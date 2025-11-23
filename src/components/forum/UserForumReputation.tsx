import { useState, useEffect } from 'react';
import { ForumBadgeService } from '@/services/forumBadgeService';
import { UserForumStats } from '@/types/forumBadges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForumBadge } from './ForumBadge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, TrendingUp, CheckCircle2, ThumbsUp, MessageSquare } from 'lucide-react';

interface UserForumReputationProps {
  userId: string;
}

export const UserForumReputation = ({ userId }: UserForumReputationProps) => {
  const [stats, setStats] = useState<UserForumStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await ForumBadgeService.getUserStats(userId);
        setStats(userStats);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Reputação no Fórum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pontos de Reputação */}
        <div className="text-center p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-3xl font-bold text-primary">
              {stats.reputation.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Pontos de Reputação</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.solutionsAccepted}</span>
            </div>
            <p className="text-xs text-muted-foreground">Soluções Aceitas</p>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsUp className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{stats.upvotesReceived}</span>
            </div>
            <p className="text-xs text-muted-foreground">Upvotes</p>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.topicsCreated}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tópicos</p>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.badges.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Badges</p>
          </div>
        </div>

        {/* Badges Conquistados */}
        {stats.badges.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-sm">Badges Conquistados</h4>
            <div className="flex flex-wrap gap-2">
              {stats.badges.map(badgeId => (
                <ForumBadge key={badgeId} badgeId={badgeId} size="sm" />
              ))}
            </div>
          </div>
        )}

        {stats.badges.length === 0 && (
          <div className="text-center py-4">
            <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Participe do fórum para ganhar badges!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
