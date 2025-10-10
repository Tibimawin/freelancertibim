import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Smartphone, 
  Monitor, 
  Globe, 
  DollarSign,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApplicationService } from "@/services/applicationService";
import { JobService } from "@/services/firebase";
import { Application, Job } from "@/types/firebase";
import Header from "@/components/Header";
import { useTranslation } from 'react-i18next';

const TaskHistory = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<(Application & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!currentUser) return;
      
      try {
        const userApplications = await ApplicationService.getUserApplications(currentUser.uid);
        
        // Buscar dados dos jobs para cada aplicação
        const applicationsWithJobs = await Promise.all(
          userApplications.map(async (app) => {
            try {
              const job = await JobService.getJobById(app.jobId);
              return { ...app, job };
            } catch (error) {
              console.error('Error fetching job for application:', error);
              return app;
            }
          })
        );
        
        setApplications(applicationsWithJobs);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />{t("approved")}</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />{t("rejected")}</Badge>;
      case 'submitted':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />{t("pending_analysis")}</Badge>;
      case 'accepted':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><AlertCircle className="h-3 w-3 mr-1" />{t("accepted")}</Badge>;
      case 'applied':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{t("applied")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string | undefined) => {
    switch (platform) {
      case "iOS":
      case "Android":
        return <Smartphone className="h-4 w-4 text-muted-foreground" />;
      case "Web":
        return <Globe className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Monitor className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDifficultyColor = (difficulty: string | undefined) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-success/10 text-success border-success/20";
      case "Médio":
        return "bg-warning/10 text-warning border-warning/20";
      case "Difícil":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFilteredApplications = (status?: string) => {
    if (!status) return applications;
    
    switch (status) {
      case 'completed':
        return applications.filter(app => app.status === 'approved');
      case 'pending':
        return applications.filter(app => ['submitted', 'accepted'].includes(app.status));
      case 'rejected':
        return applications.filter(app => app.status === 'rejected');
      default:
        return applications;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">{t("loading_history")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t("task_history")}</h1>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              {t("all")} ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              {t("completed")} ({getFilteredApplications('completed').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              {t("pending")} ({getFilteredApplications('pending').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {t("rejected")} ({getFilteredApplications('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {applications.length > 0 ? (
              applications.map((app) => (
                <Card key={app.id} className="interactive-scale bg-card border-border shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-foreground">{app.job?.title || t('task_not_found')}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("applied_on")} {new Date(app.appliedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-primary">
                          {app.job?.bounty.toFixed(2) || '0.00'} KZ
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {app.job?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {app.job.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {getPlatformIcon(app.job?.platform)}
                          <span className="font-medium">{app.job?.platform || t('not_available')}</span>
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Badge variant="outline" className={getDifficultyColor(app.job?.difficulty)}>
                            {t(app.job?.difficulty?.toLowerCase() || 'not_available')}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{app.job?.timeEstimate || t('not_available')}</span>
                        </span>
                      </div>

                      {app.rejectionReason && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                          <p className="text-sm text-destructive font-medium">{t("rejection_reason")}:</p>
                          <p className="text-sm text-destructive mt-1">{app.rejectionReason}</p>
                        </div>
                      )}

                      {app.reviewedAt && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {app.status === 'approved' ? t('completed_on') : t('reviewed_on')}{' '}
                            {new Date(app.reviewedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("no_tasks_found_history")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {getFilteredApplications('completed').map((app) => (
              <Card key={app.id} className="interactive-scale bg-card border-success/20 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-foreground">{app.job?.title || t('task_not_found')}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("completed_on")} {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('pt-BR') : t('date_not_available')}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-success">
                        +{app.job?.bounty.toFixed(2) || '0.00'} KZ
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {app.job?.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {getFilteredApplications('pending').map((app) => (
              <Card key={app.id} className="interactive-scale bg-card border-warning/20 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-foreground">{app.job?.title || t('task_not_found')}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {app.status === 'submitted' ? t('pending_analysis') : t('task_accepted_submit_proofs')}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-warning">
                        {app.job?.bounty.toFixed(2) || '0.00'} KZ
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {app.job?.description}
                  </p>
                  {app.status === 'accepted' && (
                    <Button 
                      size="sm" 
                      className="mt-3 glow-effect"
                      onClick={() => navigate(`/job/${app.jobId}`)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {t("submit_proofs")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {getFilteredApplications('rejected').map((app) => (
              <Card key={app.id} className="interactive-scale bg-card border-destructive/20 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-foreground">{app.job?.title || t('task_not_found')}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("rejected_on")} {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('pt-BR') : t('date_not_available')}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {app.job?.bounty.toFixed(2) || '0.00'} KZ
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.job?.description}
                    </p>
                    
                    {app.rejectionReason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm text-destructive font-medium">{t("rejection_reason")}:</p>
                        <p className="text-sm text-destructive mt-1">{app.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TaskHistory;