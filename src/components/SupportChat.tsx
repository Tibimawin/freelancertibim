import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useSupportChat } from '@/hooks/useSupportChat';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface SupportChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportChat = ({ open, onOpenChange }: SupportChatProps) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage, currentUserId, status, adminTyping, setUserTyping } = useSupportChat();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [typingLocal, setTypingLocal] = useState(false);
  const { userData } = useAuth();

  const formatRelative = useMemo(() => {
    const rtf = typeof Intl !== 'undefined' && (Intl as any).RelativeTimeFormat ? new (Intl as any).RelativeTimeFormat('pt-BR', { numeric: 'auto' }) : null;
    return (date: Date) => {
      const d = date instanceof Date ? date : new Date(date);
      const diff = (Date.now() - d.getTime());
      const sec = Math.round(diff / 1000);
      if (!rtf) return d.toLocaleString('pt-BR');
      if (sec < 60) return rtf.format(-sec, 'second');
      const min = Math.round(sec / 60);
      if (min < 60) return rtf.format(-min, 'minute');
      const hour = Math.round(min / 60);
      if (hour < 24) return rtf.format(-hour, 'hour');
      const day = Math.round(hour / 24);
      return rtf.format(-day, 'day');
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    // Ao abrir, marcar como lido pelo usuário
    // Marcamos no launcher para evitar loop; aqui mantemos apenas UI
    // Auto-scroll ao final
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await setUserTyping(false);
    await sendMessage(trimmed);
    setText('');
  };

  useEffect(() => {
    if (!open) return;
    if (!typingLocal) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setUserTyping(false);
      setTypingLocal(false);
    }, 1500);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [typingLocal, open, setUserTyping]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <span>{t('support_chat_title')}</span>
            {status === 'closed' && (
              <Badge variant="secondary">{t('chat_closed') || 'Chat fechado'}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <Card className="bg-muted/20 border-border">
          <CardContent className="p-3">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading && <div className="text-sm text-muted-foreground">{t('loading_messages')}</div>}
              {!loading && messages.length === 0 && (
                <div className="text-sm text-muted-foreground">{t('no_messages_yet')}</div>
              )}
              {messages.map((msg) => {
                const mine = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2 items-end gap-2`}>
                    {mine ? (
                      <>
                        <div className="px-3 py-2 rounded-lg text-sm max-w-[80%] bg-primary text-primary-foreground rounded-br-sm">
                          <div>{msg.text}</div>
                          <div className="text-xs mt-1 text-primary-foreground/70">{formatRelative(new Date(msg.createdAt))}</div>
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={(userData?.avatarUrl) || undefined} alt={userData?.name || 'Você'} />
                          <AvatarFallback>{(userData?.name || 'Você').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </>
                    ) : (
                      <div className="flex items-end gap-2">
                        <Avatar className="h-6 w-6">
                          {/* Opcional: imagem do suporte */}
                          <AvatarImage src="" alt="Admin" />
                          <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div className="px-3 py-2 rounded-lg text-sm max-w-[80%] bg-muted text-foreground border border-border rounded-bl-sm">
                          <div className="font-semibold text-xs mb-1">{t('admin') || 'Admin'}</div>
                          <div>{msg.text}</div>
                          <div className="text-xs mt-1 text-muted-foreground">{formatRelative(new Date(msg.createdAt))}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {adminTyping && status === 'open' && (
                <div className="text-left">
                  <span className="text-xs text-muted-foreground">Suporte está digitando…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Input
                placeholder={status === 'closed' ? (t('chat_closed_placeholder') || 'Este chat está fechado') : t('type_a_message')}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (status !== 'closed') {
                    setTypingLocal(true);
                    setUserTyping(true);
                  }
                }}
                onBlur={() => { setUserTyping(false); setTypingLocal(false); }}
                disabled={status === 'closed'}
              />
              <Button onClick={handleSend} disabled={status === 'closed' || !text.trim()}>{t('send')}</Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SupportChat;