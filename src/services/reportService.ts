import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report } from '@/types/firebase';
import { NotificationService } from './notificationService';

export class ReportService {
  static async createReport(reportData: Omit<Report, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'adminNotes' | 'resolution'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'reports'), {
        ...reportData,
        status: 'pending',
        submittedAt: Timestamp.now(),
      });

      // Notify admin about new report
      await NotificationService.createNotification({
        userId: 'admin', // Assuming a generic admin user ID or a specific admin for reports
        type: 'report_submitted',
        title: 'Nova Denúncia Recebida',
        message: `Uma nova denúncia foi enviada por ${reportData.reporterName} contra ${reportData.reportedUserName}.`,
        read: false,
        metadata: {
          reportId: docRef.id,
        },
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  static async getReports(options?: {
    status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'all';
    limit?: number;
  }): Promise<Report[]> {
    try {
      let q = query(
        collection(db, 'reports'),
        orderBy('submittedAt', 'desc')
      );

      if (options?.status && options.status !== 'all') {
        q = query(q, where('status', '==', options.status));
      }

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as Report);
      });

      return reports;
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  static async reviewReport(
    reportId: string,
    decision: 'approved' | 'rejected',
    reviewerId: string,
    reviewerName: string,
    adminNotes?: string,
    resolution?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const reportRef = doc(db, 'reports', reportId);

      batch.update(reportRef, {
        status: decision,
        reviewedAt: Timestamp.now(),
        reviewedBy: reviewerId,
        adminNotes: adminNotes || null,
        resolution: resolution || null,
      });

      // Fetch report data to notify reporter and reported user
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        throw new Error('Report not found');
      }
      const reportData = reportSnap.data() as Report;

      // Notify reporter
      await NotificationService.createNotification({
        userId: reportData.reporterId,
        type: 'report_reviewed',
        title: `Sua Denúncia Foi ${decision === 'approved' ? 'Aprovada' : 'Rejeitada'}`,
        message: `A denúncia que você enviou contra ${reportData.reportedUserName} foi revisada.`,
        read: false,
        metadata: {
          reportId: reportId,
        },
      });

      // Optionally notify reported user (if decision is 'approved' and action is taken)
      if (decision === 'approved' && resolution) {
        await NotificationService.createNotification({
          userId: reportData.reportedUserId,
          type: 'report_reviewed',
          title: 'Ação Tomada em Denúncia',
          message: `Uma ação foi tomada em relação a uma denúncia contra você: ${resolution}.`,
          read: false,
          metadata: {
            reportId: reportId,
          },
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error reviewing report:', error);
      throw error;
    }
  }

  static async getReportById(reportId: string): Promise<Report | null> {
    try {
      const docSnap = await getDoc(doc(db, 'reports', reportId));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as Report;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }
}