import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  StickyNote, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SupportNotesService, SupportNote } from '@/services/supportNotesService';
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
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SupportNotesPanelProps {
  chatUserId: string;
  currentUserId: string;
  currentUserName: string;
}

export const SupportNotesPanel = ({
  chatUserId,
  currentUserId,
  currentUserName,
}: SupportNotesPanelProps) => {
  const [notes, setNotes] = useState<SupportNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = SupportNotesService.subscribeToNotes(chatUserId, (notesList) => {
      setNotes(notesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatUserId]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleStartEdit = (note: SupportNote) => {
    setEditingNoteId(note.id);
    setNoteText(note.note);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleSave = async () => {
    if (!noteText.trim()) {
      toast.error('A nota não pode estar vazia');
      return;
    }

    setSaving(true);
    try {
      if (editingNoteId) {
        await SupportNotesService.updateNote(editingNoteId, noteText.trim());
        toast.success('Nota atualizada');
      } else {
        await SupportNotesService.createNote(
          chatUserId,
          noteText.trim(),
          currentUserId,
          currentUserName
        );
        toast.success('Nota criada');
      }
      handleCancel();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      toast.error('Erro ao salvar nota');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      await SupportNotesService.deleteNote(noteToDelete);
      toast.success('Nota deletada');
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      toast.error('Erro ao deletar nota');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border-dashed">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Notas Internas</CardTitle>
                {notes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {notes.length}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {!isOpen && notes.length > 0 && (
              <CardDescription className="text-xs line-clamp-1">
                {notes[0].note}
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando notas...</span>
              </div>
            ) : (
              <>
                {notes.length === 0 && !isAdding && (
                  <div className="text-center py-6">
                    <StickyNote className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-3">
                      Nenhuma nota interna registrada
                    </p>
                    <Button size="sm" onClick={handleStartAdd}>
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Nota
                    </Button>
                  </div>
                )}

                {notes.map((note) => (
                  <Card key={note.id} className="bg-muted/30">
                    <CardContent className="p-3">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Digite sua nota..."
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={saving || !noteText.trim()}
                            >
                              {saving ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Save className="h-3 w-3 mr-1" />
                              )}
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={saving}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="text-xs text-muted-foreground">
                              <span className="font-semibold">{note.createdByName}</span>
                              {' · '}
                              {formatDistanceToNow(note.createdAt, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                              {note.createdAt.getTime() !== note.updatedAt.getTime() && (
                                <span className="italic"> (editada)</span>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEdit(note)}
                                className="h-6 w-6 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setNoteToDelete(note.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {isAdding && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Digite sua nota interna aqui..."
                          rows={3}
                          className="resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || !noteText.trim()}
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {notes.length > 0 && !isAdding && !editingNoteId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartAdd}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Nova Nota
                  </Button>
                )}
              </>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta nota interna? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setNoteToDelete(null)}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
