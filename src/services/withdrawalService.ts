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
import { WithdrawalRequest } from '@/types/firebase';

export class WithdrawalService {
  static async createWithdrawalRequest(requestData: Omit<WithdrawalRequest, 'id' | 'requestedAt' | 'status'>) {
    try {
      const docRef = await addDoc(collection(db, 'withdrawals'), {
        ...requestData,
        status: 'pending',
        requestedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  static async getUserWithdrawals(userId: string) {
    try {
      const q = query(
        collection(db, 'withdrawals'),
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
      const docRef = doc(db, 'withdrawals', withdrawalId);
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
        collection(db, 'withdrawals'),
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