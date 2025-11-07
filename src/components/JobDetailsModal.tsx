import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, User, Calendar } from "lucide-react";
import { Job } from "@/types/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';

interface JobDetailsModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobDetailsModal = ({ job, open, onOpenChange }: JobDetailsModalProps) => {
  const [isApplying, setIsApplying] = useState(false);
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  if (!job) return null;

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

  const handleApply = async () => {
    if (!currentUser || !userData) {
      toast({
        title: t("error"),
        description: t("unauthenticated apply"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsApplying(true);
      await JobService.applyToJob(job.id, currentUser.uid, userData.name);
      
      toast({
        title: t("proofs submitted success"),
        description: t("proofs submitted description"),
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: t("error"),
        description: t("error submitting proofs"),
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getPlatformIcon()}
              <Badge variant="outline" className={getDifficultyColor()}>
                {t(job.difficulty.toLowerCase())}
              </Badge>
              <Badge variant="secondary">{job.platform}</Badge>
              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                {job.status === 'active' ? t('active') : t('inactive')}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{job.bounty.toFixed(2)} KZ</p>
              <p className="text-sm text-muted-foreground">{t("applicants count", { count: job.applicantCount })}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">{t("detailed description")}</h3>
            <p className="text-muted-foreground leading-relaxed">{job.description}</p>
          </div>

          {/* Detailed Instructions */}
          {job.detailedInstructions && job.detailedInstructions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">{t("detailed instructions label")}</h3>
              <div className="space-y-3">
                {job.detailedInstructions.map((instruction, index) => (
                  <div key={instruction.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                    <span className="font-semibold text-primary text-sm mt-0.5 min-w-[24px]">
                      {instruction.step}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{instruction.instruction}</p>
                      {instruction.isRequired && (
                        <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {t("required")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof Requirements */}
          {job.proofRequirements && job.proofRequirements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">{t("proof requirements")}</h3>
              <div className="space-y-3">
                {job.proofRequirements.map((proof, index) => (
                  <div key={proof.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                    <span className="font-semibold text-primary text-sm mt-0.5 min-w-[24px]">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{proof.label}</p>
                        {proof.isRequired && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                            {t("required")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{proof.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {t("type")}: {proof.type === 'text' ? t('text response') : 
                               proof.type === 'screenshot' ? t('screenshot') :
                               proof.type === 'file' ? t('file') : t('link url')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Info */}
          <div className="grid grid-cols-2 gap-4">
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
                  {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {job.dueDate && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("due date")}:</span>
                  <span className="font-medium">
                    {new Date(job.dueDate).toLocaleDateString('pt-BR')}
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

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
            
            {canApply ? (
              <Button 
                onClick={handleApply} 
                disabled={isApplying}
                className="min-w-[120px]"
              >
                {isApplying ? t("applying") : t("apply now")}
              </Button>
            ) : (
              <Button disabled variant="outline">
                {currentUser && job.posterId === currentUser.uid 
                  ? t("your own job short") 
                  : job.status !== 'active' 
                    ? t("job inactive short") 
                    : t("not available")
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;