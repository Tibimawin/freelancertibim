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
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
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
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const isFreelancer = userData.currentMode === 'tester';
  const wallet = isFreelancer ? userData.testerWallet : userData.posterWallet;

  // Dados simulados para demonstração
  const monthlyEarnings = [120, 180, 240, 320, 280, 390, 450];
  const currentMonth = monthlyEarnings[monthlyEarnings.length - 1];
  const lastMonth = monthlyEarnings[monthlyEarnings.length - 2];
  const earningsGrowth = ((currentMonth - lastMonth) / lastMonth) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard {isFreelancer ? 'Freelancer' : 'Contratante'}
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {userData.name}! Aqui está um resumo da sua atividade.
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isFreelancer ? 'Saldo Disponível' : 'Saldo da Conta'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {isFreelancer 
                  ? ((wallet as any)?.availableBalance || 0).toFixed(2) 
                  : ((wallet as any)?.balance || 0).toFixed(2)
                } KZ
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer && (wallet as any)?.pendingBalance 
                  ? `${(wallet as any).pendingBalance.toFixed(2)} KZ pendente`
                  : 'Disponível para uso'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isFreelancer ? 'Tarefas Completadas' : 'Tarefas Criadas'}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isFreelancer ? userData.completedTests || 0 : (userData as any).jobsPosted || 0}
              </div>
              <p className="text-xs text-success">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +20% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {(userData.rating || 0).toFixed(1)}
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${
                      i < Math.floor(userData.rating || 0) 
                        ? 'text-primary fill-primary' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isFreelancer ? 'Taxa de Aprovação' : 'Taxa de Conclusão'}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {userData.approvalRate || 95}%
              </div>
              <Progress value={userData.approvalRate || 95} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Seção específica para cada tipo de usuário */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {isFreelancer ? (
            <>
              {/* Ganhos Mensais para Freelancer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Ganhos Mensais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Este mês</span>
                        <span className="font-bold text-foreground">{currentMonth} KZ</span>
                      </div>
                      <Progress value={75} className="mb-1" />
                      <p className="text-xs text-muted-foreground">Meta: 600 KZ</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Crescimento</span>
                      <Badge variant={earningsGrowth > 0 ? 'default' : 'destructive'}>
                        {earningsGrowth > 0 ? '+' : ''}{earningsGrowth.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tarefas Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Tarefa de App Mobile</p>
                        <p className="text-xs text-muted-foreground">Concluído há 2 horas</p>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        +25 KZ
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Tarefa de Website</p>
                        <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        Pendente
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/task-history')}
                      className="w-full"
                    >
                      Ver Histórico Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Estatísticas de Tarefas para Contratante */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Suas Tarefas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tarefas Ativas</span>
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Aguardando Aprovação</span>
                      <span className="font-bold text-warning">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Concluídas</span>
                      <span className="font-bold text-success">12</span>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/manage-applications')}
                      className="w-full"
                    >
                      Gerenciar Aplicações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gastos e Orçamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Gastos do Mês</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Gasto este mês</span>
                        <span className="font-bold text-foreground">1,250 KZ</span>
                      </div>
                      <Progress value={62} className="mb-1" />
                      <p className="text-xs text-muted-foreground">Orçamento: 2,000 KZ</p>
                    </div>
                    
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/create-job')}
                        className="w-full"
                      >
                        Criar Nova Tarefa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Alertas e Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Alertas Importantes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isFreelancer ? (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Parabéns! Você alcançou 100 tarefas completadas!</p>
                      <p className="text-xs text-muted-foreground">Você desbloqueou o badge "Freelancer Expert"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">Saldo disponível para saque</p>
                      <p className="text-xs text-muted-foreground">Você tem {(((wallet as any)?.availableBalance || 0)).toFixed(2)} KZ disponível para retirada</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <Clock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-sm">5 tarefas aguardando sua aprovação</p>
                      <p className="text-xs text-muted-foreground">Freelancers estão aguardando feedback sobre suas submissões</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">12 novos candidatos para suas tarefas</p>
                      <p className="text-xs text-muted-foreground">Revise os perfis e selecione os melhores freelancers</p>
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