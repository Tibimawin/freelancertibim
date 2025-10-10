import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Target,
  Briefcase,
  Award,
  Wallet,
  BarChart2,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  
  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">{t("loading_dashboard")}</p>
          </div>
        </div>
      </div>
    );
  }

  const isFreelancer = userData.currentMode === 'tester';
  const wallet = isFreelancer ? userData.testerWallet : userData.posterWallet;

  // Dados simulados para demonstração de gráficos
  const monthlyEarningsData = [
    { name: 'Jan', earnings: 400 },
    { name: 'Fev', earnings: 300 },
    { name: 'Mar', earnings: 600 },
    { name: 'Abr', earnings: 800 },
    { name: 'Mai', earnings: 700 },
    { name: 'Jun', earnings: 900 },
    { name: 'Jul', earnings: 1200 },
  ];
  const currentMonthEarnings = monthlyEarningsData[monthlyEarningsData.length - 1].earnings;
  const lastMonthEarnings = monthlyEarningsData[monthlyEarningsData.length - 2]?.earnings || 0;
  const earningsGrowth = lastMonthEarnings > 0 ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-card border-border">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {isFreelancer ? t("dashboard_freelancer") : t("dashboard_contractor")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("welcome_back", { name: userData.name })}
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-md interactive-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? t("available_balance_dashboard") : t("account_balance_dashboard")}
              </CardTitle>
              <Wallet className="h-4 w-4 text-electric-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold balance-display">
                {isFreelancer 
                  ? ((wallet as any)?.availableBalance || 0).toFixed(2) 
                  : ((wallet as any)?.balance || 0).toFixed(2)
                } KZ
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer && (wallet as any)?.pendingBalance 
                  ? `${(wallet as any).pendingBalance.toFixed(2)} KZ ${t("pending_balance_dashboard")}`
                  : t("available_for_use")
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md interactive-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? t("completed_tasks_dashboard") : t("created_tasks_dashboard")}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-cosmic-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isFreelancer ? userData.completedTests || 0 : (userData as any).jobsPosted || 0}
              </div>
              <p className="text-xs text-success">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +20% {t("this_month")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md interactive-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("average_rating")}</CardTitle>
              <Star className="h-4 w-4 text-star-glow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {(userData.rating || 0).toFixed(1)}
              </div>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${
                      i < Math.floor(userData.rating || 0) 
                        ? 'text-star-glow fill-star-glow' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md interactive-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? t("approval_rate_dashboard") : t("completion_rate_dashboard")}
              </CardTitle>
              <Target className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {userData.approvalRate || 95}%
              </div>
              <Progress value={userData.approvalRate || 95} className="mt-2 h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-electric-purple to-success" />
            </CardContent>
          </Card>
        </div>

        {/* Seção específica para cada tipo de usuário */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {isFreelancer ? (
            <>
              {/* Ganhos Mensais para Freelancer */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <BarChart2 className="h-5 w-5 text-electric-purple" />
                    <span>{t("monthly_earnings")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">{t("this_month")}</span>
                        <span className="font-bold text-foreground">{currentMonthEarnings.toFixed(2)} KZ</span>
                      </div>
                      <Progress value={(currentMonthEarnings / 1500) * 100} className="mb-1 h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-electric-purple to-cosmic-blue" />
                      <p className="text-xs text-muted-foreground">{t("goal")}: 1,500 KZ</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("growth")}</span>
                      <Badge variant={earningsGrowth > 0 ? 'success' : 'destructive'} className="bg-success/10 text-success border-success/20">
                        {earningsGrowth > 0 ? '+' : ''}{earningsGrowth.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  {/* Gráfico de linha real */}
                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyEarningsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '0.5rem' 
                          }} 
                          itemStyle={{ color: 'hsl(var(--foreground))' }} 
                          formatter={(value: number) => `${value.toFixed(2)} KZ`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="earnings" 
                          stroke="hsl(var(--electric-purple))" 
                          strokeWidth={2} 
                          dot={{ fill: 'hsl(var(--electric-purple))', r: 4 }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tarefas Recentes */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Briefcase className="h-5 w-5 text-cosmic-blue" />
                    <span>{t("recent_activity")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("mobile_app_task")}</p>
                        <p className="text-xs text-muted-foreground">{t("completed_2_hours_ago")}</p>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        +25 KZ
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("website_task")}</p>
                        <p className="text-xs text-muted-foreground">{t("awaiting_approval")}</p>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {t("pending")}
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/task-history')}
                      className="w-full border-primary/50 text-primary hover:bg-primary/10"
                    >
                      {t("view_full_history")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Estatísticas de Tarefas para Contratante */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Users className="h-5 w-5 text-electric-purple" />
                    <span>{t("your_tasks")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("active_tasks")}</span>
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("awaiting_your_approval")}</span>
                      <span className="font-bold text-warning">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("completed_tasks_count")}</span>
                      <span className="font-bold text-success">12</span>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/manage-applications')}
                      className="w-full bg-gradient-primary text-primary-foreground hover:bg-primary-hover"
                    >
                      {t("manage_applications_button")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gastos e Orçamento */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <DollarSign className="h-5 w-5 text-star-glow" />
                    <span>{t("monthly_expenses")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">{t("spent_this_month")}</span>
                        <span className="font-bold text-foreground">1,250 KZ</span>
                      </div>
                      <Progress value={62} className="mb-1 h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-star-glow to-destructive" />
                      <p className="text-xs text-muted-foreground">{t("budget")}: 2,000 KZ</p>
                    </div>
                    
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/create-job')}
                        className="w-full border-primary/50 text-primary hover:bg-primary/10"
                      >
                        {t("create_new_task_button")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Alertas e Notificações */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-warning" />
              <span>{t("important_alerts")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isFreelancer ? (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{t("congrats_100_tasks")}</p>
                      <p className="text-xs text-muted-foreground">{t("unlocked_expert_badge")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{t("balance_available_for_withdrawal")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("balance_available_for_withdrawal_description", { balance: ((wallet as any)?.availableBalance || 0).toFixed(2) })}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <Clock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{t("tasks_awaiting_approval", { count: 5 })}</p>
                      <p className="text-xs text-muted-foreground">{t("tasks_awaiting_approval_description")}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{t("new_applicants", { count: 12 })}</p>
                      <p className="text-xs text-muted-foreground">{t("new_applicants_description")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;