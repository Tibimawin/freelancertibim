import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageSquare, Search, X, Check, Zap, Tag, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SupportChatService, SupportChatSummary, SupportMessage } from '@/services/supportChatService';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthService } from '@/services/auth';
import { QuickRepliesService, QuickReply } from '@/services/quickRepliesService';
import { SupportTagsService, SupportTag } from '@/services/supportTagsService';
import { SupportNotesService } from '@/services/supportNotesService';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { QuickRepliesManager } from './QuickRepliesManager';
import { SupportTagsManager } from './SupportTagsManager';
import { SupportNotesPanel } from './SupportNotesPanel';

// Função para formatação de tempo relativo - fora do componente para melhor performance
const formatRelative = (date: Date) => {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  
  if (typeof Intl !== 'undefined' && (Intl as any).RelativeTimeFormat) {
    const rtf = new (Intl as any).RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    if (sec < 60) return rtf.format(-sec, 'second');
    const min = Math.round(sec / 60);
    if (min < 60) return rtf.format(-min, 'minute');
    const hour = Math.round(min / 60);
    if (hour < 24) return rtf.format(-hour, 'hour');
    const day = Math.round(hour / 24);
    return rtf.format(-day, 'day');
  }
  
  return d.toLocaleString('pt-BR');
};

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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSelectedRef = useRef(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickRepliesManager, setShowQuickRepliesManager] = useState(false);
  const [tags, setTags] = useState<SupportTag[]>([]);
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chatTags, setChatTags] = useState<Record<string, string[]>>({});
  const [filterByTags, setFilterByTags] = useState<string[]>([]);

  // Carregar respostas rápidas
  useEffect(() => {
    const unsubscribe = QuickRepliesService.subscribeToQuickReplies((replies) => {
      setQuickReplies(replies);
    });
    return () => unsubscribe();
  }, []);

  // Carregar tags
  useEffect(() => {
    const unsubscribe = SupportTagsService.subscribeToTags((tagsList) => {
      setTags(tagsList);
    });
    return () => unsubscribe();
  }, []);

  // Carregar chats e fazer auto-seleção uma única vez
  useEffect(() => {
    setLoadingChats(true);
    const unsubscribe = SupportChatService.subscribeToChats((c) => {
      setChats(c);
      setLoadingChats(false);
      
      // Auto-selecionar primeiro chat apenas uma vez ao carregar
      if (!hasAutoSelectedRef.current && !selectedUserId && c.length > 0) {
        setSelectedUserId(c[0].userId);
        hasAutoSelectedRef.current = true;
      }

      // Carregar tags de cada chat
      c.forEach(async (chat) => {
        const tags = await SupportTagsService.getChatTags(chat.userId);
        setChatTags((prev) => ({ ...prev, [chat.userId]: tags }));
      });
    });
    
    return () => unsubscribe();
  }, []); // Sem dependências - executa apenas uma vez

  // Prefetch de informações de usuários quando a lista de chats mudar
  useEffect(() => {
    const missingIds = chats
      .map((chat) => chat.userId)
      .filter((id) => !userInfos[id]);
    
    if (missingIds.length === 0) return;

    const fetchUserInfos = async () => {
      const updates: Record<string, { name: string; avatarUrl?: string }> = {};
      for (const uid of missingIds) {
        try {
          const user = await AuthService.getUserData(uid);
          updates[uid] = { 
            name: user?.name || `Usuário (${uid.slice(0, 4)})`, 
            avatarUrl: user?.avatarUrl 
          };
        } catch (e) {
          console.error('Erro ao buscar dados do usuário', e);
          updates[uid] = { name: `Usuário (${uid.slice(0, 4)})` };
        }
      }
      setUserInfos((prev) => ({ ...prev, ...updates }));
    };

    fetchUserInfos();
  }, [chats]); // Depende apenas de chats

  // Scroll automático quando mensagens mudam
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Carregar mensagens do chat selecionado
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

    // Marcar como lido quando admin abre o chat
    SupportChatService.markAsRead(selectedUserId, 'admin').catch((err) => {
      console.error('Erro ao marcar chat como lido:', err);
    });

    return () => unsubscribe();
  }, [selectedUserId]);

  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Filtrar por busca de texto
    const s = search.trim().toLowerCase();
    if (s) {
      filtered = filtered.filter((c) => {
        const userName = userInfos[c.userId]?.name || '';
        return (
          c.userId.toLowerCase().includes(s) ||
          userName.toLowerCase().includes(s) ||
          (c.lastMessage || '').toLowerCase().includes(s) ||
          (c.lastSenderName || '').toLowerCase().includes(s)
        );
      });
    }

    // Filtrar por tags selecionadas
    if (filterByTags.length > 0) {
      filtered = filtered.filter((c) => {
        const cTags = chatTags[c.userId] || [];
        return filterByTags.some(tag => cTags.includes(tag));
      });
    }

    return filtered;
  }, [search, chats, userInfos, filterByTags, chatTags]);

  const selectedChat = useMemo(() => {
    return chats.find((c) => c.userId === selectedUserId);
  }, [chats, selectedUserId]);

  const isChatClosed = selectedChat?.status === 'closed';

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedUserId || !currentUser || isChatClosed) return;

    // Limpar indicador de digitação e timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      await SupportChatService.setTyping(selectedUserId, 'admin', false);
      await SupportChatService.sendMessage(
        selectedUserId,
        currentUser.uid,
        currentUser.displayName || 'Admin',
        trimmed
      );
      setText('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (value: string) => {
    setText(value);

    if (!selectedUserId || isChatClosed) return;

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Indicar que está digitando
    SupportChatService.setTyping(selectedUserId, 'admin', true);

    // Após 3 segundos sem digitar, remover indicador
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedUserId) {
        SupportChatService.setTyping(selectedUserId, 'admin', false);
      }
    }, 3000);
  };

  const handleBlur = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (selectedUserId) {
      SupportChatService.setTyping(selectedUserId, 'admin', false);
    }
  };

  const toggleChatStatus = async (userId: string, currentStatus: 'open' | 'closed') => {
    const next = currentStatus === 'open' ? 'closed' : 'open';
    try {
      await SupportChatService.setChatStatus(userId, next);
    } catch (error) {
      console.error('Erro ao alterar status do chat:', error);
    }
  };

  const handleQuickReply = (message: string) => {
    setText(message);
  };

  // Agrupar respostas rápidas por categoria
  const groupedQuickReplies = useMemo(() => {
    return quickReplies.reduce((acc, reply) => {
      const category = reply.category || 'Sem Categoria';
      if (!acc[category]) acc[category] = [];
      acc[category].push(reply);
      return acc;
    }, {} as Record<string, QuickReply[]>);
  }, [quickReplies]);

  // Carregar tags do chat selecionado
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedTags([]);
      return;
    }

    const loadTags = async () => {
      const tags = await SupportTagsService.getChatTags(selectedUserId);
      setSelectedTags(tags);
    };

    loadTags();
  }, [selectedUserId]);

  const handleAddTag = async (tagId: string) => {
    if (!selectedUserId) return;
    try {
      await SupportTagsService.addTagToChat(selectedUserId, tagId);
      setSelectedTags([...selectedTags, tagId]);
      setChatTags((prev) => ({
        ...prev,
        [selectedUserId]: [...(prev[selectedUserId] || []), tagId],
      }));
      toast.success('Tag adicionada');
    } catch (error) {
      console.error('Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedUserId) return;
    try {
      await SupportTagsService.removeTagFromChat(selectedUserId, tagId);
      setSelectedTags(selectedTags.filter(t => t !== tagId));
      setChatTags((prev) => ({
        ...prev,
        [selectedUserId]: (prev[selectedUserId] || []).filter(t => t !== tagId),
      }));
      toast.success('Tag removida');
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  };

  const toggleTagFilter = (tagId: string) => {
    setFilterByTags((prev) =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="space-y-4">
      {showQuickRepliesManager ? (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowQuickRepliesManager(false)}
            className="mb-4"
          >
            ← Voltar para Atendimento
          </Button>
          <QuickRepliesManager />
        </div>
      ) : showTagsManager ? (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowTagsManager(false)}
            className="mb-4"
          >
            ← Voltar para Atendimento
          </Button>
          <SupportTagsManager />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Atendimento</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagsManager(true)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Gerenciar Tags
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickRepliesManager(true)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Gerenciar Respostas
                </Button>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Lista de Chats */}
            <div className="lg:col-span-1">
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuário ou mensagem"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {tags.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" title="Filtrar por tags">
                          <Filter className="h-4 w-4" />
                          {filterByTags.length > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                              {filterByTags.length}
                            </Badge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Filtrar por Tags</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {tags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag.id}
                            checked={filterByTags.includes(tag.id)}
                            onCheckedChange={() => toggleTagFilter(tag.id)}
                          >
                            <Badge
                              style={{ backgroundColor: tag.color, color: '#fff' }}
                              className="mr-2"
                            >
                              {tag.name}
                            </Badge>
                          </DropdownMenuCheckboxItem>
                        ))}
                        {filterByTags.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setFilterByTags([])}>
                              Limpar filtros
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {loadingChats ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('loading_messages')}</span>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  {search ? 'Nenhum chat encontrado' : 'Nenhum chat disponível'}
                </div>
              ) : (
                <div className="border rounded-md divide-y max-h-[600px] overflow-y-auto">
                  {filteredChats.slice(0, visibleCount).map((c) => (
                    <button
                      key={c.userId}
                      className={`w-full text-left p-3 hover:bg-muted/70 transition-colors ${
                        selectedUserId === c.userId ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedUserId(c.userId)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={userInfos[c.userId]?.avatarUrl} />
                            <AvatarFallback>
                              {(userInfos[c.userId]?.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {userInfos[c.userId]?.name || c.userId}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {c.userId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={c.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                            {c.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                          {c.adminUnread && c.adminUnread > 0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs h-5 w-5 font-medium">
                              {Math.min(c.adminUnread, 9)}{c.adminUnread > 9 ? '+' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {c.lastMessage && (
                        <div className="text-xs text-muted-foreground mb-1 line-clamp-2">
                          <span className="font-semibold">{c.lastSenderName || 'Usuário'}: </span>
                          {c.lastMessage}
                        </div>
                      )}

                      {/* Tags do chat */}
                      {chatTags[c.userId] && chatTags[c.userId].length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {chatTags[c.userId].slice(0, 3).map((tagId) => {
                            const tag = tags.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <Badge
                                key={tagId}
                                style={{ backgroundColor: tag.color, color: '#fff' }}
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            );
                          })}
                          {chatTags[c.userId].length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{chatTags[c.userId].length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          {formatRelative(new Date(c.updatedAt))}
                        </div>
                        <Button
                          variant={c.status === 'open' ? 'ghost' : 'outline'}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChatStatus(c.userId, c.status);
                          }}
                        >
                          {c.status === 'open' ? (
                            <>
                              <X className="h-3 w-3 mr-1" />
                              Fechar
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Reabrir
                            </>
                          )}
                        </Button>
                      </div>
                    </button>
                  ))}
                  
                  {filteredChats.length > visibleCount && (
                    <div className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleCount((v) => v + 20)}
                      >
                        Carregar mais ({filteredChats.length - visibleCount} restantes)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thread de Mensagens */}
            <div className="lg:col-span-2">
              {!selectedUserId ? (
                <Card className="h-full flex items-center justify-center min-h-[500px]">
                  <CardContent className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Selecione um chat para visualizar as mensagens
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={userInfos[selectedUserId]?.avatarUrl} />
                            <AvatarFallback>
                              {(userInfos[selectedUserId]?.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">
                              {userInfos[selectedUserId]?.name || selectedUserId}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {selectedChat?.status === 'open' ? 'Chat aberto' : 'Chat fechado'}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={selectedChat?.status === 'open' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => selectedChat && toggleChatStatus(selectedUserId, selectedChat.status)}
                        >
                          {selectedChat?.status === 'open' ? (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Fechar Chat
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Reabrir Chat
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Tags do chat */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {selectedTags.map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <Badge
                              key={tagId}
                              style={{ backgroundColor: tag.color, color: '#fff' }}
                              className="flex items-center gap-1"
                            >
                              {tag.name}
                              <button
                                onClick={() => handleRemoveTag(tagId)}
                                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                        {tags.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Tag className="h-3 w-3 mr-1" />
                                Adicionar Tag
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Selecione uma tag</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {tags
                                .filter(tag => !selectedTags.includes(tag.id))
                                .map((tag) => (
                                  <DropdownMenuItem
                                    key={tag.id}
                                    onClick={() => handleAddTag(tag.id)}
                                  >
                                    <Badge
                                      style={{ backgroundColor: tag.color, color: '#fff' }}
                                      className="mr-2"
                                    >
                                      {tag.name}
                                    </Badge>
                                    {tag.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {tag.description}
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Notas Internas */}
                  <div className="px-6 pb-4">
                    <SupportNotesPanel
                      chatUserId={selectedUserId}
                      currentUserId={currentUser?.uid || ''}
                      currentUserName={currentUser?.displayName || 'Admin'}
                    />
                  </div>

                  <CardContent className="flex-1 flex flex-col p-4">
                    <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-[450px]">
                      {loadingMessages ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t('loading_messages')}</span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          {t('no_messages_yet')}
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const mine = msg.senderId === currentUser?.uid;
                          return (
                            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`px-4 py-2 rounded-lg text-sm max-w-[75%] ${
                                  mine
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted border border-border'
                                }`}
                              >
                                {!mine && (
                                  <div className="font-semibold text-xs mb-1 opacity-70">
                                    {msg.senderName}
                                  </div>
                                )}
                                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                                <div
                                  className={`text-xs mt-1 ${
                                    mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}
                                >
                                  {formatRelative(new Date(msg.createdAt))}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {selectedChat?.userTyping && selectedChat?.status === 'open' && (
                        <div className="text-left">
                          <span className="text-xs text-muted-foreground italic">
                            {userInfos[selectedUserId]?.name || 'Usuário'} está digitando...
                          </span>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    <Separator className="mb-4" />

                    <div className="flex items-end gap-2">
                      {quickReplies.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={isChatClosed}
                              title="Respostas Rápidas"
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
                            <DropdownMenuLabel>Respostas Rápidas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(groupedQuickReplies).map(([category, replies]) => (
                              <div key={category}>
                                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
                                  {category}
                                </DropdownMenuLabel>
                                {replies.map((reply) => (
                                  <DropdownMenuItem
                                    key={reply.id}
                                    onClick={() => handleQuickReply(reply.message)}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex flex-col gap-1 w-full">
                                      <span className="font-medium text-sm">{reply.title}</span>
                                      <span className="text-xs text-muted-foreground line-clamp-2">
                                        {reply.message}
                                      </span>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                              </div>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Input
                        placeholder={isChatClosed ? 'Chat fechado' : t('type_a_message')}
                        value={text}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onBlur={handleBlur}
                        disabled={isChatClosed}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!text.trim() || !selectedUserId || isChatClosed}
                      >
                        {t('send')}
                      </Button>
                    </div>

                    {isChatClosed && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Este chat está fechado. Reabra para continuar a conversa.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSupport;
