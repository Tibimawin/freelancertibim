import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, MessageSquare, ArrowLeft, Shield, Wallet } from 'lucide-react';
import { MarketListing } from '@/types/firebase';
import { MarketService } from '@/services/marketService';
import { AuthService } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import DirectMessagesModal from '@/components/DirectMessagesModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { TransactionService } from '@/services/firebase';
import { DirectMessageService } from '@/services/directMessageService';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { DownloadService } from '@/services/downloadService';
import { AffiliateService } from '@/services/affiliateService';
import { AdminService } from '@/services/admin';

const formatPrice = (value: number, currency: string) => {
  const iso = currency === 'KZ' ? 'AOA' : currency;
  try {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: iso }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

export default function MarketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userData, switchUserMode, updateUserData } = useAuth();
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [dmOpen, setDmOpen] = useState(false);
  const isContractor = (userData?.currentMode === 'poster');
  const contractorBalance = (userData?.posterWallet?.balance ?? 0) + (userData?.posterWallet?.bonusBalance ?? 0);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [alreadyPurchasedOpen, setAlreadyPurchasedOpen] = useState(false);
  const [chatConfirmed, setChatConfirmed] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [chatStartedAt, setChatStartedAt] = useState<Date | null>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState<string | null>(null);
  // Avaliação pós-compra
  const [buyerOrderId, setBuyerOrderId] = useState<string | null>(null);
  const [buyerOrderStatus, setBuyerOrderStatus] = useState<('pending' | 'paid' | 'delivered' | 'cancelled') | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingText, setRatingText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const ratingBlockRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const [allowed, setAllowed] = useState(true);
  const formatKZ = (value: number) => {
    try {
      return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
    } catch {
    return `${value.toFixed(2)} Kz`;
    }
  };

  // Link de afiliado para o usuário atual
  const affiliateLink = useMemo(() => {
    if (!id || !currentUser?.uid) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/market/${id}?aff=${currentUser.uid}`;
  }, [id, currentUser?.uid]);

  // Resolve template substituindo placeholders simples
  const resolveTemplate = (tpl: string, item?: MarketListing | null) => {
    const title = item?.title || '';
    const seller = item?.sellerName || '';
    return tpl
      .replace(/\{\{\s*title\s*\}\}/g, title)
      .replace(/\{\{\s*seller\s*\}\}/g, seller);
  };

  // Carregar anúncio e definir mensagem inicial baseada em template de configurações
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        try {
          const ft = await AdminService.getFeatureToggles();
          if (!ft.marketEnabled) {
            setAllowed(false);
            navigate('/');
            return;
          }
        } catch { void 0; }
        const item = await MarketService.getListing(id);
        setListing(item);
        // Buscar avatar do vendedor
        try {
          if (item?.sellerId) {
            const seller = await AuthService.getUserData(item.sellerId);
            setSellerAvatarUrl(seller?.avatarUrl || null);
          } else {
            setSellerAvatarUrl(null);
          }
        } catch (e) {
          console.warn('Falha ao buscar avatar do vendedor:', e);
          setSellerAvatarUrl(null);
        }
        const tpl = userData?.settings?.messageTemplates?.directMessageInitial;
        const fallback = item ? `tenho interesse nesse produto${item.title ? `: ${item.title}` : ''}` : 'tenho interesse nesse produto';
        setInitialMessage(tpl ? resolveTemplate(tpl, item) : fallback);
      } catch (e) {
        console.error('Erro ao carregar anúncio', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, userData]);

  // Registrar clique em link de afiliado (quando acessado com ?aff=)
  useEffect(() => {
    try {
      const affParam = searchParams.get('aff') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('aff') : null);
      if (!id || !affParam) return;
      // Evita logar clique do próprio afiliado
      if (currentUser?.uid && currentUser.uid === affParam) return;
      AffiliateService.logClick({ affiliateId: affParam, listingId: id!, visitorId: currentUser?.uid || null }).catch(() => {});
    } catch {
      // silencioso
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser?.uid]);

  // Imagens: derivar galeria de imagens de listing
  const images: string[] = useMemo(() => {
    const list = (listing?.images && listing.images.length ? listing.images : []);
    if (!list.length && listing?.imageUrl) return [listing.imageUrl];
    return list;
  }, [listing]);

  // Resetar seleção ao trocar de anúncio
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [listing?.id]);

  // Buscar pedido do comprador para este anúncio e verificar se já avaliou
  useEffect(() => {
    const loadBuyerOrder = async () => {
      try {
        if (!listing?.id || !currentUser?.uid) return;
        const order = await MarketService.getLatestOrderForBuyerListing(currentUser.uid, listing.id);
        if (order) {
          setBuyerOrderId(order.id);
          setBuyerOrderStatus(order.status);
          if (order.rating) {
            setHasRated(true);
            setRatingValue(order.rating);
          }
        } else {
          setBuyerOrderId(null);
          setBuyerOrderStatus(null);
          setHasRated(false);
          setRatingValue(0);
        }
      } catch (e) {
        console.warn('Falha ao buscar pedido do comprador para avaliação', e);
      }
    };
    loadBuyerOrder();
  }, [listing?.id, currentUser?.uid]);

  const logAuditChatInitiated = async () => {
    try {
      if (!listing || !currentUser || !userData) return;
      await addDoc(collection(db, 'market_audit'), {
        action: 'chat_initiated',
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: currentUser.uid,
        buyerName: userData.name,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        createdAt: Timestamp.now(),
      });
    } catch (e) {
      console.warn('Falha ao registrar auditoria de chat', e);
    }
  };

  // Abrir chat com o vendedor e enviar mensagem automática de interesse
  const openChatWithSeller = async () => {
    try {
      if (!currentUser) {
        toast({ title: 'Faça login', description: 'Entre para conversar com o vendedor.', variant: 'destructive' });
        return;
      }
      if (!listing) return;
      const threadId = await DirectMessageService.getOrCreateThread(currentUser.uid, listing.sellerId);
      const senderName = currentUser.displayName || userData?.name || 'Usuário';
      const text = (initialMessage || `tenho interesse nesse produto${listing.title ? `: ${listing.title}` : ''}`).trim();
      await DirectMessageService.sendMessage(threadId, currentUser.uid, senderName, listing.sellerId, text);
      setDmOpen(true);
      setChatConfirmed(true);
      setChatStarted(true);
      setChatStartedAt(new Date());
      logAuditChatInitiated().catch(() => {});
      toast({ title: 'Conversa iniciada', description: `Mensagem enviada para ${listing.sellerName}.` });
    } catch (e: any) {
      console.error('Erro ao iniciar conversa automática com vendedor:', e);
      const msg = e?.message?.includes('disabled') ? 'Mensagens diretas estão desativadas nas configurações.' : (e?.message || 'Falha ao enviar mensagem.');
      toast({ title: 'Erro ao iniciar chat', description: msg, variant: 'destructive' });
    }
  };

  // Exibir tempo relativo desde início do chat
  const relativeSince = useMemo(() => {
    if (!chatStartedAt) return '';
    const diffMs = Date.now() - chatStartedAt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    if (diffMin < 1) return 'há poucos segundos';
    if (diffMin < 60) return `há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    return `há ${diffH} hora${diffH > 1 ? 's' : ''}`;
  }, [chatStartedAt]);

  // Fluxo de compra segura com verificação de modo, saldo e confirmação de chat
  const handleOpenPurchase = () => {
    if (!currentUser) {
      toast({ title: 'Faça login', description: 'Entre para realizar compras no Mercado.', variant: 'destructive' });
      return;
    }
    if (!isContractor) {
      toast({ title: 'Conta contratante inativa', description: 'Ative a conta contratante para comprar.', variant: 'destructive' });
      return;
    }
    // Verificação simples: se já foi entregue e é digital, sugerir download
    if (listing?.productType === 'digital' && !!listing?.downloadUrl && buyerOrderStatus === 'delivered') {
      setAlreadyPurchasedOpen(true);
      return;
    }
    setPurchaseOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!currentUser || !userData || !listing) return;
    const isDigital = listing.productType === 'digital' && !!listing.downloadUrl && (listing.autoDeliver ?? true);
    if (!isContractor) {
      toast({ title: 'Conta contratante inativa', description: 'Ative a conta contratante para comprar.', variant: 'destructive' });
      return;
    }
    if (!isDigital && !chatConfirmed) {
      toast({ title: 'Confirmação necessária', description: 'Confirme que já conversou com o vendedor via chat.', variant: 'destructive' });
      return;
    }
    if (contractorBalance < listing.price) {
      toast({ title: 'Saldo insuficiente', description: 'Seu saldo é insuficiente para esta compra.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Capturar afiliado da URL (se válido)
      const affParam = searchParams.get('aff') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('aff') : null);
      const affiliateId = affParam && affParam !== currentUser.uid && affParam !== listing.sellerId ? affParam : undefined;
      // Criar pedido do Mercado (pending)
      const orderId = await MarketService.placeOrder({
        listingId: listing.id,
        buyerId: currentUser.uid,
        buyerName: userData.name,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        amount: listing.price,
        currency: listing.currency,
        ...(affiliateId ? { affiliateId } : {}),
      });

      // Determinar uso de bônus (respeitando expiração)
      const bonusExpiresRaw = userData.posterWallet?.bonusExpiresAt;
      const bonusObj = bonusExpiresRaw as { toDate?: () => Date } | undefined;
      const bonusExpiresDate = bonusObj && typeof bonusObj.toDate === 'function' ? bonusObj.toDate!() : (bonusExpiresRaw ? new Date(bonusExpiresRaw as Date | string | number) : null);
      const bonusValid = !bonusExpiresDate || bonusExpiresDate > new Date();
      const currentBonus = userData.posterWallet?.bonusBalance ?? 0;
      const useBonusPre = bonusValid ? Math.min(currentBonus, listing.price) : 0;

      // Registrar transação de escrow vinculada ao pedido/anúncio
      await TransactionService.createTransaction({
        userId: currentUser.uid,
        type: 'escrow',
        amount: listing.price,
        currency: listing.currency,
        status: 'completed',
        description: `Escrow Mercado: ${listing.title}${useBonusPre > 0 ? ` (bônus usado: ${useBonusPre} Kz)` : ''}`,
        provider: 'system',
        metadata: { orderId, listingId: listing.id, sellerId: listing.sellerId, bonusUsed: useBonusPre },
      } as any);

      // Atualizar saldo: consumir bônus primeiro, mover total para pendente (escrow)
      const currentPending = userData.posterWallet?.pendingBalance ?? 0;
      const totalDeposits = userData.posterWallet?.totalDeposits ?? 0;
      const currentBalance = userData.posterWallet?.balance ?? 0;
      const currentBonus2 = userData.posterWallet?.bonusBalance ?? 0;
      const useBonus = bonusValid ? Math.min(currentBonus2, listing.price) : 0;
      const useCash = listing.price - useBonus;

      

      await switchUserMode('poster');
      await updateUserData({
        posterWallet: {
          balance: currentBalance - useCash,
          bonusBalance: currentBonus - useBonus,
          pendingBalance: currentPending + listing.price,
          totalDeposits,
        } as any,
      } as any);

      toast({ title: 'Compra iniciada', description: 'Pagamento confirmado. Preparando entrega...' });
      setPurchaseOpen(false);
      setChatConfirmed(false);
      // Atualizar status do pedido: pago imediatamente
      try {
        await MarketService.updateOrderStatus(orderId, 'paid');
      } catch (e) {
        console.warn('Falha ao atualizar status do pedido para pago:', e);
      }

      // Produtos digitais: liberar automaticamente o download e marcar como entregue
      try {
        if (listing?.productType === 'digital' && listing?.downloadUrl) {
          await MarketService.updateOrderStatus(orderId, 'delivered');
          setBuyerOrderStatus('delivered');
          toast({ title: 'Download liberado', description: 'Seu produto digital foi entregue e pode ser baixado em Minhas Compras.' });
          // Gerar token automaticamente e redirecionar para página de download
          try {
            const token = await DownloadService.createToken({
              listingId: listing.id,
              buyerId: currentUser!.uid,
              downloadUrl: listing.downloadUrl,
              ttlMinutes: 30,
            });
            navigate(`/download/${token}`);
          } catch (e) {
            // Se falhar, mantém a liberação e o botão de Download na página
            console.warn('Falha ao gerar token de download automático:', e);
          }
        } else {
          setBuyerOrderStatus('paid');
        }
      } catch (e) {
        console.warn('Falha ao liberar entrega automática de produto digital:', e);
      }

      // Tornar bloco de avaliação visível e rolar até ele
      setBuyerOrderId(orderId);
      setHasRated(false);
      setRatingValue(0);
      setTimeout(() => {
        ratingBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      // Nota: digitais são entregues automaticamente; físicos/serviços aguardam entrega do vendedor
    } catch (err: any) {
      console.error('Erro ao comprar no Mercado:', err);
      toast({ title: 'Erro na compra', description: err?.message || 'Falha ao iniciar escrow.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    try {
      if (!buyerOrderId || !listing || !currentUser) {
        toast({ title: 'Não foi possível avaliar', description: 'Pedido não encontrado ou usuário não autenticado.', variant: 'destructive' });
        return;
      }
      if (buyerOrderStatus !== 'delivered') {
        toast({ title: 'Avaliação indisponível', description: 'A avaliação só é liberada após a entrega concluída.', variant: 'destructive' });
        return;
      }
      if (ratingValue < 1 || ratingValue > 5) {
        toast({ title: 'Selecione uma nota', description: 'Escolha entre 1 e 5 estrelas.' });
        return;
      }
      setRatingSubmitting(true);
      await MarketService.rateOrderAndListing({ orderId: buyerOrderId, listingId: listing.id, rating: ratingValue, review: ratingText.trim() || undefined });
      setHasRated(true);
      toast({ title: 'Avaliação registrada', description: 'Obrigado por avaliar o produto!' });
    } catch (e: any) {
      console.error('Erro ao enviar avaliação:', e);
      toast({ title: 'Erro ao avaliar', description: e?.message || 'Falha ao registrar avaliação.', variant: 'destructive' });
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Download rápido na página do anúncio: gera token e navega
  const handleQuickDownload = async () => {
    try {
      if (!listing || !currentUser) return;
      if (!(listing.productType === 'digital' && listing.downloadUrl)) return;
      const token = await DownloadService.createToken({
        listingId: listing.id,
        buyerId: currentUser.uid,
        downloadUrl: listing.downloadUrl,
        ttlMinutes: 30,
      });
      navigate(`/download/${token}`);
    } catch (e) {
      // opcional: adicionar toast de erro
    }
  };

  if (!allowed) return null;
  if (loading) {
    return (
      <div>
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <div className="container mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold">Mercado</h1>
            <p className="text-muted-foreground">Detalhes do anúncio</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
          <div className="grid md:grid-cols-3 gap-6 animate-pulse">
            <div className="md:col-span-2 h-64 rounded-lg bg-muted/30" />
            <div className="h-64 rounded-lg bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div>
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <div className="container mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold">Mercado</h1>
            <p className="text-muted-foreground">Detalhes do anúncio</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/market')} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Mercado</Button>
          <Card className="bg-card border border-border shadow-sm">
            <CardContent className="p-6 text-center text-muted-foreground">
              Anúncio não encontrado.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  

  return (
    <div>
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <div className="container mx-auto px-4 md:py-10 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">Mercado</h1>
          <p className="text-sm md:text-base text-muted-foreground">Detalhes do anúncio</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 pb-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
        <div className="grid md:grid-cols-3 gap-6">
        {/* Imagem e detalhes principais */}
        <Card className="md:col-span-2 bg-card border border-border shadow-sm">
          <CardContent className="p-0">
            <AspectRatio ratio={4/3}>
              {images.length > 0 ? (
                <img src={images[selectedImageIndex]} alt={listing.title} className="w-full h-full object-cover rounded-t-lg" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-t-lg">Sem imagem</div>
              )}
            </AspectRatio>
            {images.length > 1 && (
              <div className="px-6 pt-3 pb-1">
                <ScrollArea className="w-full">
                  <div className="flex gap-2 overflow-x-auto snap-x">
                    {images.slice(0, 8).map((img, idx) => (
                      <button
                        key={img + idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded border ${selectedImageIndex === idx ? 'ring-2 ring-primary border-primary' : 'border-border'} overflow-hidden flex-shrink-0 snap-start`}
                        aria-label={`Imagem ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold">{listing.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>{(listing.rating ?? 0).toFixed(1)} ({listing.ratingCount ?? 0} avaliações){hasRated && ratingValue > 0 ? ` • sua nota: ${ratingValue}` : ''}</span>
              </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{formatPrice(listing.price, listing.currency)}</div>
                  <div className="text-sm text-muted-foreground">Preço do serviço</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {listing.tags?.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>

              <Separator />

              <div className="md:hidden">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="desc">
                    <AccordionTrigger>
                      <span className="text-sm font-medium">Descrição</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.description}</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div className="hidden md:block space-y-2">
                <h2 className="text-lg font-semibold">Descrição</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={sellerAvatarUrl || undefined} />
                    <AvatarFallback>{(listing.sellerName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm">Vendedor</div>
                    <button className="font-medium hover:underline" onClick={() => navigate(`/profile/${listing.sellerId}`)}>
                      {listing.sellerName}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={openChatWithSeller}><MessageSquare className="h-4 w-4 mr-2" />Conversar</Button>
                  {chatStarted && <Badge variant="default">Conversa iniciada {relativeSince || ''}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo lateral */}
        <Card className="bg-card border border-border shadow-sm hidden md:block">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={listing.status === 'active' ? 'default' : 'destructive'}>{listing.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Criado em</span>
              <span className="text-sm">{new Date(listing.createdAt).toLocaleString('pt-BR')}</span>
            </div>

            {(listing.category || listing.subcategory) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Categoria</span>
                <span className="text-sm font-medium truncate">{[listing.category, listing.subcategory].filter(Boolean).join(' / ')}</span>
              </div>
            )}
            {(listing.brand || listing.model) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marca / Modelo</span>
                <span className="text-sm font-medium truncate">{[listing.brand, listing.model].filter(Boolean).join(' ')}</span>
              </div>
            )}
            {listing.condition && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Condição</span>
                <span className="text-sm font-medium">{listing.condition === 'new' ? 'Novo' : listing.condition === 'used' ? 'Usado' : 'Recondicionado'}</span>
              </div>
            )}
            {(listing.sku || typeof listing.stock === 'number') && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SKU / Estoque</span>
                <span className="text-sm font-medium">{[listing.sku, typeof listing.stock === 'number' ? String(listing.stock) : undefined].filter(Boolean).join(' • ')}</span>
              </div>
            )}
            {listing.warranty && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Garantia</span>
                <span className="text-sm font-medium truncate">{listing.warranty}</span>
              </div>
            )}
            {listing.deliveryInfo && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Entrega</span>
                <span className="text-sm font-medium truncate">{listing.deliveryInfo}</span>
              </div>
            )}
            {listing.returnPolicy && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Devolução</span>
                <span className="text-sm font-medium truncate">{listing.returnPolicy}</span>
              </div>
            )}
            {listing.details && (
              <div className="pt-2">
                <Separator className="my-2" />
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Detalhes / Especificações</span>
                  <p className="text-sm whitespace-pre-line">{listing.details}</p>
                </div>
              </div>
            )}

            {currentUser && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Conta contratante</span>
                  <Badge variant={isContractor ? 'default' : 'secondary'} className="ml-auto">
                    {isContractor ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span className="text-sm font-medium">{formatKZ(contractorBalance)}</span>
                </div>
                {!isContractor && (
                  <Button variant="outline" size="sm" onClick={() => switchUserMode('poster')}>
                    Ativar conta contratante
                  </Button>
                )}
              </div>
            )}

            <div className="mt-2 p-3 rounded-md bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Aviso de compra segura</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Antes de efetuar qualquer compra, entre em contacto com o vendedor via chat e acerte os detalhes do produto/serviço, prazos e garantias. Pagamentos usam o saldo da sua conta contratante.
              </p>
              {chatStarted && (
                <div className="mt-2">
                  <Badge variant="default">Conversa iniciada com o vendedor {relativeSince || ''}</Badge>
                </div>
              )}
            </div>
            <div className="pt-2">
              {buyerOrderStatus === 'delivered' && listing.productType === 'digital' && !!listing.downloadUrl ? (
                <Button onClick={handleQuickDownload} className="w-full">
                  Download
                </Button>
              ) : (
                <Button disabled={!currentUser || !isContractor} onClick={handleOpenPurchase} className="w-full">
                  Comprar
                </Button>
              )}
              {!isContractor && (
                <p className="mt-1 text-xs text-muted-foreground">Ative a conta contratante para habilitar compras.</p>
              )}
              {isContractor && contractorBalance < listing.price && (
                <p className="mt-1 text-xs text-muted-foreground">Saldo insuficiente para esta compra.</p>
              )}
            </div>

            {/* Afiliados: compartilhar link para ganhar comissão */}
            {currentUser && (
              <div className="mt-4 p-3 rounded-md bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Ganhe dinheiro compartilhando</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Compartilhe seu link de afiliado deste produto. Se alguém comprar por ele, você recebe comissão.</p>
                <div className="flex gap-2 mb-2">
                  <Input value={affiliateLink} readOnly className="text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!affiliateLink) return;
                        await navigator.clipboard.writeText(affiliateLink);
                        // Logar evento de compartilhamento (copiar)
                        if (currentUser?.uid && listing?.id) {
                          AffiliateService.logShare({ affiliateId: currentUser.uid, listingId: listing.id, platform: 'copy' }).catch(() => {});
                        }
                        toast({ title: 'Link copiado', description: 'Seu link de afiliado foi copiado.' });
                      } catch {
                        toast({ title: 'Falha ao copiar', description: 'Copie manualmente o link acima.', variant: 'destructive' });
                      }
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                {/* Botões de compartilhamento rápidos */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!affiliateLink) return;
                      const text = `Confira este produto: ${listing.title} — ${affiliateLink}`;
                      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                      // Logar evento de compartilhamento (WhatsApp)
                      if (currentUser?.uid && listing?.id) {
                        AffiliateService.logShare({ affiliateId: currentUser.uid, listingId: listing.id, platform: 'WhatsApp' }).catch(() => {});
                      }
                      window.open(url, '_blank');
                    }}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!affiliateLink) return;
                      const text = `Confira este produto: ${listing.title}`;
                      const url = `https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${encodeURIComponent(text)}`;
                      // Logar evento de compartilhamento (Telegram)
                      if (currentUser?.uid && listing?.id) {
                        AffiliateService.logShare({ affiliateId: currentUser.uid, listingId: listing.id, platform: 'Telegram' }).catch(() => {});
                      }
                      window.open(url, '_blank');
                    }}
                  >
                    Telegram
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!affiliateLink) return;
                      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateLink)}`;
                      // Logar evento de compartilhamento (Facebook)
                      if (currentUser?.uid && listing?.id) {
                        AffiliateService.logShare({ affiliateId: currentUser.uid, listingId: listing.id, platform: 'Facebook' }).catch(() => {});
                      }
                      window.open(url, '_blank');
                    }}
                  >
                    Facebook
                  </Button>
                </div>
                {/* Indicador de ganho esperado por venda */}
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const rate = typeof listing.affiliateCommissionRate === 'number' ? listing.affiliateCommissionRate : 0.05;
                    const expected = (listing.price || 0) * rate;
                    return `Ganho estimado por venda: ${expected.toLocaleString('pt-BR')} ${listing.currency} (${Math.round(rate * 100)}%)`;
                  })()}
                </div>
              </div>
            )}

            {/* Avaliação pós-compra */}
            {buyerOrderId && (
              <div ref={ratingBlockRef} className="mt-4 p-3 rounded-md bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">Avalie sua compra</span>
                </div>
                {hasRated ? (
                  <p className="text-xs text-muted-foreground">Você já avaliou este produto. Obrigado!</p>
                ) : buyerOrderStatus !== 'delivered' ? (
                  <p className="text-xs text-muted-foreground">A avaliação será liberada após a entrega concluída.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1" role="radiogroup" aria-label="Selecione sua avaliação">
                      {[0,1,2,3,4].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRatingValue(i + 1)}
                          aria-label={`Avaliar ${i + 1}`}
                          className="p-1"
                        >
                          <Star className={`h-5 w-5 ${i < ratingValue ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Escreva um comentário (opcional)"
                      value={ratingText}
                      onChange={(e) => setRatingText(e.target.value)}
                    />
                    <Button size="sm" onClick={handleSubmitRating} disabled={ratingSubmitting || ratingValue < 1}>
                      {ratingSubmitting ? 'Enviando...' : 'Enviar avaliação'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Barra de ações fixa no mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Preço</span>
            <span className="text-base font-semibold">{formatPrice(listing.price, listing.currency || 'KZ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openChatWithSeller}><MessageSquare className="h-4 w-4 mr-1" />Chat</Button>
            {buyerOrderStatus === 'delivered' && listing.productType === 'digital' && !!listing.downloadUrl ? (
              <Button size="sm" onClick={handleQuickDownload}>Download</Button>
            ) : (
              <Button size="sm" onClick={handleOpenPurchase} disabled={!currentUser || !isContractor || (isContractor && contractorBalance < listing.price)}>Comprar</Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de mensagens diretas */}
      <DirectMessagesModal open={dmOpen} onOpenChange={setDmOpen} initialRecipientId={listing.sellerId} />
      {/* Modal de produto já comprado (digital entregue) */}
      <Dialog open={alreadyPurchasedOpen} onOpenChange={setAlreadyPurchasedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Você já possui este produto</DialogTitle>
            <DialogDescription>
              Este é um produto digital que já foi entregue para você. Deseja baixar novamente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAlreadyPurchasedOpen(false)}>Fechar</Button>
            <Button variant="outline" onClick={() => { setAlreadyPurchasedOpen(false); navigate('/market/compras'); }}>Ver Minhas Compras</Button>
            <Button onClick={() => { setAlreadyPurchasedOpen(false); handleQuickDownload(); }}>Baixar agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de confirmação de compra */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar compra segura</DialogTitle>
            <DialogDescription>
              Antes de comprar, confirme que já conversou com o vendedor via chat e acertou detalhes do produto/serviço, prazos e garantias. O pagamento usará o saldo da conta contratante e ficará em escrow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm">Mensagem inicial</label>
              <Input
                placeholder="Escreva a mensagem inicial"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={openChatWithSeller}>
              <MessageSquare className="h-4 w-4 mr-2" /> Abrir chat com vendedor
            </Button>
            {/* Para produtos digitais com entrega automática, não exigir confirmação de chat */}
            {!(listing?.productType === 'digital' && (listing?.autoDeliver ?? true)) && (
              <div className="flex items-center gap-2">
                <Checkbox id="chatConfirmed" checked={chatConfirmed} onCheckedChange={(v) => setChatConfirmed(!!v)} />
                <label htmlFor="chatConfirmed" className="text-sm flex items-center gap-2">
                  Confirmo que já conversei com o vendedor via chat.
                  {chatStarted && <Badge variant="secondary">Conversa iniciada {relativeSince || ''}</Badge>}
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPurchaseOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleConfirmPurchase} disabled={submitting || ((!(listing?.productType === 'digital' && (listing?.autoDeliver ?? true))) && !chatConfirmed) || (contractorBalance < (listing?.price || 0))}>
              {submitting ? 'Processando...' : 'Confirmar compra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}