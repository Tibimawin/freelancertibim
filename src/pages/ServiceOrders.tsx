import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ServiceOrder, ServiceListing } from '@/types/firebase';
import ServiceOrderService from '@/services/serviceOrderService';
import { ServicesService } from '@/services/servicesService';
import { Image as ImageIcon, Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

function formatDate(d?: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date ? new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function formatPrice(amount: number, currency: string) {
  const code = currency === 'KZ' ? 'AOA' : currency;
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: code }).format(amount);
}

export default function ServiceOrdersPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [listingMap, setListingMap] = useState<Record<string, ServiceListing | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceOrder['status']>('all');
  const [search, setSearch] = useState('');
  const [escrowLoadingId, setEscrowLoadingId] = useState<string | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [ratingDraft, setRatingDraft] = useState<Record<string, { rating: number; review?: string; submitting?: boolean; error?: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        if (!currentUser?.uid) return;
        const os = await ServiceOrderService.listOrdersForBuyer(currentUser.uid);
        setOrders(os);
        const uniqueIds = Array.from(new Set(os.map((o) => o.listingId).filter(Boolean)));
        const results = await Promise.allSettled(uniqueIds.map((id) => ServicesService.get(id)));
        const map: Record<string, ServiceListing | null> = {};
        results.forEach((r, idx) => {
          const id = uniqueIds[idx];
          if (r.status === 'fulfilled') map[id] = r.value as ServiceListing;
          else map[id] = null;
        });
        setListingMap(map);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar seus pedidos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.uid]);

  const filteredOrders = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o) => {
      const statusOk = statusFilter === 'all' ? true : o.status === statusFilter;
      const l = listingMap[o.listingId];
      const text = `${l?.title || ''} ${o.sellerName || ''}`.toLowerCase();
      const searchOk = s ? text.includes(s) : true;
      return statusOk && searchOk;
    });
  }, [orders, statusFilter, search, listingMap]);

  const confirmDelivery = async (order: ServiceOrder) => {
    setEscrowError(null);
    setEscrowLoadingId(order.id);
    try {
      await ServiceOrderService.confirmBuyerDelivery(order.id);
      // Atualiza estado local
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, buyerConfirmedDelivery: true, updatedAt: new Date() } : o)));
    } catch (e: any) {
      setEscrowError(e?.message || 'Falha ao confirmar entrega.');
    } finally {
      setEscrowLoadingId(null);
    }
  };

  const submitRating = async (order: ServiceOrder) => {
    const draft = ratingDraft[order.id];
    if (!draft?.rating) return;
    try {
      setRatingDraft((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 0, review: '' }), submitting: true, error: undefined } }));
      await ServiceOrderService.rateOrderAndListing({ orderId: order.id, listingId: order.listingId, rating: draft.rating, review: draft.review || '' });
      // atualizar estado local
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, rating: draft.rating, review: draft.review, ratedAt: new Date() } : o)));
      setRatingDraft((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 0, review: '' }), submitting: false } }));
    } catch (e: any) {
      setRatingDraft((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 0, review: '' }), submitting: false, error: e?.message || 'Falha ao enviar avaliação' } }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Meus Serviços</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus pedidos de serviços.</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 flex items-center gap-3">
          <Input placeholder="Pesquisar por título ou vendedor" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            className="border rounded px-2 py-1 text-sm bg-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      )}
      {escrowError && (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{escrowError}</CardContent>
        </Card>
      )}

      {filteredOrders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nenhum pedido encontrado</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Você ainda não realizou compras de serviços. Explore serviços e volte aqui após comprar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const l = listingMap[o.listingId];
            return (
              <Card key={o.id} className="bg-card border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
                        {l?.imageUrl ? (
                          <img src={l.imageUrl} alt={l?.title || 'Serviço'} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-semibold">
                          {l?.title || 'Serviço'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {l?.sellerName || o.sellerName} • {formatDate(o.createdAt)}
                        </div>
                        <div className="text-sm">
                          Valor: {formatPrice(o.amount, o.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                      <div className="mt-2 flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/services/${o.listingId}`)}>Anúncio</Button>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Pedido: {o.id}</div>
                      <div className="flex items-center gap-2">
                        {o.status === 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => confirmDelivery(o)}
                            disabled={escrowLoadingId === o.id || !!o.buyerConfirmedDelivery}
                          >
                            {escrowLoadingId === o.id ? 'Processando…' : (o.buyerConfirmedDelivery ? 'Entrega confirmada' : 'Confirmar entrega')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => navigate(`/services/${o.listingId}`)}>Anúncio</Button>
                      </div>
                      {o.status === 'paid' && o.buyerConfirmedDelivery && (
                        <div className="text-xs text-muted-foreground mt-2">Entrega confirmada pelo comprador. Aguardando liberação pelo administrador.</div>
                      )}
                    </div>

                    {/* Avaliação pós-entrega */}
                    {o.status === 'delivered' && !o.rating && (
                      <div className="border border-border rounded-md p-3">
                        <div className="text-sm font-medium mb-2">Avalie este serviço</div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const val = idx + 1;
                            const selected = (ratingDraft[o.id]?.rating || 0) >= val;
                            return (
                              <button
                                key={val}
                                type="button"
                                className="p-1"
                                onClick={() => setRatingDraft((prev) => ({ ...prev, [o.id]: { ...(prev[o.id] || { rating: 0, review: '' }), rating: val } }))}
                              >
                                <Star className={`w-5 h-5 ${selected ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                              </button>
                            );
                          })}
                        </div>
                        <Textarea
                          placeholder="Escreva um comentário (opcional)"
                          value={ratingDraft[o.id]?.review || ''}
                          onChange={(e) => setRatingDraft((prev) => ({ ...prev, [o.id]: { ...(prev[o.id] || { rating: 0, review: '' }), review: e.target.value } }))}
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => submitRating(o)}
                            disabled={!ratingDraft[o.id]?.rating || ratingDraft[o.id]?.submitting}
                          >
                            {ratingDraft[o.id]?.submitting ? 'Enviando…' : 'Enviar avaliação'}
                          </Button>
                          {ratingDraft[o.id]?.error && (
                            <span className="text-xs text-red-600">{ratingDraft[o.id]?.error}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}