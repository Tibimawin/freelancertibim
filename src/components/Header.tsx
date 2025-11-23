import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wallet, User, Bell, Search, LogOut, Settings, BarChart3, Plus, History, CheckCircle, Menu, X, Users, IdCard, Store, MessageSquare, TrendingUp, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Notification } from '@/types/firebase';
import AuthModal from "./AuthModal";
import ModeToggle from "./ModeToggle";
import WithdrawalModal from "./WithdrawalModal";
import DirectMessagesModal from "./DirectMessagesModal";
import { useNotifications } from "@/hooks/useNotifications";
import { ThemeToggle } from "./ThemeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile"; // Importando o hook de mobile
import { useTheme } from "@/contexts/ThemeContext";
import { AdminService } from '@/services/admin';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const Header = () => {
  const { currentUser, userData, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notificationsLoading } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDirectMessages, setShowDirectMessages] = useState(false);
  const [initialDMRecipientId, setInitialDMRecipientId] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dmUnreadCount = useUnreadMessages();
  const contractorBalance = (userData?.posterWallet?.balance || 0) + (userData?.posterWallet?.bonusBalance || 0);
  const currentBalance = userData?.currentMode === 'tester'
    ? (userData?.testerWallet?.availableBalance || 0)
    : contractorBalance;
  const [marketEnabled, setMarketEnabled] = useState(true);
  const [servicesEnabled, setServicesEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ft = await AdminService.getFeatureToggles();
        setMarketEnabled(!!ft.marketEnabled);
        setServicesEnabled(!!ft.servicesEnabled);
      } catch { void 0; }
    })();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return t("just_now");
    if (diffMinutes < 60) return t("ago_minutes", { count: diffMinutes });
    if (diffHours < 24) return t("ago_hours", { count: diffHours });
    if (diffDays < 7) return t("ago_days", { count: diffDays });
    return date.toLocaleDateString('pt-BR');
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
    } catch (e) {
      console.warn('Falha ao marcar notificação como lida, navegando mesmo assim.', e);
    }

    const meta = notification.metadata || {};
    switch (notification.type) {
      case 'message_received': {
        // Pode ser mensagem de aplicação (applicationId) ou direta (chatUserId)
        if (meta.applicationId) {
          navigate(`/manage-applications?focusApplicationId=${encodeURIComponent(meta.applicationId)}`);
        } else if (meta.chatUserId) {
          setInitialDMRecipientId(meta.chatUserId);
          setShowDirectMessages(true);
        } else {
          // Fallback: abrir modal de mensagens diretas
          setShowDirectMessages(true);
        }
        break;
      }
      case 'task_submitted': {
        const target = meta.applicationId ? `/manage-applications?focusApplicationId=${encodeURIComponent(meta.applicationId)}` : '/manage-applications';
        navigate(target);
        break;
      }
      case 'task_approved':
      case 'task_rejected': {
        navigate('/task-history');
        break;
      }
      case 'withdrawal_approved':
      case 'withdrawal_rejected': {
        navigate('/transactions');
        break;
      }
      case 'new_task': {
        navigate('/');
        break;
      }
      case 'login_alert': {
        navigate('/profile?tab=settings');
        break;
      }
      case 'report_submitted':
      case 'report_reviewed': {
        navigate('/admin');
        break;
      }
      case 'comment_submitted': {
        if (meta.jobId) {
          navigate(`/job/${encodeURIComponent(meta.jobId)}?tab=comments`);
        } else {
          navigate('/dashboard');
        }
        break;
      }
      case 'support_message': {
        // Abrir chat de suporte via query param
        navigate('/dashboard?supportChat=open');
        break;
      }
      case 'forum_reply': {
        if (meta.topicId) {
          navigate(`/community/forum/${encodeURIComponent(meta.topicId)}`);
        } else {
          navigate('/community/forum');
        }
        break;
      }
      case 'forum_solution_accepted':
      case 'forum_upvote': {
        if (meta.topicId) {
          navigate(`/community/forum/${encodeURIComponent(meta.topicId)}`);
        } else {
          navigate('/community/forum');
        }
        break;
      }
      default: {
        // Fallback para dashboard
        navigate('/dashboard');
      }
    }
  };

  const renderUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 rounded-full px-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-primary/50">
              <AvatarImage src={userData?.avatarUrl} alt={userData?.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {userData?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium max-w-[120px] truncate hidden md:inline">{userData?.name}</span>
            <span className="inline-flex items-center rounded bg-green-500 text-white text-xs font-semibold px-2 py-0.5">
              Kz {currentBalance.toFixed(2)}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{userData?.name}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {currentUser?.email}
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              {userData?.currentMode === 'tester' ? (
                <>
                  <div>{t("available_balance")}: {(userData.testerWallet?.availableBalance || 0).toFixed(2)} Kz</div>
                  <div>{t("pending_balance")}: {(userData.testerWallet?.pendingBalance || 0).toFixed(2)} Kz</div>
                </>
              ) : (
                  <div>{t("current_balance")}: {contractorBalance.toFixed(2)} Kz</div>
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/dashboard" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/stats" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Estatísticas
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/task-history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            {t("task_history")}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/referral" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {t("referral_program")}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/messages" className="flex items-center">
            <MessageCircle className="mr-2 h-4 w-4" />
            Mensagens
            {dmUnreadCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {dmUnreadCount}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/profile?tab=settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onClick={handleSignOut} className="hover:bg-muted/50 text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderMobileSheet = () => (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted/50 transition-colors">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-background border-border p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
                  <span className="text-base font-bold text-primary-foreground">F</span>
                </div>
                <span className="text-lg font-bold text-foreground">Freelincer</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* User Profile Section */}
          {currentUser && userData && (
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-12 w-12 border-2 border-primary/50">
                  <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                    {userData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{userData.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {userData.currentMode === 'tester' ? t("freelancer") : t("contractor")}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                <span className="text-xs font-medium text-muted-foreground">Saldo</span>
                <span className="text-sm font-bold text-green-500">
                  Kz {currentBalance.toFixed(2)}
                </span>
              </div>
              <div className="mt-3">
                <ModeToggle />
              </div>
            </div>
          )}
        
          {/* Navigation Links */}
          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-1">
              {currentUser && userData ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <BarChart3 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">{t("dashboard")}</span>
                  </Link>

                  <Link 
                    to="/stats" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">Estatísticas</span>
                  </Link>

                  <Link 
                    to="/task-history" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <History className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">{t("task_history")}</span>
                  </Link>

                  <Link 
                    to="/profile" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">{t("profile")}</span>
                  </Link>

                  <Link 
                    to="/referral" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">{t("referral_program")}</span>
                  </Link>

                  <Link 
                    to="/messages" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium">Mensagens</span>
                    </div>
                    {dmUnreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold min-w-[20px] text-center">
                        {dmUnreadCount}
                      </span>
                    )}
                  </Link>

                  <Link 
                    to="/community" 
                    onClick={() => setIsSheetOpen(false)} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                  >
                    <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="font-medium">Comunidade</span>
                  </Link>

                  {servicesEnabled && (
                    <>
                      <div className="pt-2 pb-1 px-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serviços</p>
                      </div>
                      <Link 
                        to="/services" 
                        onClick={() => setIsSheetOpen(false)} 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                      >
                        <Store className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">Explorar Serviços</span>
                      </Link>
                      <Link 
                        to="/services/pedidos" 
                        onClick={() => setIsSheetOpen(false)} 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-foreground group"
                      >
                        <CheckCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">Meus Pedidos</span>
                      </Link>
                    </>
                  )}

                  {userData.currentMode === 'poster' && (
                    <>
                      <div className="pt-2 pb-1 px-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações Rápidas</p>
                      </div>
                      <Link 
                        to="/create-job" 
                        onClick={() => setIsSheetOpen(false)} 
                        className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="font-semibold">{t("create_job")}</span>
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <div className="p-3">
                  <Button 
                    variant="hero" 
                    className="w-full glow-effect" 
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsSheetOpen(false);
                    }}
                  >
                    {t("login")}
                  </Button>
                </div>
              )}
            </nav>
          </ScrollArea>

          {/* Footer Actions */}
          {currentUser && userData && (
            <div className="p-3 border-t border-border space-y-2 bg-muted/20">
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-muted/80 transition-colors"
                onClick={() => {
                  navigate('/carteira');
                  setIsSheetOpen(false);
                }}
              >
                <Wallet className="h-4 w-4 mr-3" />
                <span className="font-medium">Carteira</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start hover:bg-muted/80 transition-colors"
                onClick={() => {
                  navigate('/profile?tab=settings');
                  setIsSheetOpen(false);
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                <span className="font-medium">{t("settings")}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span className="font-medium">{t("logout")}</span>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm animate-fade-in">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 animate-slide-in-from-top" style={{ animationDuration: '0.4s' }}>
          {/* Logo & Mobile Menu */}
          <div className="flex items-center space-x-3">
            {currentUser && renderMobileSheet()}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-md group-hover:shadow-lg transition-all">
                <span className="text-base font-bold text-white">AT</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline font-jakarta">Ango Tarefas</span>
            </Link>
          </div>

          {/* Área central de navegação */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 items-center">
            <div className="mx-auto flex items-center gap-4">
              {marketEnabled && (
                <>
                </>
              )}
              {servicesEnabled && (
                <>
                  <Link to="/services" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Store className="h-7 w-7" />
                    <span className="text-sm font-medium">Serviços</span>
                  </Link>
                  <Link to="/services/pedidos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Meus Serviços
                  </Link>
                </>
              )}
              <Link to="/community" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Comunidade</span>
              </Link>
            </div>
          </div>

          {/* Navigation & Actions (Desktop/Mobile) */}
          <nav className="flex items-center space-x-2 lg:space-x-4">
            {currentUser && userData ? (
              <>
                {userData.currentMode === 'poster' && (
                  <Button variant="outline" size="sm" asChild className="hidden lg:flex border-primary/50 text-primary hover:bg-primary/10">
                    <Link to="/create-job">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("create_job")}
                    </Link>
                  </Button>
                )}
                
                {/* Carteira Button (Desktop) */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/carteira')}
                  className="flex items-center space-x-2 hidden md:flex border-primary/50 hover:bg-primary/10"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Carteira</span>
                </Button>
                
                {/* Mode Toggle (Desktop Only) */}
                <div className="hidden lg:block">
                  <ModeToggle />
                </div>
                 
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success text-[10px] font-medium text-success-foreground flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-card border-border text-foreground">
                    <div className="flex items-center justify-between p-2">
                      <p className="text-sm font-medium">{t("notifications_count", { count: unreadCount })}</p>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto px-2 py-1 text-xs text-primary hover:bg-primary/10">
                          {t("mark_all_as_read")}
                        </Button>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <ScrollArea className="h-[200px]">
                      {notificationsLoading ? (
                        <div className="p-2 space-y-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col space-y-1 p-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-64" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          ))}
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <DropdownMenuItem 
                            key={notification.id} 
                            className={`flex flex-col items-start space-y-1 p-2 cursor-pointer ${!notification.read ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'}`}
                            onClick={() => handleNotificationClick(notification as Notification)}
                          >
                            <p className={`text-sm font-medium ${!notification.read ? 'text-primary' : ''}`}>{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <span className="text-xs text-muted-foreground opacity-70">{formatNotificationDate(notification.createdAt)}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">{t("no_notifications")}</div>
                      )}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Ícone de Chat (Mensagens Diretas) */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (!currentUser) {
                      setShowAuthModal(true);
                    } else {
                      setShowDirectMessages(true);
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  {dmUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                      {Math.min(dmUnreadCount, 9)}{dmUnreadCount > 9 ? '+' : ''}
                    </span>
                  )}
                </Button>
                 
                {userData.currentMode === 'tester' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowWithdrawalModal(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Wallet className="h-4 w-4" />
                  </Button>
                )}

                {userData.currentMode === 'poster' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link to="/transactions">
                      <Wallet className="h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Dropdown (Desktop Only) */}
                <div className="hidden lg:block">
                  {renderUserMenu()}
                </div>
              </>
            ) : (
              <Button variant="hero" size="sm" onClick={() => setShowAuthModal(true)} className="glow-effect">
                {t("login")}
              </Button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <DirectMessagesModal open={showDirectMessages} onOpenChange={setShowDirectMessages} initialRecipientId={initialDMRecipientId} />
      <WithdrawalModal isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)} />
    </>
  );
};

export default Header;
