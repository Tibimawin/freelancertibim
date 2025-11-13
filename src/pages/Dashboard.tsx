import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { useToast } from '@/hooks/use-toast';
import FreelancerLevel from '@/components/FreelancerLevel';
import { reload } from 'firebase/auth';

const Dashboard = () => {
  const { userData, currentUser, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { userJobs, loading: userJobsLoading } = useUserJobsAndApplications();
  const { toast } = useToast();
  const [refreshingEmailStatus, setRefreshingEmailStatus] = useState(false);

  // Debug logs
  console.log('Dashboard - userData:', userData);
  console.log('Dashboard - currentUser:', currentUser);
  console.log('Dashboard - transactions:', transactions);
  console.log('Dashboard - userJobs:', userJobs);

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen bg-background">
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Nível do Freelancer */}
        {isFreelancer && (
          <div className="mb-6">
            <FreelancerLevel />
          </div>
        )}
        {/* Banner persistente de verificação de e-mail */}
        {currentUser && !currentUser.emailVerified && (
          <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {t('verify_email_banner_title', { defaultValue: 'Verifique seu e-mail para ativar sua conta' })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('verify_email_banner_desc', { defaultValue: 'Alguns recursos ficam bloqueados até confirmar.' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await resendVerificationEmail();
                      toast({ title: t('verification_email_resent', { defaultValue: 'E-mail de verificação reenviado' }), description: t('please_check_email_to_activate', { defaultValue: 'Verifique sua caixa de entrada para ativar sua conta.' }) });
                    } catch (err: any) {
                      toast({ title: t('login_error', { defaultValue: 'Erro de Login' }), description: err?.message || t('login_error_description', { defaultValue: 'Credenciais inválidas ou erro de conexão.' }), variant: 'destructive' });
                    }
                  }}
                >
                  {t('resend_verification_email', { defaultValue: 'Reenviar e-mail' })}
                </Button>
                <Button
                  disabled={refreshingEmailStatus}
                  onClick={async () => {
                    if (!currentUser) return;
                    setRefreshingEmailStatus(true);
                    try {
                      await reload(currentUser);
                      if (currentUser.emailVerified) {
                        toast({ title: t('email_verified_now', { defaultValue: 'E-mail verificado' }), description: t('welcome_back_freelincer', { defaultValue: 'Bem-vindo de volta à Freelincer.' }) });
                      } else {
                        toast({ title: t('email_not_verified', { defaultValue: 'E-mail não verificado' }), description: t('please_check_email_to_activate', { defaultValue: 'Verifique sua caixa de entrada para ativar sua conta.' }) });
                      }
                    } catch (err: any) {
                      toast({ title: t('error', { defaultValue: 'Erro' }), description: err?.message || t('login_error_description', { defaultValue: 'Credenciais inválidas ou erro de conexão.' }), variant: 'destructive' });
                    } finally {
                      setRefreshingEmailStatus(false);
                    }
                  }}
                >
                  {refreshingEmailStatus ? t('loading', { defaultValue: 'Carregando...' }) : t('refresh_verification_status', { defaultValue: 'Atualizar status' })}
                </Button>
              </div>
            </div>
          </div>
        )}
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
                Saldo Disponível
              </CardTitle>
              <Wallet className="h-4 w-4 text-electric-purple" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
        {currentBalance.toFixed(2)} Kz
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer && userData.testerWallet?.pendingBalance && userData.testerWallet.pendingBalance > 0
        ? `${userData.testerWallet.pendingBalance.toFixed(2)} Kz pendente`
                  : "Disponível para uso"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? "Tarefas Completadas" : "Tarefas Criadas"}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-cosmic-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isFreelancer ? freelancerCompletedTests : contractorJobsPosted}
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer ? "Total de tarefas concluídas" : "Total de tarefas criadas"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avaliação Média</CardTitle>
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
                {isFreelancer ? "Taxa de Aprovação" : "Taxa de Conclusão"}
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
                    <span>Estatísticas de Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tarefas Completadas</span>
                      <span className="font-bold text-primary">{freelancerCompletedTests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avaliação Média</span>
                      <span className="font-bold text-primary">{freelancerRating.toFixed(1)}/5.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Taxa de Aprovação</span>
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
                    <span>Próximos Passos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {freelancerCompletedTests === 0 && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="font-medium text-sm text-foreground">Comece sua primeira tarefa!</p>
                        <p className="text-xs text-muted-foreground mt-1">Navegue pelas tarefas disponíveis e comece a ganhar dinheiro.</p>
                      </div>
                    )}
                    
                    {currentBalance >= 2000 && (
                      <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                        <p className="font-medium text-sm text-foreground">Saldo disponível para saque</p>
      <p className="text-xs text-muted-foreground mt-1">Você tem {currentBalance.toFixed(2)} Kz disponível para retirada.</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/')}
                      className="w-full"
                    >
                      Ver Tarefas Disponíveis
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
                    <span>Suas Tarefas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tarefas Ativas</span>
                      <span className="font-bold text-primary">{contractorActiveTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Aguardando Aprovação</span>
                      <span className="font-bold text-warning">{contractorAwaitingApproval}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Concluídas</span>
                      <span className="font-bold text-success">{contractorCompletedTasks}</span>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/manage-applications')}
                      className="w-full bg-gradient-primary text-primary-foreground"
                    >
                      Gerenciar Aplicações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Criar Nova Tarefa */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Briefcase className="h-5 w-5 text-star-glow" />
                    <span>Criar Nova Tarefa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Crie uma nova tarefa e encontre freelancers qualificados para testar seu aplicativo.
                    </p>
                    
                    <Button 
                      onClick={() => navigate('/create-job')}
                      className="w-full"
                    >
                      Criar Nova Tarefa
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
              <span>Alertas Importantes</span>
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
                        <p className="font-medium text-sm text-foreground">Nenhuma tarefa ainda</p>
                        <p className="text-xs text-muted-foreground mt-1">Comece sua primeira tarefa para começar a ganhar.</p>
                      </div>
                    </div>
                  )}
                  
                  {currentBalance >= 2000 && (
                    <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-sm text-foreground">Saldo disponível para saque</p>
      <p className="text-xs text-muted-foreground mt-1">Você tem {currentBalance.toFixed(2)} Kz disponível para retirada.</p>
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
                        <p className="font-medium text-sm text-foreground">{contractorAwaitingApproval} tarefas aguardando sua aprovação</p>
                        <p className="text-xs text-muted-foreground mt-1">Freelancers estão aguardando feedback sobre suas submissões</p>
                      </div>
                    </div>
                  )}
                  
                  {contractorJobsPosted === 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/5 border border-muted/20 rounded-lg">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">Nenhuma tarefa criada ainda</p>
                        <p className="text-xs text-muted-foreground mt-1">Crie sua primeira tarefa para encontrar freelancers.</p>
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