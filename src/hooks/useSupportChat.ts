import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SupportChatService, SupportMessage, SupportChatSummary } from '@/services/supportChatService';

export const useSupportChat = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMeta, setChatMeta] = useState<SupportChatSummary | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      setLoading(false);
      setChatMeta(null);
      return;
    }
    setLoading(true);
    const unsubscribe = SupportChatService.subscribeToMessages(currentUser.uid, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    const unMeta = SupportChatService.subscribeToChat(currentUser.uid, (meta) => {
      setChatMeta(meta);
    });
    return () => { unsubscribe(); unMeta(); };
  }, [currentUser?.uid]);

  const sendMessage = async (text: string) => {
    if (!currentUser) {
      setError('Usuário não autenticado');
      return;
    }
    try {
      await SupportChatService.sendMessage(currentUser.uid, currentUser.uid, currentUser.displayName || 'Usuário', text);
    } catch (err) {
      console.error('Error sending support message:', err);
      setError('Erro ao enviar mensagem de suporte');
    }
  };

  const markUserRead = async () => {
    if (!currentUser) return;
    try {
      await SupportChatService.markAsRead(currentUser.uid, 'user');
    } catch (e) {
      console.error('Error marking user chat as read', e);
    }
  };

  const setUserTyping = async (typing: boolean) => {
    if (!currentUser) return;
    try {
      await SupportChatService.setTyping(currentUser.uid, 'user', typing);
    } catch (e) {
      console.error('Error setting user typing', e);
    }
  };

  return { messages, loading, error, sendMessage, currentUserId: currentUser?.uid, status: chatMeta?.status || 'open', userUnread: chatMeta?.userUnread || 0, markUserRead, adminTyping: !!chatMeta?.adminTyping, setUserTyping };
};