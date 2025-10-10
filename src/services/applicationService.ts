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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Application, ProofSubmission } from '@/types/firebase';
import { NotificationService } from './notificationService';
import { TransactionService } from './firebase';

export class ApplicationService {
  static async hasUserApplied(jobId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId),
        where('userId', '==', userId)
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
      const appRef = doc(db, 'applications', applicationId);
      const appDoc = await getDoc(appRef);
      
      if (!appDoc.exists()) {
        throw new Error('Application not found');
      }

      const appData = appDoc.data() as Application;
      
      // Atualizar status da aplicação
      await updateDoc(appRef, {
        status: decision,
        reviewedAt: Timestamp.now(),
        reviewedBy: reviewerId,
        ...(rejectionReason && { rejectionReason }),
      });

      if (decision === 'approved') {
        // Buscar dados do job para obter o valor
        const jobDoc = await getDoc(doc(db, 'jobs', appData.jobId));
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          const bounty = jobData.bounty;

          // Mover saldo do testador: pendente para disponível
          const testerRef = doc(db, 'users', appData.testerId);
          const testerDoc = await getDoc(testerRef);
          
          if (testerDoc.exists()) {
            const testerData = testerDoc.data();
            const currentPending = testerData.testerWallet?.pendingBalance || 0;
            const currentAvailable = testerData.testerWallet?.availableBalance || 0;
            const currentEarnings = testerData.testerWallet?.totalEarnings || 0;

            await updateDoc(testerRef, {
              'testerWallet.pendingBalance': Math.max(0, currentPending - bounty),
              'testerWallet.availableBalance': currentAvailable + bounty,
              'testerWallet.totalEarnings': currentEarnings + bounty,
              completedTests: (testerData.completedTests || 0) + 1,
            });

            // Reduzir saldo pendente do contratante
            const posterRef = doc(db, 'users', jobData.posterId);
            const posterDoc = await getDoc(posterRef);
            
            if (posterDoc.exists()) {
              const posterData = posterDoc.data();
              const currentPosterPending = posterData.posterWallet?.pendingBalance || 0;

              await updateDoc(posterRef, {
                'posterWallet.pendingBalance': Math.max(0, currentPosterPending - bounty),
                updatedAt: Timestamp.now(),
              });
            }

            // Criar transação para o testador
            await TransactionService.createTransaction({
              userId: appData.testerId,
              type: 'payout',
              amount: bounty,
              currency: 'KZ',
              status: 'completed',
              description: `Pagamento pela tarefa: ${jobData.title}`,
              metadata: {
                jobId: appData.jobId,
                applicationId: applicationId,
              },
            });
          }
        }

        // Criar notificação de aprovação
        await NotificationService.createNotification({
          userId: appData.testerId,
          type: 'task_approved',
          title: 'Tarefa Aprovada!',
          message: 'Suas provas foram aprovadas e o pagamento foi processado.',
          read: false,
          metadata: {
            jobId: appData.jobId,
            applicationId: applicationId,
          },
        });
      } else {
        // Criar notificação de rejeição
        await NotificationService.createNotification({
          userId: appData.testerId,
          type: 'task_rejected',
          title: 'Tarefa Rejeitada',
          message: rejectionReason || 'Suas provas foram rejeitadas. Verifique os comentários do contratante.',
          read: false,
          metadata: {
            jobId: appData.jobId,
            applicationId: applicationId,
          },
        });
      }

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

        // Adicionar valor ao saldo pendente do testador
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