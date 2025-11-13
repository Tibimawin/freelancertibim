import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { User } from '@/types/firebase';
import DirectChatThread from '@/components/DirectChatThread';
import { useTranslation } from 'react-i18next';

interface DirectMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRecipientId?: string;
}
import { doc, getDoc } from 'firebase/firestore';

const DirectMessagesModal = ({ open, onOpenChange, initialRecipientId }: DirectMessagesModalProps) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([] as any);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!open) return;
    const loadInitial = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as User[];
        const filtered = list.filter((u) => u.id !== currentUser?.uid);
        setUsers(filtered);

        if (initialRecipientId) {
          try {
            const userSnap = await getDoc(doc(db, 'users', initialRecipientId));
            if (userSnap.exists()) {
              const u = { id: userSnap.id, ...(userSnap.data() as any) } as User;
              setSelectedUser(u);
              // Ensure selected user appears in list (prepend if missing)
              if (!filtered.find((x) => x.id === u.id)) {
                setUsers([u, ...filtered]);
              }
            }
          } catch (e) {
            console.warn('Não foi possível pré-selecionar usuário para chat.', e);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar usuários:', e);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [open, currentUser?.uid, initialRecipientId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => (u.name || '').toLowerCase().includes(s));
  }, [users, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-center">{t('start_conversation') || 'Iniciar conversa'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lista de usuários */}
          <Card className="md:col-span-1 bg-muted/20 border-border">
            <CardContent className="p-3 space-y-3">
              <Input
                placeholder={t('search') || 'Buscar usuários'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ScrollArea className="h-64">
                {loading ? (
                  <div className="text-sm text-muted-foreground">{t('loading') || 'Carregando...'}</div>
                ) : filtered.length === 0 ? (
                  <div className="text-sm text-muted-foreground">{t('no_results') || 'Nenhum resultado'}</div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((u) => (
                      <button
                        key={u.id}
                        className={`w-full text-left p-2 rounded-md hover:bg-muted/50 flex items-center gap-2 ${selectedUser?.id === u.id ? 'bg-muted/40' : ''}`}
                        onClick={() => setSelectedUser(u)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.avatarUrl} alt={u.name} />
                          <AvatarFallback>{(u.name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{u.name || u.email}</span>
                          {u.location && <span className="text-xs text-muted-foreground">{u.location}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Thread de chat direto */}
          <div className="md:col-span-2">
            {selectedUser ? (
              <DirectChatThread recipientUserId={selectedUser.id} />
            ) : (
              <Card className="bg-muted/20 border-border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">{t('select_user_to_chat') || 'Selecione um usuário para conversar'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('close') || 'Fechar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessagesModal;