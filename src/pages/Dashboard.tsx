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
import { useTransactions } from '@/hooks/useFirebase';
import { useUserJobsAndApplications } from '@/hooks/useUserJobsAndApplications';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { userJobs, loading: userJobsLoading } = useUserJobsAndApplications();

  // Debug logs
  console.log('Dashboard - userData:', userData);
  console.log('Dashboard - currentUser:', currentUser);
  console.log('Dashboard - transactions:', transactions);
  console.log('Dashboard - userJobs:', userJobs);

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Por favor, faça login para acessar o dashboard</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Ir para Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isFreelancer = userData.currentMode === 'tester';
  const currentBalance = isFreelancer 
    ? (userData.testerWallet?.availableBalance || 0)
    : (userData.posterWallet?.balance || 0);

  // Dados reais do freelancer
  const freelancerCompletedTests = userData.completedTests || 0;
  const freelancerRating = userData.rating || 0;
  const freelancerApprovalRate = userData.approvalRate || 0;

  // Dados reais do contratante
  const contractorJobsPosted = userJobs.length;
  const contractorActiveTasks = userJobs.filter(job => job.status === 'active').length;
  const contractorAwaitingApproval = userJobs.reduce((sum, job) => {
    return sum + job.applications.filter(app => app.status === 'submitted').length;
  }, 0);
  const contractorCompletedTasks = userJobs.reduce((sum, job) => {
    return sum + job.applications.filter(app => app.status === 'approved').length;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {isFreelancer ? "Dashboard Freelancer" : "Dashboard Contratante"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Bem-vindo de volta, {userData.name}! Aqui está um resumo da sua atividade.
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("available balance")}
              </CardTitle>
              <Wallet className="h-4 w-4 text-electric-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {currentBalance.toFixed(2)} KZ
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer && userData.testerWallet?.pendingBalance && userData.testerWallet.pendingBalance > 0
                  ? `${userData.testerWallet.pendingBalance.toFixed(2)} KZ ${t("pending")}`
                  : t("available for use")
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? t("completed tasks") : t("created tasks")}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-cosmic-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isFreelancer ? freelancerCompletedTests : contractorJobsPosted}
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer ? t("total completed tasks") : t("total created tasks")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("average rating")}</CardTitle>
              <Star className="h-4 w-4 text-star-glow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {freelancerRating.toFixed(1)}
              </div>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${
                      i < Math.floor(freelancerRating) 
                        ? 'text-star-glow fill-star-glow' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? t("approval rate") : t("completion rate")}
              </CardTitle>
              <Target className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {freelancerApprovalRate}%
              </div>
              <Progress value={freelancerApprovalRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Seção específica para cada tipo de usuário */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {isFreelancer ? (
            <>
              {/* Estatísticas para Freelancer */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <BarChart2 className="h-5 w-5 text-electric-purple" />
                    <span>{t("performance statistics")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("completed tasks")}</span>
                      <span className="font-bold text-primary">{freelancerCompletedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("average rating")}</span>
                      <span className="font-bold text-primary">{freelancerRating.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("approval rate")}</span>
                      <span className="font-bold text-success">{freelancerApprovalRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Próximos Passos */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Activity className="h-5 w-5 text-cosmic-blue" />
                    <span>{t("next steps")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {freelancerCompletedTests === 0 && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="font-medium text-sm text-foreground">{t("start your first task")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("browse available tasks")}</p>
                      </div>
                    )}
                    
                    {currentBalance >= 2000 && (
                      <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                        <p className="font-medium text-sm text-foreground">{t("balance available for withdrawal")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("you have balance available for withdrawal", { balance: currentBalance.toFixed(2) })}</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/')}
                      className="w-full"
                    >
                      {t("view available tasks")}
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
                    <span>{t("your tasks")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("active tasks")}</span>
                      <span className="font-bold text-primary">{contractorActiveTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("awaiting approval")}</span>
                      <span className="font-bold text-warning">{contractorAwaitingApproval}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("completed tasks count")}</span>
                      <span className="font-bold text-success">{contractorCompletedTasks}</span>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/manage-applications')}
                      className="w-full bg-gradient-primary text-primary-foreground"
                    >
                      {t("manage applications")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Criar Nova Tarefa */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Briefcase className="h-5 w-5 text-star-glow" />
                    <span>{t("create new task")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t("create new task description")}
                    </p>
                    
                    <Button 
                      onClick={() => navigate('/create-job')}
                      className="w-full"
                    >
                      {t("create new task button")}
                    </Button>
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
              <span>{t("important alerts")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isFreelancer ? (
                <>
                  {freelancerCompletedTests === 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/5 border border-muted/20 rounded-lg">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("no tasks yet")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("start your first task to earn")}</p>
                      </div>
                    </div>
                  )}
                  
                  {currentBalance >= 2000 && (
                    <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("balance available for withdrawal")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("you have balance available for withdrawal", { balance: currentBalance.toFixed(2) })}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {contractorAwaitingApproval > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                      <Clock className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("tasks awaiting approval", { count: contractorAwaitingApproval })}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("tasks awaiting approval description")}</p>
                      </div>
                    </div>
                  )}
                  
                  {contractorJobsPosted === 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/5 border border-muted/20 rounded-lg">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("no tasks created yet")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("create your first task to find freelancers")}</p>
                      </div>
                    </div>
                  )}
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