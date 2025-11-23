import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Building2, Smartphone, Info, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { BankingService, BankingInfo } from '@/services/bankingService';
import SupportChat from './SupportChat';
import { DepositNegotiationButton } from './DepositNegotiationButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: 'express' | 'iban';
}

const DepositModal = ({ open, onOpenChange, method }: DepositModalProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [bankingInfo, setBankingInfo] = useState<BankingInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast.success(`${field} copiado!`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const info = await BankingService.getBankingInfo();
        setBankingInfo(info);
      } catch (err) {
        console.error('Error loading banking info', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const expressData = {
    phone: bankingInfo?.expressTransfer?.phoneNumber || "926 234 567"
  };

  const ibanData = {
    iban: bankingInfo?.ibanTransfer?.iban || "AO06 0040 0000 4562 3745 1018 5",
    bank: bankingInfo?.ibanTransfer?.bankName || "Banco BIC Angola",
    accountName: bankingInfo?.ibanTransfer?.accountName || "TaskBoost Angola Lda"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Fazer Depósito
          </DialogTitle>
          <DialogDescription>
            Escolha entre negociar seu depósito diretamente com nossa equipe ou usar os métodos bancários tradicionais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Negotiation Option - Highlighted */}
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Negociação Direta</CardTitle>
                  <CardDescription>Recomendado - Flexível e personalizado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Negocie o melhor método de pagamento para você</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Atendimento personalizado via chat</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Maior flexibilidade de valores e métodos</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Suporte em tempo real durante todo o processo</span>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Como funciona?</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Clique em "Iniciar Negociação"</li>
                  <li>Converse com nossa equipe sobre o valor e método</li>
                  <li>Receba as instruções personalizadas de pagamento</li>
                  <li>Envie o comprovante pelo chat</li>
                  <li>Seu saldo é creditado após aprovação</li>
                </ol>
              </div>

              <DepositNegotiationButton onNegotiationStarted={() => onOpenChange(false)} />
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou use os métodos tradicionais</span>
            </div>
          </div>

          {/* Traditional Banking Methods */}
          {method === 'express' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Express (Referência)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Número de Telefone</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded text-center font-mono text-lg">
                      {expressData.phone}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.phone, 'Número')}
                    >
                      {copied === 'Número' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">Instruções Importantes:</span>
                  </div>
                  <ul className="ml-6 space-y-1 text-muted-foreground">
                    <li>• Use este número para fazer a transferência Express</li>
                    <li>• O saldo será creditado em até 24 horas após confirmação</li>
                    <li>• Guarde o comprovante de transferência</li>
                    <li>• Caso tenha problemas, entre em contato via suporte</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Transferência IBAN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">IBAN</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded text-center font-mono">
                      {ibanData.iban}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.iban, 'IBAN')}
                    >
                      {copied === 'IBAN' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Banco</label>
                  <div className="p-3 bg-muted rounded text-center">
                    {ibanData.bank}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome da Conta</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-muted rounded text-center">
                      {ibanData.accountName}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.accountName, 'Titular')}
                    >
                      {copied === 'Titular' ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">Instruções Importantes:</span>
                  </div>
                  <ul className="ml-6 space-y-1 text-muted-foreground">
                    <li>• Use a referência para identificar seu depósito</li>
                    <li>• O saldo será creditado em 1-3 dias úteis após confirmação</li>
                    <li>• Guarde o comprovante de transferência</li>
                    <li>• Caso tenha problemas, entre em contato via suporte</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
