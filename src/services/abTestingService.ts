import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  where,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ABTestVariant {
  id: string;
  title: string;
  message: string;
  recipientCount: number;
  readCount: number;
  clickCount: number;
  readRate: number;
  clickRate: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  totalRecipients: number;
  splitRatio: number; // Percentual para A (0-100), resto vai para B
  startedAt?: Date;
  completedAt?: Date;
  winner?: 'A' | 'B' | 'tie';
  createdAt: Date;
  createdBy: string;
  targetAudience: 'all' | 'freelancers' | 'contractors';
  metric: 'readRate' | 'clickRate'; // Métrica principal para determinar vencedor
}

export class ABTestingService {
  static async createABTest(data: {
    name: string;
    description: string;
    variantA: { title: string; message: string };
    variantB: { title: string; message: string };
    splitRatio: number;
    targetAudience: ABTest['targetAudience'];
    metric: ABTest['metric'];
    createdBy: string;
  }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'ab_tests'), {
        name: data.name,
        description: data.description,
        status: 'draft',
        variantA: {
          id: 'A',
          title: data.variantA.title,
          message: data.variantA.message,
          recipientCount: 0,
          readCount: 0,
          clickCount: 0,
          readRate: 0,
          clickRate: 0,
        },
        variantB: {
          id: 'B',
          title: data.variantB.title,
          message: data.variantB.message,
          recipientCount: 0,
          readCount: 0,
          clickCount: 0,
          readRate: 0,
          clickRate: 0,
        },
        totalRecipients: 0,
        splitRatio: data.splitRatio,
        targetAudience: data.targetAudience,
        metric: data.metric,
        createdAt: Timestamp.now(),
        createdBy: data.createdBy,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating AB test:', error);
      throw error;
    }
  }

  static async launchABTest(testId: string): Promise<void> {
    try {
      const testRef = doc(db, 'ab_tests', testId);
      const testSnap = await getDoc(testRef);

      if (!testSnap.exists()) {
        throw new Error('Test not found');
      }

      const testData = testSnap.data() as ABTest;

      // Buscar usuários baseado na audiência alvo
      let usersQuery = query(collection(db, 'users'));
      
      if (testData.targetAudience === 'freelancers') {
        usersQuery = query(collection(db, 'users'), where('currentMode', '==', 'tester'));
      } else if (testData.targetAudience === 'contractors') {
        usersQuery = query(collection(db, 'users'), where('currentMode', '==', 'poster'));
      }

      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Shuffle para randomização
      const shuffledUsers = users.sort(() => Math.random() - 0.5);
      
      // Dividir audiência baseado no splitRatio
      const splitIndex = Math.floor(shuffledUsers.length * (testData.splitRatio / 100));
      const variantAUsers = shuffledUsers.slice(0, splitIndex);
      const variantBUsers = shuffledUsers.slice(splitIndex);

      const { NotificationService } = await import('./notificationService');
      const { BroadcastHistoryService } = await import('./broadcastHistoryService');

      // Criar broadcasts para cada variante
      const broadcastAId = await BroadcastHistoryService.createBroadcastRecord({
        type: 'manual',
        title: testData.variantA.title,
        message: testData.variantA.message,
        totalRecipients: variantAUsers.length,
        sentBy: testData.createdBy,
      });

      const broadcastBId = await BroadcastHistoryService.createBroadcastRecord({
        type: 'manual',
        title: testData.variantB.title,
        message: testData.variantB.message,
        totalRecipients: variantBUsers.length,
        sentBy: testData.createdBy,
      });

      // Enviar notificações Variante A
      const notificationsA = variantAUsers.map(user =>
        NotificationService.createNotification({
          userId: user.id,
          type: 'system_update',
          title: testData.variantA.title,
          message: testData.variantA.message,
          read: false,
          broadcastId: broadcastAId,
          metadata: {
            abTestId: testId,
            variant: 'A',
          },
        })
      );

      // Enviar notificações Variante B
      const notificationsB = variantBUsers.map(user =>
        NotificationService.createNotification({
          userId: user.id,
          type: 'system_update',
          title: testData.variantB.title,
          message: testData.variantB.message,
          read: false,
          broadcastId: broadcastBId,
          metadata: {
            abTestId: testId,
            variant: 'B',
          },
        })
      );

      await Promise.all([...notificationsA, ...notificationsB]);

      // Atualizar test status
      await updateDoc(testRef, {
        status: 'running',
        startedAt: Timestamp.now(),
        totalRecipients: users.length,
        'variantA.recipientCount': variantAUsers.length,
        'variantB.recipientCount': variantBUsers.length,
      });

      console.log(`AB Test launched: ${variantAUsers.length} users got A, ${variantBUsers.length} got B`);
    } catch (error) {
      console.error('Error launching AB test:', error);
      throw error;
    }
  }

  static async calculateTestResults(testId: string): Promise<ABTest> {
    try {
      const testRef = doc(db, 'ab_tests', testId);
      const testSnap = await getDoc(testRef);

      if (!testSnap.exists()) {
        throw new Error('Test not found');
      }

      const testData = testSnap.data() as ABTest;

      // Buscar notificações de cada variante
      const notificationsRef = collection(db, 'notifications');
      
      const variantAQuery = query(
        notificationsRef,
        where('metadata.abTestId', '==', testId),
        where('metadata.variant', '==', 'A')
      );
      
      const variantBQuery = query(
        notificationsRef,
        where('metadata.abTestId', '==', testId),
        where('metadata.variant', '==', 'B')
      );

      const [variantASnap, variantBSnap] = await Promise.all([
        getDocs(variantAQuery),
        getDocs(variantBQuery)
      ]);

      // Calcular métricas Variante A
      let aRead = 0, aClicked = 0;
      variantASnap.forEach(doc => {
        const data = doc.data();
        if (data.read) aRead++;
        if (data.clicked) aClicked++;
      });

      // Calcular métricas Variante B
      let bRead = 0, bClicked = 0;
      variantBSnap.forEach(doc => {
        const data = doc.data();
        if (data.read) bRead++;
        if (data.clicked) bClicked++;
      });

      const aTotal = variantASnap.size;
      const bTotal = variantBSnap.size;

      const variantAReadRate = aTotal > 0 ? (aRead / aTotal) * 100 : 0;
      const variantAClickRate = aTotal > 0 ? (aClicked / aTotal) * 100 : 0;
      const variantBReadRate = bTotal > 0 ? (bRead / bTotal) * 100 : 0;
      const variantBClickRate = bTotal > 0 ? (bClicked / bTotal) * 100 : 0;

      // Determinar vencedor baseado na métrica escolhida
      let winner: 'A' | 'B' | 'tie' = 'tie';
      const metric = testData.metric || 'readRate';
      const aMetric = metric === 'readRate' ? variantAReadRate : variantAClickRate;
      const bMetric = metric === 'readRate' ? variantBReadRate : variantBClickRate;

      if (Math.abs(aMetric - bMetric) > 5) { // Diferença mínima de 5% para declarar vencedor
        winner = aMetric > bMetric ? 'A' : 'B';
      }

      // Atualizar documento
      await updateDoc(testRef, {
        'variantA.readCount': aRead,
        'variantA.clickCount': aClicked,
        'variantA.readRate': parseFloat(variantAReadRate.toFixed(2)),
        'variantA.clickRate': parseFloat(variantAClickRate.toFixed(2)),
        'variantB.readCount': bRead,
        'variantB.clickCount': bClicked,
        'variantB.readRate': parseFloat(variantBReadRate.toFixed(2)),
        'variantB.clickRate': parseFloat(variantBClickRate.toFixed(2)),
        winner,
      });

      return {
        ...testData,
        id: testId,
        variantA: {
          ...testData.variantA,
          readCount: aRead,
          clickCount: aClicked,
          readRate: parseFloat(variantAReadRate.toFixed(2)),
          clickRate: parseFloat(variantAClickRate.toFixed(2)),
        },
        variantB: {
          ...testData.variantB,
          readCount: bRead,
          clickCount: bClicked,
          readRate: parseFloat(variantBReadRate.toFixed(2)),
          clickRate: parseFloat(variantBClickRate.toFixed(2)),
        },
        winner,
      };
    } catch (error) {
      console.error('Error calculating test results:', error);
      throw error;
    }
  }

  static async completeABTest(testId: string): Promise<void> {
    try {
      const results = await this.calculateTestResults(testId);
      
      await updateDoc(doc(db, 'ab_tests', testId), {
        status: 'completed',
        completedAt: Timestamp.now(),
      });

      console.log(`AB Test completed. Winner: ${results.winner}`);
    } catch (error) {
      console.error('Error completing AB test:', error);
      throw error;
    }
  }

  static async getABTests(limitCount: number = 20): Promise<ABTest[]> {
    try {
      const q = query(
        collection(db, 'ab_tests'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const tests: ABTest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          startedAt: data.startedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
        } as ABTest);
      });

      return tests;
    } catch (error) {
      console.error('Error getting AB tests:', error);
      throw error;
    }
  }
}
