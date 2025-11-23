import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DepositNegotiationService } from '@/services/depositNegotiationService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DepositNegotiationButtonProps {
  onNegotiationStarted?: () => void;
}

export const DepositNegotiationButton = ({ onNegotiationStarted }: DepositNegotiationButtonProps) => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');

  const handleStartNegotiation = async () => {
    if (!currentUser || !userData) {
      toast.error('Você precisa estar logado');
      return;
    }

    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor válido maior que zero');
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe negociação ativa
      const activeNegotiation = await DepositNegotiationService.getActiveNegotiationForUser(currentUser.uid);
      
      if (activeNegotiation) {
        toast.info('Você já tem uma negociação ativa.');
        navigate(`/deposit-negotiation?id=${activeNegotiation.id}`);
        setDialogOpen(false);
        return;
      }

      const negotiationId = await DepositNegotiationService.createNegotiation(
        currentUser.uid,
        userData.name,
        amount,
        userData.email
      );

      toast.success('Negociação iniciada! Redirecionando para o chat...');
      setDialogOpen(false);
      setDepositAmount('');
      navigate(`/deposit-negotiation?id=${negotiationId}`);
    } catch (error) {
      console.error('Error starting negotiation:', error);
      toast.error('Erro ao iniciar negociação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Iniciar Negociação de Depósito
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Negociação de Depósito</DialogTitle>
            <DialogDescription>
              Informe o valor que deseja depositar para iniciar a negociação com nossa equipe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Valor do Depósito (Kz)</Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="text-lg font-semibold"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Insira o valor que você deseja depositar em sua carteira.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDialogOpen(false);
                setDepositAmount('');
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleStartNegotiation}
              disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Iniciar Negociação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
