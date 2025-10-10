import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Check, 
  X, 
  CreditCard, 
  Calendar,
  User,
  DollarSign,
  Eye
} from 'lucide-react';
import { useAdminWithdrawals } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';
import { WithdrawalRequest } from '@/types/admin';

const AdminWithdrawals = () => {
  const { currentUser } = useAuth();
  const { adminData } = useAdmin();
  const { withdrawals, loading, fetchWithdrawals, approveWithdrawal, rejectWithdrawal } = useAdminWithdrawals();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | null;
    withdrawal: WithdrawalRequest | null;
  }>({ type: null, withdrawal: null });
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleWithdrawalAction = async () => {
    if (!actionDialog.type || !actionDialog.withdrawal || !currentUser || !adminData) return;

    try {
      switch (actionDialog.type) {
        case 'approve':
          await approveWithdrawal(
            actionDialog.withdrawal.id, 
            currentUser.uid, 
            adminData.name,
            actionNotes
          );
          toast.success('Saque aprovado com sucesso');
          break;
        case 'reject':
          await rejectWithdrawal(
            actionDialog.withdrawal.id, 
            currentUser.uid, 
            adminData.name,
            rejectionReason,
            actionNotes
          );
          toast.success('Saque rejeitado com sucesso');
          break;
      }
      
      setActionDialog({ type: null, withdrawal: null });
      setActionNotes('');
      setRejectionReason('');
    } catch (error) {
      toast.error('Erro ao processar saque');
      console.error('Error processing withdrawal:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      processing: "outline",
      completed: "default"
    };
    
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      processing: "Processando",
      completed: "Concluído"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: "PIX",
      bank: "Transferência Bancária",
      crypto: "Criptomoeda"
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals List */}
      <div className="grid gap-4">
        {filteredWithdrawals.map((withdrawal) => (
          <Card key={withdrawal.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{withdrawal.userName}</h3>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {getMethodLabel(withdrawal.method)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {withdrawal.userEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {withdrawal.requestedAt.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  {withdrawal.adminNotes && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Notas do Admin:</strong> {withdrawal.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWithdrawal(withdrawal)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  {withdrawal.status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActionDialog({ type: 'approve', withdrawal })}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setActionDialog({ type: 'reject', withdrawal })}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal Details Modal */}
      <Dialog 
        open={!!selectedWithdrawal} 
        onOpenChange={() => setSelectedWithdrawal(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Saque</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação de saque
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usuário</Label>
                  <p className="font-medium">{selectedWithdrawal.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.userEmail}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium text-lg">
                    R$ {selectedWithdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label>Método</Label>
                  <p className="font-medium">{getMethodLabel(selectedWithdrawal.method)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="pt-1">
                    {getStatusBadge(selectedWithdrawal.status)}
                  </div>
                </div>
              </div>

              <div>
                <Label>Informações da Conta</Label>
                <div className="bg-muted p-3 rounded text-sm mt-1">
                  {selectedWithdrawal.method === 'pix' && (
                    <p><strong>Chave PIX:</strong> {selectedWithdrawal.accountInfo.pixKey}</p>
                  )}
                  {selectedWithdrawal.method === 'bank' && selectedWithdrawal.accountInfo.bankAccount && (
                    <>
                      <p><strong>Banco:</strong> {selectedWithdrawal.accountInfo.bankAccount.bank}</p>
                      <p><strong>Agência:</strong> {selectedWithdrawal.accountInfo.bankAccount.agency}</p>
                      <p><strong>Conta:</strong> {selectedWithdrawal.accountInfo.bankAccount.account}</p>
                      <p><strong>Tipo:</strong> {selectedWithdrawal.accountInfo.bankAccount.accountType === 'checking' ? 'Corrente' : 'Poupança'}</p>
                    </>
                  )}
                  {selectedWithdrawal.method === 'crypto' && selectedWithdrawal.accountInfo.cryptoWallet && (
                    <>
                      <p><strong>Endereço:</strong> {selectedWithdrawal.accountInfo.cryptoWallet.address}</p>
                      <p><strong>Rede:</strong> {selectedWithdrawal.accountInfo.cryptoWallet.network}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Solicitado em</Label>
                  <p>{selectedWithdrawal.requestedAt.toLocaleString('pt-BR')}</p>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div>
                    <Label>Processado em</Label>
                    <p>{selectedWithdrawal.processedAt.toLocaleString('pt-BR')}</p>
                  </div>
                )}
              </div>

              {selectedWithdrawal.adminNotes && (
                <div>
                  <Label>Notas do Administrador</Label>
                  <p className="bg-muted p-3 rounded text-sm mt-1">{selectedWithdrawal.adminNotes}</p>
                </div>
              )}

              {selectedWithdrawal.rejectionReason && (
                <div>
                  <Label>Motivo da Rejeição</Label>
                  <p className="bg-destructive/10 p-3 rounded text-sm mt-1">{selectedWithdrawal.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog 
        open={!!actionDialog.type} 
        onOpenChange={() => setActionDialog({ type: null, withdrawal: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Aprovar Saque' : 'Rejeitar Saque'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' 
                ? 'Confirmar a aprovação do saque. O valor será debitado da conta do usuário.'
                : 'Rejeitar a solicitação de saque. Informe o motivo da rejeição.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog.type === 'reject' && (
              <div>
                <Label htmlFor="rejectionReason">Motivo da Rejeição *</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insufficient_balance">Saldo insuficiente</SelectItem>
                    <SelectItem value="invalid_account">Informações da conta inválidas</SelectItem>
                    <SelectItem value="suspected_fraud">Suspeita de fraude</SelectItem>
                    <SelectItem value="account_verification">Conta não verificada</SelectItem>
                    <SelectItem value="other">Outro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notas Administrativas</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações internas (opcional)..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, withdrawal: null })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleWithdrawalAction}
              disabled={actionDialog.type === 'reject' && !rejectionReason}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;