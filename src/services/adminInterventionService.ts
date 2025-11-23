import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminIntervention } from '@/types/firebase';

export class AdminInterventionService {
  // Criar log de intervenção
  static async createIntervention(data: Omit<AdminIntervention, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'admin_interventions'), {
        ...data,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating intervention:', error);
      throw error;
    }
  }

  // Buscar intervenções de um contratante (para detectar padrão de fraude)
  static async getContractorInterventions(contractorId: string): Promise<AdminIntervention[]> {
    try {
      const q = query(
        collection(db, 'admin_interventions'),
        where('originalReviewerId', '==', contractorId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminIntervention[];
    } catch (error) {
      console.error('Error fetching contractor interventions:', error);
      return [];
    }
  }

  // Buscar todas as intervenções (para relatórios)
  static async getAllInterventions(options?: { limit?: number }): Promise<AdminIntervention[]> {
    try {
      const q = query(
        collection(db, 'admin_interventions'),
        orderBy('createdAt', 'desc'),
        limit(options?.limit || 100)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminIntervention[];
    } catch (error) {
      console.error('Error fetching all interventions:', error);
      return [];
    }
  }

  // Estatísticas de intervenções
  static async getInterventionStats(): Promise<{
    total: number;
    last30Days: number;
    topContractorsWithIssues: { contractorId: string; count: number; contractorName: string }[];
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allInterventions = await this.getAllInterventions({ limit: 500 });
      
      const last30Days = allInterventions.filter(intervention => {
        const createdAt = intervention.createdAt?.toDate?.() || new Date(intervention.createdAt);
        return createdAt >= thirtyDaysAgo;
      });

      // Agrupar por contratante
      const contractorMap = new Map<string, { count: number; name: string }>();
      allInterventions.forEach(intervention => {
        const id = intervention.originalReviewerId;
        if (contractorMap.has(id)) {
          contractorMap.get(id)!.count++;
        } else {
          contractorMap.set(id, { count: 1, name: intervention.metadata?.freelancerName || 'Desconhecido' });
        }
      });

      const topContractorsWithIssues = Array.from(contractorMap.entries())
        .map(([contractorId, { count, name }]) => ({ contractorId, count, contractorName: name }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total: allInterventions.length,
        last30Days: last30Days.length,
        topContractorsWithIssues,
      };
    } catch (error) {
      console.error('Error fetching intervention stats:', error);
      return { total: 0, last30Days: 0, topContractorsWithIssues: [] };
    }
  }
}
