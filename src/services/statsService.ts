import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

export interface XPHistoryEntry {
  xp: number;
  reason: string;
  timestamp: Date;
}

export interface TaskStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  averageRating: number;
}

export interface MonthlyXP {
  month: string;
  xp: number;
  tasks: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  totalEarned: number;
}

export class StatsService {
  static async getUserXPHistory(userId: string, limitCount: number = 50): Promise<XPHistoryEntry[]> {
    try {
      const historyRef = collection(db, `user_levels/${userId}/xp_history`);
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      
      console.log(`[XPHistory] Found ${snapshot.size} XP history entries`);
      
      return snapshot.docs.map(doc => ({
        xp: doc.data().xp || 0,
        reason: doc.data().reason || '',
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error fetching XP history:', error);
      return [];
    }
  }

  static async getUserTaskStats(userId: string): Promise<TaskStats> {
    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('applicantId', '==', userId));
      const snapshot = await getDocs(q);
      
      console.log(`[TaskStats] Found ${snapshot.size} total applications for user ${userId}`);
      
      let approved = 0;
      let rejected = 0;
      let pending = 0;
      let totalRating = 0;
      let ratingCount = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        
        console.log(`[TaskStats] Application ${doc.id} - Status: ${status}`);
        
        if (status === 'approved') {
          approved++;
          if (data.feedback?.rating) {
            totalRating += data.feedback.rating;
            ratingCount++;
            console.log(`[TaskStats] Found rating: ${data.feedback.rating}`);
          }
        } else if (status === 'rejected') {
          rejected++;
        } else {
          pending++;
        }
      });

      const stats = {
        total: snapshot.size,
        approved,
        rejected,
        pending,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0
      };

      console.log('[TaskStats] Final stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        averageRating: 0
      };
    }
  }

  static async getMonthlyXPData(userId: string, months: number = 6): Promise<MonthlyXP[]> {
    try {
      const historyRef = collection(db, `user_levels/${userId}/xp_history`);
      const q = query(historyRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      console.log(`[MonthlyXP] Found ${snapshot.size} XP history entries`);
      
      const monthlyData: { [key: string]: { xp: number; tasks: number } } = {};
      const now = new Date();
      
      // Initialize last N months
      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = { xp: 0, tasks: 0 };
      }
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate();
        if (!timestamp) return;
        
        const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].xp += data.xp || 0;
          if (data.reason?.includes('Tarefa completada') || data.reason?.includes('migração')) {
            monthlyData[monthKey].tasks++;
          }
        }
      });
      
      console.log('[MonthlyXP] Monthly data:', monthlyData);
      
      // Convert to array and sort by month
      return Object.entries(monthlyData)
        .map(([month, data]) => ({
          month: this.formatMonth(month),
          xp: data.xp,
          tasks: data.tasks
        }))
        .reverse();
    } catch (error) {
      console.error('Error fetching monthly XP data:', error);
      return [];
    }
  }

  static async getCategoryStats(userId: string): Promise<CategoryStats[]> {
    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef, 
        where('applicantId', '==', userId),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      
      console.log(`[CategoryStats] Found ${snapshot.size} approved applications`);
      
      const categoryData: { [key: string]: { count: number; totalEarned: number } } = {};
      
      for (const appDoc of snapshot.docs) {
        const data = appDoc.data();
        
        // Buscar o job para pegar a categoria correta
        let category = 'Outros';
        if (data.jobId) {
          try {
            const jobDoc = await getDocs(query(collection(db, 'jobs'), where('__name__', '==', data.jobId)));
            if (!jobDoc.empty) {
              const jobData = jobDoc.docs[0].data();
              category = jobData.category || jobData.jobCategory || 'Outros';
            }
          } catch (error) {
            console.warn('Error fetching job for category:', error);
          }
        }
        
        const reward = data.reward || 0;
        
        if (!categoryData[category]) {
          categoryData[category] = { count: 0, totalEarned: 0 };
        }
        
        categoryData[category].count++;
        categoryData[category].totalEarned += reward;
      }
      
      console.log('[CategoryStats] Category data:', categoryData);
      
      return Object.entries(categoryData)
        .map(([category, data]) => ({
          category,
          count: data.count,
          totalEarned: data.totalEarned
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      return [];
    }
  }

  private static formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  }
}
