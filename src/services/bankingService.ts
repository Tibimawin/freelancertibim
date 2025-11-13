import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  getDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BankingInfo {
  id?: string;
  expressTransfer: {
    phoneNumber: string;
    additionalInfo?: string;
  };
  ibanTransfer: {
    iban: string;
    bankName: string;
    accountName: string;
    additionalInfo?: string;
  };
  updatedAt: any;
  updatedBy: string;
}

export class BankingService {
  static async getBankingInfo(): Promise<BankingInfo | null> {
    try {
      const q = query(
        collection(db, 'bankingInfo'),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as BankingInfo;
    } catch (error) {
      console.error('Error getting banking info:', error);
      throw error;
    }
  }

  static async updateBankingInfo(bankingInfo: Omit<BankingInfo, 'id' | 'updatedAt'>, adminId: string): Promise<void> {
    try {
      const currentInfo = await this.getBankingInfo();
      
      const data = {
        ...bankingInfo,
        updatedAt: new Date(),
        updatedBy: adminId,
      };

      if (currentInfo?.id) {
        // Update existing
        await updateDoc(doc(db, 'bankingInfo', currentInfo.id), data);
      } else {
        // Create new
        await addDoc(collection(db, 'bankingInfo'), data);
      }
    } catch (error) {
      console.error('Error updating banking info:', error);
      throw error;
    }
  }
}