import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/useFollow';
import { UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'outline';
}

export const FollowButton = ({ userId, variant = 'default' }: FollowButtonProps) => {
  const { isFollowing, loading, toggleFollow } = useFollow(userId);

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      onClick={toggleFollow}
      disabled={loading}
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Deixar de Seguir
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Seguir
        </>
      )}
    </Button>
  );
};
