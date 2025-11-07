import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Type,
  Info
} from "lucide-react";
import { useTranslation } from 'react-i18next';

const CreateJob = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
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
      case 'text': return t('proof placeholder text');
      case 'url': return t('proof placeholder url');
      case 'screenshot': return t('proof placeholder screenshot');
      case 'file': return t('proof placeholder file');
      default: return '';
    }
  };

  const getIconForProofType = (type: 'text' | 'screenshot' | 'file' | 'url') => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4 text-electric-purple" />;
      case 'url': return <Link className="h-4 w-4 text-cosmic-blue" />;
      case 'screenshot': return <Image className="h-4 w-4 text-star-glow" />;
      case 'file': return <FileText className="h-4 w-4 text-success" />;
      default: return <Type className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      toast({
        title: t("error"),
        description: t("error login required"),
        variant: "destructive",
      });
      return;
    }

    // Validações básicas
    if (!formData.title || !formData.description || !formData.bounty || !formData.platform || !formData.difficulty) {
      toast({
        title: t("error"),
        description: t("fill all required fields"), // Assuming this translation exists
        variant: "destructive",
      });
      return;
    }

    // Validação de valor da tarefa
    const jobBounty = parseFloat(formData.bounty);
    const maxApplicants = parseInt(formData.maxApplicants) || 1;
    
    if (jobBounty < 5 || jobBounty > 50) {
      toast({
        title: t("task value invalid"),
        description: t("task value range"),
        variant: "destructive",
      });
      return;
    }

    // Calcular custo total (valor × máximo de candidatos)
    const totalCost = jobBounty * maxApplicants;
    const currentBalance = userData.posterWallet?.balance || 0;
    
    if (currentBalance < totalCost) {
      toast({
        title: t("insufficient balance"), 
        description: t("insufficient balance description", { cost: totalCost.toFixed(2), bounty: jobBounty, applicants: maxApplicants, currentBalance: currentBalance.toFixed(2) }),
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
        platform: formData.platform as 'iOS' | 'Android' | 'Web', // Explicit cast
        difficulty: formData.difficulty as 'Fácil' | 'Médio' | 'Difícil', // Explicit cast
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
        title: t("job created success"),
        description: t("job created description", { cost: totalCost.toFixed(2) }),
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: t("error creating job"),
        description: t("error creating job description"),
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
            <p className="text-muted-foreground">{t("error login required")}</p>
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
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("create job")}</h1>
              <p className="text-muted-foreground">{t("create job description")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulário Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações Básicas */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-electric-purple" />
                      <span>{t("basic information")}</span>
                    </CardTitle>
                    <CardDescription>{t("basic information description")}</CardDescription> {/* Assuming this translation exists */}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">{t("task title")} *</Label>
                      <Input
                        id="title"
                        placeholder={t("task title placeholder")}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">{t("detailed description")} *</Label>
                      <Textarea
                        id="description"
                        placeholder={t("detailed description placeholder")}
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="platform">{t("platform")} *</Label>
                        <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select platform")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iOS">
                              <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                <span>iOS</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Android">
                              <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                <span>Android</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="Web">
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
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
                        <Label htmlFor="difficulty">{t("difficulty level")} *</Label>
                        <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select difficulty")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fácil">{t("easy")}</SelectItem>
                            <SelectItem value="Médio">{t("medium")}</SelectItem>
                            <SelectItem value="Difícil">{t("hard")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instruções Detalhadas */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ListOrdered className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("detailed instructions")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("detailed instructions description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder={t("instruction placeholder")}
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
                            <div className="bg-electric-purple/10 text-electric-purple border border-electric-purple/20 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
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
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShieldCheck className="h-5 w-5 text-star-glow" />
                      <span>{t("proof requirements")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("proof requirements description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="proofType">{t("proof type")}</Label>
                        <Select value={currentProofType} onValueChange={(value: 'text' | 'screenshot' | 'file' | 'url') => setCurrentProofType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center space-x-2">
                                <Type className="h-4 w-4 text-electric-purple" />
                                <span>{t("text response")}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="screenshot">
                              <div className="flex items-center space-x-2">
                                <Image className="h-4 w-4 text-star-glow" />
                                <span>{t("screenshot")}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="url">
                              <div className="flex items-center space-x-2">
                                <Link className="h-4 w-4 text-cosmic-blue" />
                                <span>{t("link url")}</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="file">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-success" />
                                <span>{t("file")}</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="proofLabel">{t("proof name")}</Label>
                        <Input
                          id="proofLabel"
                          placeholder={t("proof name placeholder")}
                          value={currentProofLabel}
                          onChange={(e) => setCurrentProofLabel(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="proofDescription">{t("proof description")}</Label>
                      <Textarea
                        id="proofDescription"
                        placeholder={t("proof description placeholder")}
                        value={currentProofDescription}
                        onChange={(e) => setCurrentProofDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <Button type="button" onClick={handleAddProofRequirement} className="w-full glow-effect">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("add proof")}
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
                                  {proof.type === 'text' && t('text response')}
                                  {proof.type === 'screenshot' && t('screenshot short')}
                                  {proof.type === 'url' && t('link short')}
                                  {proof.type === 'file' && t('file short')}
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
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("general requirements")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("general requirements description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder={t("requirement placeholder")}
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
                          <Badge key={index} variant="outline" className="flex items-center space-x-1 bg-muted/30 text-muted-foreground border-border">
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
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-star-glow" />
                      <span>{t("additional details")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("additional details description")} {/* Assuming this translation exists */}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeEstimate">{t("time estimate")}</Label>
                        <Input
                          id="timeEstimate"
                          placeholder={t("time estimate placeholder")}
                          value={formData.timeEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, timeEstimate: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">{t("location")}</Label>
                        <Input
                          id="location"
                          placeholder={t("location placeholder")}
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxApplicants">{t("max applicants")}</Label>
                        <Input
                          id="maxApplicants"
                          type="number"
                          placeholder={t("max applicants placeholder")}
                          value={formData.maxApplicants}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxApplicants: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dueDate">{t("due date")}</Label>
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
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-electric-purple" />
                      <span>{t("bounty value")}</span>
                    </CardTitle>
                    <CardDescription>{t("bounty value description")}</CardDescription> {/* Assuming this translation exists */}
                  </CardHeader>
                  <CardContent>
                    <div>
                       <Label htmlFor="bounty">{t("bounty value label")} *</Label>
                       <Input
                         id="bounty"
                         type="number"
                         step="0.01"
                         min="5"
                         max="50"
                         placeholder={t("bounty value placeholder")}
                         value={formData.bounty}
                         onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))}
                         required
                       />
                       <p className="text-xs text-muted-foreground mt-2">
                         {t("bounty value min max")}
                       </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("job summary")}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("platform")}:</span>
                      <span className="font-medium">{formData.platform || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("difficulty")}:</span>
                      <span className="font-medium">{formData.difficulty || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("value")}:</span>
                      <span className="font-medium">
                        {formData.bounty ? `${parseFloat(formData.bounty).toFixed(2)} KZ` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detailed instructions")}:</span>
                      <span className="font-medium">{formData.detailedInstructions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("proof requirements")}:</span>
                      <span className="font-medium">{formData.proofRequirements.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("general requirements")}:</span>
                      <span className="font-medium">{formData.requirements.length}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{t("total project cost")}:</span>
                      <span className="text-primary">
                        {formData.bounty ? `${(parseFloat(formData.bounty) * (parseInt(formData.maxApplicants) || 1)).toFixed(2)} KZ` : "0,00 KZ"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full glow-effect"
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? t("publishing") : t("publish job")}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    className="w-full"
                  >
                    {t("cancel")}
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