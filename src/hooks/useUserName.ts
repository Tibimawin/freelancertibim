import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth';

export const useUserName = (userId: string) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUserName(null);
      setLoading(false);
      return;
    }

    const fetchUserName = async () => {
      try {
        setLoading(true);
        const userData = await AuthService.getUserData(userId);
        setUserName(userData?.name || `Usuário Desconhecido (${userId.substring(0, 4)})`);
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName(`Erro ao carregar nome (${userId.substring(0, 4)})`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserName();
  }, [userId]);

  return { userName, loading };
};