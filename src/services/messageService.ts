import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { Message, Application, Job } from '@/types/firebase';
import { NotificationService } from './notificationService';

export class MessageService {
  static messagesCollection(applicationId: string) {
    return collection(db, 'applications', applicationId, 'messages');
  }

  static async sendMessage(applicationId: string, senderId: string, senderName: string, text: string) {
    const { recipientId, job } = await this.resolveRecipient(applicationId, senderId);

    // Respect user settings: both sender and recipient must allow direct messages
    const senderSettingsAllowed = await this.checkUserAllowsDM(senderId);
    const recipientSettingsAllowed = recipientId ? await this.checkUserAllowsDM(recipientId) : false;
    if (!senderSettingsAllowed || !recipientSettingsAllowed) {
      throw new Error('Direct messages are disabled by user settings');
    }

    const docRef = await addDoc(this.messagesCollection(applicationId), {
      applicationId,
      senderId,
      senderName,
      recipientId,
      text,
      createdAt: Timestamp.now(),
    });

    if (recipientId) {
      await NotificationService.createNotification({
        userId: recipientId,
        type: 'message_received',
        title: 'Nova mensagem',
        message: `Você recebeu uma nova mensagem de ${senderName} sobre "${job?.title || 'sua aplicação'}"`,
        read: false,
        metadata: {
          jobId: job?.id,
          applicationId,
        },
      });
    }

    return docRef.id;
  }

  static subscribeToMessages(applicationId: string, callback: (messages: Message[]) => void) {
    const q = query(this.messagesCollection(applicationId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          applicationId: data.applicationId,
          senderId: data.senderId,
          senderName: data.senderName,
          recipientId: data.recipientId,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message;
      });
      callback(messages);
    });
  }

  static async resolveRecipient(applicationId: string, senderId: string): Promise<{ recipientId: string | null; job: Job | null; application: Application | null; }> {
    const appRef = doc(db, 'applications', applicationId);
    const appSnap = await getDoc(appRef);
    if (!appSnap.exists()) return { recipientId: null, job: null, application: null };
    const application = { id: appSnap.id, ...appSnap.data() } as Application;
    const jobRef = doc(db, 'jobs', application.jobId);
    const jobSnap = await getDoc(jobRef);
    const job = jobSnap.exists() ? ({ id: jobSnap.id, ...jobSnap.data() } as Job) : null;

    let recipientId: string | null = null;
    if (senderId === application.testerId) {
      recipientId = job?.posterId || null;
    } else {
      recipientId = application.testerId;
    }
    return { recipientId, job, application };
  }

  static subscribeToMessages(applicationId: string, callback: (messages: Message[]) => void) {
    const q = query(this.messagesCollection(applicationId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          applicationId,
          senderId: data.senderId,
          senderName: data.senderName,
          recipientId: data.recipientId,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message;
      });
      callback(messages);
    });
  }

  private static async checkUserAllowsDM(userId: string): Promise<boolean> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return true; // default allow if no settings
    const settings = (userSnap.data() as any)?.settings;
    if (settings && typeof settings.allowDirectMessages === 'boolean') {
      return settings.allowDirectMessages;
    }
    return true;
  }
}