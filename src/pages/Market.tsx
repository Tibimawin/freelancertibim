import React, { useEffect, useMemo, useState } from 'react';
import MarketCard from '@/components/MarketCard';
import { MarketListing } from '@/types/firebase';
import { MarketService } from '@/services/marketService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grid2x2, LayoutGrid, List, Wallet, Shield, Filter, Search, TrendingUp, Users, Package, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AdminService } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { formatKz } from '@/lib/currency';

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
  const formatKZ = (value: number) => formatKz(value);

  if (!allowed) return null;
  
  const maxPrice = Math.max(...listings.map(l => l.price), 100);
  const priceRange = [
    priceMin ? parseFloat(priceMin) : 0,
    priceMax ? parseFloat(priceMax) : maxPrice
  ];

  const handlePriceRangeChange = (values: number[]) => {
    setPriceMin(values[0].toString());
    setPriceMax(values[1].toString());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Melhorado */}
      <section className="relative border-b bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 animate-fade-in">
              <TrendingUp className="h-3 w-3 mr-1" />
              Marketplace em Crescimento
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-4 animate-fade-in">
              Mercado Digital
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6 animate-fade-in">
              Descubra serviços digitais de qualidade com compras 100% seguras. 
              Conecte-se com profissionais verificados e impulsione seus projetos.
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 animate-scale-in">
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-3 md:p-4 text-center">
                  <Package className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 text-primary" />
                  <div className="text-lg md:text-2xl font-bold">{listings.length}+</div>
                  <div className="text-xs text-muted-foreground">Serviços</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-3 md:p-4 text-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 text-primary" />
                  <div className="text-lg md:text-2xl font-bold">{new Set(listings.map(l => l.sellerId)).size}+</div>
                  <div className="text-xs text-muted-foreground">Vendedores</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-3 md:p-4 text-center">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 text-primary" />
                  <div className="text-lg md:text-2xl font-bold">4.7</div>
                  <div className="text-xs text-muted-foreground">Avaliação</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {currentUser && (
          <div className="grid gap-3 md:grid-cols-2 mb-6 animate-fade-in">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Conta Contratante</span>
                  <Badge variant={isContractor ? 'default' : 'secondary'} className="ml-auto">
                    {isContractor ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Saldo disponível</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {formatKZ(contractorBalance)}
                    </p>
                  </div>
                  {!isContractor && (
                    <Button size="sm" onClick={() => switchUserMode('poster')} className="hover-scale">
                      Ativar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Compra Segura</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Entre em contacto com o vendedor via chat antes de comprar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Combine detalhes, prazos e garantias do serviço</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Pagamento seguro com saldo da conta contratante</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barra de Busca e Filtros Modernizada */}
        <Card className="mb-6 border-primary/20 shadow-lg animate-fade-in">
          <CardContent className="p-4 md:p-6">
            {/* Busca Principal */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços, categorias ou vendedores..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Controles e Filtros */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Mais relevantes</SelectItem>
                  <SelectItem value="latest">Mais recentes</SelectItem>
                  <SelectItem value="rating">Melhor avaliados</SelectItem>
                  <SelectItem value="price_low">Menor preço</SelectItem>
                  <SelectItem value="price_high">Maior preço</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden md:flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid3' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid3')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid2' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid2')}
                  className="h-8"
                >
                  <Grid2x2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Link to="/market/compras" className="ml-auto">
                <Button variant="outline" className="hover-scale">
                  <Wallet className="h-4 w-4 mr-2" />
                  Minhas Compras
                </Button>
              </Link>

              {/* Filtros Drawer Mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {(tag || priceMin || priceMax) && (
                      <Badge className="ml-2" variant="secondary">
                        Ativos
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Filtros Avançados</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Faixa de Preço</span>
                        <Badge variant="outline">
                          {formatKZ(priceRange[0])} - {formatKZ(priceRange[1])}
                        </Badge>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={handlePriceRangeChange}
                        max={maxPrice}
                        step={1}
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium mb-3 block">Categorias</span>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant={tag === '' ? 'default' : 'outline'}
                          onClick={() => setTag('')}
                          className="w-full justify-start"
                        >
                          Todas as categorias
                        </Button>
                        {allTags.map((t) => (
                          <Button
                            key={t}
                            size="sm"
                            variant={tag === t ? 'default' : 'outline'}
                            onClick={() => setTag(t)}
                            className="w-full justify-start"
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Tags Categorias */}
            {allTags.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex items-center gap-2 pb-2">
                  <Button
                    size="sm"
                    variant={tag === '' ? 'default' : 'outline'}
                    onClick={() => setTag('')}
                    className="hover-scale whitespace-nowrap"
                  >
                    Todas
                  </Button>
                  {allTags.map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={tag === t ? 'default' : 'outline'}
                      onClick={() => setTag(t)}
                      className="hover-scale whitespace-nowrap"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Filtros Ativos */}
            {(search || tag || priceMin || priceMax) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                <div className="flex flex-wrap gap-2 flex-1">
                  {search && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: {search}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSearch('')}
                      />
                    </Badge>
                  )}
                  {tag && (
                    <Badge variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setTag('')}
                      />
                    </Badge>
                  )}
                  {(priceMin || priceMax) && (
                    <Badge variant="secondary" className="gap-1">
                      {formatKZ(parseFloat(priceMin || '0'))} - {formatKZ(parseFloat(priceMax || maxPrice.toString()))}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => {
                          setPriceMin('');
                          setPriceMax('');
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearch('');
                    setTag('');
                    setPriceMin('');
                    setPriceMax('');
                  }}
                >
                  Limpar tudo
                </Button>
              </div>
            )}

            {/* Contador de Resultados */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Carregando serviços...
                  </span>
                ) : (
                  <>
                    Mostrando <span className="font-semibold text-foreground">{filtered.length}</span> 
                    {filtered.length === 1 ? ' serviço' : ' serviços'}
                    {(search || tag || priceMin || priceMax) && ' encontrados'}
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Serviços */}
        {loading ? (
          <div className={
            viewMode === 'grid2'
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6'
              : viewMode === 'list'
              ? 'space-y-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
          }>
            {Array.from({ length: 6 }).map((_, i) => (
              viewMode === 'list' ? (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-24 w-28 rounded" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card key={i} className="animate-pulse overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Não encontramos serviços que correspondam aos seus critérios de busca.
                Tente ajustar os filtros ou buscar por outros termos.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setTag('');
                  setPriceMin('');
                  setPriceMax('');
                }}
              >
                Limpar todos os filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid2'
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6'
              : viewMode === 'list'
              ? 'space-y-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
          }>
            {filtered.map((l, index) => (
              <div
                key={l.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MarketCard listing={l} variant={viewMode === 'list' ? 'list' : 'grid'} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}