import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DepositNegotiation } from '@/types/depositNegotiation';
import { NotificationService } from './notificationService';

export class DepositNegotiationService {
  static async createNegotiation(
    userId: string,
    userName: string,
    requestedAmount: number,
    userEmail?: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'depositNegotiations'), {
        userId,
        userName,
        userEmail,
        requestedAmount,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          chatId: userId,
          negotiationNotes: []
        }
      });

      // Notificar admins
      await NotificationService.createNotification({
        userId: 'admin',
        type: 'deposit_negotiation_started',
        title: 'Nova Negociação de Depósito',
        message: `${userName} iniciou uma negociação de depósito de ${requestedAmount.toFixed(2)} Kz`,
        read: false,
        link: `/admin/support`
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating deposit negotiation:', error);
      throw error;
    }
  }

  static async updateNegotiationStatus(
    negotiationId: string,
    status: DepositNegotiation['status'],
    adminId?: string,
    adminName?: string,
    additionalData?: Partial<DepositNegotiation>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'depositNegotiations', negotiationId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
        ...additionalData
      };

      if (adminId) updateData.adminId = adminId;
      if (adminName) updateData.adminName = adminName;
      if (status === 'approved' || status === 'rejected' || status === 'cancelled') {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(docRef, updateData);

      // Buscar dados da negociação para notificar usuário
      const negotiation = await this.getNegotiationById(negotiationId);
      if (negotiation) {
        let notificationTitle = '';
        let notificationMessage = '';
        let notificationType: 'deposit_approved' | 'deposit_rejected' | 'deposit_proof_requested' | 'deposit_negotiation_updated' = 'deposit_negotiation_updated';

        if (status === 'approved') {
          notificationTitle = 'Depósito Aprovado';
          notificationMessage = `Seu depósito de ${negotiation.agreedAmount?.toFixed(2) || negotiation.requestedAmount.toFixed(2)} Kz foi aprovado e creditado!`;
          notificationType = 'deposit_approved';
        } else if (status === 'rejected') {
          notificationTitle = 'Depósito Rejeitado';
          notificationMessage = `Sua negociação de depósito foi rejeitada.`;
          notificationType = 'deposit_rejected';
        } else if (status === 'awaiting_proof') {
          notificationTitle = 'Comprovante Solicitado';
          notificationMessage = 'Por favor, envie o comprovante de pagamento.';
          notificationType = 'deposit_proof_requested';
        }

        if (notificationTitle) {
          await NotificationService.createNotification({
            userId: negotiation.userId,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            read: false,
            link: '/wallet'
          });
        }
      }
    } catch (error) {
      console.error('Error updating negotiation status:', error);
      throw error;
    }
  }

  static async getNegotiationById(negotiationId: string): Promise<DepositNegotiation | null> {
    try {
      const docRef = doc(db, 'depositNegotiations', negotiationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as DepositNegotiation;
      }
      return null;
    } catch (error) {
      console.error('Error getting negotiation:', error);
      throw error;
    }
  }

  static async getUserNegotiations(userId: string): Promise<DepositNegotiation[]> {
    try {
      const q = query(
        collection(db, 'depositNegotiations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const negotiations: DepositNegotiation[] = [];
      
      querySnapshot.forEach((doc) => {
        negotiations.push({ id: doc.id, ...doc.data() } as DepositNegotiation);
      });

      return negotiations;
    } catch (error) {
      console.error('Error getting user negotiations:', error);
      throw error;
    }
  }

  static async getActiveNegotiationForUser(userId: string): Promise<DepositNegotiation | null> {
    try {
      const q = query(
        collection(db, 'depositNegotiations'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'negotiating', 'awaiting_payment', 'awaiting_proof']),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as DepositNegotiation;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active negotiation:', error);
      throw error;
    }
  }

  static subscribeToNegotiations(callback: (negotiations: DepositNegotiation[]) => void) {
    const q = query(
      collection(db, 'depositNegotiations'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const negotiations: DepositNegotiation[] = [];
      snapshot.forEach((doc) => {
        negotiations.push({ id: doc.id, ...doc.data() } as DepositNegotiation);
      });
      callback(negotiations);
    });
  }

  static subscribeToUserNegotiations(userId: string, callback: (negotiations: DepositNegotiation[]) => void) {
    const q = query(
      collection(db, 'depositNegotiations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const negotiations: DepositNegotiation[] = [];
      snapshot.forEach((doc) => {
        negotiations.push({ id: doc.id, ...doc.data() } as DepositNegotiation);
      });
      callback(negotiations);
    });
  }

  static async uploadProof(negotiationId: string, proofUrl: string): Promise<void> {
    try {
      const docRef = doc(db, 'depositNegotiations', negotiationId);
      await updateDoc(docRef, {
        proofUrl,
        status: 'awaiting_proof',
        updatedAt: Timestamp.now()
      });

      // Notificar admin
      const negotiation = await this.getNegotiationById(negotiationId);
      if (negotiation) {
        await NotificationService.createNotification({
          userId: 'admin',
          type: 'deposit_proof_uploaded',
          title: 'Comprovante Enviado',
          message: `${negotiation.userName} enviou comprovante para depósito de ${negotiation.requestedAmount.toFixed(2)} Kz`,
          read: false,
          link: '/admin/support'
        });
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      throw error;
    }
  }

  static async addNote(negotiationId: string, note: string): Promise<void> {
    try {
      const docRef = doc(db, 'depositNegotiations', negotiationId);
      const negotiation = await this.getNegotiationById(negotiationId);
      
      if (negotiation) {
        const notes = negotiation.metadata?.negotiationNotes || [];
        notes.push(`${new Date().toISOString()}: ${note}`);
        
        await updateDoc(docRef, {
          'metadata.negotiationNotes': notes,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }
}
