import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export interface DepositNegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  text: string;
  createdAt: Date;
  read?: boolean;
}

export class DepositNegotiationMessagesService {
  static messagesCollection(negotiationId: string) {
    return collection(db, 'depositNegotiations', negotiationId, 'messages');
  }

  static async sendMessage(
    negotiationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'user' | 'admin',
    text: string
  ): Promise<string> {
    const docRef = await addDoc(this.messagesCollection(negotiationId), {
      negotiationId,
      senderId,
      senderName,
      senderRole,
      text,
      read: false,
      createdAt: Timestamp.now(),
    });

    // Atualizar timestamp da negociação
    await updateDoc(doc(db, 'depositNegotiations', negotiationId), {
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  }

  static subscribeToMessages(
    negotiationId: string,
    callback: (messages: DepositNegotiationMessage[]) => void
  ) {
    const q = query(
      this.messagesCollection(negotiationId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages: DepositNegotiationMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          negotiationId: data.negotiationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          text: data.text,
          read: data.read || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      callback(messages);
    });
  }

  static async markMessagesAsRead(negotiationId: string, role: 'user' | 'admin') {
    const q = query(
      this.messagesCollection(negotiationId),
      where('senderRole', '!=', role),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    
    const updates = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updates);
  }

  // Indicador de digitação
  static async setTyping(negotiationId: string, userId: string, userName: string, isTyping: boolean): Promise<void> {
    const typingRef = doc(db, 'depositNegotiations', negotiationId, 'typing', userId);
    
    if (isTyping) {
      await setDoc(typingRef, {
        userId,
        userName,
        timestamp: Timestamp.now()
      });
    } else {
      try {
        await deleteDoc(typingRef);
      } catch (error) {
        // Ignorar erro se documento não existir
      }
    }
  }

  static subscribeToTyping(
    negotiationId: string,
    currentUserId: string,
    callback: (isTyping: boolean, userName: string) => void
  ): () => void {
    const typingRef = collection(db, 'depositNegotiations', negotiationId, 'typing');
    
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const otherUserTyping = snapshot.docs.find(doc => doc.data().userId !== currentUserId);
      
      if (otherUserTyping) {
        const data = otherUserTyping.data();
        const now = new Date();
        const typingTime = data.timestamp?.toDate() || new Date();
        const diff = now.getTime() - typingTime.getTime();
        
        // Considerar digitando apenas se o timestamp for recente (últimos 3 segundos)
        if (diff < 3000) {
          callback(true, data.userName);
        } else {
          callback(false, '');
        }
      } else {
        callback(false, '');
      }
    });

    return unsubscribe;
  }

  // Contador de mensagens não lidas
  static async getUnreadCount(negotiationId: string, role: 'user' | 'admin'): Promise<number> {
    const q = query(
      this.messagesCollection(negotiationId),
      where('senderRole', '!=', role),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }
}
