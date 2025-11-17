import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { ServiceOrder } from '@/types/firebase';
import ServiceOrderService from '@/services/serviceOrderService';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import { Loader2 } from 'lucide-react';

export default function AdminServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceOrder['status']>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const os = await ServiceOrderService.listAll();
      setOrders(os);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e?.message || 'Falha ao buscar pedidos de serviços', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o) => {
      const statusOk = statusFilter === 'all' ? true : o.status === statusFilter;
      const text = `${o.sellerName || ''} ${o.buyerName || ''}`.toLowerCase();
      const searchOk = s ? text.includes(s) : true;
      return statusOk && searchOk;
    });
  }, [orders, statusFilter, search]);

  const releasePayment = async (order: ServiceOrder) => {
    setActionLoadingId(order.id);
    try {
      await ServiceOrderService.completeOrderAndReleaseEscrow(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'delivered', updatedAt: new Date() } : o)));
      toast({ title: 'Pagamento liberado', description: 'Escrow liberado para o vendedor.' });
    } catch (e: any) {
      toast({ title: 'Falha ao liberar', description: e?.message || 'Erro ao liberar pagamento.', variant: 'destructive' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por vendedor/comprador" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago (escrow)</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchAll} disabled={loading}>
                  {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Atualizando...</>) : 'Atualizar'}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((o) => (
                  <div key={o.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{o.sellerName} → {o.buyerName} <span className="text-muted-foreground">• {o.id}</span></div>
                        <div className="text-xs text-muted-foreground">Criado: {formatDate(o.createdAt)}</div>
                        {o.status === 'paid' && (
                          <div className="text-xs">
                            {o.buyerConfirmedDelivery ? (
                              <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-green-600">Comprador confirmou entrega</span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">Sem confirmação do comprador</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{o.amount?.toLocaleString('pt-BR')} {o.currency}</div>
                        <Badge variant="secondary" className="mt-1">{o.status}</Badge>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-2">
                      {o.status === 'paid' && (
                        <Button size="sm" onClick={() => releasePayment(o)} disabled={actionLoadingId === o.id || !o.buyerConfirmedDelivery}>
                          {actionLoadingId === o.id ? 'Liberando…' : 'Liberar pagamento'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(d?: Date | string) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString();
}