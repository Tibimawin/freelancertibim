import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';

export interface SupportTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  usageCount: number;
}

const TAGS_COLLECTION = 'supportTags';
const CHATS_COLLECTION = 'supportChats';

export class SupportTagsService {
  /**
   * Inscrever-se para receber atualizações em tempo real das tags
   */
  static subscribeToTags(callback: (tags: SupportTag[]) => void): () => void {
    const q = query(
      collection(db, TAGS_COLLECTION),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tags: SupportTag[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tags.push({
          id: doc.id,
          name: data.name || '',
          color: data.color || '#6B7280',
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          usageCount: data.usageCount || 0,
        });
      });
      callback(tags);
    }, (error) => {
      console.error('Erro ao escutar tags de suporte:', error);
      callback([]);
    });

    return unsubscribe;
  }

  /**
   * Criar uma nova tag
   */
  static async createTag(name: string, color: string, description?: string): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, TAGS_COLLECTION), {
      name,
      color,
      description: description || '',
      createdAt: now,
      usageCount: 0,
    });
    return docRef.id;
  }

  /**
   * Atualizar uma tag existente
   */
  static async updateTag(
    id: string, 
    updates: { name?: string; color?: string; description?: string }
  ): Promise<void> {
    const docRef = doc(db, TAGS_COLLECTION, id);
    await updateDoc(docRef, updates);
  }

  /**
   * Deletar uma tag
   */
  static async deleteTag(id: string): Promise<void> {
    const docRef = doc(db, TAGS_COLLECTION, id);
    await deleteDoc(docRef);
  }

  /**
   * Adicionar tag a uma conversa
   */
  static async addTagToChat(chatUserId: string, tagId: string): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, chatUserId);
    const tagRef = doc(db, TAGS_COLLECTION, tagId);

    // Adicionar tag ao chat
    await updateDoc(chatRef, {
      tags: arrayUnion(tagId),
      updatedAt: Timestamp.now(),
    });

    // Incrementar contador de uso da tag
    const tagDoc = await getDoc(tagRef);
    if (tagDoc.exists()) {
      const currentCount = tagDoc.data().usageCount || 0;
      await updateDoc(tagRef, {
        usageCount: currentCount + 1,
      });
    }
  }

  /**
   * Remover tag de uma conversa
   */
  static async removeTagFromChat(chatUserId: string, tagId: string): Promise<void> {
    const chatRef = doc(db, CHATS_COLLECTION, chatUserId);
    const tagRef = doc(db, TAGS_COLLECTION, tagId);

    // Remover tag do chat
    await updateDoc(chatRef, {
      tags: arrayRemove(tagId),
      updatedAt: Timestamp.now(),
    });

    // Decrementar contador de uso da tag
    const tagDoc = await getDoc(tagRef);
    if (tagDoc.exists()) {
      const currentCount = tagDoc.data().usageCount || 0;
      await updateDoc(tagRef, {
        usageCount: Math.max(0, currentCount - 1),
      });
    }
  }

  /**
   * Obter tags de uma conversa
   */
  static async getChatTags(chatUserId: string): Promise<string[]> {
    const chatRef = doc(db, CHATS_COLLECTION, chatUserId);
    const chatDoc = await getDoc(chatRef);
    
    if (chatDoc.exists()) {
      return chatDoc.data().tags || [];
    }
    return [];
  }

  /**
   * Inicializar tags padrão
   */
  static async initializeDefaultTags(): Promise<void> {
    const defaultTags = [
      { name: 'Urgente', color: '#EF4444', description: 'Requer atenção imediata' },
      { name: 'Saque', color: '#F59E0B', description: 'Questões relacionadas a saques' },
      { name: 'Tarefa', color: '#3B82F6', description: 'Dúvidas sobre tarefas' },
      { name: 'Pagamento', color: '#10B981', description: 'Problemas de pagamento' },
      { name: 'Verificação', color: '#8B5CF6', description: 'Verificação de conta' },
      { name: 'Bug', color: '#DC2626', description: 'Reporte de bugs' },
      { name: 'Sugestão', color: '#06B6D4', description: 'Sugestões de melhorias' },
      { name: 'Resolvido', color: '#22C55E', description: 'Problema resolvido' },
    ];

    const now = Timestamp.now();
    for (const tag of defaultTags) {
      try {
        await addDoc(collection(db, TAGS_COLLECTION), {
          name: tag.name,
          color: tag.color,
          description: tag.description,
          createdAt: now,
          usageCount: 0,
        });
      } catch (error) {
        console.log(`Erro ao criar tag ${tag.name}:`, error);
      }
    }
  }
}
