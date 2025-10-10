import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '@/services/applicationService';
import { Play, Loader2 } from 'lucide-react';

interface JobApplyButtonProps {
  jobId: string;
  posterId: string;
}

const JobApplyButton = ({ jobId, posterId }: JobApplyButtonProps) => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);

  const canApply = currentUser && 
    userData?.currentMode === 'tester' && 
    posterId !== currentUser.uid;

  const handleApply = async () => {
    if (!currentUser || !userData || !canApply) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado como testador para aplicar",
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
          title: "Já aplicado",
          description: "Você já se candidatou a esta tarefa",
          variant: "destructive",
        });
        return;
      }

      // Navigate to job details to complete application
      navigate(`/job/${jobId}`);
      
    } catch (error) {
      console.error('Error checking application:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar candidatura",
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
          Verificando...
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Fazer Tarefa
        </>
      )}
    </Button>
  );
};

export default JobApplyButton;