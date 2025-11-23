import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface SupportNote {
  id: string;
  chatUserId: string;
  note: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const NOTES_COLLECTION = 'supportNotes';

export class SupportNotesService {
  /**
   * Inscrever-se para receber atualizações em tempo real das notas de uma conversa
   */
  static subscribeToNotes(
    chatUserId: string, 
    callback: (notes: SupportNote[]) => void
  ): () => void {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('chatUserId', '==', chatUserId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes: SupportNote[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          chatUserId: data.chatUserId || '',
          note: data.note || '',
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || 'Admin',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      callback(notes);
    }, (error) => {
      console.error('Erro ao escutar notas de suporte:', error);
      callback([]);
    });

    return unsubscribe;
  }

  /**
   * Criar uma nova nota
   */
  static async createNote(
    chatUserId: string,
    note: string,
    createdBy: string,
    createdByName: string
  ): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
      chatUserId,
      note,
      createdBy,
      createdByName,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  /**
   * Atualizar uma nota existente
   */
  static async updateNote(id: string, note: string): Promise<void> {
    const docRef = doc(db, NOTES_COLLECTION, id);
    await updateDoc(docRef, {
      note,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Deletar uma nota
   */
  static async deleteNote(id: string): Promise<void> {
    const docRef = doc(db, NOTES_COLLECTION, id);
    await deleteDoc(docRef);
  }
}
