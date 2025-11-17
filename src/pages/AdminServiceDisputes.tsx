import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ServiceOrder } from '@/types/firebase';
import { ServiceOrderService } from '@/services/serviceOrderService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminServiceDisputesPage = () => {
  const { currentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'open'|'in_review'|'resolved'|'closed'|'all'>('open');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [decision, setDecision] = useState<'refund_buyer'|'pay_seller'|'partial_refund'>('refund_buyer');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const all = await ServiceOrderService.listAll(200);
      const disputes = all.filter(o => !!o.disputeStatus);
      const filtered = statusFilter === 'all' ? disputes : disputes.filter(o => o.disputeStatus === statusFilter);
      setOrders(filtered);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar disputas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, [statusFilter]);

  const openResolve = (order: ServiceOrder) => {
    setSelected(order);
    setDecision('refund_buyer');
    setAmount('');
    setReason('');
  };

  const handleResolve = async () => {
    if (!selected) return;
    setResolving(true);
    try {
      const amt = amount ? Number(amount) : undefined;
      await ServiceOrderService.resolveDispute({
        orderId: selected.id,
        decision,
        amount: amt,
        reason,
        adminId: currentUser?.uid || 'admin',
      });
      toast.success('Disputa resolvida');
      setSelected(null);
      await fetchDisputes();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Falha ao resolver disputa');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2"/>Disputas de Serviços</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abertas</SelectItem>
                  <SelectItem value="in_review">Em análise</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                  <SelectItem value="closed">Fechadas</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchDisputes}>
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Atualizando...</>) : 'Atualizar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 mr-2 animate-spin"/>Carregando disputas...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">Nenhuma disputa encontrada para este filtro.</div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Pedido {o.id}</div>
                      <div className="text-sm text-muted-foreground">Serviço {o.listingId} • Comprador {o.buyerName} • Vendedor {o.sellerName}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {o.disputeStatus && <Badge variant="outline">{o.disputeStatus}</Badge>}
                        {o.disputeReason && <Badge variant="secondary">{o.disputeReason}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => openResolve(o)} className="glow-effect">
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Disputa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Decisão</label>
                <Select value={decision} onValueChange={(v: any) => setDecision(v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund_buyer"><XCircle className="h-4 w-4 mr-1 inline"/> Reembolsar comprador</SelectItem>
                    <SelectItem value="pay_seller"><CheckCircle className="h-4 w-4 mr-1 inline"/> Pagar vendedor</SelectItem>
                    <SelectItem value="partial_refund"><AlertTriangle className="h-4 w-4 mr-1 inline"/> Reembolso parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">Valor (KZ)</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Opcional para parcial" />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Motivo/Observações</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Detalhe a decisão" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
              <Button onClick={handleResolve} disabled={resolving} className="glow-effect">
                {resolving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Resolvendo...</>) : 'Confirmar Resolução'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServiceDisputesPage;