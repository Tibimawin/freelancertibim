import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import DirectChatThread from '@/components/DirectChatThread';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
import { AuthService } from '@/services/auth';
import { Separator } from '@/components/ui/separator';

interface ThreadSummary {
  threadId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export default function Messages() {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const threadsRef = collection(db, 'directThreads');
    const q = query(
      threadsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const summaries: ThreadSummary[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const participants = data.participants as string[];
        const otherUserId = participants.find((id) => id !== currentUser.uid);

        if (!otherUserId) continue;

        try {
          const userData = await AuthService.getUserData(otherUserId);
          const unread = data.unreadCount?.[currentUser.uid] || 0;

          summaries.push({
            threadId: doc.id,
            otherUserId,
            otherUserName: userData?.name || 'Usuário',
            otherUserAvatar: userData?.avatarUrl,
            lastMessage: data.lastMessage || 'Sem mensagens',
            lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
            unreadCount: unread,
          });
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
        }
      }

      setThreads(summaries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredThreads = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return threads;
    return threads.filter((t) => t.otherUserName.toLowerCase().includes(s));
  }, [threads, search]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Faça login para acessar suas mensagens</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          Mensagens
        </h1>
        <p className="text-muted-foreground mt-2">
          Converse com vendedores e compradores
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de conversas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversas</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                  </p>
                  {!search && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Inicie uma conversa com um vendedor no marketplace
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredThreads.map((thread) => (
                    <button
                      key={thread.threadId}
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedThread?.threadId === thread.threadId ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={thread.otherUserAvatar} />
                          <AvatarFallback>
                            {thread.otherUserName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm truncate">
                              {thread.otherUserName}
                            </span>
                            {thread.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                                {thread.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {thread.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {thread.lastMessageAt.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de chat */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedThread.otherUserAvatar} />
                    <AvatarFallback>
                      {selectedThread.otherUserName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedThread.otherUserName}</CardTitle>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <DirectChatThread recipientUserId={selectedThread.otherUserId} />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Selecione uma conversa para começar
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
