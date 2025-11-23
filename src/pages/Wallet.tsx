import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet as WalletIcon, 
  ArrowLeft, 
  CreditCard, 
  Building2,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Clock,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DepositModal from '@/components/DepositModal';
import WithdrawalModal from '@/components/WithdrawalModal';

const Wallet = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { minWithdrawal } = useSystemConfig();
  const [depositModal, setDepositModal] = useState<{ open: boolean; method?: 'express' | 'iban' }>({ open: false });
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">{t("login_to_see_wallet")}</p>
        </Card>
      </div>
    );
  }

  const isFreelancer = userData.currentMode === 'tester';
  const currentBalance = isFreelancer
    ? (userData.testerWallet?.availableBalance || 0)
    : (userData.posterWallet?.balance || 0);
  const bonusBalance = userData.posterWallet?.bonusBalance || 0;
  const pendingBalance = userData.testerWallet?.pendingBalance || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <WalletIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Carteira</h1>
              <p className="text-muted-foreground">
                {isFreelancer ? 'Gerencie seus saques' : 'Gerencie seus depósitos'}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Saldo Atual</CardDescription>
                <CardTitle className="text-4xl font-bold text-primary">
                  {currentBalance.toFixed(2)} Kz
                </CardTitle>
              </div>
              <Badge variant={isFreelancer ? "default" : "secondary"} className="text-sm">
                {isFreelancer ? 'Freelancer' : 'Contratante'}
              </Badge>
            </div>
            
            {isFreelancer && pendingBalance > 0 && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Saldo Pendente: <span className="font-semibold text-foreground">{pendingBalance.toFixed(2)} Kz</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando aprovação do contratante
                </p>
              </div>
            )}

            {!isFreelancer && bonusBalance > 0 && (
              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Saldo Bônus: <span className="font-semibold text-foreground">{bonusBalance.toFixed(2)} Kz</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível para uso na plataforma
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isFreelancer ? 'Métodos de Saque' : 'Métodos de Depósito'}
          </h2>

          {isFreelancer ? (
            // Withdrawal Methods for Freelancers
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="group hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Express (Referência)</CardTitle>
                      <CardDescription>Retirada via referência Express</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Tempo de processamento:</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      30 minutos - 2 horas úteis
                    </p>
                  </div>
                  
                  <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-success" />
                        <span className="font-medium text-foreground">Taxa:</span>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        GRÁTIS
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sem taxas de processamento. Você recebe o valor integral.
                    </p>
                  </div>

                  <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Processamento rápido
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Saque mínimo: {minWithdrawal.toFixed(2)} Kz
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Disponível 24/7
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => setWithdrawalModalOpen(true)}
                    disabled={currentBalance < minWithdrawal}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                  {currentBalance < minWithdrawal && (
                    <p className="text-xs text-destructive mt-2 text-center">
                      Saldo mínimo necessário: {minWithdrawal.toFixed(2)} Kz
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Transferência IBAN</CardTitle>
                      <CardDescription>Retirada via transferência bancária</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Tempo de processamento:</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      1-3 dias úteis
                    </p>
                  </div>
                  
                  <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-warning" />
                        <span className="font-medium text-foreground">Taxa:</span>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        2.5%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Taxa de processamento bancário de 2.5% aplicada.
                    </p>
                  </div>

                  <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Seguro e confiável
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Saque mínimo: {minWithdrawal.toFixed(2)} Kz
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Ideal para grandes valores
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => setWithdrawalModalOpen(true)}
                    disabled={currentBalance < minWithdrawal}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                  {currentBalance < minWithdrawal && (
                    <p className="text-xs text-destructive mt-2 text-center">
                      Saldo mínimo necessário: {minWithdrawal.toFixed(2)} Kz
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            // Deposit Methods for Contractors
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="group hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Express (Referência)</CardTitle>
                      <CardDescription>Depósito via referência Express</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Tempo de processamento:</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      Imediato - 30 minutos
                    </p>
                  </div>
                  
                  <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-success" />
                        <span className="font-medium text-foreground">Taxa:</span>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        GRÁTIS
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sem taxas. Valor depositado é creditado integralmente.
                    </p>
                  </div>

                  <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Processamento rápido
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Confirmação automática
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Disponível 24/7
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => setDepositModal({ open: true, method: 'express' })}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fazer Depósito
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Transferência IBAN</CardTitle>
                      <CardDescription>Depósito via transferência bancária</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">Tempo de processamento:</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      1-3 dias úteis
                    </p>
                  </div>
                  
                  <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-success" />
                        <span className="font-medium text-foreground">Taxa:</span>
                      </div>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        GRÁTIS
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Sem taxas. Valor depositado é creditado integralmente.
                    </p>
                  </div>

                  <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Seguro e confiável
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Ideal para grandes valores
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Rastreamento completo
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => setDepositModal({ open: true, method: 'iban' })}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fazer Depósito
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <Card className="mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {isFreelancer ? (
              <>
                <p>• O saldo mínimo para saque é de {minWithdrawal.toFixed(2)} Kz</p>
                <p>• Os saques são processados em até 24-48 horas úteis</p>
                <p>• Certifique-se de que seus dados bancários estão corretos antes de solicitar</p>
                <p>• Você pode acompanhar o status dos seus saques na página de transações</p>
              </>
            ) : (
              <>
                <p>• Os depósitos são creditados automaticamente após confirmação</p>
                <p>• Transferências IBAN podem levar de 1 a 3 dias úteis</p>
                <p>• Certifique-se de usar a referência correta ao fazer o depósito</p>
                <p>• O saldo bônus pode ser usado apenas dentro da plataforma</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/transactions')}
            className="flex-1"
          >
            Ver Histórico de Transações
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        open={depositModal.open}
        onOpenChange={(open) => setDepositModal({ open })}
        method={depositModal.method}
      />
      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
      />
    </div>
  );
};

export default Wallet;
