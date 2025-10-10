import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApplicationService } from "@/services/applicationService";
import { JobService } from "@/services/firebase";
import { Application, Job } from "@/types/firebase";
import Header from "@/components/Header";

const TaskHistory = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<(Application & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);

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
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      case 'submitted':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Aguardando Análise</Badge>;
      case 'accepted':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><AlertCircle className="h-3 w-3 mr-1" />Aceita</Badge>;
      case 'applied':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Candidatado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <div className="animate-pulse text-muted-foreground">Carregando histórico...</div>
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
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Tarefas</h1>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Todas ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({getFilteredApplications('completed').length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({getFilteredApplications('pending').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitadas ({getFilteredApplications('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {applications.length > 0 ? (
              applications.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{app.job?.title || 'Tarefa não encontrada'}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Aplicado em {new Date(app.appliedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-xl font-bold text-primary">
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
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Plataforma: <span className="font-medium">{app.job?.platform}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Dificuldade: <span className="font-medium">{app.job?.difficulty}</span>
                        </span>
                      </div>

                      {app.rejectionReason && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                          <p className="text-sm text-destructive font-medium">Motivo da rejeição:</p>
                          <p className="text-sm text-destructive mt-1">{app.rejectionReason}</p>
                        </div>
                      )}

                      {app.reviewedAt && (
                        <div className="text-xs text-muted-foreground">
                          {app.status === 'approved' ? 'Aprovado' : 'Analisado'} em {' '}
                          {new Date(app.reviewedAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {getFilteredApplications('completed').map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow border-success/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.job?.title || 'Tarefa não encontrada'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Concluída em {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xl font-bold text-success">
                        +{app.job?.bounty.toFixed(2) || '0.00'} KZ
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {app.job?.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {getFilteredApplications('pending').map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow border-warning/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.job?.title || 'Tarefa não encontrada'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {app.status === 'submitted' ? 'Aguardando análise das provas' : 'Tarefa aceita - envie as provas'}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xl font-bold text-warning">
                        {app.job?.bounty.toFixed(2) || '0.00'} KZ
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {app.job?.description}
                  </p>
                  {app.status === 'accepted' && (
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate(`/job/${app.jobId}`)}
                    >
                      Enviar Provas
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {getFilteredApplications('rejected').map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow border-destructive/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.job?.title || 'Tarefa não encontrada'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rejeitada em {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xl font-bold text-muted-foreground">
                        {app.job?.bounty.toFixed(2) || '0.00'} KZ
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {app.job?.description}
                    </p>
                    
                    {app.rejectionReason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm text-destructive font-medium">Motivo da rejeição:</p>
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