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

      // Create transaction record
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        userId: requestData.userId,
        type: 'payout',
        amount: requestData.amount,
        currency: requestData.currency,
        status: 'completed',
        description: `Withdrawal approved - ${requestData.method}`,
        provider: requestData.method,
        metadata: {
          withdrawalRequestId: requestId,
          approvedBy: adminId
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Update user balance (subtract the withdrawal amount)
      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentBalance = userData.testerWallet?.balance || 0;
        const newBalance = Math.max(0, currentBalance - requestData.amount);
        
        batch.update(userRef, {
          'testerWallet.balance': newBalance,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();
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
      
      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: Timestamp.now(),
        processedBy: adminId,
        rejectionReason,
        adminNotes: adminNotes || 'Rejected by admin'
      });
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