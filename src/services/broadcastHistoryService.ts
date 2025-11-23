import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  where,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BroadcastHistory {
  id: string;
  type: 'system_config' | 'manual' | 'promotional';
  title: string;
  message: string;
  sentAt: Date;
  totalRecipients: number;
  totalRead: number;
  totalClicked: number;
  readRate: number;
  clickRate: number;
  changeType?: string; // 'withdrawal_min', 'deposit_bonus', etc.
  oldValue?: any;
  newValue?: any;
  sentBy?: string;
}

export class BroadcastHistoryService {
  static async createBroadcastRecord(data: {
    type: BroadcastHistory['type'];
    title: string;
    message: string;
    totalRecipients: number;
    changeType?: string;
    oldValue?: any;
    newValue?: any;
    sentBy?: string;
  }) {
    try {
      const docRef = await addDoc(collection(db, 'broadcast_history'), {
        ...data,
        sentAt: Timestamp.now(),
        totalRead: 0,
        totalClicked: 0,
        readRate: 0,
        clickRate: 0,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating broadcast record:', error);
      throw error;
    }
  }

  static async getBroadcastHistory(limitCount: number = 50) {
    try {
      const q = query(
        collection(db, 'broadcast_history'),
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const broadcasts: BroadcastHistory[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // Calcular métricas em tempo real
        const stats = await this.calculateBroadcastStats(doc.id);
        
        broadcasts.push({
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate() || new Date(),
          totalRead: stats.totalRead,
          totalClicked: stats.totalClicked,
          readRate: stats.readRate,
          clickRate: stats.clickRate,
        } as BroadcastHistory);
      }

      return broadcasts;
    } catch (error) {
      console.error('Error getting broadcast history:', error);
      throw error;
    }
  }

  static async calculateBroadcastStats(broadcastId: string) {
    try {
      // Buscar todas as notificações deste broadcast
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('broadcastId', '==', broadcastId)
      );

      const snapshot = await getDocs(q);
      const totalRecipients = snapshot.size;
      
      let totalRead = 0;
      let totalClicked = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.read) totalRead++;
        if (data.clicked) totalClicked++;
      });

      const readRate = totalRecipients > 0 ? (totalRead / totalRecipients) * 100 : 0;
      const clickRate = totalRecipients > 0 ? (totalClicked / totalRecipients) * 100 : 0;

      return {
        totalRead,
        totalClicked,
        readRate: parseFloat(readRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
      };
    } catch (error) {
      console.error('Error calculating broadcast stats:', error);
      return {
        totalRead: 0,
        totalClicked: 0,
        readRate: 0,
        clickRate: 0,
      };
    }
  }

  static async getBroadcastsByType(type: BroadcastHistory['type']) {
    try {
      const q = query(
        collection(db, 'broadcast_history'),
        where('type', '==', type),
        orderBy('sentAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const broadcasts: BroadcastHistory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        broadcasts.push({
          id: doc.id,
          ...data,
          sentAt: data.sentAt?.toDate() || new Date(),
        } as BroadcastHistory);
      });

      return broadcasts;
    } catch (error) {
      console.error('Error getting broadcasts by type:', error);
      throw error;
    }
  }
}
