import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ForumService, ForumTopic } from '@/services/forumService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateTopicDialog } from '@/components/forum/CreateTopicDialog';
import { TopicCard } from '@/components/forum/TopicCard';
import { ForumNotificationSettings } from '@/components/forum/ForumNotificationSettings';
import { UserForumReputation } from '@/components/forum/UserForumReputation';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MessageSquare, TrendingUp, HelpCircle, Bell } from 'lucide-react';

const CATEGORIES = [
  { value: 'todas', label: 'Todas Categorias' },
  { value: 'geral', label: 'Geral' },
  { value: 'dicas', label: 'Dicas & Truques' },
  { value: 'ajuda', label: 'Preciso de Ajuda' },
  { value: 'bugs', label: 'Bugs & Problemas' },
  { value: 'sugestoes', label: 'Sugestões' },
  { value: 'anuncios', label: 'Anúncios' }
];

export default function Forum() {
  const { currentUser } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');

  const loadTopics = async () => {
    setLoading(true);
    try {
      const data = await ForumService.getTopics({
        category: selectedCategory,
        searchTerm,
        sortBy,
        limitNum: 50
      });
      setTopics(data);
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [selectedCategory, sortBy]);

  const handleSearch = () => {
    loadTopics();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Fórum da Comunidade
            </h1>
            <p className="text-muted-foreground">
              Compartilhe conhecimento, tire dúvidas e ajude outros freelancers
            </p>
          </div>
          
          {currentUser && (
            <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Novo Tópico
            </Button>
          )}
        </div>

        {/* Busca e Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tópicos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch} variant="secondary">
                    Buscar
                  </Button>
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Tópicos */}
        <div className="lg:col-span-3">
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="recent" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Recentes
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Populares
              </TabsTrigger>
              <TabsTrigger value="unanswered" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Sem Resposta
              </TabsTrigger>
            </TabsList>

            <TabsContent value={sortBy} className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : topics.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nenhum tópico encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Seja o primeiro a iniciar uma discussão!
                    </p>
                    {currentUser && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        Criar Primeiro Tópico
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {topics.map(topic => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reputação do Usuário */}
          {currentUser && (
            <>
              <UserForumReputation userId={currentUser.uid} />
              <ForumNotificationSettings />
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Tópicos</span>
                <span className="font-semibold">{topics.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sem Resposta</span>
                <span className="font-semibold text-orange-500">
                  {topics.filter(t => t.replyCount === 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolvidos</span>
                <span className="font-semibold text-green-500">
                  {topics.filter(t => t.isResolved).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regras do Fórum</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Seja respeitoso com todos</li>
                <li>• Busque antes de perguntar</li>
                <li>• Títulos claros e descritivos</li>
                <li>• Marque como resolvido quando ajudado</li>
                <li>• Sem spam ou autopromoção</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Criação */}
      <CreateTopicDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadTopics}
      />
    </div>
  );
}
