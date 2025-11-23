import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityEvent {
  id: string;
  type: 'user_registered' | 'task_created' | 'proof_submitted' | 'withdrawal_requested' | 
        'report_created' | 'transaction' | 'task_completed' | 'proof_approved' | 'proof_rejected';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  metadata?: any;
  icon: string;
  color: string;
}

export const useActivityFeed = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Monitorar novos usuários
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    unsubscribers.push(
      onSnapshot(usersQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            
            setActivities(prev => [{
              id: `user-${change.doc.id}-${Date.now()}`,
              type: 'user_registered' as const,
              title: 'Novo Usuário',
              description: `${data.name || 'Usuário'} se registrou na plataforma`,
              timestamp: createdAt,
              userId: change.doc.id,
              userName: data.name,
              icon: '👤',
              color: 'text-green-500'
            }, ...prev].slice(0, 50));
          }
        });
      })
    );

    // Monitorar novas tarefas
    const tasksQuery = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    unsubscribers.push(
      onSnapshot(tasksQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            
            setActivities(prev => [{
              id: `task-${change.doc.id}-${Date.now()}`,
              type: 'task_created' as const,
              title: 'Nova Tarefa Criada',
              description: `${data.userName || 'Contratante'} criou tarefa: ${data.title}`,
              timestamp: createdAt,
              userId: data.userId,
              userName: data.userName,
              metadata: { taskId: change.doc.id, taskTitle: data.title },
              icon: '📋',
              color: 'text-blue-500'
            }, ...prev].slice(0, 50));
          }
        });
      })
    );

    // Monitorar provas enviadas
    const applicationsQuery = query(
      collection(db, 'applications'),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    unsubscribers.push(
      onSnapshot(applicationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            
            if (data.proofUrl) {
              setActivities(prev => [{
                id: `proof-${change.doc.id}-${Date.now()}`,
                type: 'proof_submitted' as const,
                title: 'Prova Enviada',
                description: `${data.userName || 'Freelancer'} enviou prova para tarefa`,
                timestamp: createdAt,
                userId: data.userId,
                userName: data.userName,
                metadata: { applicationId: change.doc.id },
                icon: '📸',
                color: 'text-purple-500'
              }, ...prev].slice(0, 50));
            }
          }

          if (change.type === 'modified') {
            const data = change.doc.data();
            const updatedAt = new Date();

            if (data.status === 'approved') {
              setActivities(prev => [{
                id: `approved-${change.doc.id}-${Date.now()}`,
                type: 'proof_approved' as const,
                title: 'Prova Aprovada',
                description: `Prova de ${data.userName || 'Freelancer'} foi aprovada`,
                timestamp: updatedAt,
                userId: data.userId,
                userName: data.userName,
                metadata: { applicationId: change.doc.id },
                icon: '✅',
                color: 'text-green-500'
              }, ...prev].slice(0, 50));
            } else if (data.status === 'rejected') {
              setActivities(prev => [{
                id: `rejected-${change.doc.id}-${Date.now()}`,
                type: 'proof_rejected' as const,
                title: 'Prova Rejeitada',
                description: `Prova de ${data.userName || 'Freelancer'} foi rejeitada`,
                timestamp: updatedAt,
                userId: data.userId,
                userName: data.userName,
                metadata: { applicationId: change.doc.id },
                icon: '❌',
                color: 'text-red-500'
              }, ...prev].slice(0, 50));
            }
          }
        });
      })
    );

    // Monitorar saques
    const withdrawalsQuery = query(
      collection(db, 'withdrawals'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    unsubscribers.push(
      onSnapshot(withdrawalsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            
            setActivities(prev => [{
              id: `withdrawal-${change.doc.id}-${Date.now()}`,
              type: 'withdrawal_requested' as const,
              title: 'Saque Solicitado',
              description: `${data.userName || 'Usuário'} solicitou saque de ${data.amount} Kz`,
              timestamp: createdAt,
              userId: data.userId,
              userName: data.userName,
              metadata: { withdrawalId: change.doc.id, amount: data.amount },
              icon: '💰',
              color: 'text-yellow-500'
            }, ...prev].slice(0, 50));
          }
        });
      })
    );

    // Monitorar reportes
    const reportsQuery = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    unsubscribers.push(
      onSnapshot(reportsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            
            setActivities(prev => [{
              id: `report-${change.doc.id}-${Date.now()}`,
              type: 'report_created' as const,
              title: 'Novo Reporte',
              description: `${data.reporterName || 'Usuário'} reportou: ${data.reason}`,
              timestamp: createdAt,
              userId: data.reporterId,
              userName: data.reporterName,
              metadata: { reportId: change.doc.id, reason: data.reason },
              icon: '🚨',
              color: 'text-red-500'
            }, ...prev].slice(0, 50));
          }
        });
      })
    );

    // Monitorar transações
    const transactionsQuery = query(
      collection(db, 'transactions'),
      orderBy('timestamp', 'desc'),
      limit(15)
    );

    unsubscribers.push(
      onSnapshot(transactionsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const timestamp = data.timestamp?.toDate() || new Date();
            
            setActivities(prev => [{
              id: `transaction-${change.doc.id}-${Date.now()}`,
              type: 'transaction' as const,
              title: 'Transação',
              description: `${data.type === 'credit' ? 'Crédito' : 'Débito'} de ${data.amount} Kz`,
              timestamp: timestamp,
              userId: data.userId,
              metadata: { transactionId: change.doc.id, amount: data.amount, type: data.type },
              icon: '💳',
              color: data.type === 'credit' ? 'text-green-500' : 'text-orange-500'
            }, ...prev].slice(0, 50));
          }
        });
      })
    );

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentUser]);

  return {
    activities: activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    loading
  };
};
