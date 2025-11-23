import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ServicesService } from '@/services/servicesService';
import { ServiceListing } from '@/types/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AuthService } from '@/services/auth';
import DirectMessagesModal from '@/components/DirectMessagesModal';
import { Clock, RefreshCw, ChevronLeft, ChevronRight, Star, ExternalLink, MessageSquare } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { LevelService } from '@/services/levelService';
import type { User } from '@/types/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionService } from '@/services/firebase';
import { NotificationService } from '@/services/notificationService';
import ServiceOrderService from '@/services/serviceOrderService';
import { AdminService } from '@/services/admin';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerAvatarUrl, setSellerAvatarUrl] = useState<string | null>(null);
  const [openDM, setOpenDM] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sellerData, setSellerData] = useState<User | null>(null);
  const [sellerLevel, setSellerLevel] = useState<{ level: string } | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const { currentUser, userData, switchUserMode, updateUserData } = useAuth();
  const { toast } = useToast();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [readInfoConfirmed, setReadInfoConfirmed] = useState(false);
  const [chatConfirmed, setChatConfirmed] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const levelLabelMap: Record<string, string> = {
    'Inicial': 'Bronze',
    'Avançado': 'Prata',
    'Especialista': 'Ouro',
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        try {
          const ft = await AdminService.getFeatureToggles();
          if (!ft.servicesEnabled) {
            navigate('/');
            return;
          }
        } catch { void 0; }
        const item = await ServicesService.get(id);
        setListing(item);
        if (item?.sellerId) {
          const seller = await AuthService.getUserData(item.sellerId);
          setSellerAvatarUrl(seller?.avatarUrl || null);
          setSellerData(seller || null);
          try {
            const lvl = await LevelService.getUserLevel(item.sellerId);
            setSellerLevel({ level: lvl.level });
          } catch (e) {
            // silencioso: se falhar cálculo de nível, não bloqueia UI
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Serviço não encontrado.</p>
            <Button asChild className="mt-4"><Link to="/services">Voltar aos serviços</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const imagesList = (Array.isArray(listing.images) && listing.images.length > 0)
    ? listing.images
    : (listing.imageUrl ? [listing.imageUrl] : []);
  const imageSrc = imagesList[selectedImageIndex] || undefined;

  const isSeller = !!(currentUser?.uid && listing?.sellerId && currentUser.uid === listing.sellerId);
  const isContractor = (userData?.currentMode === 'poster');
  const contractorBalance = (userData?.posterWallet?.balance ?? 0) + (userData?.posterWallet?.bonusBalance ?? 0);
  const freelancerBalance = (userData?.testerWallet?.availableBalance ?? 0);

  const handleOpenPurchase = () => {
    if (!currentUser) {
      toast({ title: 'Faça login', description: 'Entre para comprar serviços.', variant: 'destructive' });
      return;
    }
    if (isSeller) {
      toast({ title: 'Ação não permitida', description: 'Você não pode comprar seu próprio serviço.', variant: 'destructive' });
      return;
    }
    if (!isContractor) {
      toast({ title: 'Conta contratante inativa', description: 'Ative a conta contratante para comprar serviços.', variant: 'destructive' });
      return;
    }
    if (listing && contractorBalance < listing.price) {
      toast({ title: 'Saldo insuficiente', description: 'Seu saldo é insuficiente para esta compra.', variant: 'destructive' });
      return;
    }
    setPurchaseOpen(true);
  };

  const handleConfirmPurchase = async () => {
    try {
      if (!currentUser || !listing || !userData) return;
      if (!termsAccepted) {
        toast({ title: 'Aceite os termos', description: 'Você deve aceitar os termos de compra.', variant: 'destructive' });
        return;
      }
      if (!readInfoConfirmed) {
        toast({ title: 'Confirmação necessária', description: 'Confirme que leu todas as informações do serviço.', variant: 'destructive' });
        return;
      }
      if (!chatConfirmed) {
        toast({ title: 'Confirmação de chat', description: 'Confirme que já conversou com o vendedor.', variant: 'destructive' });
        return;
      }
      if (!isContractor) {
        toast({ title: 'Conta contratante inativa', description: 'Ative a conta contratante para comprar.', variant: 'destructive' });
        return;
      }
      if (contractorBalance < listing.price) {
        toast({ title: 'Saldo insuficiente', description: 'Seu saldo é insuficiente para esta compra.', variant: 'destructive' });
        return;
      }
      setSubmitting(true);
      // Criar pedido de serviço (pending)
      const orderId = await ServiceOrderService.placeOrder({
        listingId: listing.id,
        buyerId: currentUser.uid,
        buyerName: userData.name,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        amount: listing.price,
        currency: listing.currency,
      });

      // Determinar uso de bônus
      
      const bonusExpiresRaw = userData.posterWallet?.bonusExpiresAt;
      const bonusObj = bonusExpiresRaw as { toDate?: () => Date } | undefined;
      const bonusExpiresDate = bonusObj && typeof bonusObj.toDate === 'function' ? bonusObj.toDate!() : (bonusExpiresRaw ? new Date(bonusExpiresRaw as Date | string | number) : null);
      const bonusValid = !bonusExpiresDate || bonusExpiresDate > new Date();
      const currentBonus = userData.posterWallet?.bonusBalance ?? 0;
      const useBonusPre = bonusValid ? Math.min(currentBonus, listing.price) : 0;

      // Transação de escrow
      await TransactionService.createTransaction({
        userId: currentUser.uid,
        type: 'escrow',
        amount: listing.price,
        currency: listing.currency,
        status: 'completed',
        description: `Escrow Serviço: ${listing.title}${useBonusPre > 0 ? ` (bônus usado: ${useBonusPre} Kz)` : ''}`,
        provider: 'system',
        metadata: { orderId, listingId: listing.id, sellerId: listing.sellerId, service: true, bonusUsed: useBonusPre },
      } as any);

      // Atualizar carteira (bloqueio em pendente)
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
          updatedAt: new Date(),
        },
      } as any);

      await ServiceOrderService.updateOrderStatus(orderId, 'paid');

      // Notificar o vendedor sobre novo pedido pago
      try {
        await NotificationService.createNotification({
          userId: listing.sellerId,
          type: 'service_order_paid',
          title: 'Novo pedido de serviço',
          message: `${userData.name} realizou um pedido para "${listing.title}". O pagamento em escrow foi registrado.`,
          read: false,
          metadata: { orderId, listingId: listing.id },
        });
      } catch (e) {
        // falha de notificação não bloqueia a compra
        console.warn('Falha ao notificar vendedor do serviço', e);
      }

      // Creditar saldo pendente ao vendedor (tester) até liberação por admin
      try {
        const sellerData = await AuthService.getUserData(listing.sellerId);
        const currentPendingSeller = sellerData?.testerWallet?.pendingBalance ?? 0;
        await AuthService.updateUserData(listing.sellerId, {
          testerWallet: {
            availableBalance: sellerData?.testerWallet?.availableBalance ?? 0,
            pendingBalance: currentPendingSeller + listing.price,
            totalEarnings: sellerData?.testerWallet?.totalEarnings ?? 0,
            updatedAt: new Date(),
          } as any,
        } as any);

        await TransactionService.createTransaction({
          userId: listing.sellerId,
          type: 'service_sale_pending',
          amount: listing.price,
          currency: listing.currency,
          status: 'pending',
          description: `Venda pendente (escrow) do serviço: ${listing.title}`,
          provider: 'system',
          metadata: { orderId, listingId: listing.id, buyerId: currentUser.uid, service: true },
        } as any);
      } catch (e) {
        console.warn('Falha ao registrar pendente do vendedor ou transação', e);
      }

      toast({ title: 'Compra iniciada', description: 'Pagamento em escrow registrado. O vendedor será notificado.' });
      setPurchaseOpen(false);
      setTermsAccepted(false);
      setReadInfoConfirmed(false);
      setChatConfirmed(false);
      setInitialMessage('');
    } catch (e: any) {
      toast({ title: 'Erro na compra', description: e?.message || 'Falha ao confirmar.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openChatWithSeller = () => {
    setOpenDM(true);
  };

  const handleDeleteService = async () => {
    try {
      if (!listing?.id) return;
      setDeleting(true);
      await ServicesService.remove(listing.id);
      toast({ title: 'Serviço eliminado', description: 'Seu serviço foi removido com sucesso.' });
      setDeleteOpen(false);
      navigate('/services');
    } catch (e: any) {
      toast({ title: 'Erro ao eliminar', description: e?.message || 'Falha ao remover serviço.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                <Link to="/services" className="hover:underline">Serviços</Link>
                <span> / Detalhe</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{listing.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {typeof listing.rating === 'number' && (
                  <span className="text-sm text-muted-foreground">⭐ {listing.rating.toFixed(1)}{typeof listing.ratingCount === 'number' ? ` (${listing.ratingCount} avaliações)` : ''}</span>
                )}
                {(listing.category || listing.subcategory) && (
                  <Badge variant="outline">{listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ''}</Badge>
                )}
                <span className="text-sm text-muted-foreground">Por {listing.sellerName}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Galeria e descrição */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden relative">
            {imageSrc ? (
              <AspectRatio ratio={16 / 9}>
                <img src={imageSrc} alt={listing.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </AspectRatio>
            ) : (
              <div className="w-full h-80 sm:h-[28rem] flex items-center justify-center text-muted-foreground">Sem imagem</div>
            )}
            {Array.isArray(listing.imageCaptions) && listing.imageCaptions[selectedImageIndex] && (
              <div className="absolute left-0 right-0 bottom-0 bg-background/80 backdrop-blur-sm border-t border-border px-3 py-2 text-xs text-muted-foreground">
                {listing.imageCaptions[selectedImageIndex]}
              </div>
            )}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Imagem anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background rounded-full p-2 border border-border shadow"
                  onClick={() => setSelectedImageIndex((i) => (i - 1 + imagesList.length) % imagesList.length)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Próxima imagem"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background rounded-full p-2 border border-border shadow"
                  onClick={() => setSelectedImageIndex((i) => (i + 1) % imagesList.length)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 text-xs px-2 py-1 rounded-full border border-border">
                  {selectedImageIndex + 1} / {imagesList.length}
                </div>
              </>
            )}
          </div>
          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2">
              {imagesList.map((src, idx) => (
                <button
                  key={src + idx}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border ${selectedImageIndex === idx ? 'border-primary' : 'border-border'}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`Imagem ${idx + 1}${listing.imageCaptions?.[idx] ? ` - ${listing.imageCaptions[idx]}` : ''}`}
                >
                  <img src={src} alt={`Miniatura ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
          <Card>
            <CardContent className="p-6 space-y-3">
              {/* Tags principais */}
              {(listing.tags && listing.tags.length > 0) && (
                <div className="flex gap-2 flex-wrap">
                  {listing.tags.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="prose prose-sm max-w-none text-foreground">
                {listing.description}
              </div>
              {/* Campos adicionais do serviço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {listing.category && (
                  <div>
                    <div className="text-xs text-muted-foreground">Categoria</div>
                    <div className="text-sm font-medium">{listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ''}</div>
                  </div>
                )}
                {listing.deliveryTime && (
                  <div>
                    <div className="text-xs text-muted-foreground">Prazo de Entrega</div>
                    <div className="text-sm font-medium">{listing.deliveryTime}</div>
                  </div>
                )}
              </div>

              {Array.isArray(listing.includedItems) && listing.includedItems.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-1">O Que Está Incluído</div>
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {listing.includedItems.map((it, idx) => (<li key={idx}>{it}</li>))}
                  </ul>
                </div>
              )}

              {Array.isArray(listing.excludedItems) && listing.excludedItems.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-semibold mb-1">O Que Não Está Incluído</div>
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {listing.excludedItems.map((it, idx) => (<li key={idx}>{it}</li>))}
                  </ul>
                </div>
              )}

              {Array.isArray(listing.clientRequirements) && listing.clientRequirements.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-semibold mb-1">Requisitos do Cliente</div>
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {listing.clientRequirements.map((it, idx) => (<li key={idx}>{it}</li>))}
                  </ul>
                </div>
              )}

              {(listing.revisionsIncluded ?? 0) > 0 && (
                <div className="mt-3 text-sm">
                  <span className="font-semibold">Revisões Inclusas:</span> {listing.revisionsIncluded}
                </div>
              )}

              {listing.terms && (
                <div className="mt-3">
                  <div className="text-sm font-semibold mb-1">Termos e Condições</div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">{listing.terms}</div>
                </div>
              )}

              {listing.portfolioUrl && (
                <div className="mt-3 text-sm">
                  <a href={listing.portfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Ver Portfólio/Exemplos</a>
                </div>
              )}

              {listing.availability && (
                <div className="mt-3">
                  <div className="text-sm font-semibold mb-1">Disponibilidade</div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">{listing.availability}</div>
                </div>
              )}

              {Array.isArray((listing as any).faqs) && (listing as any).faqs.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Perguntas Frequentes</div>
                  <Accordion type="single" collapsible className="w-full">
                    {((listing as any).faqs as { question: string; answer: string }[]).map((faq, idx) => (
                      <AccordionItem key={`faq-${idx}`} value={`faq-${idx}`}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sobre o Vendedor */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={sellerAvatarUrl || undefined} />
                  <AvatarFallback>{(listing.sellerName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{listing.sellerName}</div>
                    {sellerLevel?.level && (
                      <Badge variant="outline" className="text-[10px]">Nível {levelLabelMap[sellerLevel.level] || sellerLevel.level}</Badge>
                    )}
                    {typeof (sellerData?.rating) === 'number' && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {(sellerData?.rating || 0).toFixed(1)}{typeof sellerData?.ratingCount === 'number' ? ` (${sellerData?.ratingCount})` : ''}
                      </div>
                    )}
                  </div>
                  {sellerData?.bio && (
                    <div className="text-sm text-muted-foreground mt-1">{sellerData.bio}</div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                    <div>
                      <div className="text-muted-foreground">Tarefas Concluídas</div>
                      <div className="font-medium">{sellerData?.completedTests ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Taxa de Aprovação</div>
                      <div className="font-medium">{typeof sellerData?.approvalRate === 'number' ? `${sellerData.approvalRate}%` : '—'}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs">
                    <Link to={`/profile/${listing.sellerId}`} className="text-primary hover:underline">Ver perfil do vendedor</Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sellerAvatarUrl || undefined} />
                  <AvatarFallback>{(listing.sellerName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{listing.sellerName}</div>
                  <div className="text-xs text-muted-foreground">Prestador do serviço</div>
                </div>
              </div>
              <div className="text-lg font-semibold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: listing.currency === 'KZ' ? 'AOA' : listing.currency }).format(listing.price)}</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={() => setOpenDM(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Contactar
                </Button>
                <Button className="w-full" onClick={handleOpenPurchase} disabled={isSeller}>
                  Comprar Agora
                </Button>
              </div>
              {isSeller && (
                <div className="text-xs text-muted-foreground mt-1">Você não pode comprar seu próprio serviço.</div>
              )}
              {isSeller && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/services/${listing.id}/edit`}>Editar</Link>
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => setDeleteOpen(true)}>
                    Eliminar
                  </Button>
                </div>
              )}
              {/* Saldo da conta freelancer */}
              <div className="mt-2 text-xs">
                <div className="text-muted-foreground">Saldo da conta freelancer</div>
                <div className="font-medium">Kz {freelancerBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              {(sellerData?.responseTime || listing.availability) && (
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Tempo de resposta: {sellerData?.responseTime || listing.availability}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                {listing.deliveryTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Prazo</div>
                      <div className="font-medium">{listing.deliveryTime}</div>
                    </div>
                  </div>
                )}
                {(listing.revisionsIncluded ?? 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Revisões</div>
                      <div className="font-medium">{listing.revisionsIncluded}</div>
                    </div>
                  </div>
                )}
              </div>
              {listing.availability && (
                <div className="mt-2 flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">Disponibilidade</div>
                    <div className="text-xs text-foreground">
                      {listing.availability.length > 160 ? `${listing.availability.slice(0, 160)}…` : listing.availability}
                    </div>
                  </div>
                </div>
              )}
              {/* Mais informações para preencher o painel */}
              {sellerLevel?.level && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">Nível do vendedor</div>
                  <Badge variant="outline" className="text-[10px] mt-1">{levelLabelMap[sellerLevel.level] || sellerLevel.level}</Badge>
                </div>
              )}
              {typeof sellerData?.rating === 'number' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{(sellerData?.rating || 0).toFixed(1)}{typeof sellerData?.ratingCount === 'number' ? ` (${sellerData?.ratingCount})` : ''}</span>
                </div>
              )}
              {sellerData?.bio && (
                <div className="mt-2 text-xs">
                  <div className="text-muted-foreground">Sobre o vendedor</div>
                  <div className="mt-1 text-foreground">
                    {showFullBio ? sellerData.bio : (sellerData.bio.length > 140 ? `${sellerData.bio.slice(0, 140)}…` : sellerData.bio)}
                  </div>
                  {sellerData.bio.length > 140 && (
                    <button type="button" className="text-primary hover:underline mt-1" onClick={() => setShowFullBio(v => !v)}>
                      {showFullBio ? 'ver menos' : 'ver mais'}
                    </button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                <div>
                  <div className="text-muted-foreground">Tarefas Concluídas</div>
                  <div className="font-medium">{sellerData?.completedTests ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Taxa de Aprovação</div>
                  <div className="font-medium">{typeof sellerData?.approvalRate === 'number' ? `${sellerData.approvalRate}%` : '—'}</div>
                </div>
              </div>
              <div className="mt-3 text-xs">
                <div className="text-muted-foreground">O que está incluído</div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <div className="text-muted-foreground">Incluídos</div>
                    <div className="font-medium">{Array.isArray(listing.includedItems) ? listing.includedItems.length : 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Excluídos</div>
                    <div className="font-medium">{Array.isArray(listing.excludedItems) ? listing.excludedItems.length : 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Requisitos</div>
                    <div className="font-medium">{Array.isArray(listing.clientRequirements) ? listing.clientRequirements.length : 0}</div>
                  </div>
                </div>
              </div>
              {(listing.category || listing.subcategory) && (
                <div className="mt-2 text-xs">
                  <div className="text-muted-foreground">Categoria</div>
                  <div className="font-medium">{listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ''}</div>
                </div>
              )}
              {(listing.tags && listing.tags.length > 0) && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">Tags</div>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {listing.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                    {listing.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{listing.tags.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
              {listing.portfolioUrl && (
                <div className="mt-2 text-xs">
                  <a href={listing.portfolioUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Ver Portfólio/Exemplos
                  </a>
                </div>
              )}
              <div className="text-xs">
                <Link to={`/profile/${listing.sellerId}`} className="text-primary hover:underline">Ver perfil do vendedor</Link>
              </div>
            </CardContent>
          </Card>
          <DirectMessagesModal open={openDM} onOpenChange={setOpenDM} initialRecipientId={listing.sellerId} />
          {/* Modal de confirmação de compra */}
          <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar compra do serviço</DialogTitle>
                <DialogDescription>
                  Antes de comprar, aceite os termos, confirme que leu as informações e que já falou com o vendedor.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm">Mensagem inicial</label>
                  <Input
                    placeholder="Escreva a mensagem inicial (opcional)"
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={openChatWithSeller}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Abrir chat com vendedor
                </Button>
                {listing.terms && (
                  <div className="text-xs">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setShowTerms((v) => !v)}
                    >
                      {showTerms ? 'Ocultar termos' : 'Ver termos'}
                    </button>
                    {showTerms && (
                      <div className="mt-2 max-h-40 overflow-auto border rounded p-2 text-xs whitespace-pre-wrap">
                        {listing.terms}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox id="termsAccepted" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(!!v)} />
                  <label htmlFor="termsAccepted" className="text-sm">Aceito os termos de compra.</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="readInfoConfirmed" checked={readInfoConfirmed} onCheckedChange={(v) => setReadInfoConfirmed(!!v)} />
                  <label htmlFor="readInfoConfirmed" className="text-sm">Li todas as informações do serviço.</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="chatConfirmed" checked={chatConfirmed} onCheckedChange={(v) => setChatConfirmed(!!v)} />
                  <label htmlFor="chatConfirmed" className="text-sm">Confirmo que já conversei com o vendedor.</label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setPurchaseOpen(false)} disabled={submitting}>Cancelar</Button>
                <Button onClick={handleConfirmPurchase} disabled={submitting || !termsAccepted || !readInfoConfirmed || !chatConfirmed}>Confirmar compra</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Confirmar eliminação do serviço */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar serviço</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O serviço será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteService} disabled={deleting}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
