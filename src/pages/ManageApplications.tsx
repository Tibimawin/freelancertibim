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
import { ArrowLeft, Eye, Users, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const ManageApplications = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<(Job & { applications?: Application[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { t } = useTranslation();

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
        title: t("error"),
        description: t("error_loading_tasks_applications"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobsWithApplications();
  }, [currentUser]);

  const handleReviewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
  };

  const handleReviewComplete = async () => {
    setShowReviewModal(false);
    setSelectedApplication(null);
    await fetchJobsWithApplications(); // Refresh the list after review
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{t("awaiting_review")}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">{t("approved")}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{t("rejected")}</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{t("accepted")}</Badge>;
      case 'applied':
        return <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-border">{t("applied")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">{t("loading_your_tasks")}</p>
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
              {t("back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("manage_applications")}</h1>
              <p className="text-muted-foreground">{t("review_freelancer_proofs")}</p>
            </div>
          </div>

          {/* Lista de Jobs */}
          <div className="space-y-6">
            {jobs.length === 0 ? (
              <Card className="bg-card border-border shadow-md">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{t("no_tasks_found_manage")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("no_tasks_found_manage_description")}
                  </p>
                  <Button onClick={() => navigate('/create-job')} className="glow-effect">
                    {t("create_new_task")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="bg-card border-border shadow-md">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
                      <div>
                        <CardTitle className="text-xl text-foreground">{job.title}</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">{job.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{job.bounty.toFixed(2)} KZ</p>
                        <p className="text-sm text-muted-foreground">
                          {job.applications?.length || 0} {t("applications_received")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {job.applications && job.applications.length > 0 ? (
                      <div className="space-y-4">
                        <Separator className="bg-border" />
                        <h4 className="font-semibold flex items-center text-foreground">
                          <Users className="h-4 w-4 mr-2 text-cosmic-blue" />
                          {t("applications_received")}
                        </h4>
                        
                        <div className="space-y-3">
                          {job.applications.map((application) => (
                            <div key={application.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 space-y-2 sm:space-y-0">
                                <div>
                                  <p className="font-medium text-foreground">{application.testerName}</p>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {t("applied_on")} {new Date(application.appliedAt).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                                <div>{getStatusBadge(application.status)}</div>
                              </div>
                              
                              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                                {application.status === 'submitted' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleReviewApplication({ ...application, job })} // Pass job data to modal
                                    className="glow-effect"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t("review_proofs")}
                                  </Button>
                                )}
                                {application.status === 'approved' && (
                                  <div className="flex items-center text-success text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {t("approved_short")}
                                  </div>
                                )}
                                {application.status === 'rejected' && (
                                  <div className="flex items-center text-destructive text-sm">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {t("rejected_short")}
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
                        <p>{t("no_applications_for_task")}</p>
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