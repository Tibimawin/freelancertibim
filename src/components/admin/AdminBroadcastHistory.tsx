import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BroadcastHistoryService, BroadcastHistory } from '@/services/broadcastHistoryService';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Users, Eye, MousePointerClick, Bell } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const AdminBroadcastHistory = () => {
  const [selectedType, setSelectedType] = useState<'all' | 'system_config' | 'manual' | 'promotional'>('all');

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['broadcastHistory', selectedType],
    queryFn: () => BroadcastHistoryService.getBroadcastHistory(100),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const filteredBroadcasts = selectedType === 'all' 
    ? broadcasts 
    : broadcasts.filter(b => b.type === selectedType);

  const getTypeColor = (type: BroadcastHistory['type']) => {
    switch (type) {
      case 'system_config': return 'bg-blue-500';
      case 'manual': return 'bg-purple-500';
      case 'promotional': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: BroadcastHistory['type']) => {
    switch (type) {
      case 'system_config': return 'Config. Sistema';
      case 'manual': return 'Manual';
      case 'promotional': return 'Promocional';
      default: return type;
    }
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rate >= 40) return <Eye className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const totalStats = filteredBroadcasts.reduce((acc, b) => ({
    totalRecipients: acc.totalRecipients + b.totalRecipients,
    totalRead: acc.totalRead + b.totalRead,
    totalClicked: acc.totalClicked + b.totalClicked,
    count: acc.count + 1,
  }), { totalRecipients: 0, totalRead: 0, totalClicked: 0, count: 0 });

  const avgReadRate = totalStats.totalRecipients > 0 
    ? (totalStats.totalRead / totalStats.totalRecipients) * 100 
    : 0;
  const avgClickRate = totalStats.totalRecipients > 0 
    ? (totalStats.totalClicked / totalStats.totalRecipients) * 100 
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Total Broadcasts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Destinatários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRecipients.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Taxa de Leitura Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{avgReadRate.toFixed(1)}%</div>
              {getTrendIcon(avgReadRate)}
            </div>
            <Progress value={avgReadRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Taxa de Clique Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</div>
              {getTrendIcon(avgClickRate)}
            </div>
            <Progress value={avgClickRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Broadcasts */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Notificações em Massa</CardTitle>
          <CardDescription>
            Acompanhe o desempenho das notificações enviadas aos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="system_config">Config. Sistema</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="promotional">Promocional</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType}>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Destinatários</TableHead>
                      <TableHead>Lidos</TableHead>
                      <TableHead>Taxa Leitura</TableHead>
                      <TableHead>Taxa Clique</TableHead>
                      <TableHead>Enviado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBroadcasts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum broadcast encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBroadcasts.map((broadcast) => (
                        <TableRow key={broadcast.id}>
                          <TableCell>
                            <Badge className={getTypeColor(broadcast.type)}>
                              {getTypeLabel(broadcast.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{broadcast.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {broadcast.message}
                              </div>
                              {broadcast.changeType && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {broadcast.changeType}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {broadcast.totalRecipients.toLocaleString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              {broadcast.totalRead.toLocaleString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={broadcast.readRate} className="w-16" />
                              <span className="text-sm font-medium">{broadcast.readRate}%</span>
                              {getTrendIcon(broadcast.readRate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={broadcast.clickRate} className="w-16" />
                              <span className="text-sm font-medium">{broadcast.clickRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(broadcast.sentAt, { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
