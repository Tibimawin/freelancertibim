import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MarketOrder, MarketListing } from '@/types/firebase';
import { MarketService } from '@/services/marketService';
import { DownloadService } from '@/services/downloadService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Star, Image as ImageIcon } from 'lucide-react';

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(d?: Date) {
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function MarketOrdersPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [listingMap, setListingMap] = useState<Record<string, MarketListing | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | MarketOrder['status']>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [ratingDraft, setRatingDraft] = useState<Record<string, { rating: number; review: string; submitting?: boolean; error?: string }>>({});

  const loadOrders = async () => {
    if (!currentUser) {
      setError('Faça login para ver seu histórico de compras.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const list = await MarketService.listOrdersForBuyer(currentUser.uid);
      setOrders(list);
      // Carregar detalhes dos anúncios usados nos pedidos (tolerante a falhas)
      const uniqueIds = Array.from(new Set(list.map((o) => o.listingId)));
      const results = await Promise.allSettled(uniqueIds.map((id) => MarketService.getListing(id)));
      const map: Record<string, MarketListing | null> = {};
      results.forEach((res, idx) => {
        const id = uniqueIds[idx];
        if (res.status === 'fulfilled') {
          map[id] = res.value || null;
        } else {
          // Falha ao obter o anúncio — registrar e seguir em frente
          console.warn('Falha ao obter anúncio', id, res.reason);
          map[id] = null;
        }
      });
      setListingMap(map);
    } catch (e: any) {
      const msg = e?.message || 'Erro ao carregar seu histórico.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const filteredOrders = useMemo(() => {
    let data = [...orders];
    if (statusFilter !== 'all') {
      data = data.filter((o) => o.status === statusFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      data = data.filter((o) => new Date(o.createdAt).getTime() >= from.getTime());
    }
    if (dateTo) {
      const to = new Date(dateTo);
      // incluir o dia inteiro
      to.setHours(23, 59, 59, 999);
      data = data.filter((o) => new Date(o.createdAt).getTime() <= to.getTime());
    }
    return data;
  }, [orders, statusFilter, dateFrom, dateTo]);

  const hasOrders = useMemo(() => filteredOrders.length > 0, [filteredOrders]);

  const monthGroups = useMemo(() => {
    const groups: Record<string, MarketOrder[]> = {};
    filteredOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    // ordenar meses desc
    const keys = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
    return keys.map((k) => ({ key: k, items: groups[k] }));
  }, [filteredOrders]);

  const handleDownload = async (order: MarketOrder) => {
    const listing = listingMap[order.listingId];
    if (!listing?.downloadUrl) return;
    if (!currentUser) return;
    try {
      const token = await DownloadService.createToken({
        listingId: order.listingId,
        buyerId: currentUser.uid,
        downloadUrl: listing.downloadUrl,
        ttlMinutes: 30,
      });
      navigate(`/download/${token}`);
    } catch (e) {
      // silently fail; could add toast if available
    }
  };

  const submitRating = async (order: MarketOrder) => {
    const draft = ratingDraft[order.id];
    if (!draft?.rating) return;
    try {
      setRatingDraft((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 0, review: '' }), submitting: true, error: undefined } }));
      await MarketService.rateOrderAndListing({ orderId: order.id, listingId: order.listingId, rating: draft.rating, review: draft.review || '' });
      // atualizar estado local
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, rating: draft.rating, review: draft.review, ratedAt: new Date() } : o)));
      setRatingDraft((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 0, review: '' }), submitting: false } }));
    } catch (e: any) {
      setRatingDraft((prev) => ({ ...prev, [order.id]: { ...(prev[order.id] || { rating: 0, review: '' }), submitting: false, error: e?.message || 'Falha ao enviar avaliação' } }));
    }
  };

  return (
    <div>
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold">Minhas Compras</h1>
          <p className="text-muted-foreground">Veja o histórico dos seus pedidos no Mercado</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="bg-card border border-border mb-4">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">De</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Até</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}>Limpar</Button>
            </div>
          </CardContent>
        </Card>
        {loading ? (
          <div className="space-y-3">
            {[0,1,2].map((i) => (
              <Card key={i} className="bg-card border border-border">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-1/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-card border border-border">
            <CardContent className="p-4 text-sm">
              <div className="text-destructive">{error}</div>
              <div className="mt-2">
                <Button variant="outline" onClick={loadOrders}>Tentar novamente</Button>
              </div>
            </CardContent>
          </Card>
        ) : !hasOrders ? (
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle>Sem compras ainda</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Você ainda não realizou compras no Mercado. Explore ofertas e volte aqui após comprar.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Desktop: lista plana */}
            <div className="hidden md:block space-y-4">
            {filteredOrders.map((o) => {
              const l = listingMap[o.listingId];
              const canDownload = l?.productType === 'digital' && !!l?.downloadUrl && o.status === 'delivered';
              return (
                <Card key={o.id} className="bg-card border border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* Miniatura */}
                        <div className="w-16 h-16 rounded-md overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
                          {l?.imageUrl ? (
                            <img src={l.imageUrl} alt={l?.title || 'Produto'} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-base font-semibold">
                            {l?.title || 'Produto'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {l?.sellerName || o.sellerName} • {formatDate(o.createdAt)}
                          </div>
                          <div className="text-sm">
                            Valor: <span className="font-medium">{formatPrice(o.amount, o.currency)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{o.status}</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => navigate(`/market/${o.listingId}`)}>Ver anúncio</Button>
                      {canDownload && (
                        <Button onClick={() => handleDownload(o)}>Download</Button>
                      )}
                    </div>
                    {/* Avaliação pós-compra */}
                    {o.status === 'delivered' && !o.rating && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((n) => (
                            <button key={n} onClick={() => setRatingDraft((prev) => ({ ...prev, [o.id]: { rating: n, review: prev[o.id]?.review || '' } }))} aria-label={`Avaliar ${n}`} className="p-1">
                              <Star className={`w-5 h-5 ${ (ratingDraft[o.id]?.rating ?? 0) >= n ? 'text-yellow-500' : 'text-muted-foreground' }`} />
                            </button>
                          ))}
                        </div>
                        <Textarea placeholder="Escreva uma breve avaliação (opcional)" value={ratingDraft[o.id]?.review || ''} onChange={(e) => setRatingDraft((prev) => ({ ...prev, [o.id]: { rating: prev[o.id]?.rating || 0, review: e.target.value } }))} />
                        <div className="flex items-center gap-2">
                          <Button disabled={ratingDraft[o.id]?.submitting} onClick={() => submitRating(o)}>
                            {ratingDraft[o.id]?.submitting ? 'Enviando...' : 'Enviar avaliação'}
                          </Button>
                          {ratingDraft[o.id]?.error && (
                            <span className="text-sm text-destructive">{ratingDraft[o.id]?.error}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </div>

            {/* Mobile: agrupado por mês */}
            <div className="md:hidden space-y-6">
              {monthGroups.map(({ key, items }) => {
                const [y, m] = key.split('-');
                const monthName = new Date(Number(y), Number(m)-1, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
                return (
                  <div key={key} className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">{monthName}</div>
                    <div className="space-y-3">
                      {items.map((o) => {
                        const l = listingMap[o.listingId];
                        const canDownload = l?.productType === 'digital' && !!l?.downloadUrl && o.status === 'delivered';
                        return (
                          <Card key={o.id} className="bg-card border border-border">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="w-14 h-14 rounded-md overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
                                  {l?.imageUrl ? (
                                    <img src={l.imageUrl} alt={l?.title || 'Produto'} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold truncate">{l?.title || 'Produto'}</div>
                                  <div className="text-xs text-muted-foreground truncate">{l?.sellerName || o.sellerName} • {formatDate(o.createdAt)}</div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-sm font-medium">{formatPrice(o.amount, o.currency)}</span>
                                    <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/market/${o.listingId}`)}>Anúncio</Button>
                                    {canDownload && <Button size="sm" onClick={() => handleDownload(o)}>Download</Button>}
                                  </div>
                                </div>
                              </div>
                              {o.status === 'delivered' && !o.rating && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map((n) => (
                                      <button key={n} onClick={() => setRatingDraft((prev) => ({ ...prev, [o.id]: { rating: n, review: prev[o.id]?.review || '' } }))} aria-label={`Avaliar ${n}`} className="p-1">
                                        <Star className={`w-4 h-4 ${ (ratingDraft[o.id]?.rating ?? 0) >= n ? 'text-yellow-500' : 'text-muted-foreground' }`} />
                                      </button>
                                    ))}
                                  </div>
                                  <Textarea className="mt-2" rows={2} placeholder="Review (opcional)" value={ratingDraft[o.id]?.review || ''} onChange={(e) => setRatingDraft((prev) => ({ ...prev, [o.id]: { rating: prev[o.id]?.rating || 0, review: e.target.value } }))} />
                                  <Button className="mt-2" size="sm" disabled={ratingDraft[o.id]?.submitting} onClick={() => submitRating(o)}>
                                    {ratingDraft[o.id]?.submitting ? 'Enviando...' : 'Enviar avaliação'}
                                  </Button>
                                  {ratingDraft[o.id]?.error && (
                                    <div className="text-xs text-destructive mt-1">{ratingDraft[o.id]?.error}</div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}