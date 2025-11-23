import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DepositNegotiationService } from '@/services/depositNegotiationService';
import { DepositNegotiationMessagesService } from '@/services/depositNegotiationMessagesService';
import { DepositNegotiation } from '@/types/depositNegotiation';
import { DepositNegotiationThread } from '@/components/DepositNegotiationThread';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  MessageSquare,
  Search,
} from 'lucide-react';
import { TransactionService } from '@/services/firebase';

const statusColors: Record<DepositNegotiation['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  negotiating: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  awaiting_payment: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  awaiting_proof: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const statusLabels: Record<DepositNegotiation['status'], string> = {
  pending: 'Pendente',
  negotiating: 'Em Negociação',
  awaiting_payment: 'Aguardando Pagamento',
  awaiting_proof: 'Aguardando Comprovante',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
};

export const AdminDepositNegotiations = () => {
  const { currentUser, userData } = useAuth();
  const [negotiations, setNegotiations] = useState<DepositNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedNegotiation, setSelectedNegotiation] = useState<DepositNegotiation | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [approveAmount, setApproveAmount] = useState<string>('0');

  useEffect(() => {
    const unsubscribe = DepositNegotiationService.subscribeToNegotiations((data) => {
      setNegotiations(data);
      setLoading(false);
      
      // Atualizar contadores de mensagens não lidas
      data.forEach(async (negotiation) => {
        const count = await DepositNegotiationMessagesService.getUnreadCount(negotiation.id, 'admin');
        setUnreadCounts(prev => ({ ...prev, [negotiation.id]: count }));
      });
    });

    return () => unsubscribe();
  }, []);

  const filteredNegotiations = negotiations.filter((n) => {
    // Filtro de status
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = ['pending', 'negotiating', 'awaiting_payment', 'awaiting_proof'].includes(n.status);
    } else if (statusFilter === 'completed') {
      matchesStatus = ['approved', 'rejected', 'cancelled'].includes(n.status);
    }

    // Filtro de busca
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = 
        n.userName.toLowerCase().includes(query) ||
        (n.userEmail?.toLowerCase() || '').includes(query) ||
        n.requestedAmount.toString().includes(query) ||
        (n.agreedAmount?.toString() || '').includes(query);
    }

    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: negotiations.filter(n => ['pending', 'negotiating'].includes(n.status)).length,
    awaiting: negotiations.filter(n => ['awaiting_proof', 'awaiting_payment'].includes(n.status)).length,
    approved: negotiations.filter(n => n.status === 'approved' && n.createdAt.toDate().getMonth() === new Date().getMonth()).length,
    totalAmount: negotiations
      .filter(n => n.status === 'approved')
      .reduce((sum, n) => sum + (n.agreedAmount || n.requestedAmount), 0),
  };

  const handleApprove = async () => {
    if (!selectedNegotiation || !currentUser || !userData) return;

    const amount = parseFloat(approveAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor válido maior que zero');
      return;
    }

    try {
      await DepositNegotiationService.updateNegotiationStatus(
        selectedNegotiation.id,
        'approved',
        currentUser.uid,
        userData.name
      );

      // Creditar saldo do usuário contratante (poster)
      await TransactionService.updateUserBalance(
        selectedNegotiation.userId,
        amount,
        'add',
        'poster' // ESPECIFICAR que é depósito para carteira de contratante
      );

      // Criar registro de transação
      await TransactionService.createTransaction({
        userId: selectedNegotiation.userId,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        description: `Depósito via negociação`,
        currency: 'AOA',
        metadata: {
          negotiationId: selectedNegotiation.id
        }
      });

      toast.success('Depósito aprovado e creditado com sucesso!');
      setApproveDialogOpen(false);
      setApproveAmount('0');
      setSelectedNegotiation(null);
    } catch (error) {
      console.error('Error approving negotiation:', error);
      toast.error('Erro ao aprovar depósito');
    }
  };

  const handleReject = async () => {
    if (!selectedNegotiation || !currentUser || !userData) return;

    try {
      await DepositNegotiationService.updateNegotiationStatus(
        selectedNegotiation.id,
        'rejected',
        currentUser.uid,
        userData.name,
        {
          rejectionReason: rejectionReason || 'Sem motivo especificado'
        }
      );

      toast.success('Negociação rejeitada');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedNegotiation(null);
    } catch (error) {
      console.error('Error rejecting negotiation:', error);
      toast.error('Erro ao rejeitar negociação');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Negociações de Depósito
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie solicitações de depósito dos usuários
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Comprovante</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.awaiting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas (Mês)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toFixed(2)} Kz</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout: List + Chat */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Negotiations List */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>Negociações</CardTitle>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="active">Ativas</TabsTrigger>
                    <TabsTrigger value="completed">Concluídas</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou valor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredNegotiations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <>
                    <p>Nenhuma negociação encontrada</p>
                    <p className="text-xs mt-1">Tente outro termo de busca</p>
                  </>
                ) : (
                  'Nenhuma negociação encontrada'
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredNegotiations.map((negotiation) => {
                  const unreadCount = unreadCounts[negotiation.id] || 0;
                  
                  return (
                    <div
                      key={negotiation.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        selectedNegotiation?.id === negotiation.id
                          ? "bg-primary/10 border-primary shadow-md"
                          : "bg-card hover:bg-accent/50"
                      )}
                      onClick={() => setSelectedNegotiation(negotiation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{negotiation.userName}</span>
                            <Badge className={statusColors[negotiation.status]}>
                              {statusLabels[negotiation.status]}
                            </Badge>
                            {unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white border-red-600 animate-pulse">
                                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {negotiation.userEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(negotiation.createdAt.toDate()).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {negotiation.requestedAmount.toFixed(2)} Kz
                          </div>
                          {negotiation.agreedAmount && (
                            <div className="text-sm text-green-600">
                              Acordado: {negotiation.agreedAmount.toFixed(2)} Kz
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div>
          {selectedNegotiation ? (
            <DepositNegotiationThread
              negotiation={selectedNegotiation}
              role="admin"
              onApprove={() => setApproveDialogOpen(true)}
              onReject={() => setRejectDialogOpen(true)}
            />
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[600px]">
              <div className="text-center text-muted-foreground space-y-2">
                <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                <p>Selecione uma negociação para iniciar o chat</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={(open) => {
        setApproveDialogOpen(open);
        if (open && selectedNegotiation) {
          // Preencher com valor acordado ou solicitado quando abrir
          const defaultAmount = selectedNegotiation.agreedAmount || selectedNegotiation.requestedAmount || 0;
          setApproveAmount(defaultAmount.toString());
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Depósito</DialogTitle>
            <DialogDescription>
              Confirme a aprovação do depósito. Insira o valor a ser creditado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-amount">Valor a creditar (Kz)</Label>
              <Input
                id="approve-amount"
                type="number"
                step="0.01"
                min="0"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                placeholder="0.00"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Valor solicitado: {(selectedNegotiation?.requestedAmount || 0).toFixed(2)} Kz
                {selectedNegotiation?.agreedAmount && (
                  <> • Valor acordado: {selectedNegotiation.agreedAmount.toFixed(2)} Kz</>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setApproveDialogOpen(false);
              setApproveAmount('0');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove} 
              className="bg-green-600 hover:bg-green-700"
              disabled={!approveAmount || parseFloat(approveAmount) <= 0}
            >
              Aprovar e Creditar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Negociação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição (opcional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da Rejeição</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
