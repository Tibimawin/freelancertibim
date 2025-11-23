import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { QuickRepliesService, QuickReply } from '@/services/quickRepliesService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const QuickRepliesManager = () => {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: '',
  });

  useEffect(() => {
    const unsubscribe = QuickRepliesService.subscribeToQuickReplies((replies) => {
      setQuickReplies(replies);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDialog = (reply?: QuickReply) => {
    if (reply) {
      setEditingReply(reply);
      setFormData({
        title: reply.title,
        message: reply.message,
        category: reply.category || '',
      });
    } else {
      setEditingReply(null);
      setFormData({ title: '', message: '', category: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReply(null);
    setFormData({ title: '', message: '', category: '' });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    try {
      if (editingReply) {
        await QuickRepliesService.updateQuickReply(editingReply.id, formData);
        toast.success('Resposta rápida atualizada');
      } else {
        await QuickRepliesService.createQuickReply(
          formData.title,
          formData.message,
          formData.category
        );
        toast.success('Resposta rápida criada');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar resposta rápida:', error);
      toast.error('Erro ao salvar resposta rápida');
    }
  };

  const handleDelete = async () => {
    if (!replyToDelete) return;

    try {
      await QuickRepliesService.deleteQuickReply(replyToDelete);
      toast.success('Resposta rápida deletada');
      setDeleteDialogOpen(false);
      setReplyToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar resposta rápida:', error);
      toast.error('Erro ao deletar resposta rápida');
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await QuickRepliesService.initializeDefaultTemplates();
      toast.success('Templates padrão inicializados');
    } catch (error) {
      console.error('Erro ao inicializar templates:', error);
      toast.error('Erro ao inicializar templates');
    }
  };

  // Agrupar por categoria
  const groupedReplies = quickReplies.reduce((acc, reply) => {
    const category = reply.category || 'Sem Categoria';
    if (!acc[category]) acc[category] = [];
    acc[category].push(reply);
    return acc;
  }, {} as Record<string, QuickReply[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gerenciar Respostas Rápidas
            </CardTitle>
            <CardDescription className="mt-2">
              Crie e gerencie templates de mensagens para agilizar o atendimento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {quickReplies.length === 0 && (
              <Button variant="outline" onClick={handleInitializeDefaults}>
                Carregar Templates Padrão
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Resposta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingReply ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingReply 
                      ? 'Atualize os campos abaixo para editar a resposta rápida'
                      : 'Preencha os campos abaixo para criar uma nova resposta rápida'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Boas-vindas"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      placeholder="Ex: Geral, Saques, Tarefas"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      placeholder="Digite a mensagem do template..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.message.length} caracteres
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingReply ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando respostas rápidas...</span>
          </div>
        ) : quickReplies.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Nenhuma resposta rápida configurada
            </p>
            <Button onClick={handleInitializeDefaults}>
              Carregar Templates Padrão
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedReplies).map(([category, replies]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid gap-3">
                  {replies.map((reply) => (
                    <Card key={reply.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1">{reply.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {reply.message}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(reply)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyToDelete(reply.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta resposta rápida? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setReplyToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
