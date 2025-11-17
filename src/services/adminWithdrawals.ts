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
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WithdrawalRequest } from '@/types/admin';
import { NotificationService } from '@/services/notificationService';

export class AdminWithdrawalService {
  // Get all withdrawal requests
  static async getWithdrawalRequests(options?: {
    status?: string;
    limit?: number;
  }): Promise<WithdrawalRequest[]> {
    try {
      let q = query(
        collection(db, 'withdrawalRequests'),
        orderBy('requestedAt', 'desc')
      );

      if (options?.status && options.status !== 'all') {
        q = query(q, where('status', '==', options.status));
      }

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const requests: WithdrawalRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WithdrawalRequest);
      });

      return requests;
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      throw error;
    }
  }

  // Approve withdrawal request
  static async approveWithdrawal(
    requestId: string, 
    adminId: string, 
    adminName: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const requestRef = doc(db, 'withdrawalRequests', requestId);
      
      // Get the request data
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        throw new Error('Withdrawal request not found');
      }
      
      const requestData = requestDoc.data();

      // Update withdrawal request
      batch.update(requestRef, {
        status: 'approved',
        processedAt: Timestamp.now(),
        processedBy: adminId,
        adminNotes: adminNotes || 'Approved by admin'
      });

      // Create transaction record como 'completed' ao aprovar
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        userId: requestData.userId,
        type: 'payout',
        amount: requestData.amount,
        currency: requestData.currency || 'KZ',
        status: 'completed',
        description: `Withdrawal completed - ${requestData.method}`,
        provider: requestData.method,
        metadata: {
          withdrawalRequestId: requestId,
          approvedBy: adminId
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Update user balance: reduzir pendente; não subtrair disponível novamente
      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentPending = userData.testerWallet?.pendingBalance || 0;
        const newPending = Math.max(0, currentPending - requestData.amount);
        
        batch.update(userRef, {
          'testerWallet.pendingBalance': newPending,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();

      // Notificar usuário sobre conclusão
      try {
        await NotificationService.createNotification({
          userId: requestData.userId,
          type: 'withdrawal_approved',
          title: 'Saque concluído',
          message: '✅ Seu saque foi aprovado e concluído com sucesso! O valor será creditado conforme o método selecionado.',
          read: false,
          metadata: { withdrawalId: requestId },
        });
      } catch (notifyError) {
        console.warn('Falha ao notificar usuário sobre aprovação de saque:', notifyError);
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      throw error;
    }
  }

  // Reject withdrawal request
  static async rejectWithdrawal(
    requestId: string, 
    adminId: string, 
    adminName: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'withdrawalRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        throw new Error('Withdrawal request not found');
      }

      const requestData = requestDoc.data();

      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: Timestamp.now(),
        processedBy: adminId,
        rejectionReason,
        adminNotes: adminNotes || 'Rejected by admin'
      });

      // Reverter saldos: devolver ao disponível e reduzir pendente
      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentAvailable = userData.testerWallet?.availableBalance || 0;
        const currentPending = userData.testerWallet?.pendingBalance || 0;
        await updateDoc(userRef, {
          'testerWallet.availableBalance': currentAvailable + (requestData.amount || 0),
          'testerWallet.pendingBalance': Math.max(0, currentPending - (requestData.amount || 0)),
          updatedAt: Timestamp.now()
        });
      }

      // Notificar usuário sobre rejeição
      try {
        await NotificationService.createNotification({
          userId: requestData.userId,
          type: 'withdrawal_rejected',
          title: 'Saque rejeitado',
          message: `Seu saque foi rejeitado. Motivo: ${rejectionReason}`,
          read: false,
          metadata: { withdrawalId: requestId },
        });
      } catch (notifyError) {
        console.warn('Falha ao notificar usuário sobre rejeição de saque:', notifyError);
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      throw error;
    }
  }

  // Create a new withdrawal request (for testing or manual creation)
  static async createWithdrawalRequest(requestData: Omit<WithdrawalRequest, 'id' | 'requestedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'withdrawalRequests'), {
        ...requestData,
        requestedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  // Get withdrawal request by ID
  static async getWithdrawalRequest(requestId: string): Promise<WithdrawalRequest | null> {
    try {
      const docSnap = await getDoc(doc(db, 'withdrawalRequests', requestId));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WithdrawalRequest;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting withdrawal request:', error);
      throw error;
    }
  }
}