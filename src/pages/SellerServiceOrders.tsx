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
import { Image as ImageIcon } from 'lucide-react';
import { AdminService } from '@/services/admin';

function formatDate(d?: Date | string) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString();
}

function formatPrice(amount: number, currency: string) {
  const symbol = currency === 'KZ' ? 'Kz' : currency;
  return `${symbol} ${amount.toLocaleString('pt-PT')}`;
}

export default function SellerServiceOrdersPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [listingMap, setListingMap] = useState<Record<string, ServiceListing | null>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceOrder['status']>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        try {
          const ft = await AdminService.getFeatureToggles();
          if (!ft.servicesEnabled) {
            navigate('/');
            return;
          }
        } catch { void 0; }
        if (!currentUser?.uid) return;
        const os = await ServiceOrderService.listOrdersForSeller(currentUser.uid);
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
      const text = `${l?.title || ''} ${o.buyerName || ''}`.toLowerCase();
      const searchOk = s ? text.includes(s) : true;
      return statusOk && searchOk;
    });
  }, [orders, statusFilter, search, listingMap]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Pedidos dos meus serviços</h1>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título ou comprador" className="max-w-sm" />
        <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago (escrow)</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nenhum pedido encontrado</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground">Nenhum pedido nos seus serviços ainda.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const l = listingMap[o.listingId];
            const imgSrc = (l?.images && l.images.length > 0 ? l.images[0] : l?.imageUrl) || undefined;
            return (
              <Card key={o.id} className="bg-card border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-md overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
                        {imgSrc ? (
                          <img src={imgSrc} alt={l?.title || 'Serviço'} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-semibold">{l?.title || 'Serviço'}</div>
                        <div className="text-sm text-muted-foreground">Comprador: {o.buyerName} • {formatDate(o.createdAt)}</div>
                        <div className="text-sm">Valor: {formatPrice(o.amount, o.currency)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                      {o.status === 'paid' && o.buyerConfirmedDelivery && (
                        <div className="mt-1 text-xs text-green-600">Entrega confirmada pelo comprador</div>
                      )}
                      {!o.buyerConfirmedDelivery && o.status === 'paid' && (
                        <div className="mt-1 text-xs text-muted-foreground">Aguardando confirmação do comprador</div>
                      )}
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/services/${o.listingId}`)}>Ver anúncio</Button>
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