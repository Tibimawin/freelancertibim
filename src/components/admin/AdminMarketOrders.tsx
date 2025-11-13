import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MarketListing, MarketOrder } from '@/types/firebase';
import { MarketService } from '@/services/marketService';
import { DownloadService } from '@/services/downloadService';
import { NotificationService } from '@/services/notificationService';
import { Loader2 } from 'lucide-react';

const AdminMarketOrders: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [listingMap, setListingMap] = useState<Record<string, MarketListing | null>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MarketOrder['status']>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const sellerIds = useMemo(() => {
    const ids = [] as string[];
    if (currentUser?.uid) ids.push(currentUser.uid);
    // Alguns anúncios podem ter sido cadastrados como 'platform'
    ids.push('platform');
    return Array.from(new Set(ids));
  }, [currentUser?.uid]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await MarketService.listOrdersForSeller(sellerIds);
      setOrders(list);
      // Carregar anúncios relacionados (mapa)
      const uniqueListingIds = Array.from(new Set(list.map(o => o.listingId).filter(Boolean)));
      const settlements = await Promise.allSettled(uniqueListingIds.map((id) => MarketService.getListing(id)));
      const map: Record<string, MarketListing | null> = {};
      uniqueListingIds.forEach((id, idx) => {
        const r = settlements[idx];
        map[id] = r.status === 'fulfilled' ? (r.value || null) : null;
      });
      setListingMap(map);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar pedidos', description: e?.message || 'Falha ao buscar pedidos do Mercado', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerIds.join('|')]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o) => {
      const l = listingMap[o.listingId];
      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      const text = [o.buyerName, o.sellerName, l?.title, o.listingId, o.id, (o as any).affiliateId].filter(Boolean).join(' ').toLowerCase();
      const matchesText = !s || text.includes(s);
      return matchesStatus && matchesText;
    });
  }, [orders, listingMap, search, statusFilter]);

  const labelStatus = (st: MarketOrder['status']) => {
    switch (st) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return st;
    }
  };

  const handleUpdateStatus = async (order: MarketOrder, next: MarketOrder['status']) => {
    try {
      setSavingId(order.id);
      await MarketService.updateOrderStatus(order.id, next);
      toast({ title: 'Status atualizado', description: `Pedido ${order.id} marcado como '${labelStatus(next)}'.` });
      // Atualizar estado local
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next, updatedAt: new Date() } : o)));
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e?.message || 'Falha ao atualizar status do pedido.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeliverAndRelease = async (order: MarketOrder) => {
    const listing = listingMap[order.listingId];
    if (!listing) {
      toast({ title: 'Produto não encontrado', description: 'Não foi possível carregar dados do anúncio.', variant: 'destructive' });
      return;
    }
    if (listing.productType !== 'digital' || !listing.downloadUrl) {
      toast({ title: 'Ação inválida', description: 'Esta ação é apenas para produtos digitais com link de download.', variant: 'destructive' });
      return;
    }
    try {
      setSavingId(order.id);
      // 1) Marcar como entregue
      await MarketService.updateOrderStatus(order.id, 'delivered');
      // 2) Gerar token de download temporário
      const tokenId = await DownloadService.createToken({
        listingId: order.listingId,
        buyerId: order.buyerId,
        downloadUrl: listing.downloadUrl,
        ttlMinutes: 30,
      });
      // 3) Notificar o cliente com link de download
      await NotificationService.createNotification({
        userId: order.buyerId,
        type: 'market_order_delivered',
        title: 'Seu pedido foi entregue',
        message: `O download do produto "${listing.title}" foi liberado. Acesse: /download/${tokenId}`,
        read: false,
        metadata: {
          orderId: order.id,
          listingId: order.listingId,
          downloadTokenId: tokenId,
        },
      });
      // Atualizar estado local
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'delivered', updatedAt: new Date() } : o)));
      toast({ title: 'Entrega confirmada', description: 'Download liberado e cliente notificado.' });
    } catch (e: any) {
      toast({ title: 'Erro ao entregar', description: e?.message || 'Falha ao liberar download.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pedidos do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente, produto, ID" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchOrders} disabled={loading}>
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
              {filtered.map((o) => {
                const l = listingMap[o.listingId];
                return (
                  <div key={o.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{l?.title || 'Produto'} <span className="text-muted-foreground">• {o.listingId}</span></div>
                        <div className="text-xs text-muted-foreground">Cliente: {o.buyerName} • #{o.id}</div>
                        <div className="text-xs text-muted-foreground">Criado: {new Date(o.createdAt).toLocaleString('pt-BR')}</div>
                        {/* Afiliados: informações resumidas */}
                        {((o as any).affiliateId) && (
                          <div className="text-xs">
                            <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">
                              Afiliado: {(o as any).affiliateId}
                            </span>
                            <span className="ml-2 inline-flex items-center rounded bg-muted px-2 py-0.5">
                              Comissão: {(() => {
                                const rate = typeof (o as any).affiliateCommissionRate === 'number' ? (o as any).affiliateCommissionRate : 0.05;
                                const amount = typeof (o as any).affiliateCommissionAmount === 'number' ? (o as any).affiliateCommissionAmount : (o.amount * rate);
                                return `${amount.toLocaleString('pt-BR')} ${o.currency}`;
                              })()}
                            </span>
                            <span className="ml-2 inline-flex items-center rounded bg-muted px-2 py-0.5">
                              Status: {((o as any).affiliateCommissionStatus || 'pending')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{o.amount?.toLocaleString('pt-BR')} {o.currency}</div>
                        <Badge variant="secondary" className="mt-1">{labelStatus(o.status)}</Badge>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(o, 'paid')} disabled={savingId === o.id || o.status === 'paid'}>
                        {savingId === o.id && '...'} Marcar como Pago
                      </Button>
                      <Button size="sm" onClick={() => handleUpdateStatus(o, 'delivered')} disabled={savingId === o.id || o.status === 'delivered'}>
                        {savingId === o.id && '...'} Marcar como Entregue
                      </Button>
                      {l?.productType === 'digital' && !!l?.downloadUrl && o.status !== 'delivered' && (
                        <Button size="sm" onClick={() => handleDeliverAndRelease(o)} disabled={savingId === o.id}>
                          {savingId === o.id ? 'Processando...' : 'Entregar e liberar download'}
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(o, 'cancelled')} disabled={savingId === o.id || o.status === 'cancelled'}>
                        {savingId === o.id && '...'} Cancelar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketOrders;