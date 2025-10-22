import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralService } from '@/services/referralService';
import { Referral } from '@/types/firebase';

export const useReferrals = () => {
  const { currentUser } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = async () => {
    if (!currentUser) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedReferrals = await ReferralService.getReferralsByReferrer(currentUser.uid);
      setReferrals(fetchedReferrals);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar referências');
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [currentUser]);

  return {
    referrals,
    loading,
    error,
    refetch: fetchReferrals,
  };
};