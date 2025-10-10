import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/notificationService';
import { Notification } from '@/types/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setNotifications(fetchedNotifications);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching real-time notifications:', err);
      setError('Erro ao carregar notificações em tempo real');
      setLoading(false);
    });

    // Cleanup listener on component unmount or user change
    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      // The onSnapshot listener will automatically update the state
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Erro ao marcar notificação como lida');
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await NotificationService.markAllAsRead(currentUser.uid);
      // The onSnapshot listener will automatically update the state
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Erro ao marcar todas as notificações como lidas');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};