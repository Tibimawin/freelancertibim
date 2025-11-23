import { useEffect, useState } from 'react';
import { RankingService, RankedUser } from '@/services/rankingService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from './FollowButton';
import { useAuth } from '@/contexts/AuthContext';

export const TopFreelancersWidget = () => {
  const { currentUser } = useAuth();
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const users = await RankingService.getTopUsersByXP(5, 'weekly');
        setTopUsers(users);
      } catch (error) {
        console.error('Erro ao buscar top freelancers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topUsers.map((user, index) => (
        <div key={user.userId} className="flex items-center gap-3">
          <div className="flex-shrink-0 w-6 text-center font-bold text-lg text-muted-foreground">
            {index + 1}
          </div>
          
          <Link to={`/freelancer/${user.userId}`} className="flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={user.userAvatar} />
              <AvatarFallback>{user.userName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={`/freelancer/${user.userId}`}
              className="font-semibold text-sm hover:text-primary transition-colors block truncate"
            >
              {user.userName}
            </Link>
            <p className="text-xs text-muted-foreground">
              {user.xp.toLocaleString()} XP
            </p>
          </div>

          {currentUser && currentUser.uid !== user.userId && (
            <FollowButton userId={user.userId} variant="outline" />
          )}
        </div>
      ))}
    </div>
  );
};
