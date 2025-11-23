import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminStatistics, useAdminReports } from '@/hooks/useAdmin'; 
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminWithdrawals from '@/components/admin/AdminWithdrawals';
import AdminBalances from '@/components/admin/AdminBalances';
import AdminBanking from '@/components/admin/AdminBanking';
import AdminReports from '@/components/admin/AdminReports'; 
import AdminReferrals from '@/components/admin/AdminReferrals';
import AdminJobManager from '@/components/admin/AdminJobManager';
import AdminSupport from '@/components/admin/AdminSupport';
import AdminMarketManager from '@/components/admin/AdminMarketManager';
import AdminMarketOrders from '@/components/admin/AdminMarketOrders';
import AdminAffiliateAnalytics from '@/components/admin/AdminAffiliateAnalytics';
import AdminDevices from '@/components/admin/AdminDevices';
import AdminDefaultAvatars from '@/components/admin/AdminDefaultAvatars';
import AdminSocialLinks from '@/components/admin/AdminSocialLinks';
import AdminMaintenance from '@/components/admin/AdminMaintenance';
import AdminTaxonomyManager from '@/components/admin/AdminTaxonomyManager';
import AdminSecurity from '@/components/admin/AdminSecurity';
import AdminVerifications from '@/components/admin/AdminVerifications';
import { AdminNotificationBell } from '@/components/admin/AdminNotificationBell';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminDepositNegotiations } from '@/components/admin/AdminDepositNegotiations';
import { AdminSystemConfig } from '@/components/admin/AdminSystemConfig';
import { AdminBroadcastHistory } from '@/components/admin/AdminBroadcastHistory';
import { AdminABTesting } from '@/components/admin/AdminABTesting';
import { AdminForumModeration } from '@/components/admin/AdminForumModeration';
import { AdminTaskTemplates } from '@/components/admin/AdminTaskTemplates';
import { AdminRecurringJobs } from '@/components/admin/AdminRecurringJobs';
import { AdminEmailCreationTasks } from '@/components/admin/AdminEmailCreationTasks';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();
  const { statistics, loading: statsLoading, refetch } = useAdminStatistics();
  const { reports, fetchReports } = useAdminReports(); 
  const { t } = useTranslation();
  
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">{t("loading_dashboard")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover-scale border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Usuários
                  </CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : statistics?.users.total.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-success mt-2">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>{statistics?.users.active || 0} ativos</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-scale border-l-4 border-l-success">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saques Pendentes
                  </CardTitle>
                  <CreditCard className="h-5 w-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : `${(statistics?.finances.pendingWithdrawals || 0).toLocaleString()} Kz`}
                  </div>
                  <div className="flex items-center text-sm text-warning mt-2">
                    <Activity className="h-4 w-4 mr-1" />
                    <span>Aguardando aprovação</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-scale border-l-4 border-l-warning">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tarefas Ativas
                  </CardTitle>
                  <Activity className="h-5 w-5 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : statistics?.jobs.active || 0}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>{statistics?.jobs.total || 0} total</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-scale border-l-4 border-l-destructive">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Reportes Pendentes
                  </CardTitle>
                  <Activity className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {reports.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="flex items-center text-sm text-destructive mt-2">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    <span>Requer atenção</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AdminActivityFeed />

            <AdminAnalytics />
          </div>
        );
      case 'users':
        return <AdminUsers />;
      case 'verifications':
        return <AdminVerifications />;
      case 'withdrawals':
        return <AdminWithdrawals />;
      case 'deposit-negotiations':
        return <AdminDepositNegotiations />;
      case 'email-creation':
        return <AdminEmailCreationTasks />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'jobs':
        return <AdminJobManager />;
      case 'reports':
        return <AdminReports />;
      case 'support':
        return <AdminSupport />;
      case 'market':
        return (
          <div className="space-y-6">
            <AdminMarketManager />
          </div>
        );
      case 'market-orders':
        return <AdminMarketOrders />;
      case 'affiliates':
        return <AdminAffiliateAnalytics />;
      case 'banking':
        return <AdminBanking />;
      case 'taxonomy':
        return <AdminTaxonomyManager />;
      case 'social-links':
        return <AdminSocialLinks />;
      case 'security':
        return <AdminSecurity />;
      case 'settings':
        return (
          <div className="space-y-6">
            <AdminDevices />
            <AdminDefaultAvatars />
            <AdminMaintenance />
          </div>
        );
      case 'system-config':
        return <AdminSystemConfig />;
      case 'broadcast-history':
        return <AdminBroadcastHistory />;
      case 'ab-testing':
        return <AdminABTesting />;
      case 'forum':
        return <AdminForumModeration />;
      case 'templates':
        return <AdminTaskTemplates />;
      case 'recurring-jobs':
        return <AdminRecurringJobs />;
      default:
        return <AdminAnalytics />;
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie sua plataforma de forma profissional
                </p>
              </div>
              <div className="flex items-center gap-3">
                <AdminNotificationBell />
                {!statsLoading && statistics && (
                  <Badge variant="outline" className="hidden md:flex bg-primary/10 text-primary border-primary/20">
                    <Activity className="h-3 w-3 mr-1" />
                    {statistics.users.active} usuários online
                  </Badge>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6 animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
