import { useQuery } from '@tanstack/react-query';
import { JobService, TransactionService } from '@/services/firebase';
import { Job, Transaction } from '@/types/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const useJobs = (filters?: { platform?: string; limitCount?: number }) => {
  const { data: jobs = [], isLoading: loading, error, refetch } = useQuery<Job[]>({
    queryKey: ['jobs', filters?.platform, filters?.limitCount],
    queryFn: () => JobService.getJobs(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });

  return { 
    jobs, 
    loading, 
    error: error ? 'Erro ao carregar jobs' : null, 
    refetch 
  };
};

export const useTransactions = () => {
  const { currentUser } = useAuth();

  const { data: transactions = [], isLoading: loading, error, refetch } = useQuery<Transaction[]>({
    queryKey: ['transactions', currentUser?.uid],
    queryFn: () => {
      if (!currentUser) return [];
      return TransactionService.getUserTransactions(currentUser.uid);
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
  });

  return { 
    transactions, 
    loading, 
    error: error ? 'Erro ao carregar transações' : null,
    refetch
  };
};