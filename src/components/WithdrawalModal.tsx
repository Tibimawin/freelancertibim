import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalService } from "@/services/withdrawalService";
import { CreditCard, Building, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawalModal = ({ isOpen, onClose }: WithdrawalModalProps) => {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const { minWithdrawal, maxWithdrawal, withdrawalFees } = useSystemConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'express' | 'iban'>('express');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');

  const availableBalance = userData?.testerWallet?.availableBalance || 0;
  
  const withdrawalAmount = parseFloat(amount) || 0;
  const fee = method === 'iban' ? withdrawalAmount * (withdrawalFees.iban / 100) : withdrawalAmount * (withdrawalFees.express / 100);
  const netAmount = withdrawalAmount - fee;
  const remainingBalance = availableBalance - withdrawalAmount;
  const isLowBalance = remainingBalance > 0 && remainingBalance < minWithdrawal;

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
        description: "Você não possui saldo disponível suficiente para este saque",
        variant: "destructive",
      });
      return;
    }

    // Validação adicional: alertar usuário sobre o valor líquido
    if (method === 'iban' && fee > 0) {
      const confirmation = window.confirm(
        `Você solicitou um saque de ${withdrawalAmount.toFixed(2)} Kz.\n\n` +
        `Taxa de processamento (2.5%): ${fee.toFixed(2)} Kz\n` +
        `Valor líquido a receber: ${netAmount.toFixed(2)} Kz\n\n` +
        `Deseja confirmar esta solicitação?`
      );
      
      if (!confirmation) {
        return;
      }
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
        fee: fee,
        netAmount: netAmount,
      });

      toast({
        title: "Solicitação enviada!",
        description: method === 'iban' 
          ? `Sua solicitação de saque foi enviada. Você receberá ${netAmount.toFixed(2)} Kz após as taxas.`
          : "Sua solicitação de saque foi enviada para análise.",
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
              {withdrawalAmount > availableBalance && (
                <p className="text-xs text-destructive mt-1">
                  Saldo insuficiente. Disponível: {availableBalance.toFixed(2)} Kz
                </p>
              )}
              {withdrawalAmount > 0 && withdrawalAmount < minWithdrawal && (
                <p className="text-xs text-destructive mt-1">
                  Valor mínimo para saque: {minWithdrawal.toFixed(2)} Kz
                </p>
              )}
            </div>

            {withdrawalAmount >= minWithdrawal && withdrawalAmount <= availableBalance && (
              <>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor solicitado:</span>
                    <span className="font-medium">{withdrawalAmount.toFixed(2)} Kz</span>
                  </div>
                  
                  {method === 'iban' && fee > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa (2.5%):</span>
                        <span className="font-medium text-warning">-{fee.toFixed(2)} Kz</span>
                      </div>
                      <div className="h-px bg-border" />
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valor a receber:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-primary">{netAmount.toFixed(2)} Kz</span>
                      {method === 'express' && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                          SEM TAXAS
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isLowBalance && (
                  <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-warning">Saldo baixo após saque</p>
                        <p className="text-xs text-muted-foreground">
                          Após este saque, seu saldo restante será de {remainingBalance.toFixed(2)} Kz, 
                          insuficiente para novos saques (mínimo: {minWithdrawal} Kz).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <Label>Método de Pagamento</Label>
              <Select value={method} onValueChange={(value: 'express' | 'iban') => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="express">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Transferência Express</span>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 ml-2">
                        GRÁTIS
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="iban">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Transferência IBAN</span>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 ml-2">
                        2.5%
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {method === 'iban' && (
                <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Uma taxa de 2.5% será deduzida do valor solicitado para cobrir custos de processamento bancário.
                    </p>
                  </div>
                </div>
              )}
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
                disabled={
                  isLoading || 
                  !amount || 
                  parseFloat(amount) < minWithdrawal || 
                  parseFloat(amount) > availableBalance ||
                  (method === 'express' && !phoneNumber) ||
                  (method === 'iban' && (!iban || !accountHolder))
                }
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