import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, Timestamp, increment, limit as fsLimit, startAfter } from 'firebase/firestore';
import { NotificationService } from './notificationService';
import { AdminService } from './admin';

export interface SupportMessage {
  id: string;
  userId: string; // dono do chat (contratante)
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
}

export interface SupportChatSummary {
  userId: string;
  status: 'open' | 'closed';
  updatedAt: Date;
  lastMessage?: string;
  lastSenderName?: string;
  userUnread?: number;
  adminUnread?: number;
  userTyping?: boolean;
  adminTyping?: boolean;
}

export class SupportChatService {
  static chatDoc(userId: string) {
    return doc(db, 'supportChats', userId);
  }

  static messagesCollection(userId: string) {
    return collection(db, 'supportChats', userId, 'messages');
  }

  static async ensureChatExists(userId: string) {
    await setDoc(this.chatDoc(userId), {
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'open',
      userUnread: 0,
      adminUnread: 0,
      userTyping: false,
      adminTyping: false,
    }, { merge: true });
  }

  static async sendMessage(userId: string, senderId: string, senderName: string, text: string) {
    await this.ensureChatExists(userId);
    const docRef = await addDoc(this.messagesCollection(userId), {
      userId,
      senderId,
      senderName,
      text,
      createdAt: Timestamp.now(),
    });

    // Atualizar metadados do chat para listagem
    try {
      await setDoc(this.chatDoc(userId), {
        updatedAt: Timestamp.now(),
        lastMessage: text,
        lastSenderId: senderId,
        lastSenderName: senderName,
        ...(senderId === userId ? { adminUnread: increment(1) } : { userUnread: increment(1) }),
      }, { merge: true });
    } catch (e) {
      console.error('Error updating chat metadata', e);
    }

    // Notificações direcionadas: se o remetente for usuário, notifica admins; se for admin, notifica o usuário
    try {
      const isSenderAdmin = await AdminService.isAdmin(senderId);
      if (isSenderAdmin) {
        // Notificar o usuário (dono do chat)
        await NotificationService.createNotification({
          userId,
          type: 'support_message',
          title: 'Resposta do suporte',
          message: `Você recebeu uma resposta de ${senderName}`,
          read: false,
          metadata: { chatUserId: userId },
        });
      } else {
        // Notificar administradores sobre nova mensagem de suporte
        const adminsSnap = await getDocs(collection(db, 'admins'));
        const notifyPromises: Promise<string>[] = [];
        adminsSnap.forEach((adminDoc) => {
          notifyPromises.push(NotificationService.createNotification({
            userId: adminDoc.id,
            type: 'support_message',
            title: 'Nova mensagem de suporte',
            message: `${senderName} enviou uma mensagem de suporte`,
            read: false,
            metadata: { chatUserId: userId },
          }));
        });
        await Promise.all(notifyPromises);
      }
    } catch (e) {
      console.error('Error creating support notifications', e);
    }

    return docRef.id;
  }

  static subscribeToMessages(userId: string, callback: (messages: SupportMessage[]) => void) {
    const q = query(this.messagesCollection(userId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages: SupportMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as SupportMessage;
      });
      callback(messages);
    });
  }

  static subscribeToChats(callback: (chats: SupportChatSummary[]) => void) {
    const q = query(collection(db, 'supportChats'), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const chats: SupportChatSummary[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          userId: data.userId || d.id,
          status: (data.status as 'open' | 'closed') || 'open',
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessage: data.lastMessage,
          lastSenderName: data.lastSenderName,
          userUnread: typeof data.userUnread === 'number' ? data.userUnread : 0,
          adminUnread: typeof data.adminUnread === 'number' ? data.adminUnread : 0,
          userTyping: !!data.userTyping,
          adminTyping: !!data.adminTyping,
        };
      });
      callback(chats);
    });
  }

  static subscribeToChat(userId: string, callback: (chat: SupportChatSummary) => void) {
    return onSnapshot(this.chatDoc(userId), (d) => {
      const data = d.data() as any || {};
      const chat: SupportChatSummary = {
        userId: data.userId || d.id,
        status: (data.status as 'open' | 'closed') || 'open',
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage,
        lastSenderName: data.lastSenderName,
        userUnread: typeof data.userUnread === 'number' ? data.userUnread : 0,
        adminUnread: typeof data.adminUnread === 'number' ? data.adminUnread : 0,
        userTyping: !!data.userTyping,
        adminTyping: !!data.adminTyping,
      };
      callback(chat);
    });
  }

  static async markAsRead(userId: string, forRole: 'user' | 'admin') {
    await updateDoc(this.chatDoc(userId), {
      [forRole === 'user' ? 'userUnread' : 'adminUnread']: 0,
    } as any);
  }

  static async listChats(limitNum: number, cursor?: any) {
    const base = query(collection(db, 'supportChats'), orderBy('updatedAt', 'desc'));
    const q = cursor ? query(collection(db, 'supportChats'), orderBy('updatedAt', 'desc'), startAfter(cursor), fsLimit(limitNum)) : query(collection(db, 'supportChats'), orderBy('updatedAt', 'desc'), fsLimit(limitNum));
    const snapshot = await getDocs(q);
    const chats: SupportChatSummary[] = snapshot.docs.map((d) => {
      const data = d.data() as any;
      return {
        userId: data.userId || d.id,
        status: (data.status as 'open' | 'closed') || 'open',
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage,
        lastSenderName: data.lastSenderName,
        userUnread: typeof data.userUnread === 'number' ? data.userUnread : 0,
        adminUnread: typeof data.adminUnread === 'number' ? data.adminUnread : 0,
        userTyping: !!data.userTyping,
        adminTyping: !!data.adminTyping,
      };
    });
    const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { chats, cursor: nextCursor };
  }

  static async setChatStatus(userId: string, status: 'open' | 'closed') {
    try {
      await setDoc(this.chatDoc(userId), {
        status,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (e) {
      console.error('Error updating chat status', e);
      throw e;
    }
  }

  static async setTyping(userId: string, role: 'user' | 'admin', typing: boolean) {
    try {
      await updateDoc(this.chatDoc(userId), {
        [role === 'user' ? 'userTyping' : 'adminTyping']: typing,
        updatedAt: Timestamp.now(),
      } as any);
    } catch (e) {
      console.error('Error updating typing status', e);
    }
  }
}