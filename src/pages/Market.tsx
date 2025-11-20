import React, { useEffect, useMemo, useState } from 'react';
import MarketCard from '@/components/MarketCard';
import { MarketListing } from '@/types/firebase';
import { MarketService } from '@/services/marketService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grid2x2, LayoutGrid, List, Wallet, Shield, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AdminService } from '@/services/admin';

const defaultListings: MarketListing[] = [
  {
    id: 'sample-1',
    title: 'Criarei 5.000+ backlinks do-follow para classificação',
    description: 'Pacote de backlinks de alta qualidade para SEO com DA 70+',
    imageUrl: '/images/sample/backlinks.png',
    tags: ['Marketing Digital', 'Backlinks'],
    sellerId: 'seller-1',
    sellerName: 'Mais vendidos123',
    price: 3.0,
    currency: 'KZ',
    rating: 4.8,
    ratingCount: 804,
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: 'sample-2',
    title: 'Promoverei seu link no meu perfil do Pinterest',
    description: 'Shoutout para seu produto/serviço com alcance orgânico',
    imageUrl: '/images/sample/pinterest.png',
    tags: ['Marketing de Influenciadores'],
    sellerId: 'seller-2',
    sellerName: 'azrahim',
    price: 3.0,
    currency: 'KZ',
    rating: 4.7,
    ratingCount: 377,
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: 'sample-3',
    title: 'Fornecerei 20 artigos com cerca de 1500 palavras cada',
    description: 'Conteúdo original, humano e otimizado para SEO',
    imageUrl: '/images/sample/articles.png',
    tags: ['Escrita Digital', 'Artigos e Postagens de Blog'],
    sellerId: 'seller-3',
    sellerName: 'bainha4trabalho',
    price: 5.9,
    currency: 'KZ',
    rating: 4.7,
    ratingCount: 355,
    status: 'active',
    createdAt: new Date(),
  },
];

export default function MarketPage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { currentUser, userData, switchUserMode } = useAuth();
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string>('');
  const [sort, setSort] = useState<'latest' | 'rating' | 'price_low' | 'price_high' | 'relevance'>('latest');
  const [viewMode, setViewMode] = useState<'grid3' | 'grid2' | 'list'>('grid3');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ft = await AdminService.getFeatureToggles();
        if (!ft.marketEnabled) {
          setAllowed(false);
          navigate('/');
          return;
        }
      } catch { void 0; }
      try {
        const ls = await MarketService.listListings({ limitNum: 24 });
        setListings(ls.length ? ls : defaultListings);
      } catch (e) {
        setListings(defaultListings);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const allTags = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => (l.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [listings]);

  const filtered = useMemo(() => {
    let data = [...listings];
    const s = search.trim().toLowerCase();
    if (s) {
      data = data.filter((l) => (l.title || '').toLowerCase().includes(s) || (l.description || '').toLowerCase().includes(s));
    }
    if (tag) {
      data = data.filter((l) => (l.tags || []).includes(tag));
    }
    // Filtro por preço mínimo/máximo
    const min = priceMin ? parseFloat(priceMin) : undefined;
    const max = priceMax ? parseFloat(priceMax) : undefined;
    if (min !== undefined) {
      data = data.filter((l) => l.price >= min);
    }
    if (max !== undefined) {
      data = data.filter((l) => l.price <= max);
    }
    switch (sort) {
      case 'rating':
        data.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'relevance': {
        // Ordenação por relevância: combina avaliação, número de avaliações e recência
        const score = (l: MarketListing) => {
          const r = l.rating ?? 0;
          const c = l.ratingCount ?? 0;
          const recency = Math.max(0, 1 - (Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)); // até 1 mês
          return r * Math.log(c + 1) + recency * 2;
        };
        data.sort((a, b) => score(b) - score(a));
        break;
      }
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
  }, [listings, search, tag, sort, priceMin, priceMax]);

  // Vendas desativadas: formulário e lógica de criação removidos.

  const isContractor = (userData?.currentMode === 'poster');
  const contractorBalance = (userData?.posterWallet?.balance ?? 0) + (userData?.posterWallet?.bonusBalance ?? 0);
  const formatKZ = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
    } catch {
    return `${value.toFixed(2)} Kz`;
    }
  };

  if (!allowed) return null;
  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho em formato da página principal */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Mercado</h1>
          <p className="text-sm text-muted-foreground mt-1">Descubra serviços digitais e produtos com compras seguras</p>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-8">
        {currentUser && (
          <div className="grid gap-3 md:grid-cols-2 mb-6">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Conta contratante</span>
                <Badge variant={isContractor ? 'default' : 'secondary'} className="ml-auto">
                  {isContractor ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo disponível</p>
                  <p className="text-lg font-semibold">{formatKZ(contractorBalance)}</p>
                </div>
                {!isContractor && (
                  <Button size="sm" variant="outline" onClick={() => switchUserMode('poster')}>
                    Ativar conta contratante
                  </Button>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Aviso de compra segura</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Antes de comprar, entre em contacto com o vendedor via chat.</li>
                <li>Combine detalhes do produto/serviço, prazos e garantias.</li>
                <li>O pagamento usa o saldo da sua conta contratante.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Barra de filtros com Drawer mobile e chips roláveis */}
        <div className="mb-4 rounded-md bg-muted/30 border border-border p-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Buscar serviço" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={tag || undefined} onValueChange={(v) => setTag(v === 'all' ? '' : v)} className="hidden md:block">
              <SelectTrigger><SelectValue placeholder="Todas as tags" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Mais recentes</SelectItem>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="rating">Melhor avaliação</SelectItem>
                <SelectItem value="price_low">Preço: menor primeiro</SelectItem>
                <SelectItem value="price_high">Preço: maior primeiro</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 justify-end">
              {tag && <Badge variant="secondary" className="mr-2">Filtrando por: {tag}</Badge>}
              {(search || tag || priceMin || priceMax) && (
                <Button variant="ghost" onClick={() => { setSearch(''); setTag(''); setPriceMin(''); setPriceMax(''); }}>
                  Limpar filtros
                </Button>
              )}
              <Link to="/market/compras" className="hidden md:block">
                <Button variant="outline">
                  <Wallet className="w-4 h-4 mr-2" /> Minhas compras
                </Button>
              </Link>
              <div className="flex items-center gap-1">
                <Button aria-label="Grid 3 colunas" variant={viewMode==='grid3'?'default':'outline'} size="icon" onClick={() => setViewMode('grid3')}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button aria-label="Grid 2 colunas" variant={viewMode==='grid2'?'default':'outline'} size="icon" onClick={() => setViewMode('grid2')}>
                  <Grid2x2 className="w-4 h-4" />
                </Button>
                <Button aria-label="Lista" variant={viewMode==='list'?'default':'outline'} size="icon" onClick={() => setViewMode('list')}>
                  <List className="w-4 h-4" />
                </Button>
                {/* Filtros em Drawer (mobile) */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden">
                      <Filter className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="sm:max-w-none">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <p className="text-sm font-medium mb-2">Categoria</p>
                        <ScrollArea className="w-full">
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <Button size="sm" variant={tag === '' ? 'default' : 'outline'} onClick={() => setTag('')}>Todas</Button>
                            {allTags.map((t) => (
                              <Button key={t} size="sm" variant={tag === t ? 'default' : 'outline'} onClick={() => setTag(t)} className="whitespace-nowrap">
                                {t}
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">Preço mínimo</p>
                          <Input type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Preço máximo</p>
                          <Input type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="100" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setTag(''); setPriceMin(''); setPriceMax(''); }}>Limpar</Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
          {/* Chips roláveis de categoria (desktop e mobile) */}
          {allTags.length > 0 && (
            <div className="mt-3">
              <ScrollArea className="w-full">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <Button size="sm" variant={tag === '' ? 'default' : 'outline'} onClick={() => setTag('')}>Todas</Button>
                  {allTags.map((t) => (
                    <Button key={t} size="sm" variant={tag === t ? 'default' : 'outline'} onClick={() => setTag(t)} className="whitespace-nowrap">
                      {t}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Lista de produtos */}
        {loading ? (
          <div className={viewMode==='grid2' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4' : viewMode==='list' ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
            {Array.from({ length: 6 }).map((_, i) => (
              viewMode === 'list' ? (
                <div key={i} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ) : (
                <div key={i} className="rounded-lg border border-border bg-card">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              )
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum anúncio encontrado.</div>
        ) : (
          viewMode === 'list' ? (
            <div className="space-y-3">
              {filtered.map((l) => (
                <MarketCard key={l.id} listing={l} variant="list" />
              ))}
            </div>
          ) : (
            <div className={viewMode==='grid2' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
              {filtered.map((l) => (
                <MarketCard key={l.id} listing={l} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}