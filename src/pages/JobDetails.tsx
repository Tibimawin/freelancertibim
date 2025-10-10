import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, User, Calendar, Upload, ArrowLeft } from "lucide-react";
import { Job } from "@/types/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { ApplicationService } from "@/services/applicationService";

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [proofs, setProofs] = useState<{ [key: number]: { text: string; file: File | null; comment: string } }>({});
  const [actualApplicantCount, setActualApplicantCount] = useState(0);
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      try {
        const jobData = await JobService.getJobById(id);
        if (jobData) {
          console.log('Job Data:', jobData);
          console.log('Detailed Instructions:', jobData.detailedInstructions);
          console.log('Proof Requirements:', jobData.proofRequirements);
          
          // Garantir que arrays existam mesmo se vazios
          const normalizedJob = {
            ...jobData,
            detailedInstructions: jobData.detailedInstructions || [],
            proofRequirements: jobData.proofRequirements || [],
          };
          setJob(normalizedJob);
          
          // Buscar número real de aplicações
          const applications = await ApplicationService.getApplicationsForJob(id);
          setActualApplicantCount(applications.length);
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
          <div className="animate-pulse text-muted-foreground">Carregando tarefa...</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Tarefa não encontrada</h2>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
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

  const handleProofChange = (requirementIndex: number, field: 'text' | 'comment', value: string) => {
    setProofs(prev => ({
      ...prev,
      [requirementIndex]: {
        ...prev[requirementIndex],
        [field]: value,
        file: prev[requirementIndex]?.file || null
      }
    }));
  };

  const handleFileChange = (requirementIndex: number, file: File | null) => {
    setProofs(prev => ({
      ...prev,
      [requirementIndex]: {
        ...prev[requirementIndex],
        file,
        text: prev[requirementIndex]?.text || '',
        comment: prev[requirementIndex]?.comment || ''
      }
    }));
  };

  const handleSubmitProofs = async () => {
    if (!currentUser || !userData || !canApply) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para aplicar",
        variant: "destructive",
      });
      return;
    }

    // Validar provas obrigatórias
    const requiredProofs = job.proofRequirements?.filter(req => req.isRequired) || [];
    const missingProofs = requiredProofs.filter(req => {
      const proofIndex = job.proofRequirements?.findIndex(p => p.id === req.id) ?? -1;
      const proof = proofs[proofIndex];
      return !proof || (!proof.text && !proof.file);
    });

    if (missingProofs.length > 0) {
      toast({
        title: "Provas obrigatórias em falta",
        description: "Por favor, complete todas as provas obrigatórias antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsApplying(true);
      
      // Primeiro, criar a aplicação
      const applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
      
      // Preparar provas para envio
      const proofsToSubmit: any[] = job.proofRequirements?.map((req, index) => {
        const proof = proofs[index];
        return {
          requirementId: req.id,
          type: req.type,
          content: proof?.text || proof?.file?.name || '',
          comment: proof?.comment || ''
        };
      }) || [];

      // Enviar provas (implementar upload de arquivos aqui se necessário)
      await ApplicationService.submitProofs(applicationId, proofsToSubmit);
      
      toast({
        title: "Sucesso!",
        description: "Sua aplicação e provas foram enviadas com sucesso",
      });
      
      navigate('/task-history');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar aplicação. Tente novamente.",
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
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
        </div>

        {/* Job Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getPlatformIcon()}
                <Badge variant="outline" className={getDifficultyColor()}>
                  {job.difficulty}
                </Badge>
                <Badge variant="secondary">{job.platform}</Badge>
                <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                  {job.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{job.bounty.toFixed(2)} KZ</p>
                <p className="text-sm text-muted-foreground">{actualApplicantCount} candidatos</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Descrição</h3>
              <p className="text-muted-foreground leading-relaxed">{job.description}</p>
            </div>

            {/* Detailed Instructions */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Instruções Detalhadas da Tarefa</h3>
              {job.detailedInstructions && job.detailedInstructions.length > 0 ? (
                <div className="space-y-3">
                  {job.detailedInstructions.map((instruction, index) => (
                    <div key={instruction.id} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                      <span className="font-semibold text-primary text-sm mt-0.5 min-w-[24px]">
                        {instruction.step}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{instruction.instruction}</p>
                        {instruction.isRequired && (
                          <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Obrigatório
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    O contratante não adicionou instruções detalhadas para esta tarefa.
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
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span className="font-medium">{job.timeEstimate}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Publicado por:</span>
                  <span className="font-medium">{job.posterName}</span>
                </div>

                {job.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Localização:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Publicado:</span>
                  <span className="font-medium">
                    {job.createdAt && (job.createdAt as any).toDate 
                      ? (job.createdAt as any).toDate().toLocaleDateString('pt-BR')
                      : job.createdAt 
                        ? new Date(job.createdAt).toLocaleDateString('pt-BR') 
                        : 'Data não disponível'}
                  </span>
                </div>

                {job.dueDate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Prazo:</span>
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
                    <span className="text-muted-foreground">Máx. candidatos:</span>
                    <span className="font-medium">{job.maxApplicants}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof Requirements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Provas Necessárias</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {job.proofRequirements && job.proofRequirements.length > 0 ? (
              <>
                {canApply ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Envie suas provas conforme solicitado abaixo para completar esta tarefa:
                    </p>
                    {job.proofRequirements.map((proofReq, index) => (
                      <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-primary text-sm">{index + 1}.</span>
                            <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                            {proofReq.isRequired && (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                                Obrigatório
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                        </div>

                        <div className="space-y-3 ml-6">
                          {(proofReq.type === 'text' || proofReq.type === 'url') && (
                            <div>
                              <label className="text-sm font-medium text-foreground mb-2 block">
                                {proofReq.type === 'url' ? 'URL/Link' : 'Texto'}
                              </label>
                              <Textarea
                                placeholder={proofReq.placeholder || `Digite ${proofReq.type === 'url' ? 'o link' : 'o texto'} aqui`}
                                value={proofs[index]?.text || ''}
                                onChange={(e) => handleProofChange(index, 'text', e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                          )}

                          {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground block">
                                {proofReq.type === 'screenshot' ? 'Captura de Tela' : 'Arquivo'}
                              </label>
                              <Input
                                type="file"
                                accept={proofReq.type === 'screenshot' ? 'image/*' : 'image/*,.pdf,.doc,.docx'}
                                onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                className="cursor-pointer"
                              />
                              {proofs[index]?.file && (
                                <p className="text-sm text-muted-foreground">
                                  Arquivo selecionado: {proofs[index].file?.name}
                                </p>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              Comentário adicional (opcional)
                            </label>
                            <Textarea
                              placeholder="Digite um comentário adicional se necessário"
                              value={proofs[index]?.comment || ''}
                              onChange={(e) => handleProofChange(index, 'comment', e.target.value)}
                              className="min-h-[60px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button variant="outline" onClick={handleCancel}>
                        CANCELAR
                      </Button>
                      <Button 
                        onClick={handleSubmitProofs} 
                        disabled={isApplying}
                        className="min-w-[140px]"
                      >
                        {isApplying ? "ENVIANDO..." : "ENVIAR PROVAS"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      O contratante solicitou as seguintes provas para esta tarefa:
                    </p>
                    {job.proofRequirements.map((proofReq, index) => (
                      <div key={proofReq.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-primary text-sm">{index + 1}.</span>
                          <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                          {proofReq.isRequired && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                        <p className="text-xs text-muted-foreground ml-6 mt-1">
                          Tipo: <span className="font-medium">{
                            proofReq.type === 'screenshot' ? 'Captura de Tela' :
                            proofReq.type === 'file' ? 'Arquivo' :
                            proofReq.type === 'url' ? 'URL/Link' : 'Texto'
                          }</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  O contratante não especificou requisitos de prova para esta tarefa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message for users who can't apply */}
        {!canApply && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {currentUser && job.posterId === currentUser.uid 
                  ? "Esta é sua própria tarefa. Você não pode aplicar para ela." 
                  : job.status !== 'active' 
                    ? "Esta tarefa não está mais ativa." 
                    : "Você precisa estar logado para aplicar a esta tarefa."
                }
              </p>
              {!currentUser && (
                <Button className="mt-4" onClick={() => navigate('/')}>
                  Fazer Login
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