import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, User, Calendar, Upload, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Job } from "@/types/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { ApplicationService } from "@/services/applicationService";
import { useTranslation } from 'react-i18next';

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [proofs, setProofs] = useState<{ [key: string]: { text: string; file: File | null; comment: string } }>({});
  const [actualApplicantCount, setActualApplicantCount] = useState(0);
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      try {
        const jobData = await JobService.getJobById(id);
        if (jobData) {
          const normalizedJob = {
            ...jobData,
            detailedInstructions: jobData.detailedInstructions || [],
            proofRequirements: jobData.proofRequirements || [],
          };
          setJob(normalizedJob);
          
          const applications = await ApplicationService.getApplicationsForJob(id);
          setActualApplicantCount(applications.length);

          // Initialize proofs state based on requirements
          const initialProofs: { [key: string]: { text: string; file: null; comment: string } } = {};
          normalizedJob.proofRequirements.forEach(req => {
            initialProofs[req.id] = { text: '', file: null, comment: '' };
          });
          setProofs(initialProofs);

        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">{t("loading task")}</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("task not found")}</h2>
          <Button onClick={() => navigate('/')}>{t("back to home")}</Button>
        </div>
      </div>
    );
  }

  const getPlatformIcon = () => {
    switch (job.platform) {
      case "iOS":
      case "Android":
        return <Smartphone className="h-5 w-5" />;
      case "Web":
        return <Globe className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = () => {
    switch (job.difficulty) {
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

  const canApply = currentUser && job.posterId !== currentUser.uid && job.status === 'active';

  const handleProofChange = (requirementId: string, field: 'text' | 'comment', value: string) => {
    setProofs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        [field]: value,
        file: prev[requirementId]?.file || null
      }
    }));
  };

  const handleFileChange = (requirementId: string, file: File | null) => {
    setProofs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        file,
        text: prev[requirementId]?.text || '',
        comment: prev[requirementId]?.comment || ''
      }
    }));
  };

  const handleSubmitProofs = async () => {
    if (!currentUser || !userData || !canApply) {
      toast({
        title: t("error"),
        description: t("unauthenticated apply"),
        variant: "destructive",
      });
      return;
    }

    const requiredProofs = job.proofRequirements?.filter(req => req.isRequired) || [];
    const missingProofs = requiredProofs.filter(req => {
      const proof = proofs[req.id];
      return !proof || (!proof.text && !proof.file);
    });

    if (missingProofs.length > 0) {
      toast({
        title: t("missing required proofs"),
        description: t("missing required proofs description"),
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    try {
      // Primeiro, criar a aplicação
      const applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
      
      // Preparar provas para envio
      const proofsToSubmit: any[] = job.proofRequirements?.map((req) => {
        const proof = proofs[req.id];
        return {
          requirementId: req.id,
          type: req.type,
          content: proof?.text || proof?.file?.name || '', // TODO: Implement file upload to storage
          comment: proof?.comment || ''
        };
      }) || [];

      // Enviar provas
      await ApplicationService.submitProofs(applicationId, proofsToSubmit);
      
      toast({
        title: t("proofs submitted success"),
        description: t("proofs submitted description"),
      });
      
      navigate('/task-history');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: t("error"),
        description: t("error submitting proofs"),
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button */}
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
          <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
        </div>

        {/* Job Info Card */}
        <Card className="mb-8 bg-card border-border shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getPlatformIcon()}
                <Badge variant="outline" className={getDifficultyColor()}>
                  {t(job.difficulty.toLowerCase())}
                </Badge>
                <Badge variant="secondary" className="bg-cosmic-blue/20 text-cosmic-blue border-cosmic-blue/30">{job.platform}</Badge>
                <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className={job.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-muted/30 text-muted-foreground border-border'}>
                  {job.status === 'active' ? t('active') : t('inactive')}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{job.bounty.toFixed(2)} KZ</p>
                <p className="text-sm text-muted-foreground">{t("applicants count", { count: actualApplicantCount })}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground">{t("detailed description")}</h3>
              <p className="text-muted-foreground leading-relaxed">{job.description}</p>
            </div>

            {/* Detailed Instructions */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t("detailed instructions label")}</h3>
              {job.detailedInstructions && job.detailedInstructions.length > 0 ? (
                <div className="space-y-3">
                  {job.detailedInstructions.map((instruction) => (
                    <div key={instruction.id} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="bg-electric-purple/10 text-electric-purple border border-electric-purple/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {instruction.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{instruction.instruction}</p>
                        {instruction.isRequired && (
                          <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {t("required")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground italic">
                    {t("no detailed instructions")}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("time estimate")}:</span>
                  <span className="font-medium">{job.timeEstimate}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("posted by")}:</span>
                  <span className="font-medium">{job.posterName}</span>
                </div>

                {job.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("location")}:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("posted")}:</span>
                  <span className="font-medium">
                    {job.createdAt && (job.createdAt as any).toDate 
                      ? (job.createdAt as any).toDate().toLocaleDateString('pt-BR')
                      : job.createdAt 
                        ? new Date(job.createdAt).toLocaleDateString('pt-BR') 
                        : t('date not available')}
                  </span>
                </div>

                {job.dueDate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("due date")}:</span>
                    <span className="font-medium">
                      {(job.dueDate as any).toDate 
                        ? (job.dueDate as any).toDate().toLocaleDateString('pt-BR')
                        : new Date(job.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {job.maxApplicants && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("max applicants")}:</span>
                    <span className="font-medium">{job.maxApplicants}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof Requirements Section */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-star-glow" />
              <span>{t("proof requirements")}</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {job.proofRequirements && job.proofRequirements.length > 0 ? (
              <>
                {canApply ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("submit your proofs")}
                    </p>
                    {job.proofRequirements.map((proofReq) => (
                      <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                            <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                            {proofReq.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                {t("required")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                        </div>

                        <div className="space-y-3 ml-6">
                          {(proofReq.type === 'text' || proofReq.type === 'url') && (
                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                {proofReq.type === 'url' ? t('link url') : t('text response')}
                              </label>
                              <Textarea
                                placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof placeholder url') : t('proof placeholder text'))}
                                value={proofs[proofReq.id]?.text || ''}
                                onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                          )}

                          {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground block">
                                {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                              </label>
                              <Input
                                type="file"
                                accept={proofReq.type === 'screenshot' ? 'image/*' : 'image/*,.pdf,.doc,.docx'}
                                onChange={(e) => handleFileChange(proofReq.id, e.target.files?.[0] || null)}
                                className="cursor-pointer"
                              />
                              {proofs[proofReq.id]?.file && (
                                <p className="text-sm text-muted-foreground">
                                  {t("file selected")}: {proofs[proofReq.id].file?.name}
                                </p>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              {t("optional comment")}
                            </label>
                            <Textarea
                              placeholder={t("optional comment placeholder")}
                              value={proofs[proofReq.id]?.comment || ''}
                              onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                              className="min-h-[60px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button variant="outline" onClick={handleCancel}>
                        {t("cancel button").toUpperCase()}
                      </Button>
                      <Button 
                        onClick={handleSubmitProofs} 
                        disabled={isApplying}
                        className="min-w-[140px] glow-effect"
                      >
                        {isApplying ? t("submitting").toUpperCase() : t("submit proofs").toUpperCase()}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("contractor requested proofs")}
                    </p>
                    {job.proofRequirements.map((proofReq) => (
                      <div key={proofReq.id} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center space-x-2 mb-2">
                          {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                          <span className="font-medium text-foreground">{proofReq.label}</span>
                          {proofReq.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              {t("required")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                        <p className="text-xs text-muted-foreground ml-6 mt-1">
                          {t("type")}: <span className="font-medium">{
                            proofReq.type === 'screenshot' ? t('screenshot') :
                            proofReq.type === 'file' ? t('file') :
                            proofReq.type === 'url' ? t('link url') : t('text response')
                          }</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground italic">
                  {t("no proof requirements")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message for users who can't apply */}
        {!canApply && (
          <Card className="bg-card border-border shadow-md">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {currentUser && job.posterId === currentUser.uid 
                  ? t("your own job") 
                  : job.status !== 'active' 
                    ? t("task inactive") 
                    : t("login to apply")
                }
              </p>
              {!currentUser && (
                <Button className="mt-4 glow-effect" onClick={() => navigate('/')}>
                  {t("login button")}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JobDetails;