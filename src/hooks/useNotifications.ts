import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/notificationService';
import { Notification } from '@/types/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNotificationPermission } from './useNotificationPermission';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousNotificationsRef = useRef<Notification[]>([]);
  const { showNotification, requestPermission, permission } = useNotificationPermission();

  // Request notification permission on mount if not already granted
  useEffect(() => {
    if (currentUser && permission === 'default') {
      requestPermission();
    }
  }, [currentUser, permission, requestPermission]);

  // Real-time subscription usando onSnapshot
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification);
      });
      
      // Detectar novas notificações e mostrar toast
      if (previousNotificationsRef.current.length > 0) {
        const previousIds = new Set(previousNotificationsRef.current.map(n => n.id));
        const newNotifications = fetchedNotifications.filter(n => !previousIds.has(n.id));
        
        // Mostrar toast e notificação push para novas notificações
        newNotifications.forEach(notification => {
          const shouldShowNotification = permission === 'granted';
          
          if (notification.type === 'task_approved') {
            toast.success(notification.title, {
              description: notification.message,
              duration: 6000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'task_approved',
                requireInteraction: true,
              });
            }
          } else if (notification.type === 'task_rejected') {
            toast.error(notification.title, {
              description: notification.message,
              duration: 8000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'task_rejected',
                requireInteraction: true,
              });
            }
          } else if (notification.type === 'task_submitted') {
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'task_submitted',
              });
            }
          } else if (notification.type === 'deposit_confirmed') {
            toast.success(notification.title, {
              description: notification.message,
              duration: 7000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'deposit_confirmed',
                requireInteraction: true,
              });
            }
          } else if (notification.type === 'withdrawal_approved') {
            toast.success(notification.title, {
              description: notification.message,
              duration: 7000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'withdrawal_approved',
                requireInteraction: true,
              });
            }
          } else if (notification.type === 'withdrawal_rejected') {
            toast.error(notification.title, {
              description: notification.message,
              duration: 8000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'withdrawal_rejected',
                requireInteraction: true,
              });
            }
          } else if (notification.type === 'system_update') {
            toast.info(notification.title, {
              description: notification.message,
              duration: 10000,
            });
            if (shouldShowNotification) {
              showNotification(notification.title, {
                body: notification.message,
                tag: 'system_update',
                requireInteraction: true,
              });
            }
          }
        });
      }
      
      previousNotificationsRef.current = fetchedNotifications;
      setNotifications(fetchedNotifications);
      // Atualiza o cache do React Query também
      queryClient.setQueryData(['notifications', currentUser.uid], fetchedNotifications);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching real-time notifications:', err);
      setError('Erro ao carregar notificações em tempo real');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, queryClient]);

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => NotificationService.markAsRead(notificationId),
    onSuccess: () => {
      // O listener onSnapshot já vai atualizar automaticamente
    },
    onError: (err) => {
      console.error('Error marking notification as read:', err);
      setError('Erro ao marcar notificação como lida');
    }
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: (userId: string) => NotificationService.markAllAsRead(userId),
    onSuccess: () => {
      // O listener onSnapshot já vai atualizar automaticamente
    },
    onError: (err) => {
      console.error('Error marking all notifications as read:', err);
      setError('Erro ao marcar todas as notificações como lidas');
    }
  });

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    markAllAsReadMutation.mutate(currentUser.uid);
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};