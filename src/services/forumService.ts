import { collection, addDoc, updateDoc, doc, query, where, orderBy, getDocs, getDoc, onSnapshot, Timestamp, increment, deleteDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';
import { NotificationService } from './notificationService';
import { ForumBadgeService } from './forumBadgeService';

// Schema de validação
export const topicSchema = z.object({
  title: z.string().trim().min(5, 'Título deve ter no mínimo 5 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  content: z.string().trim().min(10, 'Conteúdo deve ter no mínimo 10 caracteres').max(5000, 'Conteúdo deve ter no máximo 5000 caracteres'),
  category: z.enum(['geral', 'dicas', 'ajuda', 'bugs', 'sugestoes', 'anuncios']),
  tags: z.array(z.string().trim().max(30)).max(5, 'Máximo de 5 tags').optional()
});

export const replySchema = z.object({
  content: z.string().trim().min(1, 'Resposta não pode estar vazia').max(5000, 'Resposta deve ter no máximo 5000 caracteres')
});

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  isResolved: boolean;
  isPinned: boolean;
  votedBy?: string[]; // IDs dos usuários que votaram
}

export interface ForumReply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean; // Resposta aceita pelo autor do tópico
  votedBy?: string[];
}

export class ForumService {
  // Criar novo tópico
  static async createTopic(
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    data: z.infer<typeof topicSchema>
  ): Promise<string> {
    const validated = topicSchema.parse(data);
    
    const topicsRef = collection(db, 'forum_topics');
    const newTopic = await addDoc(topicsRef, {
      title: validated.title,
      content: validated.content,
      category: validated.category,
      tags: validated.tags || [],
      authorId: userId,
      authorName: userName,
      authorAvatar: userAvatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      replyCount: 0,
      upvotes: 0,
      downvotes: 0,
      isResolved: false,
      isPinned: false,
      votedBy: []
    });

    // Incrementar contador de tópicos e adicionar reputação
    try {
      await ForumBadgeService.incrementTopicsCreated(userId);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de tópico:', error);
    }

    return newTopic.id;
  }

  // Criar resposta
  static async createReply(
    topicId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    content: string
  ): Promise<string> {
    const validated = replySchema.parse({ content });
    
    // Buscar dados do tópico para notificar o autor
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) {
      throw new Error('Tópico não encontrado');
    }
    
    const topicData = topicDoc.data();
    const topicAuthorId = topicData.authorId;
    const topicTitle = topicData.title;
    
    const repliesRef = collection(db, 'forum_replies');
    const newReply = await addDoc(repliesRef, {
      topicId,
      content: validated.content,
      authorId: userId,
      authorName: userName,
      authorAvatar: userAvatar,
      createdAt: new Date(),
      updatedAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      isAccepted: false,
      votedBy: []
    });

    // Incrementar contador de respostas no tópico
    await updateDoc(topicRef, {
      replyCount: increment(1),
      updatedAt: new Date()
    });

    // Incrementar contador de respostas criadas
    try {
      await ForumBadgeService.incrementRepliesCreated(userId);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de resposta:', error);
    }

    // Notificar o autor do tópico (se não for ele mesmo respondendo)
    if (topicAuthorId !== userId) {
      try {
        await NotificationService.createNotification({
          userId: topicAuthorId,
          type: 'forum_reply',
          title: 'Nova resposta no seu tópico',
          message: `${userName} respondeu no tópico "${topicTitle}"`,
          read: false,
          metadata: {
            topicId,
            replyId: newReply.id,
            replyAuthorId: userId,
            replyAuthorName: userName
          }
        });
      } catch (error) {
        console.error('Erro ao criar notificação de resposta:', error);
      }
    }

    return newReply.id;
  }

  // Buscar tópicos com filtros
  static async getTopics(options: {
    category?: string;
    searchTerm?: string;
    sortBy?: 'recent' | 'popular' | 'unanswered';
    limitNum?: number;
  } = {}): Promise<ForumTopic[]> {
    const topicsRef = collection(db, 'forum_topics');
    let q = query(topicsRef);

    if (options.category && options.category !== 'todas') {
      q = query(q, where('category', '==', options.category));
    }

    // Ordenação
    if (options.sortBy === 'popular') {
      q = query(q, orderBy('upvotes', 'desc'));
    } else if (options.sortBy === 'unanswered') {
      q = query(q, where('replyCount', '==', 0), orderBy('createdAt', 'desc'));
    } else {
      q = query(q, orderBy('updatedAt', 'desc'));
    }

    if (options.limitNum) {
      q = query(q, limit(options.limitNum));
    }

    const snapshot = await getDocs(q);
    let topics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as ForumTopic[];

    // Filtro de busca no cliente (Firestore não suporta busca full-text nativamente)
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      topics = topics.filter(topic => 
        topic.title.toLowerCase().includes(searchLower) ||
        topic.content.toLowerCase().includes(searchLower)
      );
    }

    return topics;
  }

  // Buscar tópico por ID
  static async getTopic(topicId: string): Promise<ForumTopic | null> {
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) return null;

    // Incrementar view count
    await updateDoc(topicRef, {
      viewCount: increment(1)
    });

    return {
      id: topicDoc.id,
      ...topicDoc.data(),
      createdAt: topicDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: topicDoc.data().updatedAt?.toDate() || new Date()
    } as ForumTopic;
  }

  // Buscar respostas de um tópico
  static async getReplies(topicId: string): Promise<ForumReply[]> {
    const repliesRef = collection(db, 'forum_replies');
    const q = query(
      repliesRef,
      where('topicId', '==', topicId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as ForumReply[];
  }

  // Subscribe para atualizações em tempo real de um tópico
  static subscribeToTopic(topicId: string, callback: (topic: ForumTopic) => void): () => void {
    const topicRef = doc(db, 'forum_topics', topicId);
    
    return onSnapshot(topicRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as ForumTopic);
      }
    });
  }

  // Subscribe para respostas em tempo real
  static subscribeToReplies(topicId: string, callback: (replies: ForumReply[]) => void): () => void {
    const repliesRef = collection(db, 'forum_replies');
    const q = query(
      repliesRef,
      where('topicId', '==', topicId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const replies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ForumReply[];
      callback(replies);
    });
  }

  // Votar em tópico
  static async voteTopic(topicId: string, userId: string, voteType: 'up' | 'down'): Promise<void> {
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) throw new Error('Tópico não encontrado');

    const topicData = topicDoc.data();
    const votedBy = topicData.votedBy || [];
    
    if (votedBy.includes(userId)) {
      throw new Error('Você já votou neste tópico');
    }

    await updateDoc(topicRef, {
      [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(1),
      votedBy: [...votedBy, userId]
    });

    // Incrementar upvotes recebidos e adicionar reputação (apenas upvotes)
    if (voteType === 'up' && topicData.authorId !== userId) {
      try {
        await ForumBadgeService.incrementUpvotesReceived(topicData.authorId);
      } catch (error) {
        console.error('Erro ao atualizar estatísticas de upvote:', error);
      }

      // Notificar autor sobre upvote
      try {
        // Buscar nome do usuário que votou
        const voterDoc = await getDoc(doc(db, 'users', userId));
        const voterName = voterDoc.exists() ? voterDoc.data().name : 'Alguém';
        
        await NotificationService.createNotification({
          userId: topicData.authorId,
          type: 'forum_upvote',
          title: 'Seu tópico recebeu um upvote!',
          message: `${voterName} curtiu seu tópico "${topicData.title}"`,
          read: false,
          metadata: {
            topicId,
            voterId: userId,
            voterName
          }
        });
      } catch (error) {
        console.error('Erro ao criar notificação de upvote:', error);
      }
    }
  }

  // Votar em resposta
  static async voteReply(replyId: string, userId: string, voteType: 'up' | 'down'): Promise<void> {
    const replyRef = doc(db, 'forum_replies', replyId);
    const replyDoc = await getDoc(replyRef);
    
    if (!replyDoc.exists()) throw new Error('Resposta não encontrada');

    const replyData = replyDoc.data();
    const votedBy = replyData.votedBy || [];
    
    if (votedBy.includes(userId)) {
      throw new Error('Você já votou nesta resposta');
    }

    await updateDoc(replyRef, {
      [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(1),
      votedBy: [...votedBy, userId]
    });

    // Incrementar upvotes recebidos e adicionar reputação (apenas upvotes)
    if (voteType === 'up' && replyData.authorId !== userId) {
      try {
        await ForumBadgeService.incrementUpvotesReceived(replyData.authorId);
      } catch (error) {
        console.error('Erro ao atualizar estatísticas de upvote em resposta:', error);
      }

      // Notificar autor sobre upvote
      try {
        // Buscar dados do tópico
        const topicDoc = await getDoc(doc(db, 'forum_topics', replyData.topicId));
        const topicTitle = topicDoc.exists() ? topicDoc.data().title : 'um tópico';
        
        // Buscar nome do usuário que votou
        const voterDoc = await getDoc(doc(db, 'users', userId));
        const voterName = voterDoc.exists() ? voterDoc.data().name : 'Alguém';
        
        await NotificationService.createNotification({
          userId: replyData.authorId,
          type: 'forum_upvote',
          title: 'Sua resposta recebeu um upvote!',
          message: `${voterName} curtiu sua resposta em "${topicTitle}"`,
          read: false,
          metadata: {
            topicId: replyData.topicId,
            replyId,
            voterId: userId,
            voterName
          }
        });
      } catch (error) {
        console.error('Erro ao criar notificação de upvote em resposta:', error);
      }
    }
  }

  // Marcar tópico como resolvido
  static async markAsResolved(topicId: string, userId: string): Promise<void> {
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) throw new Error('Tópico não encontrado');
    if (topicDoc.data().authorId !== userId) {
      throw new Error('Apenas o autor pode marcar como resolvido');
    }

    await updateDoc(topicRef, {
      isResolved: true,
      updatedAt: new Date()
    });
  }

  // Aceitar resposta (marcar como solução)
  static async acceptReply(replyId: string, topicId: string, userId: string): Promise<void> {
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) throw new Error('Tópico não encontrado');
    if (topicDoc.data().authorId !== userId) {
      throw new Error('Apenas o autor pode aceitar respostas');
    }

    const replyRef = doc(db, 'forum_replies', replyId);
    const replyDoc = await getDoc(replyRef);
    
    if (!replyDoc.exists()) throw new Error('Resposta não encontrada');
    
    const replyData = replyDoc.data();
    const topicData = topicDoc.data();
    
    await updateDoc(replyRef, {
      isAccepted: true,
      updatedAt: new Date()
    });

    // Marcar tópico como resolvido
    await updateDoc(topicRef, {
      isResolved: true,
      updatedAt: new Date()
    });

    // Incrementar soluções aceitas e adicionar reputação ao autor da resposta
    if (replyData.authorId !== userId) {
      try {
        await ForumBadgeService.incrementSolutionsAccepted(replyData.authorId);
      } catch (error) {
        console.error('Erro ao atualizar estatísticas de solução aceita:', error);
      }

      // Notificar autor da resposta que foi aceita como solução
      try {
        await NotificationService.createNotification({
          userId: replyData.authorId,
          type: 'forum_solution_accepted',
          title: 'Sua resposta foi aceita como solução! 🎉',
          message: `Sua resposta no tópico "${topicData.title}" foi marcada como solução`,
          read: false,
          metadata: {
            topicId,
            replyId,
            topicTitle: topicData.title
          }
        });
      } catch (error) {
        console.error('Erro ao criar notificação de solução aceita:', error);
      }
    }
  }

  // Deletar tópico (apenas autor ou admin)
  static async deleteTopic(topicId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) throw new Error('Tópico não encontrado');
    if (topicDoc.data().authorId !== userId && !isAdmin) {
      throw new Error('Sem permissão para deletar');
    }

    await deleteDoc(topicRef);

    // Deletar todas as respostas
    const repliesRef = collection(db, 'forum_replies');
    const q = query(repliesRef, where('topicId', '==', topicId));
    const snapshot = await getDocs(q);
    
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
  }

  // Deletar resposta
  static async deleteReply(replyId: string, topicId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const replyRef = doc(db, 'forum_replies', replyId);
    const replyDoc = await getDoc(replyRef);
    
    if (!replyDoc.exists()) throw new Error('Resposta não encontrada');
    if (replyDoc.data().authorId !== userId && !isAdmin) {
      throw new Error('Sem permissão para deletar');
    }

    await deleteDoc(replyRef);

    // Decrementar contador
    const topicRef = doc(db, 'forum_topics', topicId);
    await updateDoc(topicRef, {
      replyCount: increment(-1)
    });
  }

  // Admin: Fixar/Desafixar tópico
  static async togglePinTopic(topicId: string): Promise<void> {
    const topicRef = doc(db, 'forum_topics', topicId);
    const topicDoc = await getDoc(topicRef);
    
    if (!topicDoc.exists()) throw new Error('Tópico não encontrado');

    await updateDoc(topicRef, {
      isPinned: !topicDoc.data().isPinned,
      updatedAt: new Date()
    });
  }

  // Admin: Obter estatísticas do fórum
  static async getForumStats(): Promise<{
    totalTopics: number;
    totalReplies: number;
    totalUsers: number;
    topicsToday: number;
    repliesToday: number;
    mostActiveCategory: string;
    resolvedTopics: number;
  }> {
    const topicsRef = collection(db, 'forum_topics');
    const repliesRef = collection(db, 'forum_replies');
    
    const [topicsSnapshot, repliesSnapshot] = await Promise.all([
      getDocs(topicsRef),
      getDocs(repliesRef)
    ]);

    const topics = topicsSnapshot.docs.map(doc => doc.data());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const topicsToday = topics.filter(t => {
      const createdAt = t.createdAt?.toDate() || new Date(0);
      return createdAt >= today;
    }).length;

    const replies = repliesSnapshot.docs.map(doc => doc.data());
    const repliesToday = replies.filter(r => {
      const createdAt = r.createdAt?.toDate() || new Date(0);
      return createdAt >= today;
    }).length;

    const authorIds = new Set(topics.map(t => t.authorId));
    
    const categoryCounts: Record<string, number> = {};
    topics.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const mostActiveCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'geral';

    const resolvedTopics = topics.filter(t => t.isResolved).length;

    return {
      totalTopics: topics.length,
      totalReplies: replies.length,
      totalUsers: authorIds.size,
      topicsToday,
      repliesToday,
      mostActiveCategory,
      resolvedTopics
    };
  }

  // Admin: Criar denúncia de conteúdo do fórum
  static async reportForumContent(
    reporterId: string,
    reporterName: string,
    contentType: 'topic' | 'reply',
    contentId: string,
    reason: string,
    details?: string
  ): Promise<string> {
    const reportsRef = collection(db, 'forum_reports');
    
    const report = await addDoc(reportsRef, {
      reporterId,
      reporterName,
      contentType,
      contentId,
      reason,
      details: details || '',
      status: 'pending',
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      adminNotes: null
    });

    return report.id;
  }

  // Admin: Obter denúncias
  static async getForumReports(status?: 'pending' | 'reviewed' | 'dismissed' | 'all'): Promise<any[]> {
    const reportsRef = collection(db, 'forum_reports');
    let q = query(reportsRef, orderBy('createdAt', 'desc'));

    if (status && status !== 'all') {
      q = query(reportsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    }));
  }

  // Admin: Revisar denúncia
  static async reviewForumReport(
    reportId: string,
    adminId: string,
    status: 'reviewed' | 'dismissed',
    adminNotes?: string
  ): Promise<void> {
    const reportRef = doc(db, 'forum_reports', reportId);
    await updateDoc(reportRef, {
      status,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: adminNotes || null
    });
  }
}
