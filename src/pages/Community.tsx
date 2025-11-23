import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FollowService } from '@/services/followService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Activity, TrendingUp, MessageSquare } from 'lucide-react';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { TopFreelancersWidget } from '@/components/TopFreelancersWidget';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { Skeleton } from '@/components/ui/skeleton';

export default function Community() {
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const { activities, loading: activitiesLoading } = useActivityFeed();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = FollowService.subscribeToFollowing(currentUser.uid, (followingList) => {
      setFollowing(followingList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const followingActivities = activities.filter(activity => 
    following.includes(activity.userId || '')
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Comunidade
        </h1>
        <p className="text-muted-foreground">
          Conecte-se com outros freelancers e acompanhe atividades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Fórum */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Fórum da Comunidade
              </CardTitle>
              <CardDescription>
                Participe das discussões, tire dúvidas e compartilhe conhecimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/community/forum">
                <Button className="w-full">
                  Acessar Fórum
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Tabs defaultValue="following" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="following" className="gap-2">
                <Users className="h-4 w-4" />
                Seguindo
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Activity className="h-4 w-4" />
                Todas Atividades
              </TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feed de Atividades</CardTitle>
                  <CardDescription>
                    Veja o que os freelancers que você segue estão fazendo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : followingActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        {following.length === 0 
                          ? 'Você ainda não está seguindo ninguém'
                          : 'Nenhuma atividade recente'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Siga freelancers top para ver suas atividades aqui
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {followingActivities.map((activity, index) => (
                        <ActivityFeedItem key={index} activity={activity} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Todas as Atividades</CardTitle>
                  <CardDescription>
                    Atividades recentes de toda a plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma atividade recente
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.slice(0, 20).map((activity, index) => (
                        <ActivityFeedItem key={index} activity={activity} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Freelancers
              </CardTitle>
              <CardDescription>
                Freelancers mais ativos da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopFreelancersWidget />
            </CardContent>
          </Card>

          {currentUser && (
            <Card>
              <CardHeader>
                <CardTitle>Suas Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Seguindo</span>
                  <span className="font-semibold">{following.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Seguidores</span>
                  <FollowerCount userId={currentUser.uid} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function FollowerCount({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = FollowService.subscribeToFollowers(userId, (followers) => {
      setCount(followers.length);
    });
    return () => unsubscribe();
  }, [userId]);

  return <span className="font-semibold">{count}</span>;
}
