import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Building, Save, Loader2 } from 'lucide-react';
import { BankingService, BankingInfo } from '@/services/bankingService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminBanking = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankingInfo, setBankingInfo] = useState<BankingInfo>({
    expressTransfer: {
      phoneNumber: '',
      additionalInfo: '',
    },
    ibanTransfer: {
      iban: '',
      bankName: '',
      accountName: '',
      additionalInfo: '',
    },
    updatedAt: new Date(),
    updatedBy: '',
  });

  useEffect(() => {
    loadBankingInfo();
  }, []);

  const loadBankingInfo = async () => {
    try {
      setLoading(true);
      const info = await BankingService.getBankingInfo();
      if (info) {
        setBankingInfo(info);
      }
    } catch (error) {
      console.error('Error loading banking info:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações bancárias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await BankingService.updateBankingInfo(bankingInfo, currentUser.uid);
      
      toast({
        title: "Sucesso",
        description: "Informações bancárias atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Error saving banking info:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar informações bancárias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpressField = (field: string, value: string) => {
    setBankingInfo(prev => ({
      ...prev,
      expressTransfer: {
        ...prev.expressTransfer,
        [field]: value,
      },
    }));
  };

  const updateIbanField = (field: string, value: string) => {
    setBankingInfo(prev => ({
      ...prev,
      ibanTransfer: {
        ...prev.ibanTransfer,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Configurações Bancárias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Express Transfer */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Transferência Express</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="express-phone">Número de Telefone (Multicaixa Express)</Label>
                <Input
                  id="express-phone"
                  placeholder="Ex: 926 234 567"
                  value={bankingInfo.expressTransfer.phoneNumber}
                  onChange={(e) => updateExpressField('phoneNumber', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="express-additional">Informações Adicionais</Label>
              <Textarea
                id="express-additional"
                placeholder="Instruções especiais ou informações adicionais"
                value={bankingInfo.expressTransfer.additionalInfo}
                onChange={(e) => updateExpressField('additionalInfo', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* IBAN Transfer */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Transferência IBAN</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="iban-code">Código IBAN</Label>
                <Input
                  id="iban-code"
                  placeholder="AO06 0040 0000 4562 3745 1018 5"
                  value={bankingInfo.ibanTransfer.iban}
                  onChange={(e) => updateIbanField('iban', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="iban-bank-name">Nome do Banco</Label>
                <Input
                  id="iban-bank-name"
                  placeholder="Nome do banco"
                  value={bankingInfo.ibanTransfer.bankName}
                  onChange={(e) => updateIbanField('bankName', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="iban-account-name">Nome da Conta</Label>
                <Input
                  id="iban-account-name"
                  placeholder="Titular/Nome da conta"
                  value={bankingInfo.ibanTransfer.accountName}
                  onChange={(e) => updateIbanField('accountName', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="iban-additional">Informações Adicionais</Label>
              <Textarea
                id="iban-additional"
                placeholder="Instruções especiais ou informações adicionais"
                value={bankingInfo.ibanTransfer.additionalInfo}
                onChange={(e) => updateIbanField('additionalInfo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBanking;