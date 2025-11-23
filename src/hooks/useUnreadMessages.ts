import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { useSoundNotification } from './useSoundNotification';
import { useNotificationPermission } from './useNotificationPermission';
import { AuthService } from '@/services/auth';

export const useUnreadMessages = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { playSound } = useSoundNotification();
  const { showNotification, requestPermission, permission } = useNotificationPermission();
  const [previousCount, setPreviousCount] = useState(0);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Request notification permission on mount if supported
  useEffect(() => {
    if (!hasRequestedPermission && permission === 'default' && currentUser) {
      requestPermission();
      setHasRequestedPermission(true);
    }
  }, [currentUser, permission, requestPermission, hasRequestedPermission]);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    // Subscribe to all threads where user is a participant
    const threadsRef = collection(db, 'direct_threads');
    const q = query(
      threadsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let totalUnread = 0;
      let newMessages: Array<{ senderName: string; text: string }> = [];

      // For each thread, count unread messages
      for (const threadDoc of snapshot.docs) {
        const threadId = threadDoc.id;
        const messagesRef = collection(db, 'direct_threads', threadId, 'messages');
        
        try {
          const messagesQuery = query(
            messagesRef,
            where('recipientId', '==', currentUser.uid),
            where('readAt', '==', null)
          );

          const messagesSnapshot = await getDocs(messagesQuery);
          const threadUnreadCount = messagesSnapshot.size;
          totalUnread += threadUnreadCount;

          // If there are new messages in this thread
          if (threadUnreadCount > 0 && totalUnread > previousCount) {
            // Get the latest message for notification - sort manually
            const sortedDocs = messagesSnapshot.docs.sort((a, b) => {
              const aTime = a.data().createdAt?.toMillis?.() || 0;
              const bTime = b.data().createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
            
            const latestMessage = sortedDocs[0]?.data();
            if (latestMessage) {
              newMessages.push({
                senderName: latestMessage.senderName || 'Usuário',
                text: latestMessage.text || 'Nova mensagem',
              });
            }
          }
        } catch (error) {
          console.error('Erro ao contar mensagens não lidas:', error);
          // Continue silently if index is still building
        }
      }

      // Play sound and show notification if unread count increased
      if (totalUnread > previousCount && previousCount > 0) {
        playSound('info');

        // Show browser notification for the latest message
        if (newMessages.length > 0) {
          const latestMsg = newMessages[0];
          showNotification(
            `${latestMsg.senderName}`,
            {
              body: latestMsg.text,
              tag: 'direct-message',
              requireInteraction: false,
              silent: false,
            }
          );
        }
      }

      setPreviousCount(totalUnread);
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [currentUser, playSound, previousCount, showNotification]);

  return unreadCount;
};
