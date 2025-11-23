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
  setDoc
} from 'firebase/firestore';

export interface QuickReply {
  id: string;
  title: string;
  message: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QUICK_REPLIES_COLLECTION = 'quickReplies';

export class QuickRepliesService {
  /**
   * Inscrever-se para receber atualizações em tempo real das respostas rápidas
   */
  static subscribeToQuickReplies(callback: (replies: QuickReply[]) => void): () => void {
    const q = query(
      collection(db, QUICK_REPLIES_COLLECTION),
      orderBy('title', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const replies: QuickReply[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          category: data.category,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      callback(replies);
    }, (error) => {
      console.error('Erro ao escutar respostas rápidas:', error);
      callback([]);
    });

    return unsubscribe;
  }

  /**
   * Criar uma nova resposta rápida
   */
  static async createQuickReply(title: string, message: string, category?: string): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, QUICK_REPLIES_COLLECTION), {
      title,
      message,
      category: category || '',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  }

  /**
   * Atualizar uma resposta rápida existente
   */
  static async updateQuickReply(
    id: string, 
    updates: { title?: string; message?: string; category?: string }
  ): Promise<void> {
    const docRef = doc(db, QUICK_REPLIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Deletar uma resposta rápida
   */
  static async deleteQuickReply(id: string): Promise<void> {
    const docRef = doc(db, QUICK_REPLIES_COLLECTION, id);
    await deleteDoc(docRef);
  }

  /**
   * Inicializar templates padrão se não existirem
   */
  static async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        id: 'welcome',
        title: '👋 Boas-vindas',
        message: 'Olá! Bem-vindo ao nosso suporte. Como posso ajudá-lo hoje?',
        category: 'Geral',
      },
      {
        id: 'investigating',
        title: '🔍 Investigando',
        message: 'Obrigado por entrar em contato. Estou investigando sua questão e retornarei em breve com uma solução.',
        category: 'Geral',
      },
      {
        id: 'resolved',
        title: '✅ Resolvido',
        message: 'Sua questão foi resolvida. Se precisar de mais alguma coisa, não hesite em nos contatar novamente!',
        category: 'Geral',
      },
      {
        id: 'withdrawal_processing',
        title: '💰 Saque em Processamento',
        message: 'Seu pedido de saque está sendo processado. Você receberá uma notificação assim que for aprovado.',
        category: 'Saques',
      },
      {
        id: 'task_approval',
        title: '📋 Aprovação de Tarefa',
        message: 'Sua tarefa foi analisada e aprovada! O pagamento será creditado em sua conta em breve.',
        category: 'Tarefas',
      },
      {
        id: 'verification_needed',
        title: '🔐 Verificação Necessária',
        message: 'Para prosseguir com sua solicitação, precisamos que você complete a verificação de identidade em seu perfil.',
        category: 'Verificação',
      },
      {
        id: 'wait_time',
        title: '⏰ Tempo de Espera',
        message: 'Agradecemos sua paciência. O tempo médio de resposta é de 24 horas úteis. Estamos trabalhando para atendê-lo o mais rápido possível.',
        category: 'Geral',
      },
    ];

    const now = Timestamp.now();
    for (const template of defaultTemplates) {
      try {
        await setDoc(doc(db, QUICK_REPLIES_COLLECTION, template.id), {
          title: template.title,
          message: template.message,
          category: template.category,
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        // Ignora se já existe
        console.log(`Template ${template.id} já existe ou erro ao criar:`, error);
      }
    }
  }
}
