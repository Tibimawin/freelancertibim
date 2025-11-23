import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tag, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { SupportTagsService, SupportTag } from '@/services/supportTagsService';
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

const COLOR_OPTIONS = [
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Laranja', value: '#F59E0B' },
  { name: 'Amarelo', value: '#EAB308' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Verde Claro', value: '#22C55E' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Cinza', value: '#6B7280' },
];

export const SupportTagsManager = () => {
  const [tags, setTags] = useState<SupportTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SupportTag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    description: '',
  });

  useEffect(() => {
    const unsubscribe = SupportTagsService.subscribeToTags((tagsList) => {
      setTags(tagsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDialog = (tag?: SupportTag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        color: tag.color,
        description: tag.description || '',
      });
    } else {
      setEditingTag(null);
      setFormData({ name: '', color: '#6B7280', description: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#6B7280', description: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    try {
      if (editingTag) {
        await SupportTagsService.updateTag(editingTag.id, formData);
        toast.success('Tag atualizada');
      } else {
        await SupportTagsService.createTag(
          formData.name,
          formData.color,
          formData.description
        );
        toast.success('Tag criada');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      toast.error('Erro ao salvar tag');
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    try {
      await SupportTagsService.deleteTag(tagToDelete);
      toast.success('Tag deletada');
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      toast.error('Erro ao deletar tag');
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await SupportTagsService.initializeDefaultTags();
      toast.success('Tags padrão inicializadas');
    } catch (error) {
      console.error('Erro ao inicializar tags:', error);
      toast.error('Erro ao inicializar tags');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Gerenciar Tags
            </CardTitle>
            <CardDescription className="mt-2">
              Organize conversas com tags coloridas para facilitar busca e relatórios
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {tags.length === 0 && (
              <Button variant="outline" onClick={handleInitializeDefaults}>
                Carregar Tags Padrão
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTag ? 'Editar Tag' : 'Nova Tag'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTag 
                      ? 'Atualize os campos abaixo para editar a tag'
                      : 'Preencha os campos abaixo para criar uma nova tag'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Urgente"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Cor *</Label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`h-10 rounded-md border-2 transition-all ${
                            formData.color === color.value
                              ? 'border-foreground scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva quando usar esta tag..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingTag ? 'Atualizar' : 'Criar'}
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
            <span>Carregando tags...</span>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Nenhuma tag configurada
            </p>
            <Button onClick={handleInitializeDefaults}>
              Carregar Tags Padrão
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card key={tag.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Badge 
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                      className="font-medium"
                    >
                      {tag.name}
                    </Badge>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(tag)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTagToDelete(tag.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {tag.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {tag.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Usada {tag.usageCount} {tag.usageCount === 1 ? 'vez' : 'vezes'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta tag? Ela será removida de todas as conversas. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTagToDelete(null)}>
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
