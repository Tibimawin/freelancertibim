import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, Phone, MapPin, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: 'express' | 'iban';
}

const DepositModal = ({ open, onOpenChange, method }: DepositModalProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast({
        title: "Copiado!",
        description: `${field} copiado para a área de transferência`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  const expressData = {
    phone: "926 234 567",
    name: "TaskBoost Angola",
    reference: "DEPOSIT-TB-001"
  };

  const ibanData = {
    iban: "AO06 0040 0000 4562 3745 1018 5",
    bank: "Banco BIC Angola",
    accountName: "TaskBoost Angola Lda",
    swift: "BCGAAOAO",
    reference: "DEPOSIT-TB-002"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {method === 'express' ? 'Transferência Express' : 'Transferência IBAN'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {method === 'express' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5" />
                  Dados para Transferência Express
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Número de Telefone</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {expressData.phone}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.phone, "Número")}
                    >
                      {copied === "Número" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome do Beneficiário</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center">
                      {expressData.name}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.name, "Nome")}
                    >
                      {copied === "Nome" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Referência</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {expressData.reference}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.reference, "Referência")}
                    >
                      {copied === "Referência" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-5 w-5" />
                  Dados para Transferência IBAN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">IBAN</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono text-sm">
                      {ibanData.iban}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.iban, "IBAN")}
                    >
                      {copied === "IBAN" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Banco</label>
                  <div className="p-2 bg-muted rounded text-center">
                    {ibanData.bank}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome da Conta</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center">
                      {ibanData.accountName}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.accountName, "Nome da Conta")}
                    >
                      {copied === "Nome da Conta" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Código SWIFT</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {ibanData.swift}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.swift, "SWIFT")}
                    >
                      {copied === "SWIFT" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Referência</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {ibanData.reference}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.reference, "Referência")}
                    >
                      {copied === "Referência" ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Importante</Badge>
                  <span className="text-muted-foreground">
                    Use a referência para identificar seu depósito
                  </span>
                </div>
                <p className="text-muted-foreground">
                  • O saldo será creditado em até 24h após confirmação
                </p>
                <p className="text-muted-foreground">
                  • Guarde o comprovante da transferência
                </p>
                <p className="text-muted-foreground">
                  • Entre em contato conosco se houver problemas
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;