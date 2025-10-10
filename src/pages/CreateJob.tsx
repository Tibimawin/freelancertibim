import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TaskInstruction, ProofRequirement } from "@/types/firebase";
import { 
  Plus,
  X,
  Smartphone,
  Monitor,
  Globe,
  DollarSign,
  Clock,
  Users,
  FileText,
  Save,
  ArrowLeft,
  ListOrdered,
  ShieldCheck,
  Image,
  Link,
  Type
} from "lucide-react";

const CreateJob = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bounty: "",
    platform: "",
    difficulty: "",
    timeEstimate: "",
    location: "",
    maxApplicants: "",
    dueDate: "",
    requirements: [] as string[],
    detailedInstructions: [] as TaskInstruction[],
    proofRequirements: [] as ProofRequirement[],
  });
  
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentInstruction, setCurrentInstruction] = useState("");
  const [currentProofLabel, setCurrentProofLabel] = useState("");
  const [currentProofDescription, setCurrentProofDescription] = useState("");
  const [currentProofType, setCurrentProofType] = useState<'text' | 'screenshot' | 'file' | 'url'>('text');

  const handleAddRequirement = () => {
    if (currentRequirement.trim() && !formData.requirements.includes(currentRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, currentRequirement.trim()]
      }));
      setCurrentRequirement("");
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddInstruction = () => {
    if (currentInstruction.trim()) {
      const newInstruction: TaskInstruction = {
        id: Math.random().toString(36).substr(2, 9),
        step: formData.detailedInstructions.length + 1,
        instruction: currentInstruction.trim(),
        isRequired: true
      };
      setFormData(prev => ({
        ...prev,
        detailedInstructions: [...prev.detailedInstructions, newInstruction]
      }));
      setCurrentInstruction("");
    }
  };

  const handleRemoveInstruction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      detailedInstructions: prev.detailedInstructions.filter(inst => inst.id !== id).map((inst, index) => ({
        ...inst,
        step: index + 1
      }))
    }));
  };

  const handleAddProofRequirement = () => {
    if (currentProofLabel.trim() && currentProofDescription.trim()) {
      const newProof: ProofRequirement = {
        id: Math.random().toString(36).substr(2, 9),
        type: currentProofType,
        label: currentProofLabel.trim(),
        description: currentProofDescription.trim(),
        isRequired: true,
        placeholder: getPlaceholderForProofType(currentProofType)
      };
      setFormData(prev => ({
        ...prev,
        proofRequirements: [...prev.proofRequirements, newProof]
      }));
      setCurrentProofLabel("");
      setCurrentProofDescription("");
    }
  };

  const handleRemoveProofRequirement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      proofRequirements: prev.proofRequirements.filter(proof => proof.id !== id)
    }));
  };

  const getPlaceholderForProofType = (type: 'text' | 'screenshot' | 'file' | 'url') => {
    switch (type) {
      case 'text': return 'Digite sua resposta aqui...';
      case 'url': return 'https://exemplo.com/seu-perfil';
      case 'screenshot': return 'Upload da captura de tela';
      case 'file': return 'Upload do arquivo solicitado';
      default: return '';
    }
  };

  const getIconForProofType = (type: 'text' | 'screenshot' | 'file' | 'url') => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'url': return <Link className="h-4 w-4" />;
      case 'screenshot': return <Image className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um anúncio.",
        variant: "destructive",
      });
      return;
    }

    // Validações básicas
    if (!formData.title || !formData.description || !formData.bounty || !formData.platform) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validação de valor da tarefa
    const jobBounty = parseFloat(formData.bounty);
    const maxApplicants = parseInt(formData.maxApplicants) || 1;
    
    if (jobBounty < 5 || jobBounty > 50) {
      toast({
        title: "Valor Inválido",
        description: "O valor da tarefa deve estar entre 5 KZ e 50 KZ.",
        variant: "destructive",
      });
      return;
    }

    // Calcular custo total (valor × máximo de candidatos)
    const totalCost = jobBounty * maxApplicants;
    const currentBalance = userData.posterWallet?.balance || 0;
    
    if (currentBalance < totalCost) {
      toast({
        title: "Saldo Insuficiente", 
        description: `Você precisa ter pelo menos ${totalCost.toFixed(2)} KZ para criar este anúncio (${jobBounty} KZ × ${maxApplicants} candidatos). Seu saldo atual: ${currentBalance.toFixed(2)} KZ`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        posterId: currentUser.uid,
        posterName: userData.name,
        bounty: parseFloat(formData.bounty),
        platform: formData.platform as 'iOS' | 'Android' | 'Web',
        difficulty: formData.difficulty as 'Fácil' | 'Médio' | 'Difícil',
        requirements: formData.requirements,
        attachments: [],
        status: 'active' as const,
        timeEstimate: formData.timeEstimate || "1-2 horas",
        location: formData.location,
        maxApplicants: formData.maxApplicants ? parseInt(formData.maxApplicants) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        detailedInstructions: formData.detailedInstructions,
        proofRequirements: formData.proofRequirements,
      };

      await JobService.createJobWithPayment(jobData, currentUser.uid, totalCost);
      
      toast({
        title: "Anúncio criado com sucesso!",
        description: `Seu teste foi publicado. ${totalCost.toFixed(2)} KZ foi reservado para pagamentos.`,
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: "Erro ao criar anúncio",
        description: "Não foi possível publicar o teste. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Você precisa estar logado para criar anúncios.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Criar Anúncio de Teste</h1>
                <p className="text-muted-foreground">Publique um teste para sua aplicação e encontre testadores qualificados</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulário Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Informações Básicas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título do Teste *</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Testar novo app de delivery iOS"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição Detalhada *</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva detalhadamente o que precisa ser testado, fluxos específicos, funcionalidades..."
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platform">Plataforma *</Label>
                        <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a plataforma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iOS">
                              <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4" />
                                <span>iOS</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Android">
                              <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4" />
                                <span>Android</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Web">
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4" />
                                <span>Web</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="TikTok">TikTok</SelectItem>
                            <SelectItem value="Instagram">Instagram</SelectItem>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                            <SelectItem value="OnlyFans">OnlyFans</SelectItem>
                            <SelectItem value="Play Store">Play Store</SelectItem>
                            <SelectItem value="App Store">App Store</SelectItem>
                            <SelectItem value="Pornhub">Pornhub</SelectItem>
                            <SelectItem value="X (Twitter)">X (Twitter)</SelectItem>
                            <SelectItem value="Telegram">Telegram</SelectItem>
                            <SelectItem value="YouTube">YouTube</SelectItem>
                            <SelectItem value="WeChat">WeChat</SelectItem>
                            <SelectItem value="Snapchat">Snapchat</SelectItem>
                            <SelectItem value="Pinterest">Pinterest</SelectItem>
                            <SelectItem value="Threads">Threads</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="Discord">Discord</SelectItem>
                            <SelectItem value="Reddit">Reddit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="difficulty">Nível de Dificuldade *</Label>
                        <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a dificuldade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fácil">Fácil</SelectItem>
                            <SelectItem value="Médio">Médio</SelectItem>
                            <SelectItem value="Difícil">Difícil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instruções Detalhadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ListOrdered className="h-5 w-5" />
                      <span>Instruções Detalhadas da Tarefa</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Descreva passo a passo exatamente o que o testador precisa fazer
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Ex: 1. Acesse o aplicativo e faça login com suas credenciais..."
                        value={currentInstruction}
                        onChange={(e) => setCurrentInstruction(e.target.value)}
                        rows={2}
                      />
                      <Button type="button" onClick={handleAddInstruction} size="icon" className="mt-1">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.detailedInstructions.length > 0 && (
                      <div className="space-y-3">
                        {formData.detailedInstructions.map((instruction) => (
                          <div key={instruction.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/50">
                            <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {instruction.step}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">{instruction.instruction}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveInstruction(instruction.id)}
                              className="hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Provas Necessárias */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Provas Necessárias</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Especifique que tipos de comprovação o testador deve fornecer
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="proofType">Tipo de Prova</Label>
                        <Select value={currentProofType} onValueChange={(value: 'text' | 'screenshot' | 'file' | 'url') => setCurrentProofType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center space-x-2">
                                <Type className="h-4 w-4" />
                                <span>Texto/Resposta</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="screenshot">
                              <div className="flex items-center space-x-2">
                                <Image className="h-4 w-4" />
                                <span>Captura de Tela</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="url">
                              <div className="flex items-center space-x-2">
                                <Link className="h-4 w-4" />
                                <span>Link/URL</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="file">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Arquivo</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="proofLabel">Nome da Prova</Label>
                        <Input
                          id="proofLabel"
                          placeholder="Ex: Username do TikTok"
                          value={currentProofLabel}
                          onChange={(e) => setCurrentProofLabel(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="proofDescription">Descrição da Prova</Label>
                      <Textarea
                        id="proofDescription"
                        placeholder="Ex: Informe seu nome de usuário do TikTok para que possamos verificar se você seguiu o perfil solicitado"
                        value={currentProofDescription}
                        onChange={(e) => setCurrentProofDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <Button type="button" onClick={handleAddProofRequirement} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Prova
                    </Button>
                    
                    {formData.proofRequirements.length > 0 && (
                      <div className="space-y-3">
                        {formData.proofRequirements.map((proof) => (
                          <div key={proof.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-muted/50">
                            <div className="mt-1">
                              {getIconForProofType(proof.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">{proof.label}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {proof.type === 'text' && 'Texto'}
                                  {proof.type === 'screenshot' && 'Captura'}
                                  {proof.type === 'url' && 'Link'}
                                  {proof.type === 'file' && 'Arquivo'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{proof.description}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProofRequirement(proof.id)}
                              className="hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requisitos Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle>Requisitos Gerais</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Requisitos técnicos ou de experiência necessários
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ex: Dispositivo iOS 15+, experiência com e-commerce..."
                        value={currentRequirement}
                        onChange={(e) => setCurrentRequirement(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                      />
                      <Button type="button" onClick={handleAddRequirement} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.requirements.map((req, index) => (
                          <Badge key={index} variant="outline" className="flex items-center space-x-1">
                            <span>{req}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRequirement(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Detalhes Adicionais */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeEstimate">Tempo Estimado</Label>
                        <Input
                          id="timeEstimate"
                          placeholder="Ex: 2-3 horas"
                          value={formData.timeEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, timeEstimate: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          placeholder="Ex: Remote, São Paulo, SP"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxApplicants">Máximo de Candidatos</Label>
                        <Input
                          id="maxApplicants"
                          type="number"
                          placeholder="Ex: 10"
                          value={formData.maxApplicants}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxApplicants: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dueDate">Data Limite</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Valor do Teste */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Valor do Teste</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                       <Label htmlFor="bounty">Valor em KZ *</Label>
                       <Input
                         id="bounty"
                         type="number"
                         step="0.01"
                         min="5"
                         max="50"
                         placeholder="Entre 5 e 50 KZ"
                         value={formData.bounty}
                         onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))}
                         required
                       />
                       <p className="text-xs text-muted-foreground mt-2">
                         Mínimo: 5 KZ | Máximo: 50 KZ
                       </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Anúncio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plataforma:</span>
                      <span className="font-medium">{formData.platform || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dificuldade:</span>
                      <span className="font-medium">{formData.difficulty || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">
                        {formData.bounty ? `${parseFloat(formData.bounty).toFixed(2)} KZ` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Instruções:</span>
                      <span className="font-medium">{formData.detailedInstructions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Provas:</span>
                      <span className="font-medium">{formData.proofRequirements.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requisitos:</span>
                      <span className="font-medium">{formData.requirements.length}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Total do projeto:</span>
                      <span className="text-primary">
                        {formData.bounty ? `${parseFloat(formData.bounty).toFixed(2)} KZ` : "0,00 KZ"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Publicando..." : "Publicar Anúncio"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;