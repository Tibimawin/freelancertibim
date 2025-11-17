import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import SupportChat from '@/components/SupportChat';
import { MessageSquare, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { useSupportChat } from '@/hooks/useSupportChat';
import { Badge } from '@/components/ui/badge';

const SupportLauncher = () => {
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { userUnread = 0, markUserRead } = useSupportChat();
  const WHATSAPP_NUMBER = '244998984504';

  useEffect(() => {
    if (open) {
      // Ao abrir o chat, zera não lidos do usuário
      markUserRead?.();
    }
  }, [open]);

  // Abrir chat de suporte via query param (sem dependência do Router)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shouldOpen = params.get('supportChat') === 'open';
      if (shouldOpen) {
        if (!currentUser) {
          setShowAuth(true);
        } else {
          setOpen(true);
        }
      }
    } catch {}
  }, [currentUser]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
        <Button
          onClick={() => {
            if (!currentUser) {
              setShowAuth(true);
            } else {
              setOpen(true);
            }
          }}
          className={`relative rounded-full shadow-lg px-4 py-6 ${currentUser && userUnread > 0 ? 'ring-2 ring-destructive animate-pulse' : ''}`}
          aria-label={t('talk_to_us_now')}
        >
          <MessageSquare className={`h-5 w-5 mr-2 ${currentUser && userUnread > 0 ? 'text-destructive' : ''}`} />
          <span className="hidden md:inline">{t('support_chat_title')}</span>
          {currentUser && userUnread > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] h-4 w-4">
              {Math.min(userUnread, 9)}{userUnread > 9 ? '+' : ''}
            </span>
          )}
        </Button>
        <Button asChild variant="secondary" className="rounded-full shadow px-4 py-6">
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="Suporte via WhatsApp">
            <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
            <span className="hidden md:inline">WhatsApp</span>
          </a>
        </Button>
      </div>
      <SupportChat open={open} onOpenChange={setOpen} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};

export default SupportLauncher;