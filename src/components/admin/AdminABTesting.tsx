import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ABTestingService, ABTest } from '@/services/abTestingService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Trophy, Play, CheckCircle, XCircle, TrendingUp, Users, Eye, MousePointerClick } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminABTesting = () => {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variantATitle, setVariantATitle] = useState('');
  const [variantAMessage, setVariantAMessage] = useState('');
  const [variantBTitle, setVariantBTitle] = useState('');
  const [variantBMessage, setVariantBMessage] = useState('');
  const [splitRatio, setSplitRatio] = useState(50);
  const [targetAudience, setTargetAudience] = useState<'all' | 'freelancers' | 'contractors'>('all');
  const [metric, setMetric] = useState<'readRate' | 'clickRate'>('readRate');

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['abTests'],
    queryFn: () => ABTestingService.getABTests(50),
    refetchInterval: 30000,
  });

  const createTestMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.name) throw new Error('Admin name not found');
      
      return ABTestingService.createABTest({
        name,
        description,
        variantA: { title: variantATitle, message: variantAMessage },
        variantB: { title: variantBTitle, message: variantBMessage },
        splitRatio,
        targetAudience,
        metric,
        createdBy: userData.name,
      });
    },
    onSuccess: () => {
      toast.success('Teste A/B criado com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['abTests'] });
    },
    onError: () => {
      toast.error('Erro ao criar teste A/B');
    },
  });

  const launchTestMutation = useMutation({
    mutationFn: (testId: string) => ABTestingService.launchABTest(testId),
    onSuccess: () => {
      toast.success('Teste A/B lançado! Notificações enviadas.');
      queryClient.invalidateQueries({ queryKey: ['abTests'] });
    },
    onError: () => {
      toast.error('Erro ao lançar teste A/B');
    },
  });

  const completeTestMutation = useMutation({
    mutationFn: (testId: string) => ABTestingService.completeABTest(testId),
    onSuccess: () => {
      toast.success('Teste A/B finalizado e vencedor declarado!');
      queryClient.invalidateQueries({ queryKey: ['abTests'] });
    },
    onError: () => {
      toast.error('Erro ao finalizar teste');
    },
  });

  const calculateResultsMutation = useMutation({
    mutationFn: (testId: string) => ABTestingService.calculateTestResults(testId),
    onSuccess: (data) => {
      setSelectedTest(data);
      toast.success('Resultados atualizados!');
      queryClient.invalidateQueries({ queryKey: ['abTests'] });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setVariantATitle('');
    setVariantAMessage('');
    setVariantBTitle('');
    setVariantBMessage('');
    setSplitRatio(50);
    setTargetAudience('all');
    setMetric('readRate');
  };

  const getStatusColor = (status: ABTest['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getWinnerBadge = (winner: ABTest['winner'], variant: 'A' | 'B') => {
    if (winner === variant) {
      return <Badge className="bg-yellow-500"><Trophy className="h-3 w-3 mr-1" /> Vencedor</Badge>;
    }
    if (winner === 'tie') {
      return <Badge variant="outline">Empate</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Testes A/B de Broadcasts</h2>
          <p className="text-muted-foreground">
            Compare diferentes mensagens e descubra qual gera mais engajamento
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Criar Teste A/B
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Teste A/B</DialogTitle>
              <DialogDescription>
                Configure as duas variantes e lance o teste para descobrir qual mensagem performa melhor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome do Teste</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Teste de saque reduzido"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivo do teste..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Audiência Alvo</Label>
                  <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Usuários</SelectItem>
                      <SelectItem value="freelancers">Apenas Freelancers</SelectItem>
                      <SelectItem value="contractors">Apenas Contratantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Métrica Principal</Label>
                  <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="readRate">Taxa de Leitura</SelectItem>
                      <SelectItem value="clickRate">Taxa de Clique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Divisão de Tráfego: {splitRatio}% A / {100 - splitRatio}% B</Label>
                <Slider
                  value={[splitRatio]}
                  onValueChange={([v]) => setSplitRatio(v)}
                  min={10}
                  max={90}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      A
                    </div>
                    <h3 className="font-semibold">Variante A</h3>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={variantATitle}
                      onChange={(e) => setVariantATitle(e.target.value)}
                      placeholder="Título da notificação..."
                    />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea
                      value={variantAMessage}
                      onChange={(e) => setVariantAMessage(e.target.value)}
                      placeholder="Conteúdo da mensagem..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                      B
                    </div>
                    <h3 className="font-semibold">Variante B</h3>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={variantBTitle}
                      onChange={(e) => setVariantBTitle(e.target.value)}
                      placeholder="Título da notificação..."
                    />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea
                      value={variantBMessage}
                      onChange={(e) => setVariantBMessage(e.target.value)}
                      placeholder="Conteúdo da mensagem..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => createTestMutation.mutate()}
                disabled={!name || !variantATitle || !variantBTitle || createTestMutation.isPending}
                className="w-full"
              >
                {createTestMutation.isPending ? 'Criando...' : 'Criar Teste'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="running">Em Execução</TabsTrigger>
            <TabsTrigger value="completed">Finalizados</TabsTrigger>
          </TabsList>

          {['all', 'draft', 'running', 'completed'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {tests
                .filter((t) => status === 'all' || t.status === status)
                .map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {test.name}
                            <Badge className={getStatusColor(test.status)}>
                              {test.status === 'draft' && 'Rascunho'}
                              {test.status === 'running' && 'Em Execução'}
                              {test.status === 'completed' && 'Finalizado'}
                              {test.status === 'cancelled' && 'Cancelado'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{test.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {test.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => launchTestMutation.mutate(test.id)}
                              disabled={launchTestMutation.isPending}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Lançar
                            </Button>
                          )}
                          {test.status === 'running' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => calculateResultsMutation.mutate(test.id)}
                              >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Atualizar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => completeTestMutation.mutate(test.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Finalizar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Variante A */}
                        <div className="space-y-3 border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                                A
                              </div>
                              <h4 className="font-semibold">Variante A</h4>
                            </div>
                            {getWinnerBadge(test.winner, 'A')}
                          </div>
                          <div className="text-sm">
                            <strong>{test.variantA.title}</strong>
                            <p className="text-muted-foreground mt-1">{test.variantA.message}</p>
                          </div>
                          {test.status !== 'draft' && (
                            <div className="space-y-2 pt-3 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Destinatários
                                </span>
                                <strong>{test.variantA.recipientCount}</strong>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Taxa Leitura
                                </span>
                                <div className="flex items-center gap-2">
                                  <Progress value={test.variantA.readRate} className="w-16 h-2" />
                                  <strong>{test.variantA.readRate}%</strong>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <MousePointerClick className="h-3 w-3" />
                                  Taxa Clique
                                </span>
                                <div className="flex items-center gap-2">
                                  <Progress value={test.variantA.clickRate} className="w-16 h-2" />
                                  <strong>{test.variantA.clickRate}%</strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Variante B */}
                        <div className="space-y-3 border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                                B
                              </div>
                              <h4 className="font-semibold">Variante B</h4>
                            </div>
                            {getWinnerBadge(test.winner, 'B')}
                          </div>
                          <div className="text-sm">
                            <strong>{test.variantB.title}</strong>
                            <p className="text-muted-foreground mt-1">{test.variantB.message}</p>
                          </div>
                          {test.status !== 'draft' && (
                            <div className="space-y-2 pt-3 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Destinatários
                                </span>
                                <strong>{test.variantB.recipientCount}</strong>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Taxa Leitura
                                </span>
                                <div className="flex items-center gap-2">
                                  <Progress value={test.variantB.readRate} className="w-16 h-2" />
                                  <strong>{test.variantB.readRate}%</strong>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <MousePointerClick className="h-3 w-3" />
                                  Taxa Clique
                                </span>
                                <div className="flex items-center gap-2">
                                  <Progress value={test.variantB.clickRate} className="w-16 h-2" />
                                  <strong>{test.variantB.clickRate}%</strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {test.status !== 'draft' && (
                        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                          {test.startedAt && (
                            <span>Iniciado {formatDistanceToNow(test.startedAt, { addSuffix: true, locale: ptBR })}</span>
                          )}
                          {test.completedAt && (
                            <span className="ml-4">
                              • Finalizado {formatDistanceToNow(test.completedAt, { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};
