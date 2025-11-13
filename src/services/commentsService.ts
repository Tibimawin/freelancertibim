import { db } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { JobComment } from '@/types/firebase';
import { NotificationService } from './notificationService';
import { JobService } from './firebase';

export class CommentsService {
  static commentsCollection(jobId: string) {
    return collection(db, 'jobs', jobId, 'comments');
  }

  static async addComment(jobId: string, userId: string, userName: string, text: string) {
    const commentData = {
      jobId,
      userId,
      userName,
      text,
      status: 'pending',
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(this.commentsCollection(jobId), commentData);

    const job = await JobService.getJobById(jobId);
    if (job) {
      await NotificationService.createNotification({
        userId: job.posterId,
        type: 'comment_submitted',
        title: 'Novo comentário no seu anúncio',
        message: `${userName} comentou: "${text}"`,
        read: false,
        metadata: { jobId },
      });
    }

    return docRef.id;
  }

  static subscribeApprovedComments(jobId: string, callback: (comments: JobComment[]) => void) {
    // Consulta ideal: filtra por status e ordena por createdAt — pode exigir índice composto
    const primaryQuery = query(
      this.commentsCollection(jobId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'asc')
    );

    // Handler que mapeia o snapshot para JobComment[]
    const mapSnapshot = (snapshot: any, filterApprovedClientSide = false) => {
      const comments: JobComment[] = snapshot.docs
        .map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            jobId,
            userId: data.userId,
            userName: data.userName,
            text: data.text,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as JobComment;
        })
        .filter((c: JobComment) => (filterApprovedClientSide ? c.status === 'approved' : true));
      callback(comments);
    };

    // Tenta a consulta principal; em caso de erro (ex.: índice necessário), cai para fallback
    const unsubscribe = onSnapshot(
      primaryQuery,
      (snapshot) => mapSnapshot(snapshot),
      (error) => {
        console.warn('[CommentsService] Falling back query due to error:', error);
        try {
          const fallbackQuery = query(this.commentsCollection(jobId), orderBy('createdAt', 'asc'));
          return onSnapshot(fallbackQuery, (snapshot) => mapSnapshot(snapshot, true));
        } catch (fallbackErr) {
          console.error('[CommentsService] Fallback query failed:', fallbackErr);
        }
      }
    );

    return unsubscribe;
  }
}