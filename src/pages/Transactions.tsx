import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@/types/firebase";
import { TransactionService } from "@/services/firebase";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, DollarSign, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TransactionsPage = () => {
  const { currentUser, userData } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!currentUser) {
          setError(t("login_to_see_wallet"));
          setLoading(false);
          return;
        }
        setLoading(true);
        const list = await TransactionService.getUserTransactions(currentUser.uid, 100);
        setTransactions(list);
      } catch (err) {
        console.error("Erro ao carregar todas as transações:", err);
        setError(t("error_loading_data"));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [currentUser, t]);

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

  const isTester = userData?.currentMode === 'tester';

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

  const getDisplayStatusBadge = (tx: Transaction) => {
    // Para contratante, reservas (escrow) devem aparecer como Concluídas
    const isPosterEscrow = !isTester && tx.type === 'escrow';
    const statusToShow = isPosterEscrow ? 'completed' : tx.status;
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:bg-muted/30">
          <ChevronLeft className="h-4 w-4 mr-1" /> {t("back")}
        </Button>
      </div>

      <h1 className="text-xl font-semibold mb-2">{t("payments_transactions")}</h1>
      <p className="text-sm text-muted-foreground mb-4">{t("payments_transactions_description")}</p>

      <Card className="p-4 bg-card border-border">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">{t("no_transactions")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions
              .filter((t) => {
                if (isTester) {
                  // Freelancer: ganhos e pendências de tarefas, bonificações e reembolsos
                  return (
                    t.type === 'payout' ||
                    t.type === 'escrow' ||
                    t.type === 'referral_reward' ||
                    t.type === 'refund'
                  );
                }
                // Contratante: depósitos, reservas, taxas e reembolsos
                return (
                  t.type === 'deposit' ||
                  t.type === 'admin_deposit' ||
                  t.type === 'escrow' ||
                  t.type === 'fee' ||
                  t.type === 'refund'
                );
              })
              .map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
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
            ))}
         </div>
       )}
     </Card>
   </div>
  );
};

export default TransactionsPage;