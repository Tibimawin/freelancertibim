import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Eye, FileText, EyeOff, ExternalLink, AlertTriangle } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Application, Job, ProofSubmission } from "@/types/firebase";
import { ApplicationService } from "@/services/applicationService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProofReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application & { job?: Job };
  onReviewed: () => void;
}

const ProofReviewModal = ({ isOpen, onClose, application, onReviewed }: ProofReviewModalProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
  
  // Check if this is an email creation task
  const isEmailCreationTask = Boolean(application.job?.emailCreation);

  const handleApprove = async () => {
    if (!currentUser) {
      toast.error("Erro de autenticação", { description: "Você precisa estar logado para aprovar tarefas." });
      return;
    }

    setIsLoading(true);
    try {
      await ApplicationService.reviewApplication(
        application.id,
        'approved',
        currentUser.uid // Usando o ID do usuário atual
      );
      
      toast.success("Tarefa aprovada!", {
        description: "O pagamento foi processado e o freelancer foi notificado.",
      });
      
      onReviewed();
      onClose();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error("Erro ao aprovar", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser) {
      toast.error("Erro de autenticação", { description: "Você precisa estar logado para rejeitar tarefas." });
      return;
    }

    // Email creation validation
    if (isEmailCreationTask) {
      if (!selectedRejectionReason) {
        toast.error("Motivo obrigatório", {
          description: "Por favor, selecione o motivo da rejeição.",
        });
        return;
      }
      
      if (selectedRejectionReason === 'Outro motivo' && !rejectionReason.trim()) {
        toast.error("Detalhes obrigatórios", {
          description: "Por favor, informe os detalhes do motivo da rejeição.",
        });
        return;
      }
    } else if (!rejectionReason.trim()) {
      toast.error("Motivo obrigatório", {
        description: "Por favor, informe o motivo da rejeição.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const finalReason = isEmailCreationTask 
        ? `${selectedRejectionReason}${rejectionReason.trim() ? ` - ${rejectionReason}` : ''}`
        : rejectionReason;
        
      await ApplicationService.reviewApplication(
        application.id,
        'rejected',
        currentUser.uid,
        finalReason
      );
      
      toast.success("Tarefa rejeitada", {
        description: "O freelancer foi notificado sobre a rejeição.",
      });
      
      onReviewed();
      onClose();
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error("Erro ao rejeitar", {
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProofTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Texto';
      case 'screenshot':
        return 'Captura de Tela';
      case 'file':
        return 'Arquivo';
      case 'url':
        return 'URL/Link';
      default:
        return type;
    }
  };
  
  const getProviderLoginUrl = (provider: string): string => {
    const providers: Record<string, string> = {
      'gmail': 'https://mail.google.com',
      'outlook': 'https://outlook.live.com',
      'yahoo': 'https://mail.yahoo.com',
      'protonmail': 'https://mail.proton.me',
      'proton': 'https://mail.proton.me',
    };
    return providers[provider.toLowerCase()] || '';
  };

  const getFileUrl = (p: any) => (p as any)?.fileUrl || (p as any)?.content || '';
  const isImageUrl = (url: string) => /\.(png|jpg|jpeg|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
  const formatUrlLabel = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname.length > 40 ? `${u.pathname.slice(0, 40)}…` : u.pathname;
      return `${u.hostname}${path}`;
    } catch {
      return url.length > 60 ? `${url.slice(0, 60)}…` : url;
    }
  };
  
  const emailRejectionReasons = [
    'Credenciais incorretas - não consegui fazer login',
    'Conta já está logada em outro lugar',
    'E-mail não corresponde ao provedor solicitado',
    'Senha não atende aos requisitos mínimos',
    'Outro motivo'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[1000px] h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Revisar Provas - {application.job?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <div className="px-6 py-4 pb-32 space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Informações da Tarefa</h3>
              <p className="text-sm text-muted-foreground mb-2">{application.job?.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span>Freelancer: <strong>{application.testerName}</strong></span>
                <span>Valor: <strong>{application.job?.bounty.toFixed(2)} Kz</strong></span>
              </div>
            </div>

            {/* Email creation specific warning */}
            {isEmailCreationTask && (
              <Alert className="border-warning/50 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning">⚠️ ATENÇÃO: Monitoramento Administrativo</AlertTitle>
                <AlertDescription className="text-sm">
                  Rejeições injustificadas são monitoradas pelo sistema administrativo. Se você rejeitar uma prova válida, 
                  o administrador pode verificar e liberar o pagamento ao freelancer, e sua conta poderá ser penalizada.
                </AlertDescription>
              </Alert>
            )}

            {application.proofSubmission?.proofs && application.proofSubmission.proofs.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-4">Provas Submetidas</h3>
                <div className="space-y-4">
                  {application.proofSubmission.proofs.map((proof, index) => {
                    const requirement = application.job?.proofRequirements?.find(
                      req => req.id === proof.requirementId
                    );
                    const url = getFileUrl(proof);
                    return (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{getProofTypeLabel(proof.type)}</Badge>
                            {requirement?.isRequired && (
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                          <h4 className="font-medium mt-1">{requirement?.label}</h4>
                          {requirement?.description && (
                            <p className="text-sm text-muted-foreground">{requirement.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-3">
                            {/* Email creation specific display */}
                            {isEmailCreationTask && proof.requirementId === 'email' && (
                              <div className="bg-background border border-border rounded p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">E-mail criado</p>
                                <p className="text-sm break-words font-mono">{proof.content}</p>
                              </div>
                            )}
                            
                            {isEmailCreationTask && proof.requirementId === 'password' && (
                              <div className="bg-background border border-border rounded p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-muted-foreground">Senha da conta</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="h-6"
                                  >
                                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                </div>
                                <p className="text-sm break-words font-mono">
                                  {showPassword ? proof.content : '••••••••'}
                                </p>
                              </div>
                            )}
                            
                            {isEmailCreationTask && proof.requirementId === 'provider' && (
                              <div className="bg-background border border-border rounded p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Provedor</p>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm break-words font-mono">{proof.content}</p>
                                  {getProviderLoginUrl(proof.content) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(getProviderLoginUrl(proof.content), '_blank')}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Testar Login
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Standard text proof (non-email) */}
                            {!isEmailCreationTask && proof.type === 'text' && (
                              <div className="bg-background border border-border rounded p-3">
                                <p className="text-sm break-words">{proof.content}</p>
                              </div>
                            )}

                            {proof.type === 'url' && (
                              <div className="bg-background border border-border rounded p-3 flex items-center justify-between">
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate max-w-[70%]">{formatUrlLabel(url)}</a>
                                <Button variant="ghost" size="sm" onClick={() => url && window.open(url, '_blank')}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Visualizar
                                </Button>
                              </div>
                            )}

                            {(proof.type === 'screenshot' || isImageUrl(url)) && (
                              <div>
                                <AspectRatio ratio={16/9} className="bg-background border border-border rounded overflow-hidden">
                                  {url ? (
                                    <img src={url} alt="Prova" className="h-full w-full object-contain" />
                                  ) : (
                                    <div className="h-full w-full" />
                                  )}
                                </AspectRatio>
                                <div className="flex justify-end mt-2">
                                  <Button variant="ghost" size="sm" onClick={() => url && window.open(url, '_blank')}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Abrir imagem
                                  </Button>
                                </div>
                              </div>
                            )}

                            {proof.type !== 'text' && proof.type !== 'url' && !isImageUrl(url) && (
                              <div className="bg-background border border-border rounded p-3">
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <FileText className="h-4 w-4" />
                                  <span className="truncate max-w-[60%]">{formatUrlLabel(url)}</span>
                                  <Button variant="ghost" size="sm" onClick={() => url && window.open(url, '_blank')}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Visualizar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            {proof.comment && (
                              <div className="bg-muted/30 border border-border rounded p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Comentário</p>
                                <p className="text-sm break-words">{proof.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma prova foi submetida ainda.</p>
              </div>
            )}

            {showRejectionForm && (
              <div className="space-y-4">
                {isEmailCreationTask && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Motivo específico da rejeição</label>
                    <Select value={selectedRejectionReason} onValueChange={setSelectedRejectionReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailRejectionReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isEmailCreationTask && selectedRejectionReason !== 'Outro motivo' 
                      ? 'Detalhes adicionais (opcional)' 
                      : 'Motivo da rejeição'}
                  </label>
                  <Textarea
                    placeholder={isEmailCreationTask 
                      ? "Adicione mais detalhes se necessário..." 
                      : "Explique por que as provas foram rejeitadas..."}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[120px]"
                    required={!isEmailCreationTask || selectedRejectionReason === 'Outro motivo'}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4 flex space-x-3 bg-card sticky bottom-0">
            {!showRejectionForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "Aprovando..." : "Aprovar"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => { setShowRejectionForm(false); setRejectionReason(''); }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  {isLoading ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProofReviewModal;