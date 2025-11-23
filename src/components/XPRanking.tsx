import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RankingService, RankedUser } from '@/services/rankingService';
import { Trophy, Medal, Crown, Zap, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const XPRanking: React.FC = () => {
  const [allTimeRanking, setAllTimeRanking] = useState<RankedUser[]>([]);
  const [weeklyRanking, setWeeklyRanking] = useState<RankedUser[]>([]);
  const [monthlyRanking, setMonthlyRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const limit = isMobile ? 5 : 10;
      const [allTime, weekly, monthly] = await Promise.all([
        RankingService.getTopUsersByXP(limit),
        RankingService.getTopUsersByXP(limit, 'weekly'),
        RankingService.getTopUsersByXP(limit, 'monthly')
      ]);

      setAllTimeRanking(allTime);
      setWeeklyRanking(weekly);
      setMonthlyRanking(monthly);
    } catch (error) {
      console.error('[XPRanking] Erro ao carregar rankings:', error);
      // Manter arrays vazios em caso de erro - a UI já trata isso
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-4 h-4 md:w-5 md:h-5 text-warning animate-pulse" />;
    if (position === 2) return <Medal className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />;
    if (position === 3) return <Medal className="w-4 h-4 md:w-5 md:h-5 text-accent" />;
    return <span className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">#{position}</span>;
  };

  const getRankBadgeColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-warning to-accent text-white border-0 shadow-glow';
    if (position === 2) return 'bg-muted text-foreground border-muted-foreground/20';
    if (position === 3) return 'bg-accent/20 text-accent border-accent/20';
    return 'bg-card text-muted-foreground border-border';
  };

  const renderMobileRankingList = (ranking: RankedUser[]) => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-2 w-12" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      );
    }

    if (ranking.length === 0) {
      return (
        <div className="text-center py-6">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-xs">
            Nenhum freelancer ainda
          </p>
          <p className="text-muted-foreground text-[10px] mt-1">
            Complete tarefas para entrar no ranking!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {ranking.map((user, index) => {
          const position = index + 1;
          return (
            <div
              key={user.userId}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/profile/${user.userId}`);
              }}
              style={{ animationDelay: `${index * 80}ms` }}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-300 animate-fade-in ${
                position <= 3
                  ? 'bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 border border-primary/20'
                  : 'bg-card/50 hover:bg-muted/50 border border-border/50'
              } hover:scale-[1.02] active:scale-[0.98]`}
            >
              {/* Posição */}
              <div className="flex-shrink-0">
                {getRankIcon(position)}
              </div>

              {/* Avatar */}
              <Avatar className={`w-8 h-8 border ${position <= 3 ? 'border-primary' : 'border-border'}`}>
                <AvatarImage src={user.userAvatar} alt={user.userName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {user.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info do usuário */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-xs truncate group-hover:text-primary transition-colors">
                  {user.userName}
                </p>
                <Badge className={`${getRankBadgeColor(position)} text-[10px] px-1 py-0`} variant="outline">
                  {user.levelName}
                </Badge>
              </div>

              {/* XP */}
              <div className="flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-warning" />
                <span className="font-bold text-primary text-xs">{user.xp}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDesktopRankingList = (ranking: RankedUser[]) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (ranking.length === 0) {
      return (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum freelancer neste ranking ainda</p>
          <p className="text-muted-foreground text-xs mt-2">
            Complete e avalie tarefas para ganhar XP e aparecer aqui!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {ranking.map((user, index) => {
          const position = index + 1;
          return (
            <div
              key={user.userId}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/profile/${user.userId}`);
              }}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 animate-fade-in ${
                position <= 3
                  ? 'bg-gradient-to-r from-primary/5 via-card to-accent/5 hover:from-primary/10 hover:to-accent/10 border-2 border-primary/20'
                  : 'bg-card hover:bg-muted/50 border border-border'
              } hover:scale-[1.02] hover:shadow-lg`}
            >
              {/* Posição com animação de brilho para top 3 */}
              <div className={`flex-shrink-0 ${position <= 3 ? 'animate-pulse' : ''}`}>
                {getRankIcon(position)}
              </div>

              {/* Avatar */}
              <Avatar className={`w-10 h-10 border-2 ${position <= 3 ? 'border-primary shadow-glow' : 'border-border'} transition-all duration-300 group-hover:scale-110`}>
                <AvatarImage src={user.userAvatar} alt={user.userName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info do usuário */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {user.userName}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRankBadgeColor(position)} transition-all duration-300 group-hover:scale-105`} variant="outline">
                    {user.levelName}
                  </Badge>
                </div>
              </div>

              {/* XP com animação de contador */}
              <div className="flex items-center gap-1 text-sm">
                <Zap className="w-4 h-4 text-warning group-hover:animate-pulse" />
                <span className="font-bold text-primary">{user.xp}</span>
                <span className="text-muted-foreground text-xs">XP</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={`relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-glow ${isMobile ? 'shadow-md' : ''}`}>
      {/* Decoração de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-warning/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardHeader className={`relative ${isMobile ? 'pb-2 px-3 pt-3' : 'pb-3'}`}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
          <Trophy className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-warning animate-pulse`} />
          {isMobile ? 'Ranking' : 'Ranking de Freelancers'}
        </CardTitle>
        {!isMobile && (
          <p className="text-sm text-muted-foreground mt-1">
            Top 10 freelancers com maior XP
          </p>
        )}
      </CardHeader>

      <CardContent className={`relative ${isMobile ? 'px-3 pb-3' : ''}`}>
        <Tabs defaultValue="all-time" className="w-full">
          <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'h-8 mb-2' : 'mb-4'}`}>
            <TabsTrigger value="all-time" className={isMobile ? 'text-[10px] px-1' : 'text-xs sm:text-sm'}>
              {isMobile ? '🏆' : '🏆 Geral'}
            </TabsTrigger>
            <TabsTrigger value="weekly" className={isMobile ? 'text-[10px] px-1' : 'text-xs sm:text-sm'}>
              {isMobile ? '📅' : '📅 Semanal'}
            </TabsTrigger>
            <TabsTrigger value="monthly" className={isMobile ? 'text-[10px] px-1' : 'text-xs sm:text-sm'}>
              {isMobile ? '📆' : '📆 Mensal'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-time" className="mt-0">
            {isMobile ? renderMobileRankingList(allTimeRanking) : renderDesktopRankingList(allTimeRanking)}
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            {isMobile && (
              <p className="text-[10px] text-muted-foreground mb-2 text-center">
                Últimos 7 dias
              </p>
            )}
            {!isMobile && (
              <p className="text-xs text-muted-foreground mb-3 text-center">
                Freelancers mais ativos nos últimos 7 dias
              </p>
            )}
            {isMobile ? renderMobileRankingList(weeklyRanking) : renderDesktopRankingList(weeklyRanking)}
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {isMobile && (
              <p className="text-[10px] text-muted-foreground mb-2 text-center">
                Últimos 30 dias
              </p>
            )}
            {!isMobile && (
              <p className="text-xs text-muted-foreground mb-3 text-center">
                Freelancers mais ativos nos últimos 30 dias
              </p>
            )}
            {isMobile ? renderMobileRankingList(monthlyRanking) : renderDesktopRankingList(monthlyRanking)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default XPRanking;

