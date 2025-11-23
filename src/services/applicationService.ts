import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment,
  runTransaction,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Application, ProofSubmission, Job } from '@/types/firebase';
import { NotificationService } from './notificationService';
import { TransactionService, JobService } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { LevelService } from './levelService';
import { cleanFirebaseData } from '@/lib/firebaseUtils';

export class ApplicationService {
  private static normalizeApplicationData(data: any, id: string): Application {
    const toDate = (v: any): Date => {
      if (!v) return new Date();
      if (typeof v?.toDate === 'function') return v.toDate();
      return new Date(v);
    };
    const app: Application = {
      id,
      jobId: data.jobId,
      testerId: data.testerId,
      testerName: data.testerName,
      status: data.status,
      appliedAt: toDate(data.appliedAt),
      ...(data.proofSubmission && {
        proofSubmission: {
          proofs: data.proofSubmission.proofs || [],
          submittedAt: toDate(data.proofSubmission.submittedAt),
        },
      }),
      ...(data.feedback && {
        feedback: {
          rating: data.feedback.rating,
          comment: data.feedback.comment,
          providedAt: toDate(data.feedback.providedAt),
        },
      }),
      ...(data.contractorFeedback && {
        contractorFeedback: {
          rating: data.contractorFeedback.rating,
          comment: data.contractorFeedback.comment,
          providedAt: toDate(data.contractorFeedback.providedAt),
        },
      }),
      ...(data.reviewedAt && { reviewedAt: toDate(data.reviewedAt) }),
      ...(data.reviewedBy && { reviewedBy: data.reviewedBy }),
      ...(data.rejectionReason && { rejectionReason: data.rejectionReason }),
    } as Application;
    return app;
  }
  static async hasUserApplied(jobId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId),
        where('testerId', '==', userId) // Corrigido de 'userId' para 'testerId'
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user application:', error);
      throw error;
    }
  }

  static async submitJobFeedback(
    applicationId: string,
    rating: number,
    comment?: string
  ) {
    try {
      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }
      const appData = appDoc.data() as Application;

      if (appData.status !== 'approved') {
        throw new Error('Só é possível classificar tarefas aprovadas');
      }

      // Evitar reclassificação
      if (appData.feedback?.rating) {
        throw new Error('Esta aplicação já foi classificada');
      }

      // Atualizar feedback da aplicação
      await updateDoc(appRef, {
        feedback: {
          rating,
          comment: comment || '',
          providedAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      } as any);

      // ⭐ DAR XP PELA AVALIAÇÃO
      const xpGained = rating >= 4 ? 50 : 30; // Mais XP para avaliações positivas
      try {
        const result = await LevelService.addXP(
          appData.testerId, 
          xpGained, 
          `Avaliação de tarefa (${rating}⭐)`
        );
        
        // Se subiu de nível, pode enviar notificação
        if (result.leveledUp) {
          const levelName = LevelService.getLevelName(result.level);
          await NotificationService.createNotification({
            userId: appData.testerId,
            title: '🎉 Subiu de Nível!',
            message: `Parabéns! Você alcançou o nível ${result.level} (${levelName})!`,
            type: 'level_up',
            read: false
          });
        }
      } catch (xpError) {
        console.error('Error adding XP for feedback:', xpError);
        // Não falhar a operação se o XP der erro
      }

      // Atualizar agregação de rating no Job
      const jobRef = doc(db, 'jobs', appData.jobId);
      const jobSnap = await getDoc(jobRef);
      if (!jobSnap.exists()) {
        throw new Error('Job não encontrado para agregação de rating');
      }
      const jobData = jobSnap.data() as Job;
      const currentCount = jobData.ratingCount || 0;
      const currentAvg = jobData.rating || 0;
      const newCount = currentCount + 1;
      // Recalcular média sem armazenar soma (média incremental)
      const newAvg = ((currentAvg * currentCount) + rating) / newCount;

      await updateDoc(jobRef, {
        ratingCount: newCount,
        rating: Number(newAvg.toFixed(2)),
        updatedAt: Timestamp.now(),
      } as any);
    } catch (error) {
      console.error('Error submitting job feedback:', error);
      throw error;
    }
  }

  static async submitContractorFeedback(
    applicationId: string,
    rating: number,
    comment?: string
  ) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('A avaliação deve estar entre 1 e 5');
      }

      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }
      const appData = appDoc.data() as Application;

      if (appData.status !== 'approved') {
        throw new Error('Só é possível avaliar contratantes de tarefas aprovadas');
      }

      // Evitar reavaliação do contratante
      if (appData.contractorFeedback?.rating) {
        throw new Error('O contratante já foi avaliado nesta aplicação');
      }

      // Obter o job para identificar o contratante
      const job = await JobService.getJobById(appData.jobId);
      if (!job) {
        throw new Error('Job não encontrado para avaliar contratante');
      }

      const posterRef = doc(db, 'users', job.posterId);

      // Usar transação para atualizar média e contagem no usuário
      await runTransaction(db, async (transaction) => {
        const posterSnap = await transaction.get(posterRef);
        if (!posterSnap.exists()) {
          throw new Error('Usuário contratante não encontrado');
        }
        const posterData = posterSnap.data() as any;
        const currentCount = posterData.ratingCount || 0;
        const currentAvg = posterData.rating || 0;
        const newCount = currentCount + 1;
        const newAvg = ((currentAvg * currentCount) + rating) / newCount;

        transaction.update(posterRef, {
          ratingCount: newCount,
          rating: Number(newAvg.toFixed(2)),
          updatedAt: Timestamp.now(),
        });

        // Atualizar feedback na aplicação para marcar como concluído
        transaction.update(appRef, {
          contractorFeedback: {
            rating,
            comment: comment || '',
            providedAt: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        } as any);
      });
    } catch (error) {
      console.error('Error submitting contractor feedback:', error);
      throw error;
    }
  }
  static async submitProofs(
    applicationId: string,
    proofs: ProofSubmission[]
  ) {
    try {
      const appRef = doc(db, 'applications', applicationId);
      // Buscar aplicação para validar status atual antes de permitir envio
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) {
        throw new Error('Application not found after submission');
      }
      const appData = appDoc.data() as Application;

      // Bloquear reenvio se já estiver submetido ou aprovado
      if (appData.status === 'submitted' || appData.status === 'approved') {
        throw new Error('Provas já enviadas ou aprovadas; aguarde ou verifique o resultado.');
      }

      // Permitir envio se status for 'applied', 'accepted' ou 'rejected'
      // Registrar envio e criar hold pendente na carteira do freelancer (e reserva no contratante)
      const job = await JobService.getJobById(appData.jobId);
      
      // Limpar provas antes de salvar (remove undefined/null)
      const cleanedProofs = proofs.map(p => cleanFirebaseData(p));
      
      // Atualiza o documento da aplicação com provas e marca como 'submitted'
      await updateDoc(appRef, {
        'proofSubmission.proofs': cleanedProofs,
        'proofSubmission.submittedAt': Timestamp.now(),
        status: 'submitted',
      });

      if (job) {
        const bounty = job.bounty;
        const testerRef = doc(db, 'users', appData.testerId);
        const posterRef = doc(db, 'users', job.posterId);

        await runTransaction(db, async (transaction) => {
          const testerDoc = await transaction.get(testerRef);
          const posterDoc = await transaction.get(posterRef);
          if (!testerDoc.exists()) {
            throw new Error('Tester user not found');
          }
          const testerData = testerDoc.data() as any;
          const currentPending = testerData.testerWallet?.pendingBalance || 0;
          const posterPending = posterDoc.exists() ? ((posterDoc.data() as any)?.posterWallet?.pendingBalance || 0) : undefined;

          transaction.update(testerRef, {
            'testerWallet.pendingBalance': currentPending + bounty,
            updatedAt: Timestamp.now(),
          });

          if (posterPending !== undefined) {
            transaction.update(posterRef, {
              'posterWallet.pendingBalance': posterPending + bounty,
              updatedAt: Timestamp.now(),
            });
          }

          const transactionRef = doc(collection(db, 'transactions'));
          transaction.set(transactionRef, {
            userId: appData.testerId,
            type: 'escrow',
            amount: bounty,
            currency: 'KZ',
            status: 'pending',
            description: `Valor em análise pela tarefa: ${job.title}`,
            metadata: {
              jobId: appData.jobId,
              applicationId: applicationId,
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        });

        // Notificar o contratante sobre submissão
        await NotificationService.createNotification({
          userId: job.posterId,
          type: 'task_submitted',
          title: 'Nova Tarefa Submetida!',
          message: `O freelancer ${appData.testerName} enviou as provas para a tarefa "${job.title}".`,
          read: false,
          metadata: {
            jobId: job.id,
            applicationId: applicationId,
          },
        });

        // Enviar email de submissão para o contratante
        try {
          const posterDoc = await getDoc(posterRef);
          if (posterDoc.exists()) {
            const posterData = posterDoc.data();
            const functions = getFunctions();
            const sendEmail = httpsCallable(functions, 'sendProofSubmittedEmail');
            await sendEmail({
              posterEmail: posterData.email,
              posterName: posterData.name || posterData.displayName,
              workerName: appData.testerName,
              jobTitle: job.title,
              proofUrl: proofs.length > 0 ? '' : '',
            });
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de submissão:', emailError);
        }

        if (
          (job.youtube && job.youtube.actionType === 'watch') ||
          (job.instagram && job.instagram.actionType === 'watch') ||
          (job.facebook && job.facebook.actionType === 'watch') ||
          (job.tiktok && job.tiktok.actionType === 'watch') ||
          (job.website && (job.website.actionType === 'visit' || job.website.actionType === 'visit_scroll'))
        ) {
          await ApplicationService.reviewApplication(applicationId, 'approved', job.posterId);
        }
      }

    } catch (error) {
      console.error('Error submitting proofs:', error);
      throw error;
    }
  }

  static async reviewApplication(
    applicationId: string,
    decision: 'approved' | 'rejected',
    reviewerId: string,
    rejectionReason?: string
  ) {
    try {
      const batch = writeBatch(db);
      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }

      const appData = appDoc.data() as Application;
      
      // Atualizar status da aplicação
      batch.update(appRef, {
        status: decision,
        reviewedAt: Timestamp.now(),
        reviewedBy: reviewerId,
        ...(rejectionReason && { rejectionReason }),
      });

      // Fetch job data to get job title
      const job = await JobService.getJobById(appData.jobId);
      const jobTitle = job?.title || 'Sua Tarefa';

      if (decision === 'approved') {
        // Buscar dados do job para obter o valor
        if (job) {
          const bounty = job.bounty;
          const commissionRate = 0.05; // 5% de comissão

          // 1. Atualizar saldo do freelancer (indicado)
          const testerRef = doc(db, 'users', appData.testerId);
          
          // Usar transação para garantir atomicidade
          const txResult = await runTransaction(db, async (transaction) => {
            const testerDoc = await transaction.get(testerRef);
            const testerData = testerDoc.data();
            
            if (!testerData) throw new Error('Tester user not found');

            // Ler dados do contratante antes de qualquer escrita
            const posterRef = doc(db, 'users', job.posterId);
            const posterDoc = await transaction.get(posterRef);
            const posterData = posterDoc.exists() ? posterDoc.data() : null;

            const currentPending = testerData.testerWallet?.pendingBalance || 0;
            const currentAvailable = testerData.testerWallet?.availableBalance || 0;
            const currentEarnings = testerData.testerWallet?.totalEarnings || 0;
            const completedTests = testerData.completedTests || 0;

            // Calcular se é a primeira tarefa antes de escrever
            const wasFirstTask = completedTests === 0;

            // Atualizar carteira do freelancer
            transaction.update(testerRef, {
              'testerWallet.pendingBalance': Math.max(0, currentPending - bounty),
              'testerWallet.availableBalance': currentAvailable + bounty,
              'testerWallet.totalEarnings': currentEarnings + bounty,
              completedTests: increment(1),
              updatedAt: Timestamp.now(),
            });

            // 2. Processar comissão de indicação (se houver um indicador)
            const referrerId = testerData.referredBy;
            if (referrerId) {
              const commissionAmount = bounty * commissionRate;
              const referrerRef = doc(db, 'users', referrerId);
              
              // Pagar comissão ao indicador
              transaction.update(referrerRef, {
                'testerWallet.availableBalance': increment(commissionAmount),
                updatedAt: Timestamp.now(),
              });

              // Criar transação de recompensa para o indicador
              const referralTransactionRef = doc(collection(db, 'transactions'));
              transaction.set(referralTransactionRef, {
                userId: referrerId,
                type: 'referral_reward',
                amount: commissionAmount,
                currency: 'KZ',
                status: 'completed',
                description: `Comissão de 5% pela tarefa de ${appData.testerName}`,
                metadata: {
                  jobId: appData.jobId,
                  applicationId: applicationId,
                  referredUserId: appData.testerId,
                  originalBounty: bounty,
                },
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              });

              // 3. Atualização de indicação movida para etapa pós-transação
            }

            // 4. Reduzir saldo pendente do contratante
            if (posterData) {
              const currentPosterPending = posterData.posterWallet?.pendingBalance || 0;
              transaction.update(posterRef, {
                'posterWallet.pendingBalance': Math.max(0, currentPosterPending - bounty),
                updatedAt: Timestamp.now(),
              });
            }

            // 5. Criar transação de pagamento para o freelancer
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
              userId: appData.testerId,
              type: 'payout',
              amount: bounty,
              currency: 'KZ',
              status: 'completed',
              description: `Pagamento pela tarefa: ${jobTitle}`,
              metadata: {
                jobId: appData.jobId,
                applicationId: applicationId,
              },
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            // Retornar dados para pós-processamento (indicação)
            return { wasFirstTask, referrerId };
          });

          // Pós-transação: atualizar status da indicação se for a primeira tarefa concluída
          if (txResult?.referrerId && txResult.wasFirstTask) {
            const commissionAmount = bounty * commissionRate;
            const referralQuery = query(
              collection(db, 'referrals'),
              where('referrerId', '==', txResult.referrerId),
              where('referredId', '==', appData.testerId),
              limit(1)
            );
            const referralSnapshot = await getDocs(referralQuery);
            if (!referralSnapshot.empty) {
              const referralDocRef = referralSnapshot.docs[0].ref;
              await updateDoc(referralDocRef, {
                status: 'completed',
                completedAt: Timestamp.now(),
                rewardAmount: increment(commissionAmount),
              } as any);
            }
          }
        }

        // Criar notificação de aprovação para o freelancer
        await NotificationService.createNotification({
          userId: appData.testerId,
          type: 'task_approved',
          title: 'Tarefa Aprovada!',
          message: `Suas provas para a tarefa "${jobTitle}" foram aprovadas e o pagamento foi processado.`,
          read: false,
          metadata: {
            jobId: appData.jobId,
            applicationId: applicationId,
          },
        });

        // Enviar email de aprovação
        try {
          const testerDoc = await getDoc(doc(db, 'users', appData.testerId));
          if (testerDoc.exists()) {
            const testerData = testerDoc.data();
            const functions = getFunctions();
            const sendEmail = httpsCallable(functions, 'sendProofApprovedEmail');
            await sendEmail({
              userEmail: testerData.email,
              userName: appData.testerName,
              jobTitle: jobTitle,
              amount: job.bounty,
            });
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de aprovação:', emailError);
          // Não falhar a operação se o email falhar
        }
      } else {
        // Em caso de rejeição, liberar saldo pendente do freelancer e reserva do contratante
        if (job) {
          const bounty = job.bounty;
          const testerRef = doc(db, 'users', appData.testerId);
          const posterRef = doc(db, 'users', job.posterId);

          await runTransaction(db, async (transaction) => {
            const testerDoc = await transaction.get(testerRef);
            const posterDoc = await transaction.get(posterRef);

            if (testerDoc.exists()) {
              const testerData = testerDoc.data() as any;
              const currentPending = testerData.testerWallet?.pendingBalance || 0;
              transaction.update(testerRef, {
                'testerWallet.pendingBalance': Math.max(0, currentPending - bounty),
                updatedAt: Timestamp.now(),
              });
            }

            if (posterDoc.exists()) {
              const posterData = posterDoc.data() as any;
              const posterPending = posterData.posterWallet?.pendingBalance || 0;
              transaction.update(posterRef, {
                'posterWallet.pendingBalance': Math.max(0, posterPending - bounty),
                updatedAt: Timestamp.now(),
              });
            }
          });
        }
        
        // ⚠️ ALERTA CRÍTICO: Notificar admin sobre rejeição de tarefa de e-mail
        if (job?.emailCreation) {
          await NotificationService.createNotification({
            userId: 'ADMIN', // Enviado para todos os admins
            type: 'email_task_rejection',
            title: '🚨 Rejeição de Tarefa de E-mail',
            message: `Contratante ${reviewerId} rejeitou tarefa de criação de e-mail: "${jobTitle}". Motivo: ${rejectionReason || 'Não especificado'}`,
            read: false,
            metadata: {
              jobId: appData.jobId,
              applicationId: applicationId,
              contractorId: reviewerId,
              freelancerId: appData.testerId,
              freelancerName: appData.testerName,
              rejectionReason: rejectionReason || 'Não especificado',
              bounty: job.bounty,
              provider: job.emailCreation.provider,
              severity: 'critical'
            },
          });
        }

        // Criar notificação de rejeição para o freelancer
        await NotificationService.createNotification({
          userId: appData.testerId,
          type: 'task_rejected',
          title: 'Tarefa Rejeitada',
          message: rejectionReason ? `Suas provas para a tarefa "${jobTitle}" foram rejeitadas: ${rejectionReason}` : `Suas provas para a tarefa "${jobTitle}" foram rejeitadas. Verifique os comentários do contratante.`,
          read: false,
          metadata: {
            jobId: appData.jobId,
            applicationId: applicationId,
          },
        });

        // Enviar email de rejeição
        try {
          const testerDoc = await getDoc(doc(db, 'users', appData.testerId));
          if (testerDoc.exists()) {
            const testerData = testerDoc.data();
            const functions = getFunctions();
            const sendEmail = httpsCallable(functions, 'sendProofRejectedEmail');
            await sendEmail({
              userEmail: testerData.email,
              userName: appData.testerName,
              jobTitle: jobTitle,
              rejectionReason: rejectionReason || 'Não especificado',
            });
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de rejeição:', emailError);
          // Não falhar a operação se o email falhar
        }
      }
      
      // Commit do batch principal (apenas a atualização do status da aplicação)
      await batch.commit();

    } catch (error) {
      console.error('Error reviewing application:', error);
      throw error;
    }
  }

  static async getApplicationsForJob(jobId: string) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId),
        orderBy('appliedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const applications: Application[] = [];
      querySnapshot.forEach((d) => {
        applications.push(ApplicationService.normalizeApplicationData(d.data(), d.id));
      });

      return applications;
    } catch (error) {
      console.error('Error getting applications for job:', error);
      throw error;
    }
  }

  static async getUserApplications(userId: string, statusFilter?: string) {
    try {
      let q = query(
        collection(db, 'applications'),
        where('testerId', '==', userId),
        orderBy('appliedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const applications: Application[] = [];
      querySnapshot.forEach((d) => {
        const app = ApplicationService.normalizeApplicationData(d.data(), d.id);
        if (!statusFilter || app.status === statusFilter) applications.push(app);
      });

      return applications;
    } catch (error) {
      console.error('Error getting user applications:', error);
      throw error;
    }
  }

  static async acceptApplication(applicationId: string, posterId: string) {
    try {
      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }

      const appData = appDoc.data() as Application;
      
      // Atualizar status para aceito
      await updateDoc(appRef, {
        status: 'accepted',
      });

      // Buscar dados do job para mover saldo para pendente
      const jobDoc = await getDoc(doc(db, 'jobs', appData.jobId));
      if (jobDoc.exists()) {
        const jobData = jobDoc.data();
        const bounty = jobData.bounty;

        // Adicionar valor ao saldo pendente do freelancer
        const userRef = doc(db, 'users', appData.testerId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentPending = userData.testerWallet?.pendingBalance || 0;

          await updateDoc(userRef, {
            'testerWallet.pendingBalance': currentPending + bounty,
          });

          // Criar transação de escrow
          await TransactionService.createTransaction({
            userId: appData.testerId,
            type: 'escrow',
            amount: bounty,
            currency: 'KZ',
            status: 'pending',
            description: `Valor em escrow para a tarefa: ${jobData.title}`,
            metadata: {
              jobId: appData.jobId,
              applicationId: applicationId,
            },
          });
        }
      }

    } catch (error) {
      console.error('Error accepting application:', error);
      throw error;
    }
  }

  // Buscar todas as aplicações (para admin)
  static async getAllApplications(options?: { limit?: number }): Promise<Application[]> {
    try {
      const q = query(
        collection(db, 'applications'),
        orderBy('appliedAt', 'desc'),
        limit(options?.limit || 100)
      );

      const querySnapshot = await getDocs(q);
      const applications: Application[] = [];
      querySnapshot.forEach((d) => {
        applications.push(ApplicationService.normalizeApplicationData(d.data(), d.id));
      });

      return applications;
    } catch (error) {
      console.error('Error getting all applications:', error);
      throw error;
    }
  }

  // Aprovação manual por admin (bypass de rejeição)
  static async adminManualApproval(
    applicationId: string,
    adminId: string,
    adminName: string,
    reason: string
  ): Promise<void> {
    try {
      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }

      const appData = appDoc.data() as Application;
      const job = await JobService.getJobById(appData.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // Criar log de intervenção admin
      const { AdminInterventionService } = await import('./adminInterventionService');
      await AdminInterventionService.createIntervention({
        applicationId,
        jobId: appData.jobId,
        adminId,
        adminName,
        action: 'manual_approval',
        reason,
        originalReviewerId: job.posterId,
        originalRejectionReason: appData.rejectionReason,
        metadata: {
          freelancerId: appData.testerId,
          freelancerName: appData.testerName,
          bountyAmount: job.bounty,
        },
      });

      // Aprovar a aplicação normalmente
      await this.reviewApplication(applicationId, 'approved', adminId);

      // Notificar freelancer
      await NotificationService.createNotification({
        userId: appData.testerId,
        type: 'task_approved',
        title: '🎉 Intervenção Administrativa',
        message: `Um administrador revisou sua tarefa "${job.title}" e aprovou o pagamento de ${job.bounty.toFixed(2)} Kz!`,
        read: false,
        metadata: {
          jobId: appData.jobId,
          applicationId,
        },
      });

      // Notificar contratante
      await NotificationService.createNotification({
        userId: job.posterId,
        type: 'task_approved',
        title: '⚠️ Intervenção Administrativa',
        message: `Sua rejeição da tarefa "${job.title}" foi revisada. Decisão final: Aprovada. O pagamento foi liberado ao freelancer.`,
        read: false,
        metadata: {
          jobId: appData.jobId,
          applicationId,
        },
      });

    } catch (error) {
      console.error('Error in admin manual approval:', error);
      throw error;
    }
  }
}