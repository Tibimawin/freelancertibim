import { useState, useEffect } from 'react';
import { FollowService } from '@/services/followService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFollow = (targetUserId: string) => {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !targetUserId) {
      setLoading(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const [following, followers, following_count] = await Promise.all([
          FollowService.isFollowing(currentUser.uid, targetUserId),
          FollowService.getFollowersCount(targetUserId),
          FollowService.getFollowingCount(targetUserId)
        ]);
        
        setIsFollowing(following);
        setFollowersCount(followers);
        setFollowingCount(following_count);
      } catch (error) {
        console.error('Erro ao verificar status de seguidor:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();

    // Subscribe para mudanças em tempo real
    const unsubFollowers = FollowService.subscribeToFollowers(targetUserId, (followers) => {
      setFollowersCount(followers.length);
      if (currentUser) {
        setIsFollowing(followers.includes(currentUser.uid));
      }
    });

    return () => {
      unsubFollowers();
    };
  }, [currentUser, targetUserId]);

  const toggleFollow = async () => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para seguir usuários');
      return;
    }

    if (currentUser.uid === targetUserId) {
      toast.error('Você não pode seguir a si mesmo');
      return;
    }

    try {
      if (isFollowing) {
        await FollowService.unfollowUser(currentUser.uid, targetUserId);
        toast.success('Deixou de seguir');
      } else {
        await FollowService.followUser(currentUser.uid, targetUserId);
        toast.success('Seguindo agora!');
      }
    } catch (error) {
      console.error('Erro ao alternar seguidor:', error);
      toast.error('Erro ao processar ação');
    }
  };

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    toggleFollow
  };
};
