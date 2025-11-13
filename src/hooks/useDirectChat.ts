import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DirectMessage } from '@/types/firebase';
import { DirectMessageService } from '@/services/directMessageService';

export const useDirectChat = (recipientUserId: string) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState<boolean>(false);

  useEffect(() => {
    const setup = async () => {
      if (!currentUser || !recipientUserId) return;
      setLoading(true);
      try {
        const id = await DirectMessageService.getOrCreateThread(currentUser.uid, recipientUserId);
        setThreadId(id);
        const unsubscribe = DirectMessageService.subscribeToMessages(id, (msgs) => {
          setMessages(msgs);
          setLoading(false);
          // Mark as read when new messages from other user arrive
          const last = msgs[msgs.length - 1];
          if (last && last.senderId !== currentUser.uid) {
            DirectMessageService.markThreadRead(id, currentUser.uid).catch(() => {});
          }
        });
        const unsubMeta = DirectMessageService.subscribeToThread(id, ({ typing }) => {
          const other = typing[recipientUserId];
          setOtherTyping(!!other);
        });
        return () => unsubscribe();
      } catch (e) {
        console.error('Erro ao iniciar chat direto:', e);
        setError('Erro ao iniciar conversa');
        setLoading(false);
      }
    };
    const cleanup = setup();
    return () => {
      if (typeof cleanup === 'function') cleanup();
      // clear typing when unmount
      if (threadId && currentUser) {
        DirectMessageService.setTyping(threadId, currentUser.uid, false).catch(() => {});
      }
    };
  }, [currentUser, recipientUserId]);

  const sendMessage = async (text: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    if (!threadId) throw new Error('Thread not initialized');
    try {
      await DirectMessageService.sendMessage(threadId, currentUser.uid, currentUser.displayName || 'Usuário', recipientUserId, text);
      // stop typing after sending
      await DirectMessageService.setTyping(threadId, currentUser.uid, false);
    } catch (err) {
      console.error('Erro ao enviar mensagem direta:', err);
      setError('Erro ao enviar mensagem');
    }
  };

  const setTyping = async (typing: boolean) => {
    if (!currentUser || !threadId) return;
    try {
      await DirectMessageService.setTyping(threadId, currentUser.uid, typing);
    } catch {}
  };

  return { messages, loading, error, sendMessage, currentUserId: currentUser?.uid, threadId, otherTyping, setTyping };
};