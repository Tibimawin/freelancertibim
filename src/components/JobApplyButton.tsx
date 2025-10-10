import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '@/services/applicationService';
import { Play, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface JobApplyButtonProps {
  jobId: string;
  posterId: string;
}

const JobApplyButton = ({ jobId, posterId }: JobApplyButtonProps) => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const { t } = useTranslation();

  const canApply = currentUser && 
    userData?.currentMode === 'tester' && 
    posterId !== currentUser.uid;

  const handleApply = async () => {
    if (!currentUser || !userData || !canApply) {
      toast({
        title: t("error"),
        description: t("unauthenticated_apply"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsApplying(true);
      
      // Check if user already applied
      const hasApplied = await ApplicationService.hasUserApplied(jobId, currentUser.uid);
      
      if (hasApplied) {
        toast({
          title: t("already_applied"),
          description: t("already_applied_description"),
          variant: "destructive",
        });
        return;
      }

      // Navigate to job details to complete application
      navigate(`/job/${jobId}`);
      
    } catch (error) {
      console.error('Error checking application:', error);
      toast({
        title: t("error"),
        description: t("error_checking_application"),
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  if (!canApply) {
    return null;
  }

  return (
    <Button 
      onClick={handleApply}
      disabled={isApplying}
      variant="outline"
      size="sm"
      className="w-full"
    >
      {isApplying ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t("checking")}
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          {t("do_task")}
        </>
      )}
    </Button>
  );
};

export default JobApplyButton;