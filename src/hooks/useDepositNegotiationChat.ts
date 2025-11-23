import { useEffect, useState, useCallback, useRef } from 'react';
import { DepositNegotiationMessagesService, DepositNegotiationMessage } from '@/services/depositNegotiationMessagesService';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundNotification } from '@/hooks/useSoundNotification';

export const useDepositNegotiationChat = (negotiationId: string | null) => {
  const [messages, setMessages] = useState<DepositNegotiationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [otherUserName, setOtherUserName] = useState('');
  const { currentUser, userData } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { playSound } = useSoundNotification();
  const prevMessagesCountRef = useRef(0);

  useEffect(() => {
    if (!negotiationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeMessages = DepositNegotiationMessagesService.subscribeToMessages(
      negotiationId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
        
        // Tocar som quando nova mensagem chega (apenas se não for do próprio usuário)
        if (currentUser && msgs.length > prevMessagesCountRef.current) {
          const latestMessage = msgs[msgs.length - 1];
          if (latestMessage.senderId !== currentUser.uid) {
            playSound('info');
          }
        }
        
        prevMessagesCountRef.current = msgs.length;
      }
    );

    // Inscrever no indicador de digitação
    let unsubscribeTyping: (() => void) | undefined;
    if (currentUser) {
      unsubscribeTyping = DepositNegotiationMessagesService.subscribeToTyping(
        negotiationId,
        currentUser.uid,
        (isTyping, userName) => {
          setIsOtherUserTyping(isTyping);
          setOtherUserName(userName);
        }
      );
    }

    return () => {
      unsubscribeMessages();
      unsubscribeTyping?.();
    };
  }, [negotiationId, currentUser, playSound]);

  const sendMessage = async (text: string, role: 'user' | 'admin') => {
    if (!negotiationId || !currentUser || !userData) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    // Limpar indicador de digitação ao enviar
    await DepositNegotiationMessagesService.setTyping(
      negotiationId,
      currentUser.uid,
      userData.name,
      false
    );

    await DepositNegotiationMessagesService.sendMessage(
      negotiationId,
      currentUser.uid,
      userData.name,
      role,
      trimmed
    );
  };

  const handleTyping = useCallback(() => {
    if (!negotiationId || !currentUser || !userData) return;

    // Definir como digitando
    DepositNegotiationMessagesService.setTyping(
      negotiationId,
      currentUser.uid,
      userData.name,
      true
    );

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Definir novo timeout para limpar o status de digitação
    typingTimeoutRef.current = setTimeout(() => {
      DepositNegotiationMessagesService.setTyping(
        negotiationId,
        currentUser.uid,
        userData.name,
        false
      );
    }, 2000);
  }, [negotiationId, currentUser, userData]);

  return {
    messages,
    loading,
    sendMessage,
    handleTyping,
    isOtherUserTyping,
    otherUserName,
  };
};
