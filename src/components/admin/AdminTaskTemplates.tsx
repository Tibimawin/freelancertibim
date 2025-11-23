import { useState, useEffect } from 'react';
import { Mail, Youtube, Facebook, Instagram, Video, Globe, Copy, X as XIcon, Plus as PlusIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskTemplateService, TaskTemplate } from '@/services/taskTemplateService';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProofRequirement {
  id: string;
  type: 'text' | 'url' | 'screenshot' | 'file';
  label: string;
  description: string;
  placeholder?: string;
  isRequired: boolean;
}

interface EmailCreation {
  provider: 'gmail' | 'outlook' | 'yahoo' | 'protonmail' | 'other';
  quantity: number;
  requirements?: string;
  customProvider?: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  platform: string;
  taskType: string;
  defaultBounty: number;
  defaultTimeEstimate: number;
  defaultInstructions: string;
  isActive: boolean;
  proofRequirements: ProofRequirement[];
  emailCreation?: EmailCreation;
}

export function AdminTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'Redes Sociais',
    subcategory: '',
    platform: 'Facebook',
    taskType: 'like',
    defaultBounty: 50,
    defaultTimeEstimate: 5,
    defaultInstructions: '',
    isActive: true,
    proofRequirements: [],
  });
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await TaskTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenDialog = (template?: TaskTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        subcategory: template.subcategory || '',
        platform: template.platform,
        taskType: template.taskType,
        defaultBounty: template.defaultBounty,
        defaultTimeEstimate: template.defaultTimeEstimate,
        defaultInstructions: template.defaultInstructions,
        isActive: template.isActive,
        proofRequirements: template.proofRequirements || [],
        emailCreation: template.emailCreation,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        category: 'Redes Sociais',
        subcategory: '',
        platform: 'Facebook',
        taskType: 'like',
        defaultBounty: 50,
        defaultTimeEstimate: 5,
        defaultInstructions: '',
        isActive: true,
        proofRequirements: [],
      });
    }
    setIsDialogOpen(true);
  };

  const validateTemplate = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name?.trim()) {
      errors.push('Nome do template é obrigatório');
    }

    if (!formData.description?.trim()) {
      errors.push('Descrição é obrigatória');
    }

    if (!formData.category?.trim()) {
      errors.push('Categoria é obrigatória');
    }

    if (!formData.subcategory?.trim()) {
      errors.push('Subcategoria é obrigatória');
    }

    if (!formData.platform?.trim()) {
      errors.push('Plataforma é obrigatória');
    }

    if (!formData.taskType?.trim()) {
      errors.push('Tipo de tarefa é obrigatório');
    }

    if (!formData.defaultBounty || formData.defaultBounty <= 0) {
      errors.push('Recompensa padrão deve ser maior que 0');
    }

    if (!formData.defaultTimeEstimate || formData.defaultTimeEstimate <= 0) {
      errors.push('Tempo estimado deve ser maior que 0');
    }

    if (!formData.defaultInstructions?.trim()) {
      errors.push('Instruções padrão são obrigatórias');
    }

    if (!formData.proofRequirements || formData.proofRequirements.length === 0) {
      errors.push('Adicione pelo menos um requisito de prova');
    } else {
      // Validar cada requisito de prova
      formData.proofRequirements.forEach((req, index) => {
        if (!req.type?.trim()) {
          errors.push(`Requisito ${index + 1}: Tipo é obrigatório`);
        }
        if (!req.label?.trim()) {
          errors.push(`Requisito ${index + 1}: Label é obrigatório`);
        }
      });
    }

    // Validar emailCreation se o taskType for 'email_creation'
    if (formData.taskType === 'email_creation') {
      if (!formData.emailCreation) {
        errors.push('Configuração de criação de email é obrigatória para este tipo de tarefa');
      } else {
        if (!formData.emailCreation.provider?.trim()) {
          errors.push('Provedor de email é obrigatório');
        }
        if (!formData.emailCreation.quantity || formData.emailCreation.quantity <= 0) {
          errors.push('Quantidade de emails deve ser maior que 0');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSaveTemplate = async () => {
    try {
      // Validar formulário
      const validation = validateTemplate();
      
      if (!validation.isValid) {
        // Mostrar todos os erros
        validation.errors.forEach(error => {
          toast({
            title: 'Erro de validação',
            description: error,
            variant: 'destructive',
          });
        });
        return;
      }

      // Remover campos undefined antes de salvar
      const cleanedData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        platform: formData.platform,
        taskType: formData.taskType,
        defaultBounty: formData.defaultBounty,
        defaultTimeEstimate: formData.defaultTimeEstimate,
        defaultInstructions: formData.defaultInstructions,
        isActive: formData.isActive,
        proofRequirements: formData.proofRequirements,
      };

      // Só adicionar emailCreation se existir
      if (formData.emailCreation) {
        cleanedData.emailCreation = formData.emailCreation;
      }

      if (editingTemplate) {
        await TaskTemplateService.updateTemplate(editingTemplate.id, cleanedData);
        toast({
          title: 'Sucesso',
          description: 'Template atualizado com sucesso',
        });
      } else {
        await TaskTemplateService.createTemplate(cleanedData);
        toast({
          title: 'Sucesso',
          description: 'Template criado com sucesso',
        });
      }
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await TaskTemplateService.deleteTemplate(templateId);
      toast({
        title: 'Sucesso',
        description: 'Template excluído com sucesso',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o template',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await TaskTemplateService.duplicateTemplate(templateId);
      toast({
        title: 'Sucesso',
        description: 'Template duplicado com sucesso',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o template',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (templateId: string) => {
    try {
      await TaskTemplateService.toggleTemplateStatus(templateId);
      toast({
        title: 'Sucesso',
        description: 'Status do template atualizado',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    }
  };

  const addProofRequirement = () => {
    setFormData({
      ...formData,
      proofRequirements: [
        ...formData.proofRequirements,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'screenshot',
          label: '',
          description: '',
          placeholder: '',
          isRequired: true,
        },
      ],
    });
  };

  const removeProofRequirement = (id: string) => {
    setFormData({
      ...formData,
      proofRequirements: formData.proofRequirements.filter((req) => req.id !== id),
    });
  };

  const updateProofRequirement = (id: string, updates: Partial<ProofRequirement>) => {
    setFormData({
      ...formData,
      proofRequirements: formData.proofRequirements.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    });
  };

  const handleSeedTemplates = async (seedFunction: () => Promise<void>, platform: string) => {
    try {
      await seedFunction();
      toast({
        title: 'Sucesso',
        description: `Templates de ${platform} adicionados com sucesso`,
      });
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao adicionar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar os templates',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Templates de Tarefas</h2>
          <p className="text-muted-foreground">
            Gerencie templates pré-configurados para criação rápida de tarefas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedEmailCreationTemplates(), 'E-mail')} variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            E-mail
          </Button>
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedYouTubeTemplates(), 'YouTube')} variant="outline" size="sm">
            <Youtube className="h-4 w-4 mr-2" />
            YouTube
          </Button>
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedFacebookTemplates(), 'Facebook')} variant="outline" size="sm">
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedInstagramTemplates(), 'Instagram')} variant="outline" size="sm">
            <Instagram className="h-4 w-4 mr-2" />
            Instagram
          </Button>
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedTikTokTemplates(), 'TikTok')} variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            TikTok
          </Button>
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedWebsiteTemplates(), 'Website')} variant="outline" size="sm">
            <Globe className="h-4 w-4 mr-2" />
            Website
          </Button>
          <Button onClick={() => handleSeedTemplates(() => TaskTemplateService.seedTwitterTemplates(), 'Twitter/X')} variant="outline" size="sm">
            <XIcon className="h-4 w-4 mr-2" />
            Twitter/X
          </Button>
          <Button onClick={fetchTemplates} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates Disponíveis</CardTitle>
          <CardDescription>
            {templates.length} template(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum template cadastrado. Use os botões acima para adicionar templates padrão.
            </p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">{template.platform}</Badge>
                      <Badge variant="outline">{template.taskType}</Badge>
                      {template.subcategory && (
                        <Badge variant="secondary">{template.subcategory}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>💰 {template.defaultBounty} Kz</span>
                      <span>⏱️ {template.defaultTimeEstimate} min</span>
                      <span>📁 {template.category}</span>
                      {template.proofRequirements && template.proofRequirements.length > 0 && (
                        <span>📋 {template.proofRequirements.length} requisitos</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(template.id)}
                      title={template.isActive ? 'Desativar' : 'Ativar'}
                    >
                      <Switch checked={template.isActive} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(template)}
                      title="Editar template"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicateTemplate(template.id)}
                      title="Duplicar template"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      title="Excluir template"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure um template de tarefa pré-definido para facilitar a criação de tarefas
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="proof">Requisitos de Prova</TabsTrigger>
              <TabsTrigger value="email">E-mail (Opcional)</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Curtir Publicação no Facebook"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Breve descrição do template"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value, subcategory: '', platform: '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="Web">Web</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategoria *</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                    disabled={!formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category === 'Social' && (
                        <>
                          <SelectItem value="YouTube">YouTube</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                          <SelectItem value="VK">VK</SelectItem>
                          <SelectItem value="X (Twitter)">X (Twitter)</SelectItem>
                        </>
                      )}
                      {formData.category === 'Web' && (
                        <>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Visitar site">Visitar site</SelectItem>
                          <SelectItem value="Ver vídeo no YouTube">Ver vídeo no YouTube</SelectItem>
                          <SelectItem value="Criar E-mail">Criar E-mail</SelectItem>
                        </>
                      )}
                      {formData.category === 'Mobile' && (
                        <>
                          <SelectItem value="App">App</SelectItem>
                          <SelectItem value="Play Store">Play Store</SelectItem>
                          <SelectItem value="App Store">App Store</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="platform">Tipo de Anúncio (Platform) *</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de anúncio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube-watch">YouTube - Assistir</SelectItem>
                      <SelectItem value="youtube-subscribe">YouTube - Inscrever-se</SelectItem>
                      <SelectItem value="youtube-like">YouTube - Curtir</SelectItem>
                      <SelectItem value="youtube-comment">YouTube - Comentar</SelectItem>
                      <SelectItem value="facebook-watch">Facebook - Assistir</SelectItem>
                      <SelectItem value="facebook-follow">Facebook - Seguir Página</SelectItem>
                      <SelectItem value="facebook-like">Facebook - Curtir</SelectItem>
                      <SelectItem value="facebook-comment">Facebook - Comentar</SelectItem>
                      <SelectItem value="facebook-share">Facebook - Compartilhar</SelectItem>
                      <SelectItem value="instagram-watch">Instagram - Assistir Reels</SelectItem>
                      <SelectItem value="instagram-follow">Instagram - Seguir</SelectItem>
                      <SelectItem value="instagram-like">Instagram - Curtir</SelectItem>
                      <SelectItem value="instagram-comment">Instagram - Comentar</SelectItem>
                      <SelectItem value="tiktok-watch">TikTok - Assistir</SelectItem>
                      <SelectItem value="tiktok-follow">TikTok - Seguir</SelectItem>
                      <SelectItem value="tiktok-like">TikTok - Curtir</SelectItem>
                      <SelectItem value="tiktok-comment">TikTok - Comentar</SelectItem>
                      <SelectItem value="tiktok-share">TikTok - Compartilhar</SelectItem>
                      <SelectItem value="vk-join">VK - Entrar em Grupo</SelectItem>
                      <SelectItem value="vk-like">VK - Curtir</SelectItem>
                      <SelectItem value="web-website">Web - Visitar Site</SelectItem>
                      <SelectItem value="web-visit-site">Web - Visitar Site (Scroll)</SelectItem>
                      <SelectItem value="web-criar-email">Web - Criar E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taskType">Tipo de Tarefa (TaskType) *</Label>
                  <Select
                    value={formData.taskType}
                    onValueChange={(value) => setFormData({ ...formData, taskType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de tarefa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="watch">Assistir</SelectItem>
                      <SelectItem value="subscribe">Inscrever-se</SelectItem>
                      <SelectItem value="like">Curtir</SelectItem>
                      <SelectItem value="comment">Comentar</SelectItem>
                      <SelectItem value="follow">Seguir</SelectItem>
                      <SelectItem value="share">Compartilhar</SelectItem>
                      <SelectItem value="visit">Visitar</SelectItem>
                      <SelectItem value="visit_scroll">Visitar e Rolar</SelectItem>
                      <SelectItem value="email_creation">Criar E-mail</SelectItem>
                      <SelectItem value="join">Entrar em Grupo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bounty">Recompensa (Kz) *</Label>
                  <Input
                    id="bounty"
                    type="number"
                    value={formData.defaultBounty}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultBounty: parseInt(e.target.value) || 0 })
                    }
                    placeholder="50"
                  />
                </div>

                <div>
                  <Label htmlFor="timeEstimate">Tempo Estimado (min) *</Label>
                  <Input
                    id="timeEstimate"
                    type="number"
                    value={formData.defaultTimeEstimate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultTimeEstimate: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="5"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="instructions">Instruções Padrão *</Label>
                  <Textarea
                    id="instructions"
                    value={formData.defaultInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultInstructions: e.target.value })
                    }
                    placeholder="Instruções detalhadas para executar a tarefa"
                    rows={4}
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Template ativo (visível para contratantes)
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="proof" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">Requisitos de Prova</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure os campos que o freelancer deve preencher para comprovar a tarefa
                  </p>
                </div>
                <Button onClick={addProofRequirement} size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Requisito
                </Button>
              </div>

              {formData.proofRequirements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  Nenhum requisito de prova configurado. Clique em "Adicionar Requisito" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.proofRequirements.map((req, index) => (
                    <Card key={req.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Requisito #{index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProofRequirement(req.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Tipo de Prova</Label>
                            <Select
                              value={req.type}
                              onValueChange={(value: any) =>
                                updateProofRequirement(req.id, { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="screenshot">Screenshot</SelectItem>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="file">Arquivo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Label do Campo</Label>
                            <Input
                              value={req.label}
                              onChange={(e) =>
                                updateProofRequirement(req.id, { label: e.target.value })
                              }
                              placeholder="Ex: Screenshot da curtida"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label>Descrição</Label>
                            <Input
                              value={req.description}
                              onChange={(e) =>
                                updateProofRequirement(req.id, { description: e.target.value })
                              }
                              placeholder="Descrição do que deve ser enviado"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label>Placeholder (Opcional)</Label>
                            <Input
                              value={req.placeholder || ''}
                              onChange={(e) =>
                                updateProofRequirement(req.id, { placeholder: e.target.value })
                              }
                              placeholder="Texto de ajuda no campo"
                            />
                          </div>

                          <div className="col-span-2 flex items-center space-x-2">
                            <Switch
                              checked={req.isRequired}
                              onCheckedChange={(checked) =>
                                updateProofRequirement(req.id, { isRequired: checked })
                              }
                            />
                            <Label className="cursor-pointer">Campo obrigatório</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="mb-4">
                <h3 className="font-semibold">Configurações de Criação de E-mail</h3>
                <p className="text-sm text-muted-foreground">
                  Preencha apenas se este template for para tarefas de criação de e-mail
                </p>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  checked={!!formData.emailCreation}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        emailCreation: {
                          provider: 'gmail',
                          quantity: 1,
                          requirements: '',
                        },
                      });
                    } else {
                      const { emailCreation, ...rest } = formData;
                      setFormData(rest);
                    }
                  }}
                />
                <Label className="cursor-pointer">
                  Este template é para criação de e-mail
                </Label>
              </div>

              {formData.emailCreation && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Provedor de E-mail</Label>
                    <Select
                      value={formData.emailCreation.provider}
                      onValueChange={(value: any) =>
                        setFormData({
                          ...formData,
                          emailCreation: { ...formData.emailCreation!, provider: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gmail">Gmail</SelectItem>
                        <SelectItem value="outlook">Outlook</SelectItem>
                        <SelectItem value="yahoo">Yahoo</SelectItem>
                        <SelectItem value="protonmail">ProtonMail</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantidade de E-mails</Label>
                    <Input
                      type="number"
                      value={formData.emailCreation.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailCreation: {
                            ...formData.emailCreation!,
                            quantity: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                      placeholder="1"
                    />
                  </div>

                  {formData.emailCreation.provider === 'other' && (
                    <div className="col-span-2">
                      <Label>Nome do Provedor Personalizado</Label>
                      <Input
                        value={formData.emailCreation.customProvider || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emailCreation: {
                              ...formData.emailCreation!,
                              customProvider: e.target.value,
                            },
                          })
                        }
                        placeholder="Ex: Zoho Mail, FastMail"
                      />
                    </div>
                  )}

                  <div className="col-span-2">
                    <Label>Requisitos Específicos (Opcional)</Label>
                    <Textarea
                      value={formData.emailCreation.requirements || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailCreation: {
                            ...formData.emailCreation!,
                            requirements: e.target.value,
                          },
                        })
                      }
                      placeholder="Ex: E-mail deve seguir o formato nome.sobrenome@gmail.com"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Atualizar Template' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
