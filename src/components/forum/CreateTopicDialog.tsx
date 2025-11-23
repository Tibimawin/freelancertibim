import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ForumService, topicSchema } from '@/services/forumService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface CreateTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'geral', label: 'Geral', color: 'bg-blue-500' },
  { value: 'dicas', label: 'Dicas & Truques', color: 'bg-green-500' },
  { value: 'ajuda', label: 'Preciso de Ajuda', color: 'bg-orange-500' },
  { value: 'bugs', label: 'Bugs & Problemas', color: 'bg-red-500' },
  { value: 'sugestoes', label: 'Sugestões', color: 'bg-purple-500' },
  { value: 'anuncios', label: 'Anúncios', color: 'bg-yellow-500' }
];

export const CreateTopicDialog = ({ open, onOpenChange, onSuccess }: CreateTopicDialogProps) => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      setLoading(true);
      
      await ForumService.createTopic(
        currentUser.uid,
        userData.name,
        userData.avatarUrl,
        { title, content, category: category as any, tags }
      );

      toast.success('Tópico criado com sucesso!');
      setTitle('');
      setContent('');
      setCategory('geral');
      setTags([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar tópico:', error);
      toast.error(error.message || 'Erro ao criar tópico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Tópico</DialogTitle>
          <DialogDescription>
            Compartilhe suas dúvidas, dicas ou sugestões com a comunidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como aumentar minhas chances de ser aprovado?"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/200 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${cat.color}`} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva sua dúvida, dica ou sugestão em detalhes..."
              rows={8}
              maxLength={5000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/5000 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="tags">Tags (opcional - máximo 5)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Ex: aprovação, provas, pagamento"
                maxLength={30}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Tópico
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
