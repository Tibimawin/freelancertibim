import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export const NotificationPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permission, requestPermission, isSupported } = useNotificationPermission();

  useEffect(() => {
    // Show prompt if notifications are supported but permission is default
    if (isSupported && permission === 'default') {
      // Wait a bit before showing to not overwhelm user
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already dismissed recently (within 7 days)
  const dismissedAt = localStorage.getItem('notification-prompt-dismissed');
  if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showPrompt || !isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Ativar Notificações</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-2"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Receba alertas instantâneos sobre aprovações de tarefas, mensagens e atualizações importantes - mesmo quando não estiver na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button onClick={handleEnable} className="flex-1">
            Permitir Notificações
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Agora Não
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
