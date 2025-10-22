import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Referral } from '@/types/firebase';

export class ReferralService {
  private static generateCode(): string {
    // Gera um código alfanumérico de 6 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async generateUniqueCode(): Promise<string> {
    let code = this.generateCode();
    let exists = true;
    
    // Garante que o código é único
    while (exists) {
      const q = query(collection(db, 'users'), where('referralCode', '==', code), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        exists = false;
      } else {
        code = this.generateCode(); // Gera um novo se já existir
      }
    }
    return code;
  }

  static async registerReferral(referrerId: string, referredId: string): Promise<string> {
    try {
      const rewardAmount = 500; // Exemplo: 500 KZ de recompensa
      
      const referralData: Omit<Referral, 'id' | 'createdAt'> = {
        referrerId,
        referredId,
        status: 'pending',
        rewardAmount,
      };

      const docRef = await addDoc(collection(db, 'referrals'), {
        ...referralData,
        createdAt: Timestamp.now(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error registering referral:', error);
      throw error;
    }
  }

  static async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    try {
      const q = query(
        collection(db, 'referrals'),
        where('referrerId', '==', referrerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const referrals: Referral[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        referrals.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        } as Referral);
      });

      return referrals;
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  }
  
  static async getReferrerIdByCode(code: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, 'users'),
        where('referralCode', '==', code.toUpperCase()),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error getting referrer ID by code:', error);
      return null;
    }
  }
}