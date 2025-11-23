import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ForumService, ForumTopic as ForumTopicType, ForumReply } from '@/services/forumService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Eye, 
  CheckCircle2,
  Loader2,
  Trash2,
  Check,
  Flag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ForumTopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [topic, setTopic] = useState<ForumTopicType | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'topic' | 'reply', id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    if (!topicId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const topicData = await ForumService.getTopic(topicId);
        if (!topicData) {
          toast.error('Tópico não encontrado');
          navigate('/community/forum');
          return;
        }
        setTopic(topicData);
      } catch (error) {
        console.error('Erro ao carregar tópico:', error);
        toast.error('Erro ao carregar tópico');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe para atualizações em tempo real
    const unsubTopic = ForumService.subscribeToTopic(topicId, setTopic);
    const unsubReplies = ForumService.subscribeToReplies(topicId, setReplies);

    return () => {
      unsubTopic();
      unsubReplies();
    };
  }, [topicId, navigate]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData || !topicId) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    try {
      setSubmitting(true);
      await ForumService.createReply(
        topicId,
        currentUser.uid,
        userData.name,
        userData.avatarUrl,
        replyContent
      );
      setReplyContent('');
      toast.success('Resposta enviada!');
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      toast.error(error.message || 'Erro ao enviar resposta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteTopic = async (voteType: 'up' | 'down') => {
    if (!currentUser || !topicId) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await ForumService.voteTopic(topicId, currentUser.uid, voteType);
      toast.success('Voto registrado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao votar');
    }
  };

  const handleVoteReply = async (replyId: string, voteType: 'up' | 'down') => {
    if (!currentUser) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await ForumService.voteReply(replyId, currentUser.uid, voteType);
      toast.success('Voto registrado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao votar');
    }
  };

  const handleMarkResolved = async () => {
    if (!currentUser || !topicId) return;

    try {
      await ForumService.markAsResolved(topicId, currentUser.uid);
      toast.success('Tópico marcado como resolvido!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar como resolvido');
    }
  };

  const handleAcceptReply = async (replyId: string) => {
    if (!currentUser || !topicId) return;

    try {
      await ForumService.acceptReply(replyId, topicId, currentUser.uid);
      toast.success('Resposta aceita como solução!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aceitar resposta');
    }
  };

  const handleDeleteTopic = async () => {
    if (!currentUser || !topicId) return;

    try {
      await ForumService.deleteTopic(topicId, currentUser.uid);
      toast.success('Tópico deletado');
      navigate('/community/forum');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar tópico');
    }
  };

  const handleReport = (type: 'topic' | 'reply', id: string) => {
    setReportTarget({ type, id });
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!currentUser || !userData || !reportTarget || !reportReason.trim()) {
      toast.error('Preencha o motivo da denúncia');
      return;
    }

    try {
      await ForumService.reportForumContent(
        currentUser.uid,
        userData.name || 'Anônimo',
        reportTarget.type,
        reportTarget.id,
        reportReason,
        reportDetails
      );

      toast.success('Denúncia enviada com sucesso');
      setReportDialogOpen(false);
      setReportReason('');
      setReportDetails('');
      setReportTarget(null);
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      toast.error('Erro ao enviar denúncia');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  const isAuthor = currentUser?.uid === topic.authorId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/community/forum')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Fórum
      </Button>

      {/* Tópico Principal */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <Link to={`/freelancer/${topic.authorId}`}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={topic.authorAvatar} />
                  <AvatarFallback>{topic.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  to={`/freelancer/${topic.authorId}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {topic.authorName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(topic.createdAt, { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>

            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            {topic.title}
            {topic.isResolved && (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )}
          </h1>

          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topic.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="prose prose-sm max-w-none mb-4">
            <p className="whitespace-pre-wrap">{topic.content}</p>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{topic.replyCount} respostas</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{topic.viewCount} visualizações</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVoteTopic('up')}
                disabled={!currentUser || topic.votedBy?.includes(currentUser.uid)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {topic.upvotes}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVoteTopic('down')}
                disabled={!currentUser || topic.votedBy?.includes(currentUser.uid)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {topic.downvotes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReport('topic', topic.id)}
                className="text-destructive hover:text-destructive"
              >
                <Flag className="h-4 w-4 mr-1" />
                Denunciar
              </Button>
              
              {isAuthor && !topic.isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkResolved}
                  className="text-green-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar Resolvido
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Respostas */}
      <div className="space-y-4 mb-6">
        <h2 className="text-2xl font-bold">
          {replies.length} {replies.length === 1 ? 'Resposta' : 'Respostas'}
        </h2>

        {replies.map(reply => (
          <Card key={reply.id} className={reply.isAccepted ? 'border-green-500 border-2' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Link to={`/freelancer/${reply.authorId}`}>
                  <Avatar>
                    <AvatarImage src={reply.authorAvatar} />
                    <AvatarFallback>{reply.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        to={`/freelancer/${reply.authorId}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {reply.authorName}
                      </Link>
                      {reply.isAccepted && (
                        <Badge variant="default" className="ml-2 bg-green-500">
                          Solução Aceita
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                    {reply.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-12">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVoteReply(reply.id, 'up')}
                  disabled={!currentUser || reply.votedBy?.includes(currentUser.uid)}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {reply.upvotes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVoteReply(reply.id, 'down')}
                  disabled={!currentUser || reply.votedBy?.includes(currentUser.uid)}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  {reply.downvotes}
                </Button>
                
                {isAuthor && !reply.isAccepted && !topic.isResolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAcceptReply(reply.id)}
                    className="text-green-600"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Aceitar Solução
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReport('reply', reply.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulário de Resposta */}
      {currentUser ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmitReply}>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva sua resposta..."
                rows={4}
                maxLength={5000}
                className="mb-2"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {replyContent.length}/5000 caracteres
                </p>
                <Button type="submit" disabled={submitting || !replyContent.trim()}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Responder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Faça login para participar da discussão
            </p>
            <Button onClick={() => navigate('/login')}>Fazer Login</Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Tópico</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este tópico? Esta ação não pode ser desfeita e todas as respostas serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar Conteúdo Inadequado</DialogTitle>
            <DialogDescription>
              Ajude-nos a manter a comunidade segura reportando conteúdo que viola nossas diretrizes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo da Denúncia*</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Ex: Spam, Conteúdo ofensivo, etc."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Detalhes (Opcional)</label>
              <Textarea
                placeholder="Forneça mais informações sobre esta denúncia..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReport} disabled={!reportReason.trim()}>
              <Flag className="h-4 w-4 mr-2" />
              Enviar Denúncia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
