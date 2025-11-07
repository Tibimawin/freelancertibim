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
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Application, ProofSubmission } from '@/types/firebase';
import { NotificationService } from './notificationService';
import { TransactionService, JobService } from './firebase'; // Import JobService

export class ApplicationService {
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
  static async submitProofs(
    applicationId: string,
    proofs: ProofSubmission[]
  ) {
    try {
      const appRef = doc(db, 'applications', applicationId);
      await updateDoc(appRef, {
        'proofSubmission.proofs': proofs,
        'proofSubmission.submittedAt': Timestamp.now(),
        status: 'submitted',
      });

      // Fetch application data to get jobId and testerId
      const appDoc = await getDoc(appRef);
      if (!appDoc.exists()) {
        throw new Error('Application not found after submission');
      }
      const appData = appDoc.data() as Application;

      // Fetch job data to get posterId and job title
      const job = await JobService.getJobById(appData.jobId);
      if (job) {
        // Create notification for the poster (contractor)
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
          await db.runTransaction(async (transaction) => {
            const testerDoc = await transaction.get(testerRef);
            const testerData = testerDoc.data();
            
            if (!testerData) throw new Error('Tester user not found');

            const currentPending = testerData.testerWallet?.pendingBalance || 0;
            const currentAvailable = testerData.testerWallet?.availableBalance || 0;
            const currentEarnings = testerData.testerWallet?.totalEarnings || 0;

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

              // Atualizar status da referência para 'completed' (se for a primeira tarefa)
              // Nota: A lógica de "primeira tarefa" é complexa de verificar aqui. Vamos assumir que a comissão é paga em todas as tarefas, a menos que a regra seja estritamente a primeira.
              // Se a regra for "5% por cada trabalho concluído com sucesso", a lógica acima está correta.
            }

            // 3. Reduzir saldo pendente do contratante
            const posterRef = doc(db, 'users', job.posterId);
            const posterDoc = await transaction.get(posterRef);
            
            if (posterDoc.exists()) {
              const posterData = posterDoc.data();
              const currentPosterPending = posterData.posterWallet?.pendingBalance || 0;

              transaction.update(posterRef, {
                'posterWallet.pendingBalance': Math.max(0, currentPosterPending - bounty),
                updatedAt: Timestamp.now(),
              });
            }

            // 4. Criar transação de pagamento para o freelancer
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

            // 5. Atualizar status da aplicação (fora da transação de saldo, mas dentro do batch original)
            // Como estamos usando uma transação para o saldo, vamos garantir que a atualização da aplicação seja feita no batch principal.
          });
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
      } else {
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
      
      querySnapshot.forEach((doc) => {
        applications.push({ id: doc.id, ...doc.data() } as Application);
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
      
      querySnapshot.forEach((doc) => {
        const app = { id: doc.id, ...doc.data() } as Application;
        if (!statusFilter || app.status === statusFilter) {
          applications.push(app);
        }
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
}