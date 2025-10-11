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
import { useTransactions } from '@/hooks/useFirebase'; // Import useTransactions
import { useUserJobsAndApplications } from '@/hooks/useUserJobsAndApplications'; // Import new hook

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { transactions, loading: transactionsLoading } = useTransactions(); // Real transactions
  const { userJobs, loading: userJobsLoading } = useUserJobsAndApplications(); // Real jobs and applications

  useEffect(() => {
    // Simulate loading data, wait for all real data to load
    if (!transactionsLoading && !userJobsLoading) {
      setLoading(false);
    }
  }, [transactionsLoading, userJobsLoading]);

  if (!userData || !currentUser || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
            <p className="text-muted-foreground">{t("loading_dashboard")}</p>
          </div>
        </div>
      </div>
    );
  }

  const isFreelancer = userData.currentMode === 'tester';
  const wallet = isFreelancer ? userData.testerWallet : userData.posterWallet;

  // --- Data for Freelancer Dashboard ---
  const freelancerCompletedTests = userData.completedTests || 0;
  const freelancerRating = userData.rating || 0;
  const freelancerApprovalRate = userData.approvalRate || 0;

  // Calculate monthly earnings for freelancer
  const monthlyEarningsMap = new Map<string, number>(); // "YYYY-MM" -> earnings
  transactions
    .filter(t => t.type === 'payout' && t.status === 'completed' && t.userId === currentUser.uid)
    .forEach(t => {
      const date = new Date(t.createdAt);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyEarningsMap.set(monthYear, (monthlyEarningsMap.get(monthYear) || 0) + t.amount);
    });

  const sortedMonths = Array.from(monthlyEarningsMap.keys()).sort();
  const monthlyEarningsData = sortedMonths.slice(-7).map(month => ({
    name: new Date(month).toLocaleString('default', { month: 'short' }),
    earnings: monthlyEarningsMap.get(month) || 0,
  }));

  const currentMonthEarnings = monthlyEarningsData.length > 0 ? monthlyEarningsData[monthlyEarningsData.length - 1].earnings : 0;
  const lastMonthEarnings = monthlyEarningsData.length > 1 ? monthlyEarningsData[monthlyEarningsData.length - 2].earnings : 0;
  const earningsGrowth = lastMonthEarnings > 0 ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;

  // Recent activity for freelancer
  const recentFreelancerActivity = transactions
    .filter(t => t.userId === currentUser.uid && (t.type === 'payout' || t.type === 'escrow'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2); // Show top 2 recent activities

  // --- Data for Contractor Dashboard ---
  const contractorJobsPosted = userJobs.length;
  const contractorActiveTasks = userJobs.filter(job => job.status === 'active').length;
  const contractorAwaitingApproval = userJobs.reduce((sum, job) => {
    return sum + job.applications.filter(app => app.status === 'submitted').length;
  }, 0);
  const contractorCompletedTasks = userJobs.reduce((sum, job) => {
    return sum + job.applications.filter(app => app.status === 'approved').length;
  }, 0);

  // Calculate monthly expenses for contractor
  const monthlyExpensesMap = new Map<string, number>(); // "YYYY-MM" -> expenses
  transactions
    .filter(t => t.type === 'escrow' && t.userId === currentUser.uid) // Escrow represents money spent/reserved for tasks
    .forEach(t => {
      const date = new Date(t.createdAt);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyExpensesMap.set(monthYear, (monthlyExpensesMap.get(monthYear) || 0) + Math.abs(t.amount)); // Use absolute value for expenses
    });

  const sortedExpenseMonths = Array.from(monthlyExpensesMap.keys()).sort();
  const monthlyExpensesData = sortedExpenseMonths.slice(-7).map(month => ({
    name: new Date(month).toLocaleString('default', { month: 'short' }),
    expenses: monthlyExpensesMap.get(month) || 0,
  }));

  const currentMonthExpenses = monthlyExpensesData.length > 0 ? monthlyExpensesData[monthlyExpensesData.length - 1].expenses : 0;
  const lastMonthExpenses = monthlyExpensesData.length > 1 ? monthlyExpensesData[monthlyExpensesData.length - 2].expenses : 0;
  const expensesGrowth = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

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
                {currentBalance.toFixed(2)} KZ
              </div>
              <p className="text-xs text-muted-foreground">
                {isFreelancer && userData.testerWallet?.pendingBalance && userData.testerWallet.pendingBalance > 0
                  ? `${userData.testerWallet.pendingBalance.toFixed(2)} KZ ${t("pending_balance_dashboard")}`
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
                {isFreelancer ? freelancerCompletedTests : contractorJobsPosted}
              </div>
              {/* Removed hardcoded growth, as it's complex to calculate without more data */}
              <p className="text-xs text-muted-foreground">
                {isFreelancer ? t("total_completed_tasks") : t("total_created_tasks")}
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

          <Card className="bg-card border-border shadow-md interactive-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? t("approval_rate_dashboard") : t("completion_rate_dashboard")}
              </CardTitle>
              <Target className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {freelancerApprovalRate}%
              </div>
              <Progress value={freelancerApprovalRate} className="mt-2 h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-electric-purple to-success" />
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
                      {/* Progress bar based on a hypothetical goal of 1500 KZ */}
                      <Progress value={(currentMonthEarnings / 1500) * 100} className="mb-1 h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-electric-purple to-cosmic-blue" />
                      <p className="text-xs text-muted-foreground">{t("goal")}: 1,500 KZ</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("growth")}</span>
                      {lastMonthEarnings > 0 ? (
                        <Badge variant={earningsGrowth > 0 ? 'success' : 'destructive'} className="bg-success/10 text-success border-success/20">
                          {earningsGrowth > 0 ? '+' : ''}{earningsGrowth.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("no_previous_data")}</Badge>
                      )}
                    </div>
                  </div>
                  {/* Gráfico de linha real */}
                  <div className="h-48 w-full mt-4">
                    {monthlyEarningsData.length > 0 ? (
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
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t("no_earnings_data")}</p>
                      </div>
                    )}
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
                    {recentFreelancerActivity.length > 0 ? (
                      recentFreelancerActivity.map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div>
                            <p className="font-medium text-sm text-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge variant="outline" className={activity.type === 'payout' ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                            {activity.type === 'payout' ? `+${activity.amount.toFixed(2)} KZ` : t("pending")}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>{t("no_recent_activity")}</p>
                      </div>
                    )}
                    
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
                      <span className="font-bold text-primary">{contractorActiveTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("awaiting_your_approval")}</span>
                      <span className="font-bold text-warning">{contractorAwaitingApproval}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t("completed_tasks_count")}</span>
                      <span className="font-bold text-success">{contractorCompletedTasks}</span>
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
                        <span className="font-bold text-foreground">{currentMonthExpenses.toFixed(2)} KZ</span>
                      </div>
                      {/* Progress bar based on a hypothetical budget of 2000 KZ */}
                      <Progress value={(currentMonthExpenses / 2000) * 100} className="mb-1 h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-star-glow to-destructive" />
                      <p className="text-xs text-muted-foreground">{t("budget")}: 2,000 KZ</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("growth")}</span>
                      {lastMonthExpenses > 0 ? (
                        <Badge variant={expensesGrowth > 0 ? 'destructive' : 'success'} className="bg-destructive/10 text-destructive border-destructive/20">
                          {expensesGrowth > 0 ? '+' : ''}{expensesGrowth.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("no_previous_data")}</Badge>
                      )}
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
                  {freelancerCompletedTests >= 100 && (
                    <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("congrats_100_tasks")}</p>
                        <p className="text-xs text-muted-foreground">{t("unlocked_expert_badge")}</p>
                      </div>
                    </div>
                  )}
                  
                  {currentBalance >= 2000 && ( // Assuming 2000 KZ is min withdrawal
                    <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("balance_available_for_withdrawal")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("balance_available_for_withdrawal_description", { balance: currentBalance.toFixed(2) })}
                        </p>
                      </div>
                    </div>
                  )}

                  {freelancerCompletedTests === 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/5 border border-muted/20 rounded-lg">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("no_tasks_yet")}</p>
                        <p className="text-xs text-muted-foreground">{t("start_your_first_task")}</p>
                      </div>
                    </div>
                  )}

                  {freelancerCompletedTests < 100 && freelancerCompletedTests > 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("keep_going")}</p>
                        <p className="text-xs text-muted-foreground">{t("tasks_to_expert_badge", { count: 100 - freelancerCompletedTests })}</p>
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
                        <p className="font-medium text-sm text-foreground">{t("tasks_awaiting_approval", { count: contractorAwaitingApproval })}</p>
                        <p className="text-xs text-muted-foreground">{t("tasks_awaiting_approval_description")}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Placeholder for new applicants, if we had a way to count them */}
                  {/* For now, if no real data, don't show */}
                  {/* <div className="flex items-center space-x-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{t("new_applicants", { count: 12 })}</p>
                      <p className="text-xs text-muted-foreground">{t("new_applicants_description")}</p>
                    </div>
                  </div> */}

                  {contractorJobsPosted === 0 && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/5 border border-muted/20 rounded-lg">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{t("no_jobs_posted_yet")}</p>
                        <p className="text-xs text-muted-foreground">{t("post_your_first_job")}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* If no alerts, show a generic message */}
              {!isFreelancer && contractorAwaitingApproval === 0 && contractorJobsPosted === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>{t("no_alerts_contractor")}</p>
                </div>
              )}
              {isFreelancer && freelancerCompletedTests < 100 && currentBalance < 2000 && freelancerCompletedTests > 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>{t("no_alerts_freelancer")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;