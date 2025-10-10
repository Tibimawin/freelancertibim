import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CreditCard, 
  FileCheck, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign 
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminStatistics } from '@/hooks/useAdmin';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminWithdrawals from '@/components/admin/AdminWithdrawals';
import AdminVerifications from '@/components/admin/AdminVerifications';
import AdminBalances from '@/components/admin/AdminBalances';
import AdminBanking from '@/components/admin/AdminBanking';

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { statistics, loading: statsLoading, refetch } = useAdminStatistics();

  useEffect(() => {
    // Refresh stats every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : statistics?.users.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    {statistics.users.active} ativos, {statistics.users.suspended} suspensos
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : `R$ ${statistics?.finances.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    R$ {statistics.finances.pendingWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : statistics?.jobs.active.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    {statistics.jobs.completed} concluídos hoje
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade Hoje</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : statistics?.activities.transactionsToday.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    {statistics.activities.newUsersToday} novos usuários
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="withdrawals">Saques</TabsTrigger>
            <TabsTrigger value="verifications">Verificações</TabsTrigger>
            <TabsTrigger value="balances">Saldos</TabsTrigger>
            <TabsTrigger value="banking">Dados Bancários</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Ações Pendentes
                  </CardTitle>
                  <CardDescription>
                    Itens que precisam da sua atenção
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Saques pendentes</span>
                    </div>
                    <Badge variant="secondary">
                      {statsLoading ? '...' : '5'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      <span className="text-sm">Verificações pendentes</span>
                    </div>
                    <Badge variant="secondary">
                      {statsLoading ? '...' : '12'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Usuários suspensos</span>
                    </div>
                    <Badge variant="destructive">
                      {statsLoading ? '...' : statistics?.users.suspended}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Resumo Financeiro
                  </CardTitle>
                  <CardDescription>
                    Movimentação financeira da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Depósitos totais</span>
                    <span className="font-medium">
                      {statsLoading ? '...' : `R$ ${statistics?.finances.totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Saques realizados</span>
                    <span className="font-medium">
                      {statsLoading ? '...' : `R$ ${statistics?.finances.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxas da plataforma</span>
                    <span className="font-medium text-green-600">
                      {statsLoading ? '...' : `R$ ${statistics?.finances.platformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="withdrawals">
            <AdminWithdrawals />
          </TabsContent>

          <TabsContent value="verifications">
            <AdminVerifications />
          </TabsContent>

          <TabsContent value="balances">
            <AdminBalances />
          </TabsContent>
          
          <TabsContent value="banking">
            <AdminBanking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;