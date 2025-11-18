import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { JobComment } from '@/types/firebase';
import { CommentsService } from '@/services/commentsService';

export const useJobComments = (jobId: string) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<JobComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    const unsubscribe = CommentsService.subscribeApprovedComments(jobId, (items) => {
      setComments(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [jobId]);

  const addComment = async (text: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await CommentsService.addComment(jobId, currentUser.uid, currentUser.displayName || 'Usuário', text);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Erro ao adicionar comentário');
    }
  };

  const addReply = async (parentId: string, text: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    try {
      await CommentsService.addReply(jobId, parentId, currentUser.uid, currentUser.displayName || 'Usuário', text);
    } catch (err) {
      console.error('Error adding reply:', err);
      setError('Erro ao adicionar resposta');
    }
  };

  return { comments, loading, error, addComment, addReply };
};