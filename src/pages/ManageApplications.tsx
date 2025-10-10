import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { ApplicationService } from "@/services/applicationService";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import ProofReviewModal from "@/components/ProofReviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Job, Application } from "@/types/firebase";
import { ArrowLeft, Eye, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ManageApplications = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<(Job & { applications?: Application[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    const fetchJobsWithApplications = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Buscar todos os jobs do contratante
        const allJobs = await JobService.getJobs({});
        const myJobs = allJobs.filter(job => job.posterId === currentUser.uid);
        
        // Para cada job, buscar as aplicações
        const jobsWithApplications = await Promise.all(
          myJobs.map(async (job) => {
            const applications = await ApplicationService.getApplicationsForJob(job.id);
            return { ...job, applications };
          })
        );
        
        setJobs(jobsWithApplications);
      } catch (error) {
        console.error('Error fetching jobs with applications:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar suas tarefas e aplicações.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobsWithApplications();
  }, [currentUser]);

  const handleReviewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
  };

  const handleReviewComplete = async () => {
    setShowReviewModal(false);
    setSelectedApplication(null);
    
    // Atualizar lista de jobs
    if (currentUser) {
      try {
        const allJobs = await JobService.getJobs({});
        const myJobs = allJobs.filter(job => job.posterId === currentUser.uid);
        
        const jobsWithApplications = await Promise.all(
          myJobs.map(async (job) => {
            const applications = await ApplicationService.getApplicationsForJob(job.id);
            return { ...job, applications };
          })
        );
        
        setJobs(jobsWithApplications);
      } catch (error) {
        console.error('Error refreshing jobs:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="text-warning border-warning/20 bg-warning/10">Aguardando Revisão</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-success border-success/20 bg-success/10">Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10">Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">Aplicado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">Carregando suas tarefas...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Aplicações</h1>
              <p className="text-muted-foreground">Revise e aprove as provas enviadas pelos freelancers</p>
            </div>
          </div>

          {/* Lista de Jobs */}
          <div className="space-y-6">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não criou nenhuma tarefa ou não há aplicações para revisar.
                  </p>
                  <Button onClick={() => navigate('/create-job')}>
                    Criar Nova Tarefa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">{job.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{job.bounty.toFixed(2)} KZ</p>
                        <p className="text-sm text-muted-foreground">
                          {job.applications?.length || 0} aplicações
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {job.applications && job.applications.length > 0 ? (
                      <div className="space-y-4">
                        <Separator />
                        <h4 className="font-semibold flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Aplicações Recebidas
                        </h4>
                        
                        <div className="space-y-3">
                          {job.applications.map((application) => (
                            <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium">{application.testerName}</p>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      Aplicado em {new Date(application.appliedAt).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                                <div>{getStatusBadge(application.status)}</div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {application.status === 'submitted' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleReviewApplication(application)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Revisar Provas
                                  </Button>
                                )}
                                {application.status === 'approved' && (
                                  <div className="flex items-center text-success text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovada
                                  </div>
                                )}
                                {application.status === 'rejected' && (
                                  <div className="flex items-center text-destructive text-sm">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeitada
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Ainda não há aplicações para esta tarefa</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Revisão */}
      {selectedApplication && (
        <ProofReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          application={selectedApplication}
          onReviewed={handleReviewComplete}
        />
      )}
    </div>
  );
};

export default ManageApplications;