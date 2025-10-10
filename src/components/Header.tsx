import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Wallet, User, Bell, Search, LogOut, Settings, BarChart3, Plus, History, CheckCircle, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import ModeToggle from "./ModeToggle";
import WithdrawalModal from "./WithdrawalModal";
import { useNotifications } from "@/hooks/useNotifications"; // Import useNotifications
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

const Header = () => {
  const { currentUser, userData, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notificationsLoading } = useNotifications(); // Use the hook
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

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

    if (diffMinutes < 1) return "agora mesmo";
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffHours < 24) return `${diffHours} h atrás`;
    if (diffDays < 7) return `${diffDays} d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <span className="text-sm font-bold text-white">F</span>
              </div>
              <span className="text-xl font-bold text-foreground">Freelincer</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar tarefas de aplicativos..."
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {currentUser && userData ? (
              <>
                {userData.currentMode === 'poster' && (
                  <Button variant="outline" size="sm" asChild className="hidden md:flex">
                    <Link to="/create-job">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Anúncio
                    </Link>
                  </Button>
                )}
                
                 <ModeToggle />
                 
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="relative">
                       <Bell className="h-4 w-4" />
                       {unreadCount > 0 && (
                         <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success text-[10px] font-medium text-success-foreground flex items-center justify-center">
                           {unreadCount}
                         </span>
                       )}
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-80">
                     <div className="flex items-center justify-between p-2">
                       <p className="text-sm font-medium">Notificações ({unreadCount})</p>
                       {unreadCount > 0 && (
                         <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto px-2 py-1 text-xs">
                           Marcar todas como lidas
                         </Button>
                       )}
                     </div>
                     <DropdownMenuSeparator />
                     <ScrollArea className="h-[200px]">
                       {notificationsLoading ? (
                         <div className="p-4 text-center text-muted-foreground text-sm">Carregando...</div>
                       ) : notifications.length > 0 ? (
                         notifications.map((notification) => (
                           <DropdownMenuItem 
                             key={notification.id} 
                             className={`flex flex-col items-start space-y-1 p-2 cursor-pointer ${!notification.read ? 'bg-accent/20' : ''}`}
                             onClick={() => markAsRead(notification.id)}
                           >
                             <p className="text-sm font-medium">{notification.title}</p>
                             <p className="text-xs text-muted-foreground">{notification.message}</p>
                             <span className="text-xs text-muted-foreground opacity-70">{formatNotificationDate(notification.createdAt)}</span>
                           </DropdownMenuItem>
                         ))
                       ) : (
                         <div className="p-4 text-center text-muted-foreground text-sm">Nenhuma notificação</div>
                       )}
                     </ScrollArea>
                   </DropdownMenuContent>
                 </DropdownMenu>
                 
                 {userData.currentMode === 'tester' && (
                   <Button 
                     variant="ghost" 
                     size="icon"
                     onClick={() => setShowWithdrawalModal(true)}
                   >
                     <Wallet className="h-4 w-4" />
                   </Button>
                 )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {userData.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{userData.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {currentUser.email}
                        </p>
                         <div className="text-xs text-muted-foreground space-y-1">
                           {userData.currentMode === 'tester' ? (
                             <>
                               <div>Disponível: {(userData.testerWallet?.availableBalance || 0).toFixed(2)} KZ</div>
                               <div>Pendente: {(userData.testerWallet?.pendingBalance || 0).toFixed(2)} KZ</div>
                             </>
                           ) : (
                             <div>Saldo: {(userData.posterWallet?.balance || 0).toFixed(2)} KZ</div>
                           )}
                         </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link to="/task-history" className="flex items-center">
                          <History className="mr-2 h-4 w-4" />
                          Histórico de Tarefas
                        </Link>
                      </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="hero" size="sm" onClick={() => setShowAuthModal(true)}>
                Entrar
              </Button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <WithdrawalModal isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)} />
    </>
  );
};

export default Header;