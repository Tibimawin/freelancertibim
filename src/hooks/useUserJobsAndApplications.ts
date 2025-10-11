import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { JobService } from '@/services/firebase';
import { ApplicationService } from '@/services/applicationService';
import { Job, Application } from '@/types/firebase';

interface UserJobWithApplications extends Job {
  applications: Application[];
}

export const useUserJobsAndApplications = () => {
  const { currentUser } = useAuth();
  const [userJobs, setUserJobs] = useState<UserJobWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserJobs = async () => {
    if (!currentUser) {
      setUserJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch all jobs, then filter by current user as poster
      const allJobs = await JobService.getJobs({});
      const jobsPostedByUser = allJobs.filter(job => job.posterId === currentUser.uid);

      const jobsWithApplications = await Promise.all(
        jobsPostedByUser.map(async (job) => {
          const applications = await ApplicationService.getApplicationsForJob(job.id);
          return { ...job, applications };
        })
      );
      setUserJobs(jobsWithApplications);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar tarefas e aplicações do usuário');
      console.error('Error fetching user jobs and applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserJobs();
  }, [currentUser]);

  return {
    userJobs,
    loading,
    error,
    refetch: fetchUserJobs,
  };
};