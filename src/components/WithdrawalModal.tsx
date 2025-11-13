import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalService } from "@/services/withdrawalService";
import { CreditCard, Building } from "lucide-react";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawalModal = ({ isOpen, onClose }: WithdrawalModalProps) => {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'express' | 'iban'>('express');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');

  const availableBalance = userData?.testerWallet?.availableBalance || 0;
  const minWithdrawal = 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) return;
    
    const withdrawalAmount = parseFloat(amount);
    
    if (withdrawalAmount < minWithdrawal) {
      toast({
        title: "Valor mínimo não atingido",
  description: `O valor mínimo para saque é ${minWithdrawal} Kz`,
        variant: "destructive",
      });
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo disponível suficiente",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const accountInfo = method === 'express' 
        ? { phoneNumber }
        : { iban, accountHolder };

      await WithdrawalService.createWithdrawalRequest({
        userId: currentUser.uid,
        userName: userData.name,
        userEmail: userData.email,
        amount: withdrawalAmount,
        method,
        accountInfo,
      });

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de saque foi enviada para análise.",
      });

      onClose();
      // Reset form
      setAmount('');
      setPhoneNumber('');
      setAccountHolder('');
      setIban('');
    } catch (error) {
      toast({
        title: "Erro ao solicitar saque",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Saldo Disponível</span>
        <span className="font-bold text-lg">{availableBalance.toFixed(2)} Kz</span>
            </div>
            <div className="text-xs text-muted-foreground">
        Valor mínimo para saque: {minWithdrawal} Kz
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Valor do Saque</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minWithdrawal}
                max={availableBalance}
                step="0.01"
                required
              />
            </div>

            <div>
              <Label>Método de Pagamento</Label>
              <Select value={method} onValueChange={(value: 'express' | 'iban') => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="express">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Transferência Express</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="iban">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Transferência IBAN</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {method === 'express' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phoneNumber">Número de Telefone (Multicaixa Express)</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Ex: 9XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    placeholder="AO06 0040 0000 0000 0000 0000 0"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="accountHolder">Titular da Conta</Label>
                  <Input
                    id="accountHolder"
                    placeholder="Nome completo do titular"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || parseFloat(amount) < minWithdrawal || parseFloat(amount) > availableBalance}
                className="flex-1"
              >
                {isLoading ? "Processando..." : "Solicitar Saque"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;