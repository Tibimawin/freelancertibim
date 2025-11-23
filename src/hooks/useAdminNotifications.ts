import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSoundNotification } from './useSoundNotification';

export interface AdminNotification {
  id: string;
  type: 'withdrawal' | 'report' | 'verification' | 'user' | 'transaction' | 'security' | 'deposit_negotiation' | 'email_task_rejection';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success' | 'critical';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  metadata?: any;
}

export const useAdminNotifications = () => {
  const { currentUser } = useAuth();
  const { playSound } = useSoundNotification();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Escutar novos saques pendentes
    const withdrawalsQuery = query(
      collection(db, 'withdrawals'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notification: AdminNotification = {
            id: `withdrawal-${change.doc.id}`,
            type: 'withdrawal',
            title: 'Novo Saque Pendente',
            message: `${data.userName || 'Usuário'} solicitou saque de ${data.amount} Kz`,
            severity: 'warning',
            read: false,
            timestamp: data.createdAt?.toDate() || new Date(),
            actionUrl: '/admin?tab=withdrawals',
            metadata: { withdrawalId: change.doc.id }
          };

          setNotifications(prev => [notification, ...prev]);
          
          // Tocar som crítico para saques pendentes
          playSound('critical');
          
          toast.warning(notification.message, {
            description: 'Clique para revisar',
            action: {
              label: 'Ver',
              onClick: () => window.location.href = notification.actionUrl!
            }
          });
        }
      });
    });

    // Escutar novos reportes
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notification: AdminNotification = {
            id: `report-${change.doc.id}`,
            type: 'report',
            title: 'Novo Reporte',
            message: `Novo reporte de ${data.reporterName || 'usuário'}: ${data.reason}`,
            severity: 'error',
            read: false,
            timestamp: data.createdAt?.toDate() || new Date(),
            actionUrl: '/admin?tab=reports',
            metadata: { reportId: change.doc.id }
          };

          setNotifications(prev => [notification, ...prev]);
          
          // Tocar som de aviso para denúncias
          playSound('warning');
          
          toast.error(notification.message, {
            description: 'Requer atenção imediata',
            action: {
              label: 'Revisar',
              onClick: () => window.location.href = notification.actionUrl!
            }
          });
        }
      });
    });

    // Escutar novos usuários
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const now = new Date();
          const createdAt = data.createdAt?.toDate() || new Date();
          const isRecent = (now.getTime() - createdAt.getTime()) < 60000; // Últimos 60 segundos

          if (isRecent) {
            const notification: AdminNotification = {
              id: `user-${change.doc.id}`,
              type: 'user',
              title: 'Novo Usuário Registrado',
              message: `${data.name || 'Novo usuário'} acabou de se registrar`,
              severity: 'success',
              read: false,
              timestamp: createdAt,
              actionUrl: '/admin?tab=users',
              metadata: { userId: change.doc.id }
            };

            setNotifications(prev => [notification, ...prev]);
            
            // Tocar som de sucesso para novos usuários
            playSound('success');
            
            toast.success(notification.message);
          }
        }
      });
    });

    // Escutar verificações pendentes
    const verificationsQuery = query(
      collection(db, 'verifications'),
      where('overallStatus', '==', 'pending'),
      orderBy('submittedAt', 'desc'),
      limit(50)
    );

    const unsubscribeVerifications = onSnapshot(verificationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notification: AdminNotification = {
            id: `verification-${change.doc.id}`,
            type: 'verification',
            title: 'Nova Verificação',
            message: `${data.userName || 'Usuário'} enviou documentos para verificação`,
            severity: 'info',
            read: false,
            timestamp: data.submittedAt?.toDate() || new Date(),
            actionUrl: '/admin?tab=verifications',
            metadata: { verificationId: change.doc.id }
          };

          setNotifications(prev => [notification, ...prev]);
          
          // Tocar som de info para verificações pendentes
          playSound('info');
          
          toast.info(notification.message, {
            action: {
              label: 'Revisar',
              onClick: () => window.location.href = notification.actionUrl!
            }
          });
        }
      });
    });

    // Escutar mensagens de negociação de depósito (usuário -> admin)
    const depositMessagesQuery = query(
      collectionGroup(db, 'messages'),
      where('senderRole', '==', 'user'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeDepositMessages = onSnapshot(depositMessagesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const now = new Date();
          const createdAt = data.createdAt?.toDate() || new Date();
          const isRecent = (now.getTime() - createdAt.getTime()) < 60000; // Últimos 60 segundos

          if (isRecent && !data.read) {
            // Extrair negotiationId do caminho do documento
            const pathParts = change.doc.ref.path.split('/');
            const negotiationId = pathParts[pathParts.indexOf('depositNegotiations') + 1];
            
            const notification: AdminNotification = {
              id: `deposit-msg-${change.doc.id}`,
              type: 'deposit_negotiation',
              title: '💰 Nova Mensagem em Negociação',
              message: `${data.senderName} enviou: "${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
              severity: 'warning',
              read: false,
              timestamp: createdAt,
              actionUrl: '/admin?tab=deposits',
              metadata: { 
                negotiationId,
                messageId: change.doc.id,
                senderId: data.senderId 
              }
            };

            setNotifications(prev => [notification, ...prev]);
            
            // Tocar som crítico para mensagens de negociação
            playSound('critical');
            
            toast.warning(notification.message, {
              description: 'Clique para responder',
              action: {
                label: 'Ver Chat',
                onClick: () => window.location.href = notification.actionUrl!
              }
            });
          }
        }
      });
    });

    // Escutar rejeições de tarefas de criação de e-mail (alerta crítico anti-fraude)
    const emailRejectionQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', 'ADMIN'),
      where('type', '==', 'email_task_rejection'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeEmailRejections = onSnapshot(emailRejectionQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const now = new Date();
          const createdAt = data.createdAt?.toDate() || new Date();
          const isRecent = (now.getTime() - createdAt.getTime()) < 60000; // Últimos 60 segundos

          if (isRecent) {
            const notification: AdminNotification = {
              id: `email-rejection-${change.doc.id}`,
              type: 'email_task_rejection',
              title: '🚨 FRAUDE: Rejeição de E-mail',
              message: `${data.metadata?.freelancerName} teve tarefa rejeitada por contratante. Provedor: ${data.metadata?.provider}. Motivo: "${data.metadata?.rejectionReason}"`,
              severity: 'critical',
              read: false,
              timestamp: createdAt,
              actionUrl: '/admin?tab=email-creation',
              metadata: {
                applicationId: data.metadata?.applicationId,
                jobId: data.metadata?.jobId,
                contractorId: data.metadata?.contractorId,
                freelancerId: data.metadata?.freelancerId,
                bounty: data.metadata?.bounty
              }
            };

            setNotifications(prev => [notification, ...prev]);
            
            // Tocar som CRÍTICO para possível fraude
            playSound('critical');
            
            toast.error(notification.message, {
              description: 'Possível fraude - Revisar credenciais',
              duration: 10000, // 10 segundos
              action: {
                label: 'Revisar Agora',
                onClick: () => window.location.href = notification.actionUrl!
              }
            });
          }
        }
      });
    });

    setLoading(false);

    return () => {
      unsubscribeWithdrawals();
      unsubscribeReports();
      unsubscribeUsers();
      unsubscribeVerifications();
      unsubscribeDepositMessages();
      unsubscribeEmailRejections();
    };
  }, [currentUser]);

  // Atualizar contador de não lidas
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll
  };
};
