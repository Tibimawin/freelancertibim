import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types/firebase';
import { MessageService } from '@/services/messageService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMessages = (applicationId: string) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription
  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    const unsubscribe = MessageService.subscribeToMessages(applicationId, (msgs) => {
      setMessages(msgs);
      // Atualiza cache do React Query
      queryClient.setQueryData(['messages', applicationId], msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [applicationId, queryClient]);

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      return MessageService.sendMessage(applicationId, currentUser.uid, currentUser.displayName || 'Usuário', text);
    },
    onSuccess: () => {
      // O listener já vai atualizar automaticamente
    },
    onError: (err) => {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
    }
  });

  const sendMessage = (text: string) => {
    return sendMessageMutation.mutateAsync(text);
  };

  return { messages, loading, error, sendMessage, currentUserId: currentUser?.uid };
};