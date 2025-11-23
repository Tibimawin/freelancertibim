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
    if (!currentUser || !recipientUserId) return;
    
    let unsubMessages: (() => void) | null = null;
    let unsubMeta: (() => void) | null = null;
    let threadIdLocal: string | null = null;
    
    const setup = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = await DirectMessageService.getOrCreateThread(currentUser.uid, recipientUserId);
        threadIdLocal = id;
        setThreadId(id);
        
        unsubMessages = DirectMessageService.subscribeToMessages(id, (msgs) => {
          setMessages(msgs);
          setLoading(false);
          // Mark as read when new messages from other user arrive
          const last = msgs[msgs.length - 1];
          if (last && last.senderId !== currentUser.uid) {
            DirectMessageService.markThreadRead(id, currentUser.uid).catch((err) => {
              // Silently fail if index is still building
              console.warn('Não foi possível marcar como lido:', err);
            });
          }
        });
        
        unsubMeta = DirectMessageService.subscribeToThread(id, ({ typing }) => {
          const other = typing[recipientUserId];
          setOtherTyping(!!other);
        });
      } catch (e) {
        console.error('Erro ao iniciar chat direto:', e);
        // Don't show error to user if it's just an index building issue
        const errorMessage = e instanceof Error ? e.message : '';
        if (!errorMessage.includes('index')) {
          setError('Erro ao iniciar conversa');
        }
        setLoading(false);
      }
    };
    
    setup();
    
    return () => {
      if (unsubMessages) unsubMessages();
      if (unsubMeta) unsubMeta();
      if (threadIdLocal && currentUser) {
        DirectMessageService.setTyping(threadIdLocal, currentUser.uid, false).catch(() => {});
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