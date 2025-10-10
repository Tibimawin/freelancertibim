import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase } from "lucide-react";

const ModeToggle = () => {
  const { userData, switchUserMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!userData) return null;

  const currentMode = userData.currentMode;

  const handleModeSwitch = async (checked: boolean) => {
    const newMode = checked ? 'poster' : 'tester';
    
    setIsLoading(true);
    try {
      await switchUserMode(newMode);
      
      toast({
        title: "Modo alterado com sucesso!",
        description: `Você agora está no modo ${newMode === 'tester' ? 'Freelancer' : 'Contratante'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar modo",
        description: error.message || "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 border rounded-lg">
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-primary" />
        <Label htmlFor="mode-toggle" className="text-sm">
          Freelancer
        </Label>
      </div>
      
      <Switch
        id="mode-toggle"
        checked={currentMode === 'poster'}
        onCheckedChange={handleModeSwitch}
        disabled={isLoading}
      />
      
      <div className="flex items-center space-x-2">
        <Label htmlFor="mode-toggle" className="text-sm">
          Contratante
        </Label>
        <Briefcase className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
};

export default ModeToggle;