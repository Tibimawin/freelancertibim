import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Eye, FileText } from "lucide-react";
import { Application, Job, ProofSubmission } from "@/types/firebase";
import { ApplicationService } from "@/services/applicationService";
import { useToast } from "@/hooks/use-toast";

interface ProofReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application & { job?: Job };
  onReviewed: () => void;
}

const ProofReviewModal = ({ isOpen, onClose, application, onReviewed }: ProofReviewModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await ApplicationService.reviewApplication(
        application.id,
        'approved',
        'current-user-id' // TODO: Get from auth context
      );
      
      toast({
        title: "Tarefa aprovada!",
        description: "O pagamento foi processado e o testador foi notificado.",
      });
      
      onReviewed();
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await ApplicationService.reviewApplication(
        application.id,
        'rejected',
        'current-user-id', // TODO: Get from auth context
        rejectionReason
      );
      
      toast({
        title: "Tarefa rejeitada",
        description: "O testador foi notificado sobre a rejeição.",
      });
      
      onReviewed();
      onClose();
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch (error) {
      toast({
        title: "Erro ao rejeitar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar Provas - {application.job?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Informações da Tarefa</h3>
            <p className="text-sm text-muted-foreground mb-2">{application.job?.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span>Testador: <strong>{application.testerName}</strong></span>
              <span>Valor: <strong>{application.job?.bounty.toFixed(2)} KZ</strong></span>
            </div>
          </div>

          {/* Proofs */}
          {application.proofSubmission?.proofs && application.proofSubmission.proofs.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-4">Provas Submetidas</h3>
              <div className="space-y-4">
                {application.proofSubmission.proofs.map((proof, index) => {
                  // Find the requirement for this proof
                  const requirement = application.job?.proofRequirements?.find(
                    req => req.id === proof.requirementId
                  );
                  
                  return (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
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
                      </div>

                      <div className="space-y-3">
                        {proof.type === 'text' || proof.type === 'url' ? (
                          <div className="bg-background border border-border rounded p-3">
                            <p className="text-sm">{proof.content}</p>
                          </div>
                        ) : (
                          <div className="bg-background border border-border rounded p-3">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>Arquivo: {proof.content}</span>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Visualizar
                              </Button>
                            </div>
                          </div>
                        )}

                        {proof.comment && (
                          <div className="bg-muted/30 border border-border rounded p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Comentário:</p>
                            <p className="text-sm">{proof.comment}</p>
                          </div>
                        )}
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

          <Separator />

          {/* Action Buttons */}
          {!showRejectionForm ? (
            <div className="flex space-x-3">
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
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Motivo da rejeição
                </label>
                <Textarea
                  placeholder="Explique por que as provas foram rejeitadas..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason('');
                  }}
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
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProofReviewModal;