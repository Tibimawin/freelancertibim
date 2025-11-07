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
  DollarSign,
  Flag 
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminStatistics, useAdminReports } from '@/hooks/useAdmin'; 
import AdminHeader from '@/components/admin/AdminHeader';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminWithdrawals from '@/components/admin/AdminWithdrawals';
import AdminVerifications from '@/components/admin/AdminVerifications';
import AdminBalances from '@/components/admin/AdminBalances';
import AdminBanking from '@/components/admin/AdminBanking';
import AdminReports from '@/components/admin/AdminReports'; 
import AdminReferrals from '@/components/admin/AdminReferrals'; // Import AdminReferrals
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { statistics, loading: statsLoading, refetch } = useAdminStatistics();
  const { reports, fetchReports } = useAdminReports(); 
  const { t } = useTranslation();

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
                {statsLoading ? '...' : `R$ ${statistics?.finances.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {!statsLoading && statistics && (
                  <>
                    R$ {statistics.finances.pendingWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {t("pending_withdrawals")}
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">{t("overview_tab")}</TabsTrigger>
            <TabsTrigger value="users">{t("users_tab")}</TabsTrigger>
            <TabsTrigger value="withdrawals">{t("withdrawals_tab")}</TabsTrigger>
            <TabsTrigger value="verifications">{t("verifications_tab")}</TabsTrigger>
            <TabsTrigger value="balances">{t("balances_tab")}</TabsTrigger>
            <TabsTrigger value="banking">{t("banking_data_tab")}</TabsTrigger>
            <TabsTrigger value="reports">
              {t("reports_tab")}
              {pendingReportsCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingReportsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="referrals">
              {t("referral_program")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                      {statsLoading ? '...' : `R$ ${statistics?.finances.totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("total_withdrawals")}</span>
                    <span className="font-medium">
                      {statsLoading ? '...' : `R$ ${statistics?.finances.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("platform_fees")}</span>
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

          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
          
          <TabsContent value="referrals">
            <AdminReferrals />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;