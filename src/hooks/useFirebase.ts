import { useState, useEffect } from 'react';
import { JobService, TransactionService } from '@/services/firebase';
import { Job, Transaction } from '@/types/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const useJobs = (filters?: { platform?: string; limitCount?: number }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const fetchedJobs = await JobService.getJobs(filters);
        setJobs(fetchedJobs);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters?.platform, filters?.limitCount]);

  return { jobs, loading, error, refetch: () => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const fetchedJobs = await JobService.getJobs(filters);
        setJobs(fetchedJobs);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar jobs');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }};
};

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchTransactions = async () => {
    if (!currentUser) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedTransactions = await TransactionService.getUserTransactions(currentUser.uid);
      setTransactions(fetchedTransactions);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar transações');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUser]);

  return { 
    transactions, 
    loading, 
    error,
    refetch: fetchTransactions
  };
};