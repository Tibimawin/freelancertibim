import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthService } from '@/services/auth';
import { MarketService } from '@/services/marketService';
import { useAuth } from '@/contexts/AuthContext';
import { FollowButton } from '@/components/FollowButton';
import { useFollow } from '@/hooks/useFollow';
import { MarketListing } from '@/types/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  Package,
  MessageCircle,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
  Calendar,
  MapPin,
  Loader2,
  ArrowLeft,
  ExternalLink,
  ShoppingCart,
  Users,
  UserCheck
} from 'lucide-react';
import MarketCard from '@/components/MarketCard';
import { Skeleton } from '@/components/ui/skeleton';
import DirectMessagesModal from '@/components/DirectMessagesModal';

interface SellerData {
  name: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  memberSince?: Date;
  verified?: boolean;
}

interface SellerStats {
  totalSales: number;
  totalServices: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  responseTime: string;
  completionRate: number;
}

export default function SellerProfile() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { followersCount, followingCount } = useFollow(sellerId || '');
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    if (!sellerId) {
      navigate('/market');
      return;
    }

    const loadSellerData = async () => {
      setLoading(true);
      try {
        // Carregar dados do vendedor
        const userData = await AuthService.getUserData(sellerId);
        if (userData) {
          setSeller({
            name: userData.name || 'Vendedor',
            avatarUrl: userData.avatarUrl,
            bio: userData.bio || 'Vendedor no marketplace',
            location: userData.location,
            memberSince: userData.createdAt instanceof Date ? userData.createdAt : undefined,
            verified: false, // Mock - seria verificado em produção
          });
        }

        // Carregar serviços do vendedor
        const allListings = await MarketService.listListings({ limitNum: 100 });
        const sellerListings = allListings.filter(l => l.sellerId === sellerId);
        setListings(sellerListings);
      } catch (error) {
        console.error('Erro ao carregar perfil do vendedor:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, [sellerId, navigate]);

  // Calcular estatísticas do vendedor
  const stats: SellerStats = useMemo(() => {
    const activeListings = listings.filter(l => l.status === 'active');
    const totalReviews = listings.reduce((sum, l) => sum + (l.ratingCount || 0), 0);
    const averageRating = totalReviews > 0
      ? listings.reduce((sum, l) => sum + (l.rating || 0) * (l.ratingCount || 0), 0) / totalReviews
      : 0;

    return {
      totalSales: Math.floor(totalReviews * 0.8), // Estimativa baseada em avaliações
      totalServices: activeListings.length,
      averageRating,
      totalReviews,
      responseRate: 95, // Mock - seria calculado de dados reais
      responseTime: '2 horas', // Mock
      completionRate: 98, // Mock
    };
  }, [listings]);

  // Distribuição de avaliações
  const ratingDistribution = useMemo(() => {
    const total = stats.totalReviews;
    if (total === 0) return [0, 0, 0, 0, 0];
    
    // Mock distribution - em produção viria do banco
    return [
      Math.round(total * 0.75), // 5 estrelas
      Math.round(total * 0.15), // 4 estrelas
      Math.round(total * 0.07), // 3 estrelas
      Math.round(total * 0.02), // 2 estrelas
      Math.round(total * 0.01), // 1 estrela
    ];
  }, [stats.totalReviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-32 w-32 rounded-full mb-4" />
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>

      {/* Modal de mensagens diretas */}
      {sellerId && (
        <DirectMessagesModal
          open={showMessageModal}
          onOpenChange={setShowMessageModal}
          initialRecipientId={sellerId}
        />
      )}
    </div>
  );
}

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Vendedor não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O perfil que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => navigate('/market')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Mercado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/market')}
            className="mb-4 hover-scale"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Mercado
          </Button>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Sidebar - Informações do Vendedor */}
          <div className="md:col-span-1">
            <Card className="border-primary/20 sticky top-4 animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 border-4 border-primary/20 mb-4 hover-scale">
                    <AvatarImage src={seller.avatarUrl} />
                    <AvatarFallback className="text-3xl">
                      {seller.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{seller.name}</h1>
                    {seller.verified && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                    {currentUser && currentUser.uid !== sellerId && (
                      <FollowButton userId={sellerId || ''} />
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    <Star className="h-5 w-5 text-warning fill-warning" />
                    <span className="text-xl font-bold">{stats.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">
                      ({stats.totalReviews} avaliações)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{followersCount} seguidores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>{followingCount} seguindo</span>
                    </div>
                  </div>

                  {seller.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{seller.location}</span>
                    </div>
                  )}

                  {seller.memberSince && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Membro desde {seller.memberSince.toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}

                  <Button 
                    className="w-full mb-2 hover-scale" 
                    size="lg"
                    onClick={() => setShowMessageModal(true)}
                    disabled={!currentUser || currentUser.uid === sellerId}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {currentUser?.uid === sellerId ? 'Você' : 'Enviar Mensagem'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) {
                        navigator.share({ title: `Perfil de ${seller.name}`, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        alert('Link copiado para a área de transferência!');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Compartilhar Perfil
                  </Button>
                </div>

                <Separator className="my-6" />

                {/* Bio */}
                {seller.bio && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Sobre</h3>
                    <p className="text-sm text-muted-foreground">{seller.bio}</p>
                  </div>
                )}

                {/* Estatísticas Rápidas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Tempo de resposta</span>
                    </div>
                    <Badge variant="secondary">{stats.responseTime}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>Taxa de resposta</span>
                    </div>
                    <Badge variant="secondary">{stats.responseRate}%</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>Taxa de conclusão</span>
                    </div>
                    <Badge variant="secondary">{stats.completionRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                  <div className="text-xs text-muted-foreground">Vendas</div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stats.totalServices}</div>
                  <div className="text-xs text-muted-foreground">Serviços</div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                    <Star className="h-5 w-5 text-warning" />
                  </div>
                  <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Rating Médio</div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stats.totalReviews}</div>
                  <div className="text-xs text-muted-foreground">Avaliações</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs com Conteúdo */}
            <Card className="animate-fade-in border-primary/20">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="services">
                      Serviços ({stats.totalServices})
                    </TabsTrigger>
                    <TabsTrigger value="reviews">
                      Avaliações ({stats.totalReviews})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  <TabsContent value="services" className="mt-0">
                    {listings.filter(l => l.status === 'active').length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Este vendedor ainda não possui serviços ativos
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {listings
                          .filter(l => l.status === 'active')
                          .map((listing, index) => (
                            <div
                              key={listing.id}
                              className="animate-fade-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <MarketCard listing={listing} />
                            </div>
                          ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <div className="space-y-6">
                      {/* Distribuição de Avaliações */}
                      <div>
                        <h3 className="font-semibold mb-4">Distribuição de Avaliações</h3>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((stars, index) => {
                            const count = ratingDistribution[5 - stars];
                            const percentage = stats.totalReviews > 0
                              ? (count / stats.totalReviews) * 100
                              : 0;

                            return (
                              <div key={stars} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                  <span className="text-sm font-medium">{stars}</span>
                                  <Star className="h-3 w-3 text-warning fill-warning" />
                                </div>
                                <Progress value={percentage} className="flex-1" />
                                <span className="text-sm text-muted-foreground w-12 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Avaliações Recentes */}
                      <div>
                        <h3 className="font-semibold mb-4">Avaliações Recentes</h3>
                        {stats.totalReviews === 0 ? (
                          <div className="text-center py-8">
                            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">
                              Este vendedor ainda não possui avaliações
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Mock reviews - em produção viria do banco */}
                            {[...Array(3)].map((_, i) => (
                              <Card key={i} className="border-muted">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>U{i + 1}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">Cliente {i + 1}</span>
                                        <div className="flex items-center gap-1">
                                          {[...Array(5)].map((_, j) => (
                                            <Star
                                              key={j}
                                              className="h-3 w-3 text-warning fill-warning"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        Excelente serviço! Muito profissional e entrega no prazo.
                                        Recomendo!
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Há {i + 1} {i === 0 ? 'semana' : 'semanas'}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
