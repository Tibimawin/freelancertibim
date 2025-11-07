import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Job, Application, Transaction } from '@/types/firebase';

export class JobService {
  static async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>) {
    try {
      const docRef = await addDoc(collection(db, 'jobs'), {
        ...jobData,
        applicantCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  static async createJobWithPayment(
    jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>, 
    posterId: string, 
    totalCost: number
  ) {
    try {
      // Criar o job primeiro
      const docRef = await addDoc(collection(db, 'jobs'), {
        ...jobData,
        applicantCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Descontar saldo do contratante e mover para pendente
      const posterRef = doc(db, 'users', posterId);
      const posterDoc = await getDoc(posterRef);
      
      if (posterDoc.exists()) {
        const posterData = posterDoc.data();
        const currentBalance = posterData.posterWallet?.balance || 0;
        const currentPending = posterData.posterWallet?.pendingBalance || 0;

        await updateDoc(posterRef, {
          'posterWallet.balance': currentBalance - totalCost,
          'posterWallet.pendingBalance': currentPending + totalCost,
          updatedAt: Timestamp.now(),
        });

        // Criar transação de reserva
        await TransactionService.createTransaction({
          userId: posterId,
          type: 'escrow',
          amount: -totalCost,
          currency: 'KZ',
          status: 'pending',
          description: `Reserva para tarefa: ${jobData.title}`,
          metadata: {
            jobId: docRef.id,
            maxApplicants: jobData.maxApplicants,
            bountyPerTask: jobData.bounty,
          },
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating job with payment:', error);
      throw error;
    }
  }

  static async getJobs(filters?: {
    platform?: string;
    status?: string;
    limitCount?: number;
  }) {
    try {
      let q = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      if (filters?.platform && filters.platform !== 'all') {
        q = query(q, where('platform', '==', filters.platform));
      }

      if (filters?.limitCount) {
        q = query(q, limit(filters.limitCount));
      }

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];
      
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as Job);
      });

      return jobs;
    } catch (error) {
      console.error('Error getting jobs:', error);
      throw error;
    }
  }

  static async getJobById(jobId: string): Promise<Job | null> {
    try {
      const docRef = doc(db, 'jobs', jobId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Job;
      }
      return null;
    } catch (error) {
      console.error('Error getting job:', error);
      throw error;
    }
  }

  static async updateJob(jobId: string, updates: Partial<Job>) {
    try {
      const docRef = doc(db, 'jobs', jobId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }
  
  static async deleteJob(jobId: string): Promise<void> {
    try {
      const docRef = doc(db, 'jobs', jobId);
      await deleteDoc(docRef);
      // Nota: Em um sistema real, a exclusão de um job ativo exigiria o reembolso dos fundos em escrow.
      // Para simplificar, estamos apenas excluindo o documento do job.
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  static async applyToJob(jobId: string, freelancerId: string, freelancerName: string) {
    try {
      // Verificar se o usuário já aplicou para esta tarefa
      const existingApplicationQuery = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId),
        where('testerId', '==', freelancerId)
      );
      
      const existingApplications = await getDocs(existingApplicationQuery);
      
      if (!existingApplications.empty) {
        throw new Error('Você já aplicou para esta tarefa');
      }

      // Create application
      const applicationData: Omit<Application, 'id'> = {
        jobId,
        testerId: freelancerId,
        testerName: freelancerName,
        status: 'applied',
        appliedAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, 'applications'), applicationData);

      // Update job applicant count
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);
      
      if (jobDoc.exists()) {
        const currentCount = jobDoc.data().applicantCount || 0;
        await updateDoc(jobRef, {
          applicantCount: currentCount + 1,
          updatedAt: Timestamp.now(),
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  }

  static async getUserApplications(userId: string) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('testerId', '==', userId),
        orderBy('appliedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const applications: Application[] = [];
      
      querySnapshot.forEach((doc) => {
        applications.push({ id: doc.id, ...doc.data() } as Application);
      });

      return applications;
    } catch (error) {
      console.error('Error getting user applications:', error);
      throw error;
    }
  }
}

export class TransactionService {
  static async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  static async getUserTransactions(userId: string, limitCount: number = 10) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });

      return transactions;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  }

  static async updateUserBalance(userId: string, amount: number, type: 'add' | 'subtract') {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data: any = userDoc.data();
        const currentBalance = (data.testerWallet?.balance ?? data.wallet?.balance ?? 0) as number;
        const newBalance = type === 'add' 
          ? currentBalance + amount 
          : Math.max(0, currentBalance - amount);
        
        await updateDoc(userRef, {
          'testerWallet.balance': newBalance,
          // keep legacy in sync if it exists
          'wallet.balance': newBalance,
          updatedAt: Timestamp.now(),
        });
        
        return newBalance;
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }
}