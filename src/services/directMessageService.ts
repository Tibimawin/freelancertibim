import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, where, limit } from 'firebase/firestore';
import { NotificationService } from './notificationService';
import { DirectMessage, DirectThread, UserSettings } from '@/types/firebase';

export class DirectMessageService {
  static threadsCollection() {
    return collection(db, 'direct_threads');
  }

  static messagesCollection(threadId: string) {
    return collection(db, 'direct_threads', threadId, 'messages');
  }

  static threadDoc(threadId: string) {
    return doc(db, 'direct_threads', threadId);
  }

  /** Deterministic thread id for a pair of users */
  static getPairThreadId(userA: string, userB: string) {
    const [a, b] = [userA, userB].sort();
    return `${a}_${b}`;
  }

  /** Ensure a direct thread exists and return its id */
  static async getOrCreateThread(currentUserId: string, recipientId: string): Promise<string> {
    const threadId = this.getPairThreadId(currentUserId, recipientId);
    const threadRef = doc(db, 'direct_threads', threadId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) {
      const thread: Omit<DirectThread, 'id'> = {
        participants: [currentUserId, recipientId],
        createdAt: new Date(),
        lastMessageAt: undefined,
      };
      await setDoc(threadRef, {
        participants: thread.participants,
        createdAt: Timestamp.now(),
      });
    }
    return threadId;
  }

  static async sendMessage(threadId: string, senderId: string, senderName: string, recipientId: string, text: string) {
    // Respect user settings: both sender and recipient must allow direct messages
    const senderSettingsAllowed = await this.checkUserAllowsDM(senderId);
    const recipientSettingsAllowed = await this.checkUserAllowsDM(recipientId);
    if (!senderSettingsAllowed || !recipientSettingsAllowed) {
      throw new Error('Direct messages are disabled by user settings');
    }

    const docRef = await addDoc(this.messagesCollection(threadId), {
      threadId,
      senderId,
      senderName,
      recipientId,
      text,
      createdAt: Timestamp.now(),
      readAt: null,
    });

    // update lastMessageAt on thread
    await updateDoc(doc(db, 'direct_threads', threadId), {
      lastMessageAt: Timestamp.now(),
    });

    // notify recipient
    await NotificationService.createNotification({
      userId: recipientId,
      type: 'message_received',
      title: 'Nova mensagem',
      message: `Você recebeu uma nova mensagem de ${senderName}`,
      read: false,
      metadata: {
        chatUserId: senderId,
      },
    });

    return docRef.id;
  }

  static subscribeToMessages(threadId: string, callback: (messages: DirectMessage[]) => void) {
    const q = query(this.messagesCollection(threadId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages: DirectMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          threadId,
          senderId: data.senderId,
          senderName: data.senderName,
          recipientId: data.recipientId,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt ? data.readAt.toDate?.() || data.readAt : undefined,
        } as DirectMessage;
      });
      callback(messages);
    });
  }

  /** Subscribe to thread metadata like typing indicators */
  static subscribeToThread(threadId: string, callback: (meta: { typing: Record<string, boolean> }) => void) {
    return onSnapshot(this.threadDoc(threadId), (snap) => {
      const data = snap.data() as any || {};
      const typing = data.typing || {};
      callback({ typing });
    });
  }

  /** Set typing indicator for a user in a thread */
  static async setTyping(threadId: string, userId: string, typing: boolean) {
    await updateDoc(this.threadDoc(threadId), {
      [`typing.${userId}`]: typing,
    } as any);
  }

  /** Mark all unread messages for user in this thread as read */
  static async markThreadRead(threadId: string, userId: string) {
    // Simplified query without orderBy to avoid composite index requirement
    const q = query(this.messagesCollection(threadId), where('recipientId', '==', userId), limit(50));
    const snap = await getDocs(q);
    const updates: Promise<void>[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (!data.readAt) {
        updates.push(updateDoc(d.ref, { readAt: Timestamp.now() }));
      }
    });
    await Promise.all(updates);
  }

  private static async checkUserAllowsDM(userId: string): Promise<boolean> {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return true; // default allow if no settings
    const settings = (userSnap.data() as any)?.settings as UserSettings | undefined;
    if (settings && typeof settings.allowDirectMessages === 'boolean') {
      return settings.allowDirectMessages;
    }
    return true;
  }

  /** Add or update a reaction on a message */
  static async addReaction(threadId: string, messageId: string, userId: string, emoji: string) {
    const messageRef = doc(this.messagesCollection(threadId), messageId);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: emoji,
    } as any);
  }

  /** Remove a reaction from a message */
  static async removeReaction(threadId: string, messageId: string, userId: string) {
    const messageRef = doc(this.messagesCollection(threadId), messageId);
    const messageSnap = await getDoc(messageRef);
    if (messageSnap.exists()) {
      const data = messageSnap.data();
      const reactions = { ...(data.reactions || {}) };
      delete reactions[userId];
      await updateDoc(messageRef, { reactions } as any);
    }
  }

  /** Pin or unpin a message */
  static async togglePinMessage(threadId: string, messageId: string, userId: string, pin: boolean) {
    const messageRef = doc(this.messagesCollection(threadId), messageId);
    if (pin) {
      await updateDoc(messageRef, {
        pinned: true,
        pinnedBy: userId,
        pinnedAt: Timestamp.now(),
      } as any);
    } else {
      await updateDoc(messageRef, {
        pinned: false,
        pinnedBy: null,
        pinnedAt: null,
      } as any);
    }
  }
}