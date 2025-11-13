import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Removido Tabs: vamos usar navegação lateral com estado interno
import { 
  Users, 
  CreditCard, 
  FileCheck, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Flag,
  Briefcase, // Importado Briefcase
  MessageSquare,
  ShoppingBag
} from 'lucide-react';
import { Smartphone } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminStatistics, useAdminReports } from '@/hooks/useAdmin'; 
import AdminHeader from '@/components/admin/AdminHeader';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminWithdrawals from '@/components/admin/AdminWithdrawals';
import AdminVerifications from '@/components/admin/AdminVerifications';
import AdminBalances from '@/components/admin/AdminBalances';
import AdminBanking from '@/components/admin/AdminBanking';
import AdminReports from '@/components/admin/AdminReports'; 
import AdminReferrals from '@/components/admin/AdminReferrals';
import AdminJobManager from '@/components/admin/AdminJobManager'; // Importado AdminJobManager
import AdminSupport from '@/components/admin/AdminSupport';
import AdminMarketManager from '@/components/admin/AdminMarketManager';
import AdminMarketOrders from '@/components/admin/AdminMarketOrders';
import AdminDevices from '@/components/admin/AdminDevices';
import AdminDefaultAvatars from '@/components/admin/AdminDefaultAvatars';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { statistics, loading: statsLoading, refetch } = useAdminStatistics();
  const { reports, fetchReports } = useAdminReports(); 
  const { t } = useTranslation();
  const [active, setActive] = useState<'overview'|'users'|'jobs'|'withdrawals'|'verifications'|'balances'|'banking'|'reports'|'support'|'referrals'|'market'|'devices'|'avatars'>('overview');

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
          <p className="text-muted-foreground">{t("loading_dashboard")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/** Estado de navegação lateral */}
        {/** default: overview */}
        {/** Seções disponíveis: overview, users, jobs, withdrawals, verifications, balances, banking, reports, support, referrals */}
        {/** useState movido para o topo do componente para evitar erro de sintaxe */}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("total_users")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : statistics?.users.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    {statistics.users.active} {t("active")}, {statistics.users.suspended} {t("suspended")}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("total_balance")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
            {statsLoading ? '...' : `Kz ${statistics?.finances.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
            Kz {statistics.finances.pendingWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {t("pending_withdrawals")}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("active_jobs")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : statistics?.jobs.active.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    {statistics.jobs.completed} {t("completed_today")}
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("activity_today")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : statistics?.activities.transactionsToday.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    {statistics.activities.newUsersToday} {t("new_users_today")}
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Layout principal com menu lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="border rounded-lg bg-card">
              <nav className="p-2 space-y-1">
                <button onClick={() => setActive('overview')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='overview' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <TrendingUp className="h-4 w-4" /> {t("overview_tab")}
                </button>
                <button onClick={() => setActive('users')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='users' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <Users className="h-4 w-4" /> {t("users_tab")}
                </button>
                <button onClick={() => setActive('jobs')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='jobs' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <Briefcase className="h-4 w-4" /> {t("jobs_tab")}
                </button>
                <button onClick={() => setActive('market')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='market' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <ShoppingBag className="h-4 w-4" /> Mercado
                </button>
                <button onClick={() => setActive('withdrawals')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='withdrawals' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <CreditCard className="h-4 w-4" /> {t("withdrawals_tab")}
                </button>
                <button onClick={() => setActive('verifications')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='verifications' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <FileCheck className="h-4 w-4" /> {t("verifications_tab")}
                </button>
                <button onClick={() => setActive('balances')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='balances' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <DollarSign className="h-4 w-4" /> {t("balances_tab")}
                </button>
                <button onClick={() => setActive('banking')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='banking' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <CreditCard className="h-4 w-4" /> {t("banking_data_tab")}
                </button>
                <button onClick={() => setActive('reports')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='reports' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <Flag className="h-4 w-4" />
                  <span className="flex-1">{t("reports_tab")}</span>
                  {pendingReportsCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingReportsCount}
                    </Badge>
                  )}
                </button>
                <button onClick={() => setActive('support')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='support' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <MessageSquare className="h-4 w-4" /> Atendimento
                </button>
                <button onClick={() => setActive('referrals')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='referrals' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <Users className="h-4 w-4" /> {t("referral_program")}
                </button>
                <button onClick={() => setActive('devices')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='devices' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <Smartphone className="h-4 w-4" /> Dispositivos
                </button>
                <button onClick={() => setActive('avatars')} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${active==='avatars' ? 'bg-accent text-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  <Users className="h-4 w-4" /> Avatares
                </button>
              </nav>
            </div>
          </aside>

          {/* Conteúdo */}
          <section className="lg:col-span-9 space-y-4">
          {active === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    {t("pending_actions")}
                  </CardTitle>
                  <CardDescription>
                    {t("items_need_attention")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">{t("pending_withdrawals_short")}</span>
                    </div>
                    <Badge variant="secondary">
                      {statsLoading ? '...' : '5'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      <span className="text-sm">{t("pending_verifications")}</span>
                    </div>
                    <Badge variant="secondary">
                      {statsLoading ? '...' : '12'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{t("suspended_users")}</span>
                    </div>
                    <Badge variant="destructive">
                      {statsLoading ? '...' : statistics?.users.suspended}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      <span className="text-sm">{t("pending_reports")}</span>
                    </div>
                    <Badge variant="destructive">
                      {pendingReportsCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {t("financial_summary")}
                  </CardTitle>
                  <CardDescription>
                    {t("platform_financial_movement")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("total_deposits")}</span>
                    <span className="font-medium">
            {statsLoading ? '...' : `Kz ${statistics?.finances.totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("total_withdrawals")}</span>
                    <span className="font-medium">
            {statsLoading ? '...' : `Kz ${statistics?.finances.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("platform_fees")}</span>
                    <span className="font-medium text-green-600">
            {statsLoading ? '...' : `Kz ${statistics?.finances.platformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {active === 'market' && (
            <div className="space-y-6">
              <AdminMarketManager />
              <AdminMarketOrders />
            </div>
          )}
          {active === 'users' && (<AdminUsers />)}
          {active === 'jobs' && (<AdminJobManager />)}
          {active === 'withdrawals' && (<AdminWithdrawals />)}
          {active === 'verifications' && (<AdminVerifications />)}
          {active === 'balances' && (<AdminBalances />)}
          {active === 'banking' && (<AdminBanking />)}
          {active === 'reports' && (<AdminReports />)}
          {active === 'support' && (<AdminSupport />)}
          {active === 'referrals' && (<AdminReferrals />)}
          {active === 'devices' && (<AdminDevices />)}
          {active === 'avatars' && (<AdminDefaultAvatars />)}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;