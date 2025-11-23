import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pin,
  Trash2,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Ban,
  Eye
} from 'lucide-react';
import { ForumService, ForumTopic } from '@/services/forumService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const AdminForumModeration = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [banReason, setBanReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reportFilter, setReportFilter] = useState<'pending' | 'reviewed' | 'dismissed' | 'all'>('pending');

  useEffect(() => {
    loadData();
  }, [reportFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [forumStats, allTopics, forumReports] = await Promise.all([
        ForumService.getForumStats(),
        ForumService.getTopics({ limitNum: 50 }),
        ForumService.getForumReports(reportFilter)
      ]);

      setStats(forumStats);
      setTopics(allTopics);
      setReports(forumReports);
    } catch (error) {
      console.error('Erro ao carregar dados do fórum:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (topicId: string) => {
    try {
      await ForumService.togglePinTopic(topicId);
      toast.success('Status de fixação atualizado');
      loadData();
    } catch (error) {
      console.error('Erro ao fixar tópico:', error);
      toast.error('Erro ao atualizar tópico');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Tem certeza que deseja deletar este tópico? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await ForumService.deleteTopic(topicId, currentUser?.uid || '', true);
      toast.success('Tópico deletado com sucesso');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar tópico:', error);
      toast.error('Erro ao deletar tópico');
    }
  };

  const handleReviewReport = async (status: 'reviewed' | 'dismissed') => {
    if (!selectedReport || !currentUser) return;

    try {
      await ForumService.reviewForumReport(
        selectedReport.id,
        currentUser.uid,
        status,
        adminNotes
      );
      toast.success(`Denúncia ${status === 'reviewed' ? 'revisada' : 'dispensada'} com sucesso`);
      setReviewDialogOpen(false);
      setAdminNotes('');
      loadData();
    } catch (error) {
      console.error('Erro ao revisar denúncia:', error);
      toast.error('Erro ao processar denúncia');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error('Preencha o motivo do banimento');
      return;
    }

    try {
      // Create banned user record
      await updateDoc(doc(db, 'users', selectedUserId), {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: currentUser?.uid,
        banReason: banReason
      });

      toast.success('Usuário banido com sucesso');
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUserId('');
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      toast.error('Erro ao banir usuário');
    }
  };

  const openReviewDialog = (report: any) => {
    setSelectedReport(report);
    setReviewDialogOpen(true);
  };

  const openBanDialog = (userId: string) => {
    setSelectedUserId(userId);
    setBanDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total de Tópicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTopics || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.topicsToday || 0} criados hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total de Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReplies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.repliesToday || 0} criadas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Participantes únicos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Denúncias Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="topics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="topics">Tópicos</TabsTrigger>
          <TabsTrigger value="reports">
            Denúncias
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5">
                {reports.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Tópicos</CardTitle>
              <CardDescription>
                Fixar tópicos importantes ou remover spam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topics.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum tópico encontrado
                  </p>
                ) : (
                  topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {topic.isPinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          <Link
                            to={`/forum/${topic.id}`}
                            className="font-medium hover:text-primary transition-colors truncate"
                          >
                            {topic.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Por {topic.authorName}</span>
                          <span>•</span>
                          <span>{topic.replyCount} respostas</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {topic.category}
                          </Badge>
                          {topic.isResolved && (
                            <>
                              <span>•</span>
                              <Badge variant="default" className="text-xs">
                                Resolvido
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={topic.isPinned ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleTogglePin(topic.id)}
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBanDialog(topic.authorId)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTopic(topic.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Denúncias de Conteúdo</CardTitle>
                  <CardDescription>
                    Revisar denúncias de spam e conteúdo inadequado
                  </CardDescription>
                </div>
                <Select value={reportFilter} onValueChange={(v: any) => setReportFilter(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="reviewed">Revisadas</SelectItem>
                    <SelectItem value="dismissed">Dispensadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma denúncia encontrada
                  </p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              report.status === 'pending'
                                ? 'destructive'
                                : report.status === 'reviewed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {report.status === 'pending' && 'Pendente'}
                            {report.status === 'reviewed' && 'Revisada'}
                            {report.status === 'dismissed' && 'Dispensada'}
                          </Badge>
                          <Badge variant="outline">{report.contentType}</Badge>
                        </div>
                        <p className="font-medium mb-1">Motivo: {report.reason}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {report.details}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Denunciado por {report.reporterName}</span>
                          <span>•</span>
                          <span>
                            {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Revisar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Report Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar Denúncia</DialogTitle>
            <DialogDescription>
              Analise a denúncia e tome uma decisão
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Motivo:</p>
                <p className="text-sm text-muted-foreground">{selectedReport.reason}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Detalhes:</p>
                <p className="text-sm text-muted-foreground">{selectedReport.details}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Notas Administrativas:</p>
                <Textarea
                  placeholder="Adicione notas sobre sua decisão..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleReviewReport('dismissed')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dispensar
            </Button>
            <Button onClick={() => handleReviewReport('reviewed')}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar Violação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Esta ação impedirá o usuário de acessar o fórum
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Motivo do Banimento:</p>
              <Textarea
                placeholder="Descreva o motivo do banimento..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              <Ban className="h-4 w-4 mr-2" />
              Confirmar Banimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
