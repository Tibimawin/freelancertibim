import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageSquare, Search, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SupportChatService, SupportChatSummary, SupportMessage } from '@/services/supportChatService';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthService } from '@/services/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminSupport = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [chats, setChats] = useState<SupportChatSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [userInfos, setUserInfos] = useState<Record<string, { name: string; avatarUrl?: string }>>({});
  const [visibleCount, setVisibleCount] = useState(30);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [typingLocal, setTypingLocal] = useState(false);

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
    setLoadingChats(true);
    const unsubscribe = SupportChatService.subscribeToChats((c) => {
      setChats(c);
      setLoadingChats(false);
      // Auto-selecionar primeiro chat ao carregar se nada selecionado
      if (!selectedUserId && c.length > 0) {
        setSelectedUserId(c[0].userId);
      }

      // Prefetch infos de usuário (nome/avatar) para os chats listados
      const missingIds = c
        .map((chat) => chat.userId)
        .filter((id) => !userInfos[id]);
      if (missingIds.length > 0) {
        (async () => {
          const updates: Record<string, { name: string; avatarUrl?: string }> = {};
          for (const uid of missingIds) {
            try {
              const user = await AuthService.getUserData(uid);
              updates[uid] = { name: user?.name || `Usuário (${uid.slice(0,4)})`, avatarUrl: user?.avatarUrl };
            } catch (e) {
              console.error('Erro ao buscar dados do usuário', e);
              updates[uid] = { name: `Usuário (${uid.slice(0,4)})` };
            }
          }
          setUserInfos((prev) => ({ ...prev, ...updates }));
        })();
      }
    }, 30);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const unsubscribe = SupportChatService.subscribeToMessages(selectedUserId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });
    // Admin abriu o chat: marca como lido
    SupportChatService.markAsRead(selectedUserId, 'admin').catch(() => {});
    return () => unsubscribe();
  }, [selectedUserId]);

  const filteredChats = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return chats;
    return chats.filter((c) =>
      c.userId.toLowerCase().includes(s) ||
      (c.lastMessage || '').toLowerCase().includes(s) ||
      (c.lastSenderName || '').toLowerCase().includes(s)
    );
  }, [search, chats]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedUserId || !currentUser) return;
    await SupportChatService.setTyping(selectedUserId, 'admin', false);
    await SupportChatService.sendMessage(selectedUserId, currentUser.uid, currentUser.displayName || 'Admin', trimmed);
    setText('');
  };

  const toggleChatStatus = async (userId: string, currentStatus: 'open' | 'closed') => {
    const next = currentStatus === 'open' ? 'closed' : 'open';
    await SupportChatService.setChatStatus(userId, next);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span>Atendimento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lista de Chats */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Input placeholder="Buscar usuário ou mensagem" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Button variant="outline" size="icon" aria-label="Buscar"><Search className="h-4 w-4" /></Button>
              </div>

              {loadingChats ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('loading_messages')}</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum chat encontrado</div>
              ) : (
                <div className="border rounded-md divide-y">
                  {filteredChats.slice(0, visibleCount).map((c) => (
                    <button
                      key={c.userId}
                      className={`w-full text-left p-3 hover:bg-muted ${selectedUserId === c.userId ? 'bg-muted/50' : ''}`}
                      onClick={() => setSelectedUserId(c.userId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userInfos[c.userId]?.avatarUrl} />
                            <AvatarFallback>{(userInfos[c.userId]?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{userInfos[c.userId]?.name || c.userId}</div>
                            <div className="text-xs text-muted-foreground">{c.userId}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>
                            {c.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                          {c.adminUnread && c.adminUnread > 0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs h-5 w-5">
                              {Math.min(c.adminUnread, 9)}{c.adminUnread > 9 ? '+' : ''}
                            </span>
                          )}
                          <Button
                            variant={c.status === 'open' ? 'secondary' : 'default'}
                            size="sm"
                            className="px-2"
                            onClick={(e) => { e.stopPropagation(); toggleChatStatus(c.userId, c.status); }}
                          >
                            {c.status === 'open' ? (
                              <span className="flex items-center gap-1"><X className="h-3 w-3" /> Fechar</span>
                            ) : (
                              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Reabrir</span>
                            )}
                          </Button>
                        </div>
                      </div>
                      {c.lastMessage && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-semibold">{c.lastSenderName || 'Usuário'}: </span>
                          {c.lastMessage}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatRelative(new Date(c.updatedAt))}
                      </div>
                    </button>
                  ))}
                  {filteredChats.length > visibleCount && (
                    <div className="p-2 text-center">
                      <Button variant="outline" size="sm" onClick={() => setVisibleCount((v) => v + 20)}>
                        Carregar mais
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thread de Mensagens */}
            <div className="md:col-span-2">
              <Card className="bg-muted/20 border-border">
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {loadingMessages && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('loading_messages')}</div>}
                    {!loadingMessages && messages.length === 0 && (
                      <div className="text-sm text-muted-foreground">{t('no_messages_yet')}</div>
                    )}
                    {messages.map((msg) => {
                      const mine = msg.senderId === currentUser?.uid;
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`px-3 py-2 rounded-lg text-sm max-w-[75%] ${mine ? 'bg-primary/20 text-foreground' : 'bg-background border border-border text-foreground'}`}>
                            {!mine && <div className="font-semibold text-xs mb-1">{msg.senderName}</div>}
                            <div>{msg.text}</div>
                            <div className="text-xs text-muted-foreground mt-1">{formatRelative(new Date(msg.createdAt))}</div>
                          </div>
                        </div>
                      );
                    })}
                    {chats.find((c) => c.userId === selectedUserId)?.userTyping && chats.find((c) => c.userId === selectedUserId)?.status === 'open' && (
                      <div className="text-left">
                        <span className="text-xs text-muted-foreground">Usuário está digitando…</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t('type_a_message')}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        const status = chats.find((c) => c.userId === selectedUserId)?.status;
                        if (selectedUserId && status !== 'closed') {
                          setTypingLocal(true);
                          SupportChatService.setTyping(selectedUserId, 'admin', true);
                        }
                      }}
                      onBlur={() => { if (selectedUserId) { SupportChatService.setTyping(selectedUserId, 'admin', false); setTypingLocal(false); } }}
                      disabled={chats.find((c) => c.userId === selectedUserId)?.status === 'closed'}
                    />
                    <Button onClick={handleSend} disabled={!text.trim() || !selectedUserId || chats.find((c) => c.userId === selectedUserId)?.status === 'closed'}>{t('send')}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupport;