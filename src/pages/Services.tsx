import React, { useEffect, useMemo, useState } from 'react';
import { ServiceListing } from '@/types/firebase';
import { ServicesService } from '@/services/servicesService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grid2x2, LayoutGrid, List, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { ServiceCard } from '@/components/ServiceCard';
import { AdminService } from '@/services/admin';

const sample: ServiceListing[] = [
  {
    id: 'srv-1',
    title: 'Eu vou editar seu vídeo curto para redes sociais',
    description: 'Edição rápida, cortes, legendas e música em até 24h',
    imageUrl: '/images/sample/video-edit.png',
    tags: ['Vídeo', 'Reels', 'TikTok'],
    sellerId: 'seller-1',
    sellerName: 'Leonardo V.',
    price: 30,
    currency: 'KZ',
    rating: 4.9,
    ratingCount: 122,
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: 'srv-2',
    title: 'Eu vou criar sua arte de banner promocional',
    description: 'Design profissional e responsivo para campanhas',
    imageUrl: '/images/sample/banner.png',
    tags: ['Design', 'Promo'],
    sellerId: 'seller-2',
    sellerName: 'Miriam D.',
    price: 20,
    currency: 'KZ',
    rating: 4.7,
    ratingCount: 89,
    status: 'active',
    createdAt: new Date(),
  },
];

export default function ServicesPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const [items, setItems] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'latest' | 'rating' | 'price_low' | 'price_high'>('latest');
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid3' | 'grid2' | 'list'>(isMobile ? 'list' : 'grid3');
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ft = await AdminService.getFeatureToggles();
        if (!ft.servicesEnabled) {
          setAllowed(false);
          navigate('/');
          return;
        }
      } catch { void 0; }
      try {
        const rs = await ServicesService.list({ limitNum: isMobile ? 12 : 24 });
        setItems(rs.length ? rs : sample);
      } catch (e) {
        setItems(sample);
      } finally {
        setLoading(false);
      }
    })();
  }, [isMobile]);

  const filtered = useMemo(() => {
    let data = [...items];
    const s = search.trim().toLowerCase();
    if (s) {
      data = data.filter((l) => (l.title || '').toLowerCase().includes(s) || (l.description || '').toLowerCase().includes(s));
    }
    switch (sort) {
      case 'rating':
        data.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'price_low':
        data.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        data.sort((a, b) => b.price - a.price);
        break;
      default:
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return data;
  }, [items, search, sort]);

  if (!allowed) return null;
  return (
    <div className={hideHeader ? '' : "min-h-screen bg-background"}>
      {/* Cabeçalho */}
      {!hideHeader && (
        <section className="border-b bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Serviços</h1>
                <p className="text-sm text-muted-foreground mt-1">Ofertas de serviços criados por freelancers</p>
              </div>
              {currentUser && (
                <Button onClick={() => navigate('/services/create')} className="glow-effect">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Serviço
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-4 rounded-md bg-muted/30 border border-border p-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Buscar serviço" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Mais recentes</SelectItem>
                <SelectItem value="rating">Melhor avaliação</SelectItem>
                <SelectItem value="price_low">Preço: menor primeiro</SelectItem>
                <SelectItem value="price_high">Preço: maior primeiro</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={viewMode === 'grid3'}
                onClick={() => setViewMode('grid3')}
                className={viewMode === 'grid3' ? 'text-primary bg-muted/30' : 'text-muted-foreground'}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={viewMode === 'grid2'}
                onClick={() => setViewMode('grid2')}
                className={viewMode === 'grid2' ? 'text-primary bg-muted/30' : 'text-muted-foreground'}
              >
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'text-primary bg-muted/30' : 'text-muted-foreground'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className={viewMode === 'list' ? 'space-y-3' : viewMode === 'grid2' ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
            {filtered.map((l) => (
              <ServiceCard key={l.id} listing={l} variant={viewMode === 'list' ? 'list' : 'grid'} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
            <p className="text-muted-foreground">Nenhum serviço disponível ainda.</p>
            {currentUser ? (
              <Button onClick={() => navigate('/services/create')} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Criar primeiro serviço
              </Button>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">Entre para criar e visualizar serviços.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}