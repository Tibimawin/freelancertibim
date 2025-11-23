import { collection, doc, getDoc, setDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserForumStats, FORUM_BADGES, REPUTATION_POINTS } from '@/types/forumBadges';
import { NotificationService } from './notificationService';

export class ForumBadgeService {
  // Obter ou criar estatísticas do usuário
  static async getUserStats(userId: string): Promise<UserForumStats> {
    const statsRef = doc(db, 'forum_user_stats', userId);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      return {
        ...statsDoc.data(),
        lastUpdated: statsDoc.data().lastUpdated?.toDate() || new Date()
      } as UserForumStats;
    }

    // Criar estatísticas iniciais
    const initialStats: UserForumStats = {
      userId,
      reputation: 0,
      solutionsAccepted: 0,
      upvotesReceived: 0,
      topicsCreated: 0,
      repliesCreated: 0,
      helpfulTopicsResolved: 0,
      badges: [],
      lastUpdated: new Date()
    };

    await setDoc(statsRef, initialStats);
    return initialStats;
  }

  // Adicionar pontos de reputação
  static async addReputation(userId: string, points: number, reason: string): Promise<void> {
    const statsRef = doc(db, 'forum_user_stats', userId);
    
    await updateDoc(statsRef, {
      reputation: increment(points),
      lastUpdated: new Date()
    });

    // Verificar se desbloqueou novos badges de reputação
    await this.checkAndAwardBadges(userId);

    console.log(`[ForumBadgeService] ${userId} ganhou ${points} pontos de reputação (${reason})`);
  }

  // Incrementar contador de soluções aceitas
  static async incrementSolutionsAccepted(userId: string): Promise<void> {
    const statsRef = doc(db, 'forum_user_stats', userId);
    
    await updateDoc(statsRef, {
      solutionsAccepted: increment(1),
      helpfulTopicsResolved: increment(1),
      reputation: increment(REPUTATION_POINTS.SOLUTION_ACCEPTED),
      lastUpdated: new Date()
    });

    await this.checkAndAwardBadges(userId);
  }

  // Incrementar contador de upvotes recebidos
  static async incrementUpvotesReceived(userId: string): Promise<void> {
    const statsRef = doc(db, 'forum_user_stats', userId);
    
    await updateDoc(statsRef, {
      upvotesReceived: increment(1),
      reputation: increment(REPUTATION_POINTS.UPVOTE_RECEIVED),
      lastUpdated: new Date()
    });

    await this.checkAndAwardBadges(userId);
  }

  // Incrementar contador de tópicos criados
  static async incrementTopicsCreated(userId: string): Promise<void> {
    const statsRef = doc(db, 'forum_user_stats', userId);
    
    await updateDoc(statsRef, {
      topicsCreated: increment(1),
      reputation: increment(REPUTATION_POINTS.TOPIC_CREATED),
      lastUpdated: new Date()
    });

    await this.checkAndAwardBadges(userId);
  }

  // Incrementar contador de respostas criadas
  static async incrementRepliesCreated(userId: string): Promise<void> {
    const statsRef = doc(db, 'forum_user_stats', userId);
    
    await updateDoc(statsRef, {
      repliesCreated: increment(1),
      reputation: increment(REPUTATION_POINTS.REPLY_CREATED),
      lastUpdated: new Date()
    });
  }

  // Verificar e conceder badges
  static async checkAndAwardBadges(userId: string): Promise<void> {
    const stats = await this.getUserStats(userId);
    const currentBadges = new Set(stats.badges);
    const newBadges: string[] = [];

    for (const badge of FORUM_BADGES) {
      // Já tem o badge
      if (currentBadges.has(badge.id)) continue;

      let qualified = false;

      switch (badge.requirement.type) {
        case 'solutions_accepted':
          qualified = stats.solutionsAccepted >= badge.requirement.count;
          break;
        case 'upvotes_received':
          qualified = stats.upvotesReceived >= badge.requirement.count;
          break;
        case 'topics_created':
          qualified = stats.topicsCreated >= badge.requirement.count;
          break;
        case 'forum_reputation':
          qualified = stats.reputation >= badge.requirement.count;
          break;
      }

      if (qualified) {
        newBadges.push(badge.id);
      }
    }

    // Conceder novos badges
    if (newBadges.length > 0) {
      const statsRef = doc(db, 'forum_user_stats', userId);
      await updateDoc(statsRef, {
        badges: [...stats.badges, ...newBadges],
        lastUpdated: new Date()
      });

      // Notificar usuário sobre novos badges
      for (const badgeId of newBadges) {
        const badge = FORUM_BADGES.find(b => b.id === badgeId);
        if (badge) {
          try {
            await NotificationService.createNotification({
              userId,
              type: 'system_update',
              title: `Novo Badge Conquistado! 🏆`,
              message: `Você ganhou o badge "${badge.name}": ${badge.description}`,
              read: false
            });
          } catch (error) {
            console.error('Erro ao notificar badge:', error);
          }
        }
      }

      console.log(`[ForumBadgeService] ${userId} conquistou ${newBadges.length} novo(s) badge(s)`);
    }
  }

  // Buscar top usuários por reputação
  static async getTopUsersByReputation(limitCount: number = 10): Promise<UserForumStats[]> {
    const statsRef = collection(db, 'forum_user_stats');
    const q = query(statsRef);
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as UserForumStats[];

    // Ordenar por reputação (client-side devido a limitações do Firestore)
    return users
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limitCount);
  }

  // Obter badges de um usuário
  static async getUserBadges(userId: string): Promise<typeof FORUM_BADGES> {
    const stats = await this.getUserStats(userId);
    return FORUM_BADGES.filter(badge => stats.badges.includes(badge.id));
  }
}
