import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TaskInstruction, ProofRequirement } from "@/types/firebase";
import { TaxonomyService, type NamedItem, type SubcategoryItem } from "@/services/taxonomyService";
import { 
  Plus,
  X,
  Smartphone,
  Monitor,
  Globe,
  Youtube,
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
    category: "",
    subcategory: "",
    timeEstimate: "",
    location: "",
    maxApplicants: "",
    dueDate: "",
    requirements: [] as string[],
    detailedInstructions: [] as TaskInstruction[],
    proofRequirements: [] as ProofRequirement[],
    youtube: {
      actionType: 'watch' as 'watch' | 'subscribe',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: true },
    },
    tiktok: {
      actionType: 'follow' as 'watch' | 'follow',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
    },
    vk: {
      actionType: 'join' as 'join' | 'like',
      targetTitle: '',
      targetUrl: '',
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true },
    },
  });

  // Dynamic taxonomy options
  const [workLevels, setWorkLevels] = useState<NamedItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<NamedItem[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<NamedItem[]>([]);
  const [locationOptions, setLocationOptions] = useState<NamedItem[]>([]);

  // Fallback static options
  const fallbackLevels: NamedItem[] = [
    { id: "easy", name: t("easy") },
    { id: "medium", name: t("medium") },
    { id: "hard", name: t("hard") },
  ];
  const fallbackCategories: NamedItem[] = [
    { id: "Mobile", name: "Mobile" },
    { id: "Web", name: "Web" },
    { id: "Social", name: "Social" },
  ];
  const fallbackSubcategoriesFor = (cat?: string): SubcategoryItem[] => {
    switch (cat) {
      case "Mobile":
        return [
          { id: "mobile-app", name: "App", category: "Mobile" },
          { id: "mobile-play-store", name: "Play Store", category: "Mobile" },
          { id: "mobile-app-store", name: "App Store", category: "Mobile" },
        ];
      case "Web":
        return [
          { id: "web-website", name: "Website", category: "Web" },
          { id: "web-visit-site", name: "Visitar site", category: "Web" },
          { id: "web-youtube", name: "Ver vídeo no YouTube", category: "Web" },
        ];
      case "Social":
        return [
          { id: "social-facebook", name: "Facebook", category: "Social" },
          { id: "social-instagram", name: "Instagram", category: "Social" },
          { id: "social-tiktok", name: "TikTok", category: "Social" },
          { id: "social-vk", name: "VK", category: "Social" },
          { id: "social-youtube", name: "YouTube", category: "Social" },
          { id: "social-x", name: "X (Twitter)", category: "Social" },
          { id: "social-snapchat", name: "Snapchat", category: "Social" },
          { id: "social-reddit", name: "Reddit", category: "Social" },
          { id: "social-twitch", name: "Twitch", category: "Social" },
          { id: "social-discord", name: "Discord", category: "Social" },
          { id: "social-telegram", name: "Telegram", category: "Social" },
          { id: "social-whatsapp", name: "WhatsApp", category: "Social" },
          { id: "social-pinterest", name: "Pinterest", category: "Social" },
          { id: "social-threads", name: "Threads", category: "Social" },
          { id: "social-linkedin", name: "LinkedIn", category: "Social" },
          { id: "social-kwai", name: "Kwai", category: "Social" },
          { id: "social-likee", name: "Likee", category: "Social" },
          { id: "social-others", name: "Outras redes sociais", category: "Social" },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    // Load initial dynamic lists
    (async () => {
      try {
        const [levels, cats, locs] = await Promise.all([
          TaxonomyService.getJobLevels(),
          TaxonomyService.getCategories(),
          TaxonomyService.getLocations(),
        ]);
        setWorkLevels(levels);
        setCategoryOptions(cats);
        setLocationOptions(locs);
      } catch (e) {
        // keep fallbacks if load fails
        console.warn("Falha ao carregar taxonomias, usando opções padrão.", e);
      }
    })();
  }, []);

  useEffect(() => {
    // Load subcategories when category changes
    (async () => {
      const cat = formData.category;
      if (!cat) {
        setSubcategoryOptions([]);
        return;
      }
      try {
        const subs = await TaxonomyService.getSubcategories(cat);
        const famous = fallbackSubcategoriesFor(cat);
        const names = new Set<string>();
        const merged: SubcategoryItem[] = [];
        for (const s of subs) {
          const key = (s.name || '').toLowerCase();
          if (key && !names.has(key)) { names.add(key); merged.push(s); }
        }
        for (const f of famous) {
          const key = (f.name || '').toLowerCase();
          if (key && !names.has(key)) { names.add(key); merged.push(f); }
        }
        setSubcategoryOptions(merged);
      } catch (e) {
        setSubcategoryOptions(fallbackSubcategoriesFor(cat));
      }
    })();
  }, [formData.category]);
  
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
      case 'text': return t('proof_placeholder_text');
      case 'url': return t('proof_placeholder_url');
      case 'screenshot': return t('proof_placeholder_screenshot');
      case 'file': return t('proof_placeholder_file');
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
        description: t("error_login_required"),
        variant: "destructive",
      });
      return;
    }

    // Validações básicas
    const isYouTube = (formData.subcategory || '').toLowerCase().includes('youtube') || (formData.subcategory || '').toLowerCase().includes('ver vídeo');
    if (!formData.title || !formData.description || !formData.bounty || !formData.platform || !formData.difficulty || (isYouTube && !formData.youtube.videoUrl)) {
      toast({
        title: t("error"),
        description: isYouTube ? 'Preencha todos os campos obrigatórios do YouTube (incluindo link do vídeo).' : t("fill_all_required_fields"),
        variant: "destructive",
      });
      return;
    }

    // Validação de valor da tarefa
    const jobBounty = parseFloat(formData.bounty);
    const maxApplicants = parseInt(formData.maxApplicants) || 1;
    
    if (jobBounty < 5 || jobBounty > 50) {
      toast({
        title: t("task_value_invalid"),
        description: t("task_value_range"),
        variant: "destructive",
      });
      return;
    }

    // Calcular custo total (valor × máximo de candidatos)
    const totalCost = jobBounty * maxApplicants;
    const currentBalance = userData.posterWallet?.balance || 0;
    const bonusBalance = userData.posterWallet?.bonusBalance || 0;
    const combined = currentBalance + bonusBalance;
    
    if (combined < totalCost) {
      toast({
        title: t("insufficient_balance"), 
              description: t("insufficient_balance_description", { cost: totalCost.toFixed(2), bounty: jobBounty, applicants: maxApplicants, currentBalance: combined.toFixed(2) }),
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
        category: formData.category ? (formData.category as 'Mobile' | 'Web' | 'Social') : undefined,
        subcategory: formData.subcategory || undefined,
        requirements: formData.requirements,
        attachments: [],
        status: 'active' as const,
        timeEstimate: formData.timeEstimate || "1-2 horas",
        location: formData.location,
        maxApplicants: formData.maxApplicants ? parseInt(formData.maxApplicants) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        detailedInstructions: formData.detailedInstructions,
        proofRequirements: formData.proofRequirements,
        posterApprovalRate: typeof userData.approvalRate === 'number' ? userData.approvalRate : undefined,
        posterRating: typeof userData.rating === 'number' ? userData.rating : undefined,
        posterRatingCount: typeof userData.ratingCount === 'number' ? userData.ratingCount : undefined,
        youtube: isYouTube ? formData.youtube : undefined,
      };

      await JobService.createJobWithPayment(jobData, currentUser.uid, totalCost);
      
      toast({
        title: t("job_created_success"),
        description: t("job_created_description", { cost: totalCost.toFixed(2) }),
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: t("error_creating_job"),
        description: t("error_creating_job_description"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">{t("error_login_required")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t("create_job")}</h1>
              <p className="text-muted-foreground">{t("create_job_description")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulário Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tipo de Anúncio */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("ad_type") || "Tipo de anúncio"}</span>
                    </CardTitle>
                    <CardDescription>{t("choose_ad_type") || "Escolha o tipo de anúncio para começar"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('youtube') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Social',
                          subcategory: 'YouTube',
                        }))}
                      >
                        <Youtube className="h-4 w-4 mr-2" /> YouTube
                      </Button>
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('ver vídeo') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Web',
                          subcategory: 'Ver vídeo no YouTube',
                        }))}
                      >
                        <Globe className="h-4 w-4 mr-2" /> Ver vídeo no YouTube
                      </Button>
                      <Button
                        type="button"
                        variant={(formData.category || '').toLowerCase() === 'web' && (formData.subcategory || '').toLowerCase() === 'website' ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Web',
                          subcategory: 'Website',
                        }))}
                      >
                        <Monitor className="h-4 w-4 mr-2" /> Website
                      </Button>
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('tiktok') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Social',
                          subcategory: 'TikTok',
                        }))}
                      >
                        <Clock className="h-4 w-4 mr-2" /> TikTok
                      </Button>
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('vk') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Social',
                          subcategory: 'VK',
                        }))}
                      >
                        <Users className="h-4 w-4 mr-2" /> VK
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Informações Básicas */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-electric-purple" />
                      <span>{t("basic_information")}</span>
                    </CardTitle>
                    <CardDescription>{t("basic_information_description")}</CardDescription> {/* Assuming this translation exists */}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">{t("task_title")} *</Label>
                      <Input
                        id="title"
                        placeholder={t("task_title_placeholder")}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">{t("detailed_description")} *</Label>
                      <Textarea
                        id="description"
                        placeholder={t("detailed_description_placeholder")}
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
                            <SelectValue placeholder={t("select_platform")} />
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
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="difficulty">{t("difficulty_level")} *</Label>
                        <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_difficulty")} />
                          </SelectTrigger>
                          <SelectContent>
                            {(workLevels.length ? workLevels : fallbackLevels).map((lvl) => (
                              <SelectItem key={lvl.id} value={lvl.name}>{lvl.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Categoria e Subcategoria */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData(prev => ({ ...prev, category: value, subcategory: '' }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(categoryOptions.length ? categoryOptions : fallbackCategories).map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subcategory">Subcategoria</Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(subcategoryOptions.length ? subcategoryOptions : fallbackSubcategoriesFor(formData.category)).map((sub) => (
                              <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* YouTube: formulário específico */}
                {((formData.subcategory || '').toLowerCase().includes('youtube') || (formData.subcategory || '').toLowerCase().includes('ver vídeo')) && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-cosmic-blue" />
                        <span>Visualização de vídeos do YouTube</span>
                      </CardTitle>
                      <CardDescription>Configure os detalhes do anúncio de YouTube.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={formData.youtube.actionType === 'watch' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, actionType: 'watch' } }))}>Assista ao vídeo</Button>
                        <Button type="button" variant={formData.youtube.actionType === 'subscribe' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, actionType: 'subscribe' } }))}>Inscreva-se no canal</Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="yt-title">Título do vídeo</Label>
                          <Input id="yt-title" placeholder="Ex.: Tutorial de configuração" value={formData.youtube.videoTitle} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, videoTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="yt-url">Link para o vídeo</Label>
                          <Input id="yt-url" placeholder="https://www.youtube.com/watch?v=..." value={formData.youtube.videoUrl} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, videoUrl: e.target.value } }))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Tempo de visualização</Label>
                          <Select value={String(formData.youtube.viewTimeSeconds)} onValueChange={(v) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, viewTimeSeconds: parseInt(v) || 30 } }))}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                            <SelectContent>
                              {[10, 30, 60, 90, 120, 150, 180].map(s => (
                                <SelectItem key={s} value={String(s)}>{s} segundos</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Velocidade de execução</Label>
                          <Select value={String(formData.youtube.dailyMaxViews)} onValueChange={(v) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, dailyMaxViews: parseInt(v) || 500 } }))}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="100">Lento - 100/dia</SelectItem>
                              <SelectItem value="250">Moderado - 250/dia</SelectItem>
                              <SelectItem value="500">Padrão - 500/dia</SelectItem>
                              <SelectItem value="1000">Rápido - 1000/dia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Garantia</Label>
                          <Select value={formData.youtube.guarantee} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, guarantee: v } }))}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem garantia</SelectItem>
                              <SelectItem value="basic">Garantia básica</SelectItem>
                              <SelectItem value="premium">Garantia premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-login" checked={!!formData.youtube.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, extras: { ...(prev.youtube.extras || {}), requireLogin: e.target.checked } } }))} />
                          <Label htmlFor="yt-login">Exigir login no YouTube</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-repeat" checked={!!formData.youtube.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, extras: { ...(prev.youtube.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="yt-repeat">Evitar repetição do mesmo usuário</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-iframe" checked={!!formData.youtube.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...prev.youtube, extras: { ...(prev.youtube.extras || {}), openInIframe: e.target.checked } } }))} />
                          <Label htmlFor="yt-iframe">Abrir em iframe</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="yt-bounty">Custo por visualização (Kz)</Label>
                        <Input id="yt-bounty" type="number" step="0.01" min="5" max="50" value={formData.bounty} onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))} />
                        <p className="text-xs text-muted-foreground mt-2">Este valor será utilizado como preço por visualização.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Instruções Detalhadas */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ListOrdered className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("detailed_instructions")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("detailed_instructions_description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder={t("instruction_placeholder")}
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
                      <span>{t("proof_requirements")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("proof_requirements_description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="proofType">{t("proof_type")}</Label>
                        <Select value={currentProofType} onValueChange={(value: 'text' | 'screenshot' | 'file' | 'url') => setCurrentProofType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">
                              <div className="flex items-center space-x-2">
                                <Type className="h-4 w-4 text-electric-purple" />
                                <span>{t("text_response")}</span>
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
                                <span>{t("link_url")}</span>
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
                        <Label htmlFor="proofLabel">{t("proof_name")}</Label>
                        <Input
                          id="proofLabel"
                          placeholder={t("proof_name_placeholder")}
                          value={currentProofLabel}
                          onChange={(e) => setCurrentProofLabel(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="proofDescription">{t("proof_description")}</Label>
                      <Textarea
                        id="proofDescription"
                        placeholder={t("proof_description_placeholder")}
                        value={currentProofDescription}
                        onChange={(e) => setCurrentProofDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <Button type="button" onClick={handleAddProofRequirement} className="w-full glow-effect">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("add_proof")}
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
                                  {proof.type === 'text' && t('text_response')}
                                  {proof.type === 'screenshot' && t('screenshot_short')}
                                  {proof.type === 'url' && t('link_short')}
                                  {proof.type === 'file' && t('file_short')}
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
                      <span>{t("general_requirements")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("general_requirements_description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder={t("requirement_placeholder")}
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
                      <span>{t("additional_details")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("additional_details_description")} {/* Assuming this translation exists */}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeEstimate">{t("time_estimate")}</Label>
                        <Input
                          id="timeEstimate"
                          placeholder={t("time_estimate_placeholder")}
                          value={formData.timeEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, timeEstimate: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="location">{t("location")}</Label>
                        <Input
                          id="location"
                          placeholder={t("location_placeholder")}
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                        {locationOptions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {locationOptions.slice(0, 12).map((loc) => (
                              <Button
                                key={loc.id}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, location: loc.name }))}
                              >
                                {loc.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxApplicants">{t("max_applicants")}</Label>
                        <Input
                          id="maxApplicants"
                          type="number"
                          placeholder={t("max_applicants_placeholder")}
                          value={formData.maxApplicants}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxApplicants: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dueDate">{t("due_date")}</Label>
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
                      <span>{t("bounty_value")}</span>
                    </CardTitle>
                    <CardDescription>{t("bounty_value_description")}</CardDescription> {/* Assuming this translation exists */}
                  </CardHeader>
                  <CardContent>
                    <div>
                       <Label htmlFor="bounty">{t("bounty_value_label")} *</Label>
                       <Input
                         id="bounty"
                         type="number"
                         step="0.01"
                         min="5"
                         max="50"
                         placeholder={t("bounty_value_placeholder")}
                         value={formData.bounty}
                         onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))}
                         required
                       />
                       <p className="text-xs text-muted-foreground mt-2">
                         {t("bounty_value_min_max")}
                       </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("job_summary")}</span>
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
            {formData.bounty ? `${parseFloat(formData.bounty).toFixed(2)} Kz` : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("detailed_instructions")}:</span>
                      <span className="font-medium">{formData.detailedInstructions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("proof_requirements")}:</span>
                      <span className="font-medium">{formData.proofRequirements.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("general_requirements")}:</span>
                      <span className="font-medium">{formData.requirements.length}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{t("total_project_cost")}:</span>
                      <span className="text-primary">
            {formData.bounty ? `${(parseFloat(formData.bounty) * (parseInt(formData.maxApplicants) || 1)).toFixed(2)} Kz` : "0,00 Kz"}
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
                    {isLoading ? t("publishing") : t("publish_job")}
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