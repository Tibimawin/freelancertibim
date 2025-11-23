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
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WithdrawalRequest } from '@/types/firebase';
import { NotificationService } from '@/services/notificationService';

export class WithdrawalService {
  static async createWithdrawalRequest(requestData: Omit<WithdrawalRequest, 'id' | 'requestedAt' | 'status'>) {
    try {
      // 1) Criar solicitação em 'withdrawalRequests'
      const batch = writeBatch(db);
      const requestRef = doc(collection(db, 'withdrawalRequests'));
      batch.set(requestRef, {
        ...requestData,
        status: 'pending',
        requestedAt: Timestamp.now(),
      });

      // 2) Ajustar saldos do usuário (testerWallet): disponível - amount, pendente + amount
      const userRef = doc(db, 'users', requestData.userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentAvailable = userData?.testerWallet?.availableBalance || 0;
        const currentPending = userData?.testerWallet?.pendingBalance || 0;
        const newAvailable = Math.max(0, currentAvailable - requestData.amount);
        const newPending = currentPending + requestData.amount;

        batch.update(userRef, {
          'testerWallet.availableBalance': newAvailable,
          'testerWallet.pendingBalance': newPending,
          updatedAt: Timestamp.now(),
        });
      }

      await batch.commit();

      // 3) Notificar administradores sobre nova solicitação
      try {
        const adminsSnap = await getDocs(collection(db, 'admins'));
        const notifyPromises: Promise<string>[] = [];
        adminsSnap.forEach((adminDoc) => {
          const adminId = adminDoc.id;
          notifyPromises.push(
            NotificationService.createNotification({
              userId: adminId,
              type: 'support_message',
              title: 'Nova Solicitação de Saque',
              message: `Usuário ${requestData.userName} solicitou saque de ${requestData.amount} Kz via ${requestData.method}.`,
              read: false,
              metadata: { withdrawalId: requestRef.id },
            })
          );
        });
        await Promise.all(notifyPromises);
      } catch (notifyError) {
        console.warn('Falha ao notificar admins sobre nova solicitação de saque:', notifyError);
      }

      return requestRef.id;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  static async getUserWithdrawals(userId: string) {
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const withdrawals: WithdrawalRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        withdrawals.push({ id: doc.id, ...doc.data() } as WithdrawalRequest);
      });

      return withdrawals;
    } catch (error) {
      console.error('Error getting user withdrawals:', error);
      throw error;
    }
  }

  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'approved' | 'rejected' | 'processing' | 'completed',
    adminId: string,
    adminNotes?: string,
    rejectionReason?: string
  ) {
    try {
      const docRef = doc(db, 'withdrawalRequests', withdrawalId);
      await updateDoc(docRef, {
        status,
        processedAt: Timestamp.now(),
        processedBy: adminId,
        ...(adminNotes && { adminNotes }),
        ...(rejectionReason && { rejectionReason }),
      });
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      throw error;
    }
  }

  static async getAllWithdrawals() {
    try {
      const q = query(
        collection(db, 'withdrawalRequests'),
        orderBy('requestedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const withdrawals: WithdrawalRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        withdrawals.push({ id: doc.id, ...doc.data() } as WithdrawalRequest);
      });

      return withdrawals;
    } catch (error) {
      console.error('Error getting all withdrawals:', error);
      throw error;
    }
  }
}