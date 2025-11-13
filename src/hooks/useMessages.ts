import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types/firebase';
import { MessageService } from '@/services/messageService';

export const useMessages = (applicationId: string) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    const unsubscribe = MessageService.subscribeToMessages(applicationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [applicationId]);

  const sendMessage = async (text: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await MessageService.sendMessage(applicationId, currentUser.uid, currentUser.displayName || 'Usuário', text);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
    }
  };

  return { messages, loading, error, sendMessage, currentUserId: currentUser?.uid };
};