import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Plus, ArrowUpRight, Loader2, Banknote, CreditCard, DollarSign, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useFirebase";
import { Transaction } from "@/types/firebase";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DepositModal from "./DepositModal";
import WithdrawalModal from "./WithdrawalModal";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const WalletCard = () => {
  const { userData } = useAuth();
  const { transactions, loading, refetch } = useTransactions();
  const [depositModal, setDepositModal] = useState<{ open: boolean; method?: 'express' | 'iban' }>({ open: false });
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  if (!userData) {
    return (
      <Card className="p-6 bg-gradient-secondary border-border/50">
        <div className="text-center">
          <p className="text-muted-foreground">{t("login_to_see_wallet")}</p>
        </div>
      </Card>
    );
  }

  const currentWallet = userData.currentMode === 'tester' 
    ? userData.testerWallet 
    : userData.posterWallet;
  const currentBalance = userData.currentMode === 'tester'
    ? (userData.testerWallet?.availableBalance || 0)
    : (userData.posterWallet?.balance || 0);
  const bonusBalance = userData.posterWallet?.bonusBalance || 0;
    
  const isVerified = userData.verificationStatus === 'approved';
  const minWithdrawal = 2000;

  const formatDate = (date: any) => {
    if (date?.toDate) {
      return date.toDate().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingEarnings = transactions
    .filter(t => t.type === 'escrow' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const isTester = userData.currentMode === 'tester';

  const getTransactionIcon = (t: Transaction) => {
    switch (t.type) {
      case "deposit":
      case "admin_deposit":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "payout":
        // Saque (payout com withdrawalRequestId) é saída; pagamento de tarefa é entrada
        if ((t.metadata as any)?.withdrawalRequestId) {
          return <TrendingDown className="h-4 w-4 text-destructive" />;
        }
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "escrow":
        return <ArrowUpRight className="h-4 w-4 text-warning" />;
      case "fee":
        return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Filtrar transações exibidas conforme o papel atual
  const displayTransactions = transactions.filter((t) => {
    if (isTester) {
      // Freelancer: ganhos e pendências de tarefas, bonificações de indicação e reembolsos
      return (
        t.type === 'payout' ||
        t.type === 'escrow' ||
        t.type === 'referral_reward' ||
        t.type === 'refund'
      );
    }
    // Contratante: depósitos, reservas (escrow), taxas e reembolsos
    return (
      t.type === 'deposit' ||
      t.type === 'admin_deposit' ||
      t.type === 'escrow' ||
      t.type === 'fee' ||
      t.type === 'refund'
    );
  });

  const getDisplayStatusBadge = (tx: Transaction) => {
    // Regra: para contratante, transações de escrow do Mercado são consideradas concluídas
    // mesmo que o pedido do Mercado esteja pendente de entrega.
    const isPosterEscrow = userData.currentMode === 'poster' && tx.type === 'escrow';
    const shouldShowCompleted = isPosterEscrow;

    const statusToShow = shouldShowCompleted ? 'completed' : tx.status;
    switch (statusToShow) {
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">{t("completed")}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{t("pending")}</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{t("failed")}</Badge>;
      default:
        return <Badge variant="secondary">{statusToShow}</Badge>;
    }
  };

  const handleWithdrawalClick = () => {
    if (!isVerified) {
      toast({
        title: t("verification_required"),
        description: t("verification_required_withdrawal_description"),
        variant: "destructive",
      });
      return;
    }
    
    if (currentBalance < minWithdrawal) {
      toast({
        title: t("minimum_withdrawal_not_reached"),
        description: t("minimum_withdrawal_is", { amount: minWithdrawal }),
        variant: "destructive",
      });
      return;
    }
    
    // Se verificado e com saldo suficiente, abrir modal de saque
    setWithdrawalModalOpen(true);
  };

  return (
    <>
    <Card className="p-6 bg-card border-border shadow-md">
      {/* Balance Section */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h2 className="text-lg font-semibold text-card-foreground">{t("wallet")}</h2>
          <Badge variant={userData.currentMode === 'tester' ? 'default' : 'secondary'} className="bg-electric-purple/20 text-electric-purple border-electric-purple/30">
            {userData.currentMode === 'tester' ? t("freelancer") : t("contractor")}
          </Badge>
        </div>
        <div className="balance-display text-4xl font-bold mb-2">
        {currentBalance.toFixed(2)} Kz
        </div>
        <p className="text-sm text-muted-foreground">
          {userData.currentMode === 'tester' ? t("available_balance") : t("current_balance")}
        </p>

        {userData.currentMode === 'poster' && bonusBalance > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary font-medium">
        + {bonusBalance.toFixed(2)} Kz {t("bonus_balance", { defaultValue: "Bônus disponível" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("bonus_usage_hint", { defaultValue: "Usável para criar anúncios e comprar no Mercado." })}
            </p>
            {!isVerified && (
              <p className="text-xs mt-1 text-warning">
                {t("kyc_required_for_bonus", { defaultValue: "Requer verificação de identidade (KYC) para usar o bônus." })}
              </p>
            )}
          </div>
        )}
        
        {userData.currentMode === 'tester' && userData.testerWallet?.pendingBalance && userData.testerWallet.pendingBalance > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-sm text-warning">
        + {userData.testerWallet.pendingBalance.toFixed(2)} Kz {t("pending")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("awaiting_task_approval")}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        {userData.currentMode === 'tester' ? (
          <Button 
            variant="outline" 
            className={`w-full ${isVerified && currentBalance >= minWithdrawal ? 'border-primary/50 text-primary hover:bg-primary/10' : 'border-destructive/50 text-destructive opacity-70 cursor-not-allowed'}`}
            disabled={!isVerified || currentBalance < minWithdrawal}
            onClick={handleWithdrawalClick}
          >
            {!isVerified ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {t("verification_required_short")}
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 mr-2" />
                {currentBalance < minWithdrawal ? t("minimum_withdrawal_not_reached") : t("withdraw")}
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button 
              variant="hero" 
              className="w-full glow-effect"
              onClick={() => setDepositModal({ open: true, method: 'express' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("deposit_express")}
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => setDepositModal({ open: true, method: 'iban' })}
            >
              <Banknote className="h-4 w-4 mr-2" />
              {t("deposit_iban")}
            </Button>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-card-foreground mb-3">{t("recent_transactions")}</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
            {displayTransactions.length > 0 ? (
              displayTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction)}
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  {(() => {
                    let positive = false;
                    if (isTester) {
                      // Saque (payout com withdrawalRequestId) é saída; pagamento de tarefa é entrada
                      if (transaction.type === 'payout') {
                        positive = !(transaction.metadata as any)?.withdrawalRequestId;
                      } else if (transaction.type === 'escrow') {
                        positive = true; // pendente como entrada prevista
                      } else if (transaction.type === 'referral_reward' || transaction.type === 'refund') {
                        positive = true;
                      } else {
                        positive = false;
                      }
                    } else {
                      // Contratante: depósitos entram; escrow e taxas saem; reembolso entra
                      if (transaction.type === 'deposit' || transaction.type === 'admin_deposit' || transaction.type === 'refund') {
                        positive = true;
                      } else {
                        positive = false;
                      }
                    }
                    const color = positive ? 'text-success' : (transaction.type === 'fee' ? 'text-muted-foreground' : 'text-destructive');
                    const sign = positive ? '+' : '-';
                    return (
                      <p className={`text-sm font-semibold ${color}`}>
                        {sign}
        {transaction.amount.toFixed(2)} Kz
                      </p>
                    );
                  })()}
                  {getDisplayStatusBadge(transaction)}
                </div>
              </div>
              )) 
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">{t("no_transactions")}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {t("complete_first_task")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <Button variant="ghost" className="w-full text-sm text-primary hover:bg-primary/10" onClick={() => navigate('/transactions')}>
          {t("view_all_transactions")}
        </Button>
      </div>
      
      <DepositModal 
        open={depositModal.open}
        onOpenChange={(open) => setDepositModal({ open, method: depositModal.method })}
        method={depositModal.method || 'express'}
      />
    </Card>
      {/* Modals */}
      <WithdrawalModal isOpen={withdrawalModalOpen} onClose={() => setWithdrawalModalOpen(false)} />
    </>
  );
};

export default WalletCard;