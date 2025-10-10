import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Plus, ArrowUpRight, Loader2, Banknote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useFirebase";
import { Transaction } from "@/types/firebase";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DepositModal from "./DepositModal";

const WalletCard = () => {
  const { userData } = useAuth();
  const { transactions, loading, refetch } = useTransactions();
  const [depositModal, setDepositModal] = useState<{ open: boolean; method?: 'express' | 'iban' }>({ open: false });
  const { toast } = useToast();

  if (!userData) {
    return (
      <Card className="p-6 bg-gradient-secondary border-border/50">
        <div className="text-center">
          <p className="text-muted-foreground">Faça login para ver sua carteira</p>
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "payout":
        return <TrendingDown className="h-4 w-4 text-primary" />;
      case "escrow":
        return <ArrowUpRight className="h-4 w-4 text-warning" />;
      case "fee":
        return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Concluído</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pendente</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="p-6 bg-gradient-secondary border-border/50">
      {/* Balance Section */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h2 className="text-lg font-semibold text-card-foreground">Carteira</h2>
          <Badge variant={userData.currentMode === 'tester' ? 'default' : 'secondary'}>
            {userData.currentMode === 'tester' ? 'Testador' : 'Contratante'}
          </Badge>
        </div>
        <div className="balance-display text-4xl font-bold mb-2">
          {currentBalance.toFixed(2)} KZ
        </div>
        <p className="text-sm text-muted-foreground">
          {userData.currentMode === 'tester' ? 'Saldo disponível' : 'Saldo atual'}
        </p>
        
        {userData.currentMode === 'tester' && userData.testerWallet?.pendingBalance && userData.testerWallet.pendingBalance > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-sm text-warning">
              + {userData.testerWallet.pendingBalance.toFixed(2)} KZ pendente
            </p>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação das tarefas
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        {userData.currentMode === 'tester' ? (
          <Button 
            variant="outline" 
            className="w-full"
            disabled={currentBalance < 2000}
            onClick={() => {
              if (currentBalance < 2000) {
                toast({
                  title: "Limite de saque insuficiente",
                  description: "Você precisa ter pelo menos 2000 KZ para solicitar um saque.",
                  variant: "destructive",
                });
              } else {
                // Open withdrawal modal - this will be handled by the header button
              }
            }}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            {currentBalance < 2000 ? "Limite de saque insuficiente" : "Sacar"}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button 
              variant="success" 
              className="w-full"
              onClick={() => setDepositModal({ open: true, method: 'express' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Depositar Via Express
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setDepositModal({ open: true, method: 'iban' })}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Depositar Via IBAM
            </Button>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Transações Recentes</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <p className={`text-sm font-semibold ${
                    transaction.type === "deposit" || transaction.type === "payout" 
                      ? "text-success" 
                      : "text-muted-foreground"
                  }`}>
                    {transaction.type === "deposit" || transaction.type === "payout" ? "+" : "-"}
                    {transaction.amount.toFixed(2)} KZ
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
              )) 
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">Nenhuma transação ainda</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Complete seu primeiro teste para ver suas transações aqui
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {transactions.length > 3 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="ghost" className="w-full text-sm">
            Ver Todas as Transações
          </Button>
        </div>
      )}
      
      <DepositModal 
        open={depositModal.open}
        onOpenChange={(open) => setDepositModal({ open, method: depositModal.method })}
        method={depositModal.method || 'express'}
      />
    </Card>
  );
};

export default WalletCard;