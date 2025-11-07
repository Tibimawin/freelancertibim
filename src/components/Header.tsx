import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Wallet, User, Bell, Search, LogOut, Settings, BarChart3, Plus, History, CheckCircle, Menu, X, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import AuthModal from "./AuthModal";
import ModeToggle from "./ModeToggle";
import WithdrawalModal from "./WithdrawalModal";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from 'react-i18next';
import { useIsMobile } from "@/hooks/use-mobile"; // Importando o hook de mobile

const Header = () => {
  const { currentUser, userData, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notificationsLoading } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

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

    if (diffMinutes < 1) return t("just now");
    if (diffMinutes < 60) return t("ago minutes", { count: diffMinutes });
    if (diffHours < 24) return t("ago hours", { count: diffHours });
    if (diffDays < 7) return t("ago days", { count: diffDays });
    return date.toLocaleDateString('pt-BR');
  };

  const renderUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-primary/50">
            <AvatarImage src={userData?.avatarUrl} alt={userData?.name} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {userData?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
                  <div>{t("available balance")}: {(userData.testerWallet?.availableBalance || 0).toFixed(2)} KZ</div>
                  <div>{t("pending balance")}: {(userData.testerWallet?.pendingBalance || 0).toFixed(2)} KZ</div>
                </>
              ) : (
                <div>{t("current balance")}: {(userData?.posterWallet?.balance || 0).toFixed(2)} KZ</div>
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
          <Link to="/task-history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            {t("task history")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="hover:bg-muted/50">
          <Link to="/referral" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {t("referral program")}
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
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-card border-r border-border p-4">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="text-xl font-bold text-foreground">Freelincer</span>
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="flex flex-col space-y-4">
            {currentUser && userData ? (
              <>
                {/* User Info & Mode Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border border-primary/50">
                      <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {userData.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userData.name}</p>
                      <p className="text-xs text-muted-foreground">{userData.currentMode === 'tester' ? t("freelancer") : t("contractor")}</p>
                    </div>
                  </div>
                  <ModeToggle />
                </div>
                
                <DropdownMenuSeparator className="bg-border" />

                {/* Navigation Links */}
                <Link to="/" onClick={() => setIsSheetOpen(false)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-foreground">
                  <Search className="h-4 w-4" />
                  <span>{t("available tasks")}</span>
                </Link>
                <Link to="/dashboard" onClick={() => setIsSheetOpen(false)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>{t("dashboard")}</span>
                </Link>
                <Link to="/task-history" onClick={() => setIsSheetOpen(false)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-foreground">
                  <History className="h-4 w-4" />
                  <span>{t("task history")}</span>
                </Link>
                <Link to="/profile" onClick={() => setIsSheetOpen(false)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-foreground">
                  <User className="h-4 w-4" />
                  <span>{t("profile")}</span>
                </Link>
                <Link to="/referral" onClick={() => setIsSheetOpen(false)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-foreground">
                  <Users className="h-4 w-4" />
                  <span>{t("referral program")}</span>
                </Link>

                {userData.currentMode === 'poster' && (
                  <Link to="/create-job" onClick={() => setIsSheetOpen(false)} className="flex items-center space-x-3 p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>{t("create job")}</span>
                  </Link>
                )}
                
                <DropdownMenuSeparator className="bg-border" />

                {/* Actions */}
                {userData.currentMode === 'tester' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowWithdrawalModal(true);
                      setIsSheetOpen(false);
                    }}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {t("withdraw")}
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("logout")}
                </Button>
              </>
            ) : (
              <Button variant="hero" className="w-full glow-effect" onClick={() => {
                setShowAuthModal(true);
                setIsSheetOpen(false);
              }}>
                {t("login")}
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center space-x-2">
            {currentUser && renderMobileSheet()}
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-md">
                <span className="text-sm font-bold text-primary-foreground">F</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">Freelincer</span>
            </Link>
          </div>

          {/* Search Bar (Desktop Only) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search tasks placeholder")}
                className="w-full rounded-lg border border-input bg-input pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              />
            </div>
          </div>

          {/* Navigation & Actions (Desktop/Mobile) */}
          <nav className="flex items-center space-x-4">
            {currentUser && userData ? (
              <>
                {userData.currentMode === 'poster' && (
                  <Button variant="outline" size="sm" asChild className="hidden lg:flex border-primary/50 text-primary hover:bg-primary/10">
                    <Link to="/create-job">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("create job")}
                    </Link>
                  </Button>
                )}
                
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
                      <p className="text-sm font-medium">{t("notifications count", { count: unreadCount })}</p>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto px-2 py-1 text-xs text-primary hover:bg-primary/10">
                          {t("mark all as read")}
                        </Button>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <ScrollArea className="h-[200px]">
                      {notificationsLoading ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">{t("loading notifications")}</div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <DropdownMenuItem 
                            key={notification.id} 
                            className={`flex flex-col items-start space-y-1 p-2 cursor-pointer ${!notification.read ? 'bg-accent/20' : 'hover:bg-muted/50'}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <span className="text-xs text-muted-foreground opacity-70">{formatNotificationDate(notification.createdAt)}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">{t("no notifications")}</div>
                      )}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                 
                {userData.currentMode === 'tester' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowWithdrawalModal(true)}
                    className="text-muted-foreground hover:text-foreground hidden lg:flex" // Hide on mobile, available in sheet
                  >
                    <Wallet className="h-4 w-4" />
                  </Button>
                )}

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
      <WithdrawalModal isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)} />
    </>
  );
};

export default Header;