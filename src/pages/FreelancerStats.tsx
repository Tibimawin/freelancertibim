import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsService, MonthlyXP, CategoryStats, TaskStats, XPHistoryEntry } from '@/services/statsService';
import { LevelService } from '@/services/levelService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, CheckCircle, XCircle, Clock, Star, Calendar, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444'];

export default function FreelancerStats() {
  const { currentUser } = useAuth();
  const { uid } = useParams();
  const navigate = useNavigate();
  const userId = uid || currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [xpData, setXpData] = useState({ xp: 0, level: 0, levelName: '' });
  const [monthlyXP, setMonthlyXP] = useState<MonthlyXP[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [xpHistory, setXpHistory] = useState<XPHistoryEntry[]>([]);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    loadStats();
  }, [userId]);

  const loadStats = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [userXP, monthly, tasks, categories, history] = await Promise.all([
        LevelService.getUserXP(userId),
        StatsService.getMonthlyXPData(userId, 6),
        StatsService.getUserTaskStats(userId),
        StatsService.getCategoryStats(userId),
        StatsService.getUserXPHistory(userId, 30)
      ]);

      setXpData({
        xp: userXP.xp,
        level: userXP.level,
        levelName: LevelService.getLevelName(userXP.level)
      });
      setMonthlyXP(monthly);
      setTaskStats(tasks);
      setCategoryStats(categories);
      setXpHistory(history);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, description, color }: any) => (
    <Card className="hover-scale">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Estatísticas do Freelancer
        </h1>
        <p className="text-muted-foreground mt-2">Acompanhe sua evolução e desempenho na plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Award}
          title="Nível Atual"
          value={`${xpData.level} - ${xpData.levelName}`}
          description={`${xpData.xp} XP acumulados`}
          color="text-primary"
        />
        <StatCard
          icon={CheckCircle}
          title="Tarefas Aprovadas"
          value={taskStats?.approved || 0}
          description={`${taskStats?.total || 0} tarefas no total`}
          color="text-green-500"
        />
        <StatCard
          icon={Star}
          title="Avaliação Média"
          value={taskStats?.averageRating ? taskStats.averageRating.toFixed(1) : '0.0'}
          description="De 5 estrelas"
          color="text-yellow-500"
        />
        <StatCard
          icon={Target}
          title="Taxa de Aprovação"
          value={taskStats?.total ? `${Math.round((taskStats.approved / taskStats.total) * 100)}%` : '0%'}
          description={`${taskStats?.rejected || 0} rejeitadas`}
          color="text-blue-500"
        />
      </div>

      <Tabs defaultValue="xp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="xp">Evolução de XP</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="xp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução Mensal de XP
              </CardTitle>
              <CardDescription>
                Acompanhe seu ganho de XP e tarefas concluídas nos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyXP}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="XP Ganho"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Tarefas Concluídas"
                    dot={{ fill: 'hsl(var(--secondary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de XP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{xpData.xp}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">XP este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">
                  {monthlyXP[monthlyXP.length - 1]?.xp || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tarefas este Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {monthlyXP[monthlyXP.length - 1]?.tasks || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas por Categoria</CardTitle>
                <CardDescription>Distribuição das suas tarefas concluídas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {categoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ganhos por Categoria</CardTitle>
                <CardDescription>Total ganho em cada categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="totalEarned" fill="hsl(var(--primary))" name="Total Ganho (Kz)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de XP
              </CardTitle>
              <CardDescription>Últimas 30 atividades que geraram XP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {xpHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum histórico de XP ainda</p>
                    <p className="text-sm">Complete tarefas para começar a ganhar XP!</p>
                  </div>
                ) : (
                  xpHistory.map((entry, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          entry.xp > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {entry.xp > 0 ? <TrendingUp className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{entry.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.timestamp.toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${entry.xp > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.xp > 0 ? '+' : ''}{entry.xp} XP
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
