import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp, getDoc, doc } from 'firebase/firestore';
import { LevelService } from './levelService';

export interface RankedUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  xp: number;
  level: number;
  levelName: string;
  lastXPAt?: Date;
}

export class RankingService {
  static async getTopUsersByXP(limitCount: number = 10, period?: 'weekly' | 'monthly'): Promise<RankedUser[]> {
    try {
      let q = query(
        collection(db, 'user_levels'),
        orderBy('xp', 'desc'),
        limit(limitCount)
      );

      console.log(`[RankingService] Buscando top ${limitCount} usuários${period ? ` (período: ${period})` : ''}`);

      // Se houver período, filtrar por lastXPAt
      if (period) {
        const now = new Date();
        let startDate: Date;

        if (period === 'weekly') {
          // Últimos 7 dias
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          // Último mês (30 dias)
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        try {
          q = query(
            collection(db, 'user_levels'),
            where('lastXPAt', '>=', Timestamp.fromDate(startDate)),
            orderBy('lastXPAt', 'desc'),
            orderBy('xp', 'desc'),
            limit(limitCount)
          );
        } catch (indexError) {
          console.warn('[RankingService] Índice composto não encontrado, usando query simples', indexError);
          // Fallback para query simples se índice não existir
          q = query(
            collection(db, 'user_levels'),
            orderBy('xp', 'desc'),
            limit(limitCount)
          );
        }
      }

      const querySnapshot = await getDocs(q);
      console.log(`[RankingService] Encontrados ${querySnapshot.size} documentos`);
      
      const rankedUsers: RankedUser[] = [];

      // Buscar dados de usuários em paralelo
      const userPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const userId = docSnapshot.id;
        
        // Buscar dados do usuário
        let userName = 'Usuário';
        let userAvatar: string | undefined;

        try {
          const userDocRef = doc(db, 'users', userId);
          const userSnapshot = await getDoc(userDocRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            userName = (userData as any).name || 'Usuário';
            userAvatar = (userData as any).avatarUrl;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        const xp = data.xp || 0;
        const level = data.level || 0;
        const levelName = LevelService.getLevelName(level);

        return {
          userId,
          userName,
          userAvatar,
          xp,
          level,
          levelName,
          lastXPAt: data.lastXPAt?.toDate()
        };
      });

      const users = await Promise.all(userPromises);
      rankedUsers.push(...users);

      console.log(`[RankingService] Retornando ${rankedUsers.length} usuários ranqueados`);
      return rankedUsers;
    } catch (error) {
      console.error('[RankingService] Erro ao buscar ranking:', error);
      throw error; // Propagar erro para tratamento no componente
    }
  }

  static async getUserRank(userId: string, period?: 'weekly' | 'monthly'): Promise<number | null> {
    try {
      // Buscar XP do usuário
      const userLevelRef = doc(db, 'user_levels', userId);
      const userLevelDoc = await getDoc(userLevelRef);
      
      if (!userLevelDoc.exists()) return null;
      
      const userXP = userLevelDoc.data().xp || 0;

      let q = query(
        collection(db, 'user_levels'),
        where('xp', '>', userXP)
      );

      if (period) {
        const now = new Date();
        let startDate: Date;

        if (period === 'weekly') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        q = query(
          collection(db, 'user_levels'),
          where('lastXPAt', '>=', Timestamp.fromDate(startDate)),
          where('xp', '>', userXP)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.size + 1; // Posição do usuário
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }
}
