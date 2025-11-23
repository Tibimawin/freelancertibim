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
import { TaskInstruction, ProofRequirement, JobYouTubeSettings, JobTikTokSettings, JobVKSettings, JobWebsiteSettings, JobInstagramSettings, JobFacebookSettings } from "@/types/firebase";
import { TaxonomyService, type NamedItem, type SubcategoryItem } from "@/services/taxonomyService";
import { TaskTemplateService, TaskTemplate } from "@/services/taskTemplateService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  X as TwitterIcon,
  Smartphone,
  Monitor,
  Globe,
  Youtube,
  Instagram,
  Facebook,
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
  Info,
  Copy,
  Mail,
  AlertCircle,
  CheckCircle,
  Star,
  AlertTriangle
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import JobPreview from "@/components/JobPreview";
import { useTaskLimits } from "@/hooks/useTaskLimits";
import { cleanFirebaseData } from "@/lib/firebaseUtils";

const CreateJob = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
  // Task limits from system config
  const { minBounty, maxBounty, highValueThreshold, loading: limitsLoading } = useTaskLimits();
  
  // Templates state
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  
  // High value warning state
  const [showHighValueWarning, setShowHighValueWarning] = useState(false);
  const [confirmedHighValue, setConfirmedHighValue] = useState(false);
  
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
    // Recorrência
    isRecurring: false,
    recurrenceEnabled: false,
    recurrenceFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recurrenceInterval: 1,
    recurrenceEndDate: "",
    recurrenceMaxRepublications: "",
    youtube: {
      actionType: 'watch' as 'watch' | 'subscribe' | 'like',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: true, unlimitedAds: false } as JobYouTubeSettings['extras'],
    },
    tiktok: {
      actionType: 'watch' as 'watch' | 'follow',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: false } as JobTikTokSettings['extras'],
    },
    vk: {
      actionType: 'join' as 'join' | 'like',
      targetTitle: '',
      targetUrl: '',
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true } as JobVKSettings['extras'],
    },
    website: {
      actionType: 'visit' as 'visit' | 'visit_scroll',
      pageTitle: '',
      pageUrl: '',
      viewTimeSeconds: 10,
      dailyMaxVisits: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { avoidRepeat: true, openInIframe: true, blockCopy: true, blockRefresh: true, blockMultipleTabs: true } as JobWebsiteSettings['extras'],
    },
    instagram: {
      actionType: 'follow' as 'follow' | 'like' | 'comment',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: false } as JobInstagramSettings['extras'],
    },
    facebook: {
      actionType: 'follow' as 'follow' | 'like' | 'comment',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: false } as JobFacebookSettings['extras'],
    },
    twitter: {
      actionType: 'follow' as 'follow' | 'like' | 'retweet' | 'comment',
      tweetUrl: '',
      tweetTitle: '',
      profileHandle: '',
      minCommentLength: 50,
      dailyMaxActions: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: true, verifiedOnly: false },
    },
    emailCreation: {
      provider: 'gmail' as 'gmail' | 'outlook' | 'yahoo' | 'protonmail' | 'other',
      quantity: 1,
      requirements: '',
      customProvider: '',
    },
  });

  const defaultYouTube = {
    actionType: 'watch' as 'watch' | 'subscribe' | 'like',
    videoTitle: '',
    videoUrl: '',
    viewTimeSeconds: 30,
    dailyMaxViews: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: true },
  };
  const defaultTikTok = {
    actionType: 'watch' as 'watch' | 'follow',
    videoTitle: '',
    videoUrl: '',
    viewTimeSeconds: 30,
    dailyMaxViews: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
  };
  const defaultVK = {
    actionType: 'join' as 'join' | 'like',
    targetTitle: '',
    targetUrl: '',
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true },
  };
  const defaultWebsite = {
    actionType: 'visit' as 'visit' | 'visit_scroll',
    pageTitle: '',
    pageUrl: '',
    viewTimeSeconds: 10,
    dailyMaxVisits: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { avoidRepeat: true, openInIframe: true, blockCopy: true, blockRefresh: true, blockMultipleTabs: true },
  };
  const defaultInstagram = {
    actionType: 'follow' as 'follow' | 'like' | 'comment',
    videoTitle: '',
    videoUrl: '',
    viewTimeSeconds: 30,
    dailyMaxViews: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
  };
  const defaultFacebook = {
    actionType: 'follow' as 'follow' | 'like' | 'comment',
    videoTitle: '',
    videoUrl: '',
    viewTimeSeconds: 30,
    dailyMaxViews: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
  };
  const defaultTwitter = {
    actionType: 'follow' as 'follow' | 'like' | 'retweet' | 'comment',
    tweetUrl: '',
    tweetTitle: '',
    profileHandle: '',
    minCommentLength: 50,
    dailyMaxActions: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: true, verifiedOnly: false },
  };

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
          { id: "web-criar-email", name: "Criar E-mail", category: "Web" },
        ];
      case "Social":
        return [
          { id: "social-facebook", name: "Facebook", category: "Social" },
          { id: "social-facebook-video", name: "Vídeo Facebook", category: "Social" },
          { id: "social-instagram", name: "Instagram", category: "Social" },
          { id: "social-instagram-video", name: "Vídeo Instagram", category: "Social" },
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
    // Load initial dynamic lists and templates
    (async () => {
      try {
        const [levels, cats, locs, temps] = await Promise.all([
          TaxonomyService.getJobLevels(),
          TaxonomyService.getCategories(),
          TaxonomyService.getLocations(),
          TaskTemplateService.getTemplates(true), // Only active templates
        ]);
        setWorkLevels(levels);
        setCategoryOptions(cats);
        setLocationOptions(locs);
        setTemplates(temps);
        console.log('Templates carregados:', temps.length, temps);
      } catch (e) {
        // keep fallbacks if load fails
        console.warn("Falha ao carregar taxonomias, usando opções padrão.", e);
        console.error("Erro detalhado:", e);
        // Try to load all templates (without activeOnly filter) as fallback
        try {
          const allTemplates = await TaskTemplateService.getTemplates(false);
          setTemplates(allTemplates);
          console.log('Templates carregados (todos):', allTemplates.length, allTemplates);
        } catch (fallbackError) {
          console.error("Falha ao carregar templates (fallback):", fallbackError);
        }
      }
    })();
  }, []);

  // Load user's favorite templates
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const favorites = userDoc.data()?.favoriteTemplates || [];
        setFavoriteTemplates(favorites);
      } catch (error) {
        console.error("Erro ao carregar templates favoritos:", error);
      }
    };
    loadFavorites();
  }, [currentUser]);

  // Reset high value confirmation when bounty changes
  useEffect(() => {
    setConfirmedHighValue(false);
  }, [formData.bounty]);

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

  const toggleFavorite = async (templateId: string) => {
    if (!currentUser) return;
    
    try {
      const isFavorite = favoriteTemplates.includes(templateId);
      const newFavorites = isFavorite
        ? favoriteTemplates.filter(id => id !== templateId)
        : [...favoriteTemplates, templateId];
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        favoriteTemplates: newFavorites
      });
      
      setFavoriteTemplates(newFavorites);
      toast({
        title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
        description: isFavorite 
          ? "Template removido dos seus favoritos" 
          : "Template salvo nos seus favoritos para acesso rápido",
      });
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos",
        variant: "destructive",
      });
    }
  };

  const validateTemplateFields = (data: typeof formData, templatePlatform: string): string[] => {
    const missingFields: string[] = [];

    // Validação de campos básicos
    if (!data.title?.trim()) missingFields.push('Título do anúncio');
    if (!data.description?.trim()) missingFields.push('Descrição');
    if (!data.bounty || parseFloat(data.bounty) <= 0) missingFields.push('Recompensa');
    if (!data.category?.trim()) missingFields.push('Categoria');
    if (!data.subcategory?.trim()) missingFields.push('Subcategoria');

    // Validação específica por plataforma (usando o platform do template, não o platformValue)
    const platformLower = templatePlatform.toLowerCase();
    
    if (platformLower === 'youtube') {
      if (!data.youtube?.videoTitle?.trim()) missingFields.push('Título do vídeo YouTube');
      if (!data.youtube?.videoUrl?.trim()) missingFields.push('URL do vídeo YouTube');
    } else if (platformLower === 'facebook') {
      if (!data.facebook?.videoTitle?.trim()) missingFields.push('Título/Nome Facebook');
      if (!data.facebook?.videoUrl?.trim()) missingFields.push('URL Facebook');
    } else if (platformLower === 'instagram') {
      if (!data.instagram?.videoTitle?.trim()) missingFields.push('Título Instagram');
      if (!data.instagram?.videoUrl?.trim()) missingFields.push('URL Instagram');
    } else if (platformLower === 'tiktok') {
      if (!data.tiktok?.videoTitle?.trim()) missingFields.push('Título TikTok');
      if (!data.tiktok?.videoUrl?.trim()) missingFields.push('URL TikTok');
    } else if (platformLower === 'web') {
      if (data.subcategory === 'Criar E-mail') {
        if (!data.emailCreation?.provider) missingFields.push('Provedor de e-mail');
        if (!data.emailCreation?.quantity || data.emailCreation.quantity <= 0) {
          missingFields.push('Quantidade de e-mails');
        }
      } else {
        if (!data.website?.pageTitle?.trim()) missingFields.push('Título da página');
        if (!data.website?.pageUrl?.trim()) missingFields.push('URL do website');
      }
    }

    return missingFields;
  };

  const handleApplyTemplate = (template: TaskTemplate) => {
    const platform = template.platform.toLowerCase();
    const taskType = (template.taskType || '').toLowerCase();
    
    // Mapeamento simples de platform para o valor do select
    let platformValue = '';
    
    if (platform === 'youtube') {
      if (taskType === 'like') platformValue = 'youtube-like';
      else if (taskType === 'subscribe') platformValue = 'youtube-subscribe';
      else if (taskType === 'comment') platformValue = 'youtube-comment';
      else platformValue = 'youtube-watch';
    } else if (platform === 'facebook') {
      if (taskType === 'like') platformValue = 'facebook-like';
      else if (taskType === 'follow') platformValue = 'facebook-follow';
      else if (taskType === 'comment') platformValue = 'facebook-comment';
      else if (taskType === 'share') platformValue = 'facebook-share';
      else platformValue = 'facebook-watch';
    } else if (platform === 'instagram') {
      if (taskType === 'like') platformValue = 'instagram-like';
      else if (taskType === 'follow') platformValue = 'instagram-follow';
      else if (taskType === 'comment') platformValue = 'instagram-comment';
      else platformValue = 'instagram-watch';
    } else if (platform === 'tiktok') {
      if (taskType === 'like') platformValue = 'tiktok-like';
      else if (taskType === 'follow') platformValue = 'tiktok-follow';
      else if (taskType === 'comment') platformValue = 'tiktok-comment';
      else if (taskType === 'share') platformValue = 'tiktok-share';
      else platformValue = 'tiktok-watch';
    } else if (platform.includes('twitter')) {
      if (taskType === 'like') platformValue = 'twitter-like';
      else if (taskType === 'follow') platformValue = 'twitter-follow';
      else if (taskType === 'retweet') platformValue = 'twitter-retweet';
      else if (taskType === 'comment') platformValue = 'twitter-comment';
      else platformValue = 'twitter-follow';
    } else if (platform === 'web') {
      if (taskType === 'email_creation') platformValue = 'web-criar-email';
      else platformValue = 'web-website';
    } else {
      platformValue = platform;
    }

    // Build detailed instructions from template
    const instructions = template.defaultInstructions ? [{
      id: Math.random().toString(36).substr(2, 9),
      step: 1,
      instruction: template.defaultInstructions,
      isRequired: true
    }] : [];

    // Map proof requirements from template
    const proofReqs: ProofRequirement[] = (template.proofRequirements || []).map((req: any, index: number) => ({
      id: req.id || Math.random().toString(36).substr(2, 9),
      type: req.type || 'text',
      label: req.label || `Requisito ${index + 1}`,
      description: req.description || '',
      placeholder: req.placeholder || '',
      isRequired: req.isRequired !== undefined ? req.isRequired : true,
    }));

    // Prepare platform-specific settings based on task type
    const platformSettings: any = {};
    
    // YouTube settings
    if (platform === 'youtube') {
      let actionType: 'watch' | 'subscribe' | 'like' | 'comment' = 'watch';
      if (taskType === 'like') actionType = 'like';
      else if (taskType === 'subscribe') actionType = 'subscribe';
      else if (taskType === 'comment') actionType = 'comment';
      else if (taskType === 'watch') actionType = 'watch';
      
      platformSettings.youtube = {
        ...formData.youtube,
        actionType,
      };
    }
    
    // Facebook settings
    if (platform === 'facebook') {
      let actionType: 'watch' | 'follow' | 'like' | 'comment' | 'share' = 'watch';
      if (taskType === 'like') actionType = 'like';
      else if (taskType === 'follow') actionType = 'follow';
      else if (taskType === 'comment') actionType = 'comment';
      else if (taskType === 'share') actionType = 'share';
      else if (taskType === 'watch') actionType = 'watch';
      
      platformSettings.facebook = {
        ...formData.facebook,
        actionType,
      };
    }
    
    // Instagram settings
    if (platform === 'instagram') {
      let actionType: 'watch' | 'follow' | 'like' | 'comment' = 'watch';
      if (taskType === 'like') actionType = 'like';
      else if (taskType === 'follow') actionType = 'follow';
      else if (taskType === 'comment') actionType = 'comment';
      else if (taskType === 'watch') actionType = 'watch';
      
      platformSettings.instagram = {
        ...formData.instagram,
        actionType,
      };
    }
    
    // TikTok settings
    if (platform === 'tiktok') {
      let actionType: 'watch' | 'follow' | 'like' | 'comment' | 'share' = 'watch';
      if (taskType === 'like') actionType = 'like';
      else if (taskType === 'follow') actionType = 'follow';
      else if (taskType === 'comment') actionType = 'comment';
      else if (taskType === 'share') actionType = 'share';
      else if (taskType === 'watch') actionType = 'watch';
      
      platformSettings.tiktok = {
        ...formData.tiktok,
      actionType,
      };
    }
    
    // Twitter settings
    if (platform.includes('twitter')) {
      let actionType: 'follow' | 'like' | 'retweet' | 'comment' = 'follow';
      if (taskType === 'like') actionType = 'like';
      else if (taskType === 'follow') actionType = 'follow';
      else if (taskType === 'retweet') actionType = 'retweet';
      else if (taskType === 'comment') actionType = 'comment';
      
      platformSettings.twitter = {
        ...formData.twitter,
        actionType,
      };
    }

    const updatedFormData = {
      ...formData,
      title: template.name,
      description: template.description,
      category: template.category,
      subcategory: template.subcategory || '',
      platform: platformValue,
      bounty: template.defaultBounty.toString(),
      timeEstimate: `${template.defaultTimeEstimate} minutos`,
      detailedInstructions: instructions,
      proofRequirements: proofReqs,
      ...platformSettings,
      // Set platform-specific data objects based on platform
      ...(platform === 'youtube' && {
        youtube: {
          ...(formData.youtube || defaultYouTube),
          actionType: platformSettings.youtube?.actionType || formData.youtube?.actionType || 'watch',
        }
      }),
      ...(platform === 'facebook' && {
        facebook: {
          ...(formData.facebook || defaultFacebook),
          actionType: platformSettings.facebook?.actionType || formData.facebook?.actionType || 'watch',
        }
      }),
      ...(platform === 'instagram' && {
        instagram: {
          ...(formData.instagram || defaultInstagram),
          actionType: platformSettings.instagram?.actionType || formData.instagram?.actionType || 'watch',
        }
      }),
      ...(platform === 'tiktok' && {
        tiktok: {
          ...(formData.tiktok || defaultTikTok),
          actionType: platformSettings.tiktok?.actionType || formData.tiktok?.actionType || 'watch',
        }
      }),
      ...(platform.includes('twitter') && {
        twitter: {
          ...(formData.twitter || defaultTwitter),
          actionType: platformSettings.twitter?.actionType || formData.twitter?.actionType || 'follow',
        }
      }),
      ...(platform === 'web' && template.subcategory !== 'Criar E-mail' && {
        website: formData.website || defaultWebsite,
      }),
      // Set email creation settings if applicable
      ...(template.emailCreation && {
        emailCreation: {
          provider: template.emailCreation.provider,
          quantity: template.emailCreation.quantity,
          requirements: template.emailCreation.requirements || '',
          customProvider: template.emailCreation.customProvider || '',
        }
      }),
    };

    setFormData(updatedFormData);
    setSelectedTemplate(template);
    setShowTemplatesDialog(false);

    // Validar campos após aplicar template
    const missingFields = validateTemplateFields(updatedFormData, platform);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Template aplicado - Atenção',
        description: (
          <div className="space-y-2">
            <p className="font-medium">Template aplicado com sucesso, mas alguns campos obrigatórios ainda precisam ser completados:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
            <p className="text-xs mt-2 text-muted-foreground">Por favor, preencha os campos acima antes de publicar o anúncio.</p>
          </div>
        ),
        variant: "default",
        duration: 8000,
      });
    } else {
      toast({
        title: 'Template aplicado',
        description: `Template "${template.name}" foi aplicado com sucesso. Todos os campos obrigatórios foram preenchidos.`,
        duration: 4000,
      });
    }
  };

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
    const sub = (formData.subcategory || '').toLowerCase();
    const isYouTube = sub.includes('youtube');
    const isInstagram = sub.includes('instagram');
    const isFacebook = sub.includes('facebook');
    const isTikTok = sub.includes('tiktok');
    const isVK = sub.includes('vk');
    const isWebsite = (formData.category || '').toLowerCase() === 'web' && sub === 'Website'.toLowerCase();
    const isEmailCreation = sub.includes('criar e-mail') || sub.includes('criar email');
    const isVideoAd = (isYouTube && (formData.youtube?.actionType || 'watch') === 'watch') || (isInstagram && (formData.instagram?.actionType || 'watch') === 'watch') || (isFacebook && (formData.facebook?.actionType || 'watch') === 'watch') || sub.includes('ver vídeo');
    
    if (!formData.title || !formData.description || !formData.bounty ||
        (isYouTube && !formData.youtube?.videoUrl) ||
        (isInstagram && !formData.instagram?.videoUrl) ||
        (isFacebook && !formData.facebook?.videoUrl) ||
        (isTikTok && !formData.tiktok.videoUrl) ||
        (isVK && !formData.vk.targetUrl) ||
        (isWebsite && !formData.website?.pageUrl) ||
        (isEmailCreation && (formData.emailCreation.provider === 'other' && !formData.emailCreation.customProvider))) {
      toast({
        title: t("error"),
        description: isEmailCreation ? 'Preencha os campos obrigatórios de criação de e-mail.' : isVideoAd ? 'Preencha os campos obrigatórios do vídeo.' : isTikTok ? 'Preencha os campos obrigatórios do TikTok.' : isVK ? 'Preencha os campos obrigatórios do VK.' : (isInstagram ? 'Preencha os campos obrigatórios do Instagram.' : (isFacebook ? 'Preencha os campos obrigatórios do Facebook.' : (isWebsite ? 'Preencha os campos obrigatórios do Website.' : t("fill_all_required_fields")))),
        variant: "destructive",
      });
      return;
    }

    // Validação específica para criação de e-mail
    if (isEmailCreation && parseFloat(formData.bounty) < 100) {
      toast({
        title: "Valor mínimo não atingido",
        description: "Tarefas de criação de e-mail devem ter valor mínimo de 100 Kz devido à complexidade.",
        variant: "destructive",
      });
      return;
    }

    // Validação de valor da tarefa
    const jobBounty = parseFloat(formData.bounty);
    const maxApplicants = parseInt(formData.maxApplicants) || 1;
    
    if (jobBounty < minBounty) {
      toast({
        title: t("task_value_invalid"),
        description: `O valor mínimo por tarefa é ${minBounty} Kz`,
        variant: "destructive",
      });
      return;
    }

    if (jobBounty > maxBounty) {
      toast({
        title: t("task_value_invalid"),
        description: `O valor máximo por tarefa é ${maxBounty.toLocaleString('pt-AO')} Kz. Para valores maiores, contacte o suporte.`,
        variant: "destructive",
      });
      return;
    }

    // Calcular custo total (valor × máximo de candidatos)
    const totalCost = jobBounty * maxApplicants;
    const currentBalance = userData.posterWallet?.balance || 0;
    const bonusBalance = userData.posterWallet?.bonusBalance || 0;
    const availableFunds = currentBalance + bonusBalance;

    if (availableFunds < totalCost) {
      const desc = t("insufficient_balance_description", { cost: totalCost.toFixed(2), bounty: jobBounty, applicants: maxApplicants, currentBalance: availableFunds.toFixed(2) });
      toast({
        title: t("insufficient_balance"),
        description: desc,
        variant: "destructive",
      });
      return;
    }

    // Verificar se é um valor alto e ainda não foi confirmado
    if (jobBounty > highValueThreshold && !confirmedHighValue) {
      setShowHighValueWarning(true);
      return;
    }

    setIsLoading(true);
    try {
      const jobData: any = {
        title: formData.title,
        description: formData.description,
        posterId: currentUser.uid,
        posterName: userData.name,
        bounty: parseFloat(formData.bounty),
        platform: (formData.platform || 'Web') as 'iOS' | 'Android' | 'Web',
        difficulty: (formData.difficulty || 'Fácil') as 'Fácil' | 'Médio' | 'Difícil',
        category: formData.category ? (formData.category as 'Mobile' | 'Web' | 'Social') : undefined,
        subcategory: formData.subcategory || undefined,
        requirements: formData.requirements,
        attachments: [],
        status: 'active' as const,
        timeEstimate: formData.timeEstimate || "1-2 horas",
        location: formData.location || undefined,
        maxApplicants: formData.maxApplicants ? parseInt(formData.maxApplicants) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        detailedInstructions: formData.detailedInstructions,
        proofRequirements: formData.proofRequirements,
        posterApprovalRate: typeof userData.approvalRate === 'number' ? userData.approvalRate : undefined,
        posterRating: typeof userData.rating === 'number' ? userData.rating : undefined,
        posterRatingCount: typeof userData.ratingCount === 'number' ? userData.ratingCount : undefined,
        isRecurring: formData.isRecurring,
        recurrence: formData.recurrenceEnabled ? {
          enabled: true,
          frequency: formData.recurrenceFrequency,
          interval: formData.recurrenceInterval,
          endDate: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate) : undefined,
          nextPublishDate: undefined, // Will be calculated after first publication
          totalRepublications: 0,
          maxRepublications: formData.recurrenceMaxRepublications ? parseInt(formData.recurrenceMaxRepublications) : undefined,
        } : undefined,
      };

      // Remover campos undefined e adicionar somente se aplicável
      if (!jobData.category) delete jobData.category;
      if (!jobData.subcategory) delete jobData.subcategory;
      if (!jobData.maxApplicants) delete jobData.maxApplicants;
      if (!jobData.dueDate) delete jobData.dueDate;
      if (!jobData.posterApprovalRate) delete jobData.posterApprovalRate;
      if (!jobData.posterRating) delete jobData.posterRating;
      if (!jobData.posterRatingCount) delete jobData.posterRatingCount;
      if (!jobData.location) delete jobData.location;
      if (!jobData.recurrence) delete jobData.recurrence;

      const isTwitter = (formData.subcategory || '').toLowerCase().includes('twitter') || (formData.subcategory || '').toLowerCase().includes('x (twitter)');
      
      if (isYouTube && formData.youtube) jobData.youtube = formData.youtube;
      if (isInstagram && formData.instagram) jobData.instagram = formData.instagram;
      if (isFacebook && formData.facebook) jobData.facebook = formData.facebook;
      if (isTikTok && formData.tiktok) jobData.tiktok = formData.tiktok;
      if (isVK && formData.vk) jobData.vk = formData.vk;
      if (isWebsite && formData.website) jobData.website = formData.website;
      if (isTwitter && formData.twitter) jobData.twitter = formData.twitter;
      if (isEmailCreation && formData.emailCreation) jobData.emailCreation = formData.emailCreation;

      if ((formData.subcategory || '').toLowerCase().includes('youtube') && formData.youtube?.actionType === 'subscribe') {
        const existing = Array.isArray(jobData.proofRequirements) ? jobData.proofRequirements : [];
        const hasScreenshot = existing.some((p: any) => p.id === 'youtube_subscribe_screenshot');
        const hasLink = existing.some((p: any) => p.id === 'youtube_channel_link');
        const defaults = [
          !hasScreenshot && {
            id: 'youtube_subscribe_screenshot',
            type: 'screenshot',
            label: 'Comprovativo de inscrição (captura de ecrã)',
            description: 'Envie uma captura de ecrã mostrando que você se inscreveu no canal.',
            isRequired: true,
            placeholder: t('proof_placeholder_screenshot'),
          },
          !hasLink && {
            id: 'youtube_channel_link',
            type: 'url',
            label: 'Link do canal',
            description: 'Cole o link do canal que você se inscreveu.',
            isRequired: true,
            placeholder: t('proof_placeholder_url'),
          },
        ].filter(Boolean);
        jobData.proofRequirements = [...existing, ...defaults];
      }

      if ((formData.subcategory || '').toLowerCase().includes('youtube') && formData.youtube?.actionType === 'like') {
        const existing = Array.isArray(jobData.proofRequirements) ? jobData.proofRequirements : [];
        const hasScreenshot = existing.some((p: any) => p.id === 'youtube_like_screenshot');
        const hasLink = existing.some((p: any) => p.id === 'youtube_video_link');
        const defaults = [
          !hasScreenshot && {
            id: 'youtube_like_screenshot',
            type: 'screenshot',
            label: 'Comprovativo de curtida (captura de ecrã)',
            description: 'Envie uma captura de ecrã mostrando que você curtiu o vídeo.',
            isRequired: true,
            placeholder: t('proof_placeholder_screenshot'),
          },
          !hasLink && {
            id: 'youtube_video_link',
            type: 'url',
            label: 'Link do vídeo',
            description: 'Cole o link do vídeo que você curtiu.',
            isRequired: true,
            placeholder: t('proof_placeholder_url'),
          },
        ].filter(Boolean);
        jobData.proofRequirements = [...existing, ...defaults];
      }

      if ((formData.subcategory || '').toLowerCase().includes('instagram')) {
        const existing = Array.isArray(jobData.proofRequirements) ? jobData.proofRequirements : [];
        if ((formData.instagram?.actionType || 'watch') === 'follow') {
          const hasScreenshot = existing.some((p: any) => p.id === 'instagram_follow_screenshot');
          const hasLink = existing.some((p: any) => p.id === 'instagram_profile_link');
          const defaults = [
            !hasScreenshot && {
              id: 'instagram_follow_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de seguir (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você seguiu o perfil.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasLink && {
              id: 'instagram_profile_link',
              type: 'url',
              label: 'Link do perfil',
              description: 'Cole o link do perfil que você seguiu.',
              isRequired: true,
              placeholder: t('proof_placeholder_url'),
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        if ((formData.instagram?.actionType || 'watch') === 'like') {
          const hasScreenshot = existing.some((p: any) => p.id === 'instagram_like_screenshot');
          const hasLink = existing.some((p: any) => p.id === 'instagram_post_link');
          const defaults = [
            !hasScreenshot && {
              id: 'instagram_like_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de curtida (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você curtiu a publicação.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasLink && {
              id: 'instagram_post_link',
              type: 'url',
              label: 'Link da publicação',
              description: 'Cole o link da publicação que você curtiu.',
              isRequired: true,
              placeholder: t('proof_placeholder_url'),
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        if ((formData.instagram?.actionType || 'watch') === 'comment') {
          const hasScreenshot = existing.some((p: any) => p.id === 'instagram_comment_screenshot');
          const hasLink = existing.some((p: any) => p.id === 'instagram_post_link');
          const defaults = [
            !hasScreenshot && {
              id: 'instagram_comment_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de comentário (captura de ecrã)',
              description: 'Envie uma captura de ecrã do seu comentário.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasLink && {
              id: 'instagram_post_link',
              type: 'url',
              label: 'Link da publicação',
              description: 'Cole o link da publicação onde você comentou.',
              isRequired: true,
              placeholder: t('proof_placeholder_url'),
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
      }

      if ((formData.subcategory || '').toLowerCase().includes('facebook')) {
        const existing = Array.isArray(jobData.proofRequirements) ? jobData.proofRequirements : [];
        if ((formData.facebook?.actionType || 'watch') === 'follow') {
          const hasScreenshot = existing.some((p: any) => p.id === 'facebook_follow_screenshot');
          const hasLink = existing.some((p: any) => p.id === 'facebook_page_link');
          const defaults = [
            !hasScreenshot && {
              id: 'facebook_follow_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de seguir página (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você segue a página.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasLink && {
              id: 'facebook_page_link',
              type: 'url',
              label: 'Link da página',
              description: 'Cole o link da página que você seguiu.',
              isRequired: true,
              placeholder: t('proof_placeholder_url'),
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        if ((formData.facebook?.actionType || 'watch') === 'like') {
          const hasScreenshot = existing.some((p: any) => p.id === 'facebook_like_screenshot');
          const hasLink = existing.some((p: any) => p.id === 'facebook_post_link');
          const defaults = [
            !hasScreenshot && {
              id: 'facebook_like_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de curtida (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você curtiu a publicação.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasLink && {
              id: 'facebook_post_link',
              type: 'url',
              label: 'Link da publicação',
              description: 'Cole o link da publicação que você curtiu.',
              isRequired: true,
              placeholder: t('proof_placeholder_url'),
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        if ((formData.facebook?.actionType || 'watch') === 'comment') {
          const hasScreenshot = existing.some((p: any) => p.id === 'facebook_comment_screenshot');
          const hasLink = existing.some((p: any) => p.id === 'facebook_post_link');
          const defaults = [
            !hasScreenshot && {
              id: 'facebook_comment_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de comentário (captura de ecrã)',
              description: 'Envie uma captura de ecrã do seu comentário.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasLink && {
              id: 'facebook_post_link',
              type: 'url',
              label: 'Link da publicação',
              description: 'Cole o link da publicação onde você comentou.',
              isRequired: true,
              placeholder: t('proof_placeholder_url'),
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
      }

      // Twitter/X: gerar proofRequirements automáticos baseado no actionType
      if (isTwitter && formData.twitter) {
        const existing = Array.isArray(jobData.proofRequirements) ? jobData.proofRequirements : [];
        const actionType = formData.twitter.actionType;
        
        if (actionType === 'follow') {
          const hasScreenshot = existing.some((p: any) => p.id === 'twitter_follow_screenshot');
          const hasProfileLink = existing.some((p: any) => p.id === 'twitter_profile_link');
          const defaults = [
            !hasScreenshot && {
              id: 'twitter_follow_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de seguir perfil (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você seguiu o perfil no Twitter/X.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasProfileLink && {
              id: 'twitter_profile_link',
              type: 'url',
              label: 'Link do perfil seguido',
              description: 'Cole o link do perfil que você seguiu.',
              isRequired: true,
              placeholder: 'https://twitter.com/username',
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        
        if (actionType === 'like') {
          const hasScreenshot = existing.some((p: any) => p.id === 'twitter_like_screenshot');
          const hasTweetLink = existing.some((p: any) => p.id === 'twitter_tweet_link');
          const defaults = [
            !hasScreenshot && {
              id: 'twitter_like_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de curtida (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você curtiu o tweet.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasTweetLink && {
              id: 'twitter_tweet_link',
              type: 'url',
              label: 'Link do tweet curtido',
              description: 'Cole o link do tweet que você curtiu.',
              isRequired: true,
              placeholder: 'https://twitter.com/user/status/123...',
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        
        if (actionType === 'retweet') {
          const hasScreenshot = existing.some((p: any) => p.id === 'twitter_retweet_screenshot');
          const hasTweetLink = existing.some((p: any) => p.id === 'twitter_retweet_link');
          const defaults = [
            !hasScreenshot && {
              id: 'twitter_retweet_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de retweet (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando que você fez o retweet.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasTweetLink && {
              id: 'twitter_retweet_link',
              type: 'url',
              label: 'Link do seu retweet',
              description: 'Cole o link do seu retweet (seu perfil mostrando o retweet).',
              isRequired: true,
              placeholder: 'https://twitter.com/yourprofile/status/123...',
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
        
        if (actionType === 'comment') {
          const hasScreenshot = existing.some((p: any) => p.id === 'twitter_comment_screenshot');
          const hasCommentText = existing.some((p: any) => p.id === 'twitter_comment_text');
          const hasTweetLink = existing.some((p: any) => p.id === 'twitter_comment_link');
          const defaults = [
            !hasScreenshot && {
              id: 'twitter_comment_screenshot',
              type: 'screenshot',
              label: 'Comprovativo de comentário (captura de ecrã)',
              description: 'Envie uma captura de ecrã mostrando seu comentário publicado.',
              isRequired: true,
              placeholder: t('proof_placeholder_screenshot'),
            },
            !hasCommentText && {
              id: 'twitter_comment_text',
              type: 'text',
              label: 'Texto do comentário',
              description: `Digite o texto exato do seu comentário (mínimo ${formData.twitter.minCommentLength || 50} caracteres).`,
              isRequired: true,
              placeholder: 'Digite seu comentário aqui...',
            },
            !hasTweetLink && {
              id: 'twitter_comment_link',
              type: 'url',
              label: 'Link do tweet comentado',
              description: 'Cole o link do tweet onde você comentou.',
              isRequired: true,
              placeholder: 'https://twitter.com/user/status/123...',
            },
          ].filter(Boolean);
          jobData.proofRequirements = [...existing, ...defaults];
        }
      }

      // Criação de E-mail: gerar proofRequirements automáticos
      if (isEmailCreation) {
        const existing = Array.isArray(jobData.proofRequirements) ? jobData.proofRequirements : [];
        const hasEmail = existing.some((p: any) => p.id === 'email');
        const hasPassword = existing.some((p: any) => p.id === 'password');
        const hasProvider = existing.some((p: any) => p.id === 'provider');
        const hasScreenshot = existing.some((p: any) => p.id === 'screenshot');
        
        const defaults = [
          !hasEmail && {
            id: 'email',
            type: 'text',
            label: 'E-mail criado',
            description: 'Digite o endereço de e-mail completo criado',
            isRequired: true,
            placeholder: 'exemplo@email.com',
          },
          !hasPassword && {
            id: 'password',
            type: 'text',
            label: 'Senha da conta',
            description: 'Digite a senha escolhida para a conta',
            isRequired: true,
            placeholder: 'Senha da conta',
          },
          !hasProvider && {
            id: 'provider',
            type: 'text',
            label: 'Provedor',
            description: 'Nome do provedor de e-mail (Gmail, Outlook, etc.)',
            isRequired: true,
            placeholder: 'Gmail',
          },
          !hasScreenshot && {
            id: 'screenshot',
            type: 'screenshot',
            label: 'Comprovante de criação (opcional)',
            description: 'Screenshot da confirmação de conta criada',
            isRequired: false,
            placeholder: t('proof_placeholder_screenshot'),
          },
        ].filter(Boolean);
        
        jobData.proofRequirements = [...existing, ...defaults];
      }

      
      // Limpar dados antes de enviar ao Firebase (remove undefined, null)
      const cleanedJobData = cleanFirebaseData(jobData) as typeof jobData;

      await JobService.createJobWithPayment(cleanedJobData, currentUser.uid, totalCost);
      
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("back")}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t("create_job")}</h1>
                <p className="text-muted-foreground">{t("create_job_description")}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplatesDialog(true)}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Usar Template
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulário Principal - 2 colunas */}
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
                          youtube: prev.youtube || defaultYouTube,
                        }))}
                      >
                        <Youtube className="h-4 w-4 mr-2" /> YouTube
                      </Button>
                      
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('instagram') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Social',
                          subcategory: 'Instagram',
                          instagram: prev.instagram || defaultInstagram,
                        }))}
                      >
                        <Instagram className="h-4 w-4 mr-2" /> Instagram
                      </Button>
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('facebook') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Social',
                          subcategory: 'Facebook',
                          facebook: prev.facebook || defaultFacebook,
                        }))}
                      >
                        <Facebook className="h-4 w-4 mr-2" /> Facebook
                      </Button>
                      
                <Button
                  type="button"
                  variant={(formData.category || '').toLowerCase() === 'web' && (formData.subcategory || '').toLowerCase() === 'website' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    category: 'Web',
                    subcategory: 'Website',
                    website: prev.website || defaultWebsite,
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
                          tiktok: prev.tiktok || defaultTikTok,
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
                          vk: prev.vk || defaultVK,
                        }))}
                        >
                          <Users className="h-4 w-4 mr-2" /> VK
                        </Button>
                        
                        <Button
                          type="button"
                          variant={(formData.subcategory || '').toLowerCase().includes('twitter') || (formData.subcategory || '').toLowerCase().includes('x (twitter)') ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            category: 'Social',
                            subcategory: 'Twitter/X',
                            twitter: prev.twitter || defaultTwitter,
                          }))}
                        >
                          <TwitterIcon className="h-4 w-4 mr-2" /> Twitter/X
                        </Button>
                      
                      <Button
                        type="button"
                        variant={(formData.subcategory || '').toLowerCase().includes('criar e-mail') ? 'default' : 'outline'}
                        className="justify-start"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: 'Web',
                          subcategory: 'Criar E-mail',
                          emailCreation: prev.emailCreation || {
                            provider: 'gmail',
                            quantity: 1,
                            requirements: '',
                            customProvider: '',
                          },
                        }))}
                      >
                        <Mail className="h-4 w-4 mr-2" /> Criar E-mail
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

                    
                  </CardContent>
                </Card>

                {(formData.category || '').toLowerCase() === 'web' && (formData.subcategory || '').toLowerCase() === 'website' && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-cosmic-blue" />
                        <span>Website</span>
                      </CardTitle>
                      <CardDescription>Configure as opções da tarefa de Website.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={(formData.website?.actionType || 'visit') === 'visit' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), actionType: 'visit' } }))}>Visitar Website</Button>
                        <Button type="button" variant={(formData.website?.actionType || 'visit') === 'visit_scroll' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), actionType: 'visit_scroll' } }))}>Visitar e Rolar</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ws-title">Título/Descrição</Label>
                          <Input id="ws-title" placeholder="Ex.: Landing page de vendas" value={formData.website?.pageTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), pageTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="ws-url">Link do Website</Label>
                          <Input id="ws-url" placeholder="https://..." value={formData.website?.pageUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), pageUrl: e.target.value } }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Tempo mínimo</Label>
                          <Select value={String(formData.website?.viewTimeSeconds || 10)} onValueChange={(v) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), viewTimeSeconds: parseInt(v) || 10 } }))}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                            <SelectContent>
                              {[10, 20, 30, 60, 90, 120].map(s => (
                                <SelectItem key={s} value={String(s)}>{s} segundos</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Velocidade de execução</Label>
                          <Select value={String(formData.website?.dailyMaxVisits || 500)} onValueChange={(v) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), dailyMaxVisits: parseInt(v) || 500 } }))}>
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
                          <Select value={formData.website?.guarantee || 'none'} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), guarantee: v } }))}>
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
                          <input type="checkbox" id="ws-repeat" checked={!!formData.website?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { avoidRepeat: e.target.checked, openInIframe: prev.website?.extras?.openInIframe ?? true, blockCopy: prev.website?.extras?.blockCopy ?? true, blockRefresh: prev.website?.extras?.blockRefresh ?? true, blockMultipleTabs: prev.website?.extras?.blockMultipleTabs ?? true } } }))} />
                          <Label htmlFor="ws-repeat">Evitar repetição</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-iframe" checked={!!formData.website?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { avoidRepeat: prev.website?.extras?.avoidRepeat ?? true, openInIframe: e.target.checked, blockCopy: prev.website?.extras?.blockCopy ?? true, blockRefresh: prev.website?.extras?.blockRefresh ?? true, blockMultipleTabs: prev.website?.extras?.blockMultipleTabs ?? true } } }))} />
                          <Label htmlFor="ws-iframe">Abrir em iframe</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-copy" checked={!!formData.website?.extras?.blockCopy} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { avoidRepeat: prev.website?.extras?.avoidRepeat ?? true, openInIframe: prev.website?.extras?.openInIframe ?? true, blockCopy: e.target.checked, blockRefresh: prev.website?.extras?.blockRefresh ?? true, blockMultipleTabs: prev.website?.extras?.blockMultipleTabs ?? true } } }))} />
                          <Label htmlFor="ws-copy">Bloquear copiar/colar</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-refresh" checked={!!formData.website?.extras?.blockRefresh} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { avoidRepeat: prev.website?.extras?.avoidRepeat ?? true, openInIframe: prev.website?.extras?.openInIframe ?? true, blockCopy: prev.website?.extras?.blockCopy ?? true, blockRefresh: e.target.checked, blockMultipleTabs: prev.website?.extras?.blockMultipleTabs ?? true } } }))} />
                          <Label htmlFor="ws-refresh">Bloquear refresh</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-tabs" checked={!!formData.website?.extras?.blockMultipleTabs} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { avoidRepeat: prev.website?.extras?.avoidRepeat ?? true, openInIframe: prev.website?.extras?.openInIframe ?? true, blockCopy: prev.website?.extras?.blockCopy ?? true, blockRefresh: prev.website?.extras?.blockRefresh ?? true, blockMultipleTabs: e.target.checked } } }))} />
                          <Label htmlFor="ws-tabs">Bloquear múltiplas abas</Label>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ws-bounty">Custo por visita (Kz)</Label>
                        <Input id="ws-bounty" type="number" step="0.01" min="5" max="50" value={formData.bounty} onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))} />
                        <p className="text-xs text-muted-foreground mt-2">Este valor será utilizado como preço por visita.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* YouTube: vídeo/inscrição/like */}
                {(() => {
                  const sub = (formData.subcategory || '').toLowerCase();
                  const isYouTube = sub.includes('youtube');
                  if (!isYouTube) return null;
                  const platform = 'YouTube';
                  return (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-cosmic-blue" />
                        <span>{(platform === 'YouTube' && (formData.youtube?.actionType || 'watch') === 'subscribe') ? 'Inscrições no YouTube' : (platform === 'YouTube' && (formData.youtube?.actionType || 'watch') === 'like') ? 'Curtidas do YouTube' : `Visualização de vídeos no ${platform}`}</span>
                      </CardTitle>
                      <CardDescription>{(platform === 'YouTube' && (formData.youtube?.actionType || 'watch') === 'subscribe') ? 'Configure os detalhes do anúncio de inscrições no YouTube.' : (platform === 'YouTube' && (formData.youtube?.actionType || 'watch') === 'like') ? 'Configure os detalhes do anúncio de curtidas no YouTube.' : `Configure os detalhes do anúncio de ${platform}.`}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={(formData.youtube?.actionType || 'watch') === 'watch' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), actionType: 'watch' } }))}>Assista ao vídeo</Button>
                        <Button type="button" variant={(formData.youtube?.actionType || 'watch') === 'subscribe' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), actionType: 'subscribe' } }))}>Inscreva-se no canal</Button>
                        <Button type="button" variant={(formData.youtube?.actionType || 'watch') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), actionType: 'like' } }))}>Curtir vídeo</Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="yt-title">{(formData.youtube?.actionType || 'watch') === 'subscribe' ? 'Nome do canal' : 'Título do vídeo'}</Label>
                          <Input id="yt-title" placeholder={(formData.youtube?.actionType || 'watch') === 'subscribe' ? 'Ex.: Canal Oficial' : 'Ex.: Tutorial de configuração'} value={formData.youtube?.videoTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), videoTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="yt-url">{(formData.youtube?.actionType || 'watch') === 'subscribe' ? 'Link do canal' : 'Link para o vídeo'}</Label>
                          <Input id="yt-url" placeholder={(formData.youtube?.actionType || 'watch') === 'subscribe' ? 'https://www.youtube.com/@nomeDoCanal' : 'https://www.youtube.com/watch?v=...'} value={formData.youtube?.videoUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), videoUrl: e.target.value } }))} />
                        </div>
                      </div>

                      {(formData.youtube?.actionType || 'watch') === 'watch' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tempo de visualização</Label>
                            <Select value={String(formData.youtube?.viewTimeSeconds || 30)} onValueChange={(v) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), viewTimeSeconds: parseInt(v) || 30 } }))}>
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
                            <Select value={String(formData.youtube?.dailyMaxViews || 500)} onValueChange={(v) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), dailyMaxViews: parseInt(v) || 500 } }))}>
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
                            <Select value={formData.youtube?.guarantee || 'none'} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), guarantee: v } }))}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem garantia</SelectItem>
                                <SelectItem value="basic">Garantia básica</SelectItem>
                                <SelectItem value="premium">Garantia premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-login" checked={!!formData.youtube?.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), extras: { ...(prev.youtube?.extras || {}), requireLogin: e.target.checked } } }))} />
                          <Label htmlFor="yt-login">Exigir login no YouTube</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-repeat" checked={!!formData.youtube?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), extras: { ...(prev.youtube?.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="yt-repeat">Evitar repetição do mesmo usuário</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-iframe" checked={!!formData.youtube?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), extras: { ...(prev.youtube?.extras || {}), openInIframe: e.target.checked } } }))} />
                          <Label htmlFor="yt-iframe">Abrir em iframe</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="yt-unlimited" checked={!!formData.youtube?.extras?.unlimitedAds} onChange={(e) => setFormData(prev => ({ ...prev, youtube: { ...(prev.youtube || defaultYouTube), extras: { ...(prev.youtube?.extras || {}), unlimitedAds: e.target.checked } } }))} />
                          <Label htmlFor="yt-unlimited">Publicidade ilimitada</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="yt-bounty">{(formData.youtube?.actionType || 'watch') === 'watch' ? 'Custo por visualização (Kz)' : (formData.youtube?.actionType === 'subscribe' ? 'Custo por inscrição (Kz)' : 'Custo por curtida (Kz)')}</Label>
                        <Input id="yt-bounty" type="number" step="0.01" min="5" max="50" value={formData.bounty} onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))} />
                        <p className="text-xs text-muted-foreground mt-2">{(formData.youtube?.actionType || 'watch') === 'watch' ? 'Este valor será utilizado como preço por visualização.' : (formData.youtube?.actionType === 'subscribe' ? 'Este valor será utilizado como preço por inscrição.' : 'Este valor será utilizado como preço por curtida.')}</p>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })()}

                {/* Instagram: vídeo/seguir/curtir/comentar */}
                {(formData.subcategory || '').toLowerCase().includes('instagram') && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-cosmic-blue" />
                        <span>Instagram</span>
                      </CardTitle>
                      <CardDescription>Configure os detalhes do anúncio de Instagram.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={(formData.instagram?.actionType || 'follow') === 'follow' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'follow' } }))}>Seguir perfil</Button>
                        <Button type="button" variant={(formData.instagram?.actionType || 'follow') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'like' } }))}>Curtir publicação</Button>
                        <Button type="button" variant={(formData.instagram?.actionType || 'follow') === 'comment' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'comment' } }))}>Comentar publicação</Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ig-title">{(formData.instagram?.actionType || 'watch') === 'follow' ? 'Nome do perfil' : 'Título/Descrição'}</Label>
                          <Input id="ig-title" placeholder={(formData.instagram?.actionType || 'watch') === 'follow' ? 'Ex.: @perfil' : 'Ex.: Publicação promocional'} value={formData.instagram?.videoTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), videoTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="ig-url">{(formData.instagram?.actionType || 'watch') === 'follow' ? 'Link do perfil' : 'Link da publicação/vídeo'}</Label>
                          <Input id="ig-url" placeholder={(formData.instagram?.actionType || 'watch') === 'follow' ? 'https://instagram.com/...' : 'https://instagram.com/p/...'} value={formData.instagram?.videoUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), videoUrl: e.target.value } }))} />
                        </div>
                      </div>

                      {(formData.instagram?.actionType || 'watch') === 'watch' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tempo de visualização</Label>
                            <Select value={String(formData.instagram?.viewTimeSeconds || 30)} onValueChange={(v) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), viewTimeSeconds: parseInt(v) || 30 } }))}>
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
                            <Select value={String(formData.instagram?.dailyMaxViews || 500)} onValueChange={(v) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), dailyMaxViews: parseInt(v) || 500 } }))}>
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
                            <Select value={formData.instagram?.guarantee || 'none'} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), guarantee: v } }))}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem garantia</SelectItem>
                                <SelectItem value="basic">Garantia básica</SelectItem>
                                <SelectItem value="premium">Garantia premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ig-login" checked={!!formData.instagram?.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), extras: { ...(prev.instagram?.extras || {}), requireLogin: e.target.checked } } }))} />
                          <Label htmlFor="ig-login">Exigir login</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ig-repeat" checked={!!formData.instagram?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), extras: { ...(prev.instagram?.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="ig-repeat">Evitar repetição</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ig-iframe" checked={!!formData.instagram?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), extras: { ...(prev.instagram?.extras || {}), openInIframe: e.target.checked } } }))} />
                          <Label htmlFor="ig-iframe">Abrir em iframe</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="ig-bounty">{(formData.instagram?.actionType || 'watch') === 'watch' ? 'Custo por visualização (Kz)' : (formData.instagram?.actionType === 'follow' ? 'Custo por seguir (Kz)' : (formData.instagram?.actionType === 'like' ? 'Custo por curtida (Kz)' : 'Custo por comentário (Kz)'))}</Label>
                        <Input id="ig-bounty" type="number" step="0.01" min="5" max="50" value={formData.bounty} onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))} />
                        <p className="text-xs text-muted-foreground mt-2">{(formData.instagram?.actionType || 'watch') === 'watch' ? 'Este valor será utilizado como preço por visualização.' : (formData.instagram?.actionType === 'follow' ? 'Este valor será utilizado como preço por seguir.' : (formData.instagram?.actionType === 'like' ? 'Este valor será utilizado como preço por curtida.' : 'Este valor será utilizado como preço por comentário.'))}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Facebook: vídeo/seguir/curtir/comentar */}
                {(formData.subcategory || '').toLowerCase().includes('facebook') && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-cosmic-blue" />
                        <span>Facebook</span>
                      </CardTitle>
                      <CardDescription>Configure os detalhes do anúncio de Facebook.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={(formData.facebook?.actionType || 'follow') === 'follow' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'follow' } }))}>Seguir página</Button>
                        <Button type="button" variant={(formData.facebook?.actionType || 'follow') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'like' } }))}>Curtir publicação</Button>
                        <Button type="button" variant={(formData.facebook?.actionType || 'follow') === 'comment' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'comment' } }))}>Comentar publicação</Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fb-title">{(formData.facebook?.actionType || 'watch') === 'follow' ? 'Nome da página' : 'Título/Descrição'}</Label>
                          <Input id="fb-title" placeholder={(formData.facebook?.actionType || 'watch') === 'follow' ? 'Ex.: Página Oficial' : 'Ex.: Publicação promocional'} value={formData.facebook?.videoTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), videoTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="fb-url">{(formData.facebook?.actionType || 'watch') === 'follow' ? 'Link da página' : 'Link da publicação/vídeo'}</Label>
                          <Input id="fb-url" placeholder={(formData.facebook?.actionType || 'watch') === 'follow' ? 'https://facebook.com/...' : 'https://facebook.com/...'} value={formData.facebook?.videoUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), videoUrl: e.target.value } }))} />
                        </div>
                      </div>

                      {(formData.facebook?.actionType || 'watch') === 'watch' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tempo de visualização</Label>
                            <Select value={String(formData.facebook?.viewTimeSeconds || 30)} onValueChange={(v) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), viewTimeSeconds: parseInt(v) || 30 } }))}>
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
                            <Select value={String(formData.facebook?.dailyMaxViews || 500)} onValueChange={(v) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), dailyMaxViews: parseInt(v) || 500 } }))}>
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
                            <Select value={formData.facebook?.guarantee || 'none'} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), guarantee: v } }))}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem garantia</SelectItem>
                                <SelectItem value="basic">Garantia básica</SelectItem>
                                <SelectItem value="premium">Garantia premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="fb-login" checked={!!formData.facebook?.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), extras: { ...(prev.facebook?.extras || {}), requireLogin: e.target.checked } } }))} />
                          <Label htmlFor="fb-login">Exigir login</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="fb-repeat" checked={!!formData.facebook?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), extras: { ...(prev.facebook?.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="fb-repeat">Evitar repetição</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="fb-iframe" checked={!!formData.facebook?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), extras: { ...(prev.facebook?.extras || {}), openInIframe: e.target.checked } } }))} />
                          <Label htmlFor="fb-iframe">Abrir em iframe</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="fb-bounty">{(formData.facebook?.actionType || 'watch') === 'watch' ? 'Custo por visualização (Kz)' : (formData.facebook?.actionType === 'follow' ? 'Custo por seguir página (Kz)' : (formData.facebook?.actionType === 'like' ? 'Custo por curtida (Kz)' : 'Custo por comentário (Kz)'))}</Label>
                        <Input id="fb-bounty" type="number" step="0.01" min="5" max="50" value={formData.bounty} onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))} />
                        <p className="text-xs text-muted-foreground mt-2">{(formData.facebook?.actionType || 'watch') === 'watch' ? 'Este valor será utilizado como preço por visualização.' : (formData.facebook?.actionType === 'follow' ? 'Este valor será utilizado como preço por seguir página.' : (formData.facebook?.actionType === 'like' ? 'Este valor será utilizado como preço por curtida.' : 'Este valor será utilizado como preço por comentário.'))}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Twitter/X: seguir/curtir/retweet/comentar */}
                {((formData.subcategory || '').toLowerCase().includes('twitter') || (formData.subcategory || '').toLowerCase().includes('x (twitter)')) && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-cosmic-blue" />
                        <span>Twitter/X</span>
                      </CardTitle>
                      <CardDescription>Configure os detalhes do anúncio de Twitter/X.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <Button type="button" variant={(formData.twitter?.actionType || 'follow') === 'follow' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), actionType: 'follow' } }))}>Seguir perfil</Button>
                        <Button type="button" variant={(formData.twitter?.actionType || 'follow') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), actionType: 'like' } }))}>Curtir tweet</Button>
                        <Button type="button" variant={(formData.twitter?.actionType || 'follow') === 'retweet' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), actionType: 'retweet' } }))}>Retweet</Button>
                        <Button type="button" variant={(formData.twitter?.actionType || 'follow') === 'comment' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), actionType: 'comment' } }))}>Comentar</Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tw-title">{(formData.twitter?.actionType || 'follow') === 'follow' ? 'Nome do perfil' : 'Título do tweet'}</Label>
                          <Input id="tw-title" placeholder={(formData.twitter?.actionType || 'follow') === 'follow' ? 'Ex.: @usuario' : 'Ex.: Tweet promocional'} value={formData.twitter?.tweetTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), tweetTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="tw-url">{(formData.twitter?.actionType || 'follow') === 'follow' ? 'Link do perfil' : 'Link do tweet'}</Label>
                          <Input id="tw-url" placeholder={(formData.twitter?.actionType || 'follow') === 'follow' ? 'https://twitter.com/...' : 'https://twitter.com/.../status/...'} value={formData.twitter?.tweetUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), tweetUrl: e.target.value } }))} />
                        </div>
                      </div>

                      {(formData.twitter?.actionType || 'follow') === 'comment' && (
                        <div>
                          <Label htmlFor="tw-min-comment">Tamanho mínimo do comentário (caracteres)</Label>
                          <Input id="tw-min-comment" type="number" min="10" max="280" value={formData.twitter?.minCommentLength || 50} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), minCommentLength: parseInt(e.target.value) || 50 } }))} />
                          <p className="text-xs text-muted-foreground mt-1">Freelancers devem escrever comentários com pelo menos este número de caracteres</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tw-login" checked={!!formData.twitter?.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), extras: { requireLogin: e.target.checked, avoidRepeat: prev.twitter?.extras?.avoidRepeat ?? true, openInIframe: prev.twitter?.extras?.openInIframe ?? true, verifiedOnly: prev.twitter?.extras?.verifiedOnly ?? false } } }))} />
                          <Label htmlFor="tw-login">Exigir login</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tw-repeat" checked={!!formData.twitter?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), extras: { requireLogin: prev.twitter?.extras?.requireLogin ?? false, avoidRepeat: e.target.checked, openInIframe: prev.twitter?.extras?.openInIframe ?? true, verifiedOnly: prev.twitter?.extras?.verifiedOnly ?? false } } }))} />
                          <Label htmlFor="tw-repeat">Evitar repetição</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tw-iframe" checked={!!formData.twitter?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), extras: { requireLogin: prev.twitter?.extras?.requireLogin ?? false, avoidRepeat: prev.twitter?.extras?.avoidRepeat ?? true, openInIframe: e.target.checked, verifiedOnly: prev.twitter?.extras?.verifiedOnly ?? false } } }))} />
                          <Label htmlFor="tw-iframe">Abrir em iframe</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tw-verified" checked={!!formData.twitter?.extras?.verifiedOnly} onChange={(e) => setFormData(prev => ({ ...prev, twitter: { ...(prev.twitter || defaultTwitter), extras: { requireLogin: prev.twitter?.extras?.requireLogin ?? false, avoidRepeat: prev.twitter?.extras?.avoidRepeat ?? true, openInIframe: prev.twitter?.extras?.openInIframe ?? true, verifiedOnly: e.target.checked } } }))} />
                          <Label htmlFor="tw-verified">Apenas usuários verificados</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tw-bounty">{(formData.twitter?.actionType || 'follow') === 'follow' ? 'Custo por seguir (Kz)' : (formData.twitter?.actionType === 'like' ? 'Custo por curtida (Kz)' : (formData.twitter?.actionType === 'retweet' ? 'Custo por retweet (Kz)' : 'Custo por comentário (Kz)'))}</Label>
                        <Input id="tw-bounty" type="number" step="0.01" min="5" max="100" value={formData.bounty} onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))} />
                        <p className="text-xs text-muted-foreground mt-2">{(formData.twitter?.actionType || 'follow') === 'follow' ? 'Este valor será utilizado como preço por seguir.' : (formData.twitter?.actionType === 'like' ? 'Este valor será utilizado como preço por curtida.' : (formData.twitter?.actionType === 'retweet' ? 'Este valor será utilizado como preço por retweet.' : 'Este valor será utilizado como preço por comentário.'))}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* TikTok: formulário específico */}
                {(formData.subcategory || '').toLowerCase().includes('tiktok') && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-cosmic-blue" />
                        <span>TikTok</span>
                      </CardTitle>
                      <CardDescription>Configure os detalhes do anúncio de TikTok.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={(formData.tiktok?.actionType || 'watch') === 'watch' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), actionType: 'watch' } }))}>Assistir vídeo</Button>
                        <Button type="button" variant={(formData.tiktok?.actionType || 'follow') === 'follow' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), actionType: 'follow' } }))}>Seguir perfil</Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tk-title">Título</Label>
                          <Input id="tk-title" placeholder="Ex.: Vídeo promocional" value={formData.tiktok?.videoTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), videoTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="tk-url">Link do TikTok</Label>
                          <Input id="tk-url" placeholder="https://www.tiktok.com/..." value={formData.tiktok?.videoUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), videoUrl: e.target.value } }))} />
                        </div>
                      </div>

                      {formData.tiktok.actionType === 'watch' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tempo de visualização</Label>
                          <Select value={String(formData.tiktok?.viewTimeSeconds || 30)} onValueChange={(v) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), viewTimeSeconds: parseInt(v) || 30 } }))}>
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
                            <Select value={String(formData.tiktok?.dailyMaxViews || 500)} onValueChange={(v) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), dailyMaxViews: parseInt(v) || 500 } }))}>
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
                            <Select value={formData.tiktok?.guarantee || 'none'} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), guarantee: v } }))}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem garantia</SelectItem>
                                <SelectItem value="basic">Garantia básica</SelectItem>
                                <SelectItem value="premium">Garantia premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tk-login" checked={!!formData.tiktok?.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), extras: { ...(prev.tiktok?.extras || {}), requireLogin: e.target.checked } } }))} />
                          <Label htmlFor="tk-login">Exigir login</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tk-repeat" checked={!!formData.tiktok?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), extras: { ...(prev.tiktok?.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="tk-repeat">Evitar repetição</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="tk-iframe" checked={!!formData.tiktok?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, tiktok: { ...(prev.tiktok || defaultTikTok), extras: { ...(prev.tiktok?.extras || {}), openInIframe: e.target.checked } } }))} />
                          <Label htmlFor="tk-iframe">Abrir em iframe</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* VK: formulário específico */}
                {(formData.subcategory || '').toLowerCase().includes('vk') && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-cosmic-blue" />
                        <span>VK</span>
                      </CardTitle>
                      <CardDescription>Configure os detalhes do anúncio de VK.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button type="button" variant={(formData.vk?.actionType || 'join') === 'join' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), actionType: 'join' } }))}>Entrar no grupo</Button>
                        <Button type="button" variant={(formData.vk?.actionType || 'join') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), actionType: 'like' } }))}>Curtir publicação</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vk-title">Título</Label>
                          <Input id="vk-title" placeholder="Ex.: Comunidade oficial" value={formData.vk?.targetTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), targetTitle: e.target.value } }))} />
                        </div>
                        <div>
                          <Label htmlFor="vk-url">Link do VK</Label>
                          <Input id="vk-url" placeholder="https://vk.com/..." value={formData.vk?.targetUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), targetUrl: e.target.value } }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Garantia</Label>
                          <Select value={formData.vk?.guarantee || 'none'} onValueChange={(v: 'none' | 'basic' | 'premium') => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), guarantee: v } }))}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem garantia</SelectItem>
                              <SelectItem value="basic">Garantia básica</SelectItem>
                              <SelectItem value="premium">Garantia premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="vk-login" checked={!!formData.vk?.extras?.requireLogin} onChange={(e) => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), extras: { ...(prev.vk?.extras || {}), requireLogin: e.target.checked } } }))} />
                          <Label htmlFor="vk-login">Exigir login</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="vk-repeat" checked={!!formData.vk?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, vk: { ...(prev.vk || defaultVK), extras: { ...(prev.vk?.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="vk-repeat">Evitar repetição</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Criação de E-mail: formulário específico */}
                {((formData.subcategory || '').toLowerCase().includes('criar e-mail') || (formData.subcategory || '').toLowerCase().includes('criar email')) && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <span>Criação de E-mail</span>
                      </CardTitle>
                      <CardDescription>Configure os requisitos para criação de contas de e-mail.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Disclaimer Legal */}
                      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                          <div className="space-y-2 text-sm">
                            <p className="font-semibold text-warning">⚠️ ATENÇÃO IMPORTANTE</p>
                            <p className="text-foreground">Ao criar tarefas de criação de e-mail, você declara que:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>Tem autorização legal para solicitar criação de contas</li>
                              <li>Usará as contas de forma legítima conforme termos dos provedores</li>
                              <li>É responsável por qualquer uso inadequado das credenciais</li>
                              <li>Está ciente das leis de proteção de dados aplicáveis</li>
                            </ul>
                            <p className="text-xs text-warning font-medium mt-2">
                              ⚠️ Tentativas de fraude (rejeitar provas válidas para não pagar) serão detectadas 
                              pelo sistema administrativo e podem resultar em suspensão da conta.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email-provider">Provedor de E-mail *</Label>
                          <Select 
                            value={formData.emailCreation.provider} 
                            onValueChange={(v: 'gmail' | 'outlook' | 'yahoo' | 'protonmail' | 'other') => 
                              setFormData(prev => ({ ...prev, emailCreation: { ...prev.emailCreation, provider: v } }))
                            }
                          >
                            <SelectTrigger id="email-provider">
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gmail">Gmail (Google)</SelectItem>
                              <SelectItem value="outlook">Outlook (Microsoft)</SelectItem>
                              <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                              <SelectItem value="protonmail">ProtonMail</SelectItem>
                              <SelectItem value="other">Outro provedor</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Escolha o provedor de e-mail onde as contas serão criadas
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="email-quantity">Quantidade de E-mails</Label>
                          <Input
                            id="email-quantity"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.emailCreation.quantity}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              emailCreation: { ...prev.emailCreation, quantity: parseInt(e.target.value) || 1 } 
                            }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Quantas contas de e-mail devem ser criadas (máx: 10)
                          </p>
                        </div>
                      </div>

                      {formData.emailCreation.provider === 'other' && (
                        <div>
                          <Label htmlFor="email-custom-provider">Nome do Provedor Customizado *</Label>
                          <Input
                            id="email-custom-provider"
                            placeholder="Ex: Zoho Mail, FastMail, etc."
                            value={formData.emailCreation.customProvider}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              emailCreation: { ...prev.emailCreation, customProvider: e.target.value } 
                            }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Especifique o nome do provedor de e-mail
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="email-requirements">Requisitos Específicos (opcional)</Label>
                        <Textarea
                          id="email-requirements"
                          placeholder="Ex: E-mail deve seguir o formato nome.sobrenome@gmail.com&#10;Senha deve ter pelo menos 12 caracteres&#10;Use apenas letras minúsculas no endereço"
                          value={formData.emailCreation.requirements}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            emailCreation: { ...prev.emailCreation, requirements: e.target.value } 
                          }))}
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Especifique requisitos para formato do e-mail, senha, etc.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="email-bounty">Valor por E-mail Criado (Kz) *</Label>
                        <Input
                          id="email-bounty"
                          type="number"
                          step="10"
                          min="100"
                          max="500"
                          value={formData.bounty}
                          onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          ⚠️ Valor mínimo: 100 Kz (devido à complexidade da tarefa)
                        </p>
                        <p className="text-xs text-primary mt-1">
                          💰 Custo total estimado: {((parseFloat(formData.bounty) || 100) * formData.emailCreation.quantity).toFixed(2)} Kz
                        </p>
                      </div>

                      <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-2">🔒 Como funciona:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Freelancers criam as contas conforme seus requisitos</li>
                              <li>Enviam credenciais (e-mail + senha) + provedor</li>
                              <li>Você testa as credenciais antes de aprovar</li>
                              <li>Sistema administrativo monitora rejeições para prevenir fraudes</li>
                              <li>Pagamento é liberado automaticamente após sua aprovação</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}



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
                        <Label htmlFor="maxApplicants">{t("max_applicants")}</Label>
                        <Input
                          id="maxApplicants"
                          type="number"
                          placeholder={t("max_applicants_placeholder")}
                          value={formData.maxApplicants}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxApplicants: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                         min={minBounty}
                         max={maxBounty}
                         placeholder={t("bounty_value_placeholder")}
                         value={formData.bounty}
                         onChange={(e) => setFormData(prev => ({ ...prev, bounty: e.target.value }))}
                         required
                       />
                       <p className="text-xs text-muted-foreground mt-2">
                         {limitsLoading ? (
                           'Carregando limites...'
                         ) : (
                           <>Valor mínimo: <strong>{minBounty} Kz</strong>. Máximo: <strong>{maxBounty.toLocaleString('pt-AO')} Kz</strong></>
                         )}
                       </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recorrência */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Tarefa Recorrente</span>
                    </CardTitle>
                    <CardDescription>Configure republicação automática</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recurrenceEnabled">Ativar Recorrência</Label>
                      <input
                        id="recurrenceEnabled"
                        type="checkbox"
                        checked={formData.recurrenceEnabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurrenceEnabled: e.target.checked,
                          isRecurring: e.target.checked
                        }))}
                        className="h-4 w-4"
                      />
                    </div>

                    {formData.recurrenceEnabled && (
                      <>
                        <div>
                          <Label htmlFor="recurrenceFrequency">Frequência</Label>
                          <Select
                            value={formData.recurrenceFrequency}
                            onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                              setFormData(prev => ({ ...prev, recurrenceFrequency: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Diário</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="recurrenceInterval">Intervalo</Label>
                          <Input
                            id="recurrenceInterval"
                            type="number"
                            min="1"
                            value={formData.recurrenceInterval}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrenceInterval: parseInt(e.target.value) || 1
                            }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            A cada {formData.recurrenceInterval}{' '}
                            {formData.recurrenceFrequency === 'daily' ? 'dia(s)' :
                             formData.recurrenceFrequency === 'weekly' ? 'semana(s)' : 'mês(es)'}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="recurrenceEndDate">Data Final (Opcional)</Label>
                          <Input
                            id="recurrenceEndDate"
                            type="date"
                            value={formData.recurrenceEndDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrenceEndDate: e.target.value
                            }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="recurrenceMaxRepublications">
                            Máx. Republicações (Opcional)
                          </Label>
                          <Input
                            id="recurrenceMaxRepublications"
                            type="number"
                            min="1"
                            placeholder="Ilimitado"
                            value={formData.recurrenceMaxRepublications}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              recurrenceMaxRepublications: e.target.value
                            }))}
                          />
                        </div>
                      </>
                    )}
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
                      <span className="text-muted-foreground">{t("value")}:</span>
                      <span className="font-medium">
            {formData.bounty ? `${parseFloat(formData.bounty).toFixed(2)} Kz` : "-"}
                      </span>
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

          {/* High Value Warning Dialog */}
          <Dialog open={showHighValueWarning} onOpenChange={setShowHighValueWarning}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Valor Alto Detectado
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <p>Você está criando uma tarefa com valor de <strong>{parseFloat(formData.bounty || '0').toLocaleString('pt-AO')} Kz</strong> por candidato.</p>
                  <p>Custo total: <strong>{(parseFloat(formData.bounty || '0') * (parseInt(formData.maxApplicants) || 1)).toLocaleString('pt-AO')} Kz</strong> ({parseFloat(formData.bounty || '0')} Kz × {parseInt(formData.maxApplicants) || 1} candidatos)</p>
                  <p className="text-sm text-muted-foreground mt-4">Tem certeza que deseja continuar com este valor?</p>
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowHighValueWarning(false);
                    setConfirmedHighValue(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    setConfirmedHighValue(true);
                    setShowHighValueWarning(false);
                    setTimeout(() => handleSubmit(new Event('submit') as any), 100);
                  }}
                >
                  Confirmar e Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Templates Dialog */}
          <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Escolher Template de Tarefa</DialogTitle>
                <DialogDescription>
                  Selecione um template pré-configurado para criar sua tarefa rapidamente
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto flex-1 mt-4">
                <div className="space-y-4 pr-2">
                  {templates.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-2">
                        Nenhum template ativo disponível
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Os templates devem estar marcados como "Ativo" no painel administrativo para aparecer aqui.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Favorited Templates Section */}
                      {favoriteTemplates.length > 0 && templates.some(t => favoriteTemplates.includes(t.id || '')) && (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <h3 className="text-sm font-semibold">Templates Favoritos</h3>
                          </div>
                          {templates
                            .filter(template => favoriteTemplates.includes(template.id || ''))
                            .map((template) => (
                      <Card
                        key={template.id}
                        className="hover:border-primary transition-all hover:shadow-md"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => handleApplyTemplate(template)}>
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <Badge variant="outline">{template.platform}</Badge>
                              </div>
                              <CardDescription className="text-sm">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(template.id || '');
                              }}
                              className="h-8 w-8 flex-shrink-0"
                            >
                              <Star 
                                className={`h-5 w-5 transition-colors ${
                                  favoriteTemplates.includes(template.id || '')
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground hover:text-yellow-500'
                                }`} 
                              />
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Quick Stats */}
                          <div className="flex flex-wrap gap-3 pb-3 border-b">
                            <div className="flex items-center gap-1.5 text-sm">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="font-medium">{template.defaultBounty} Kz</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{template.defaultTimeEstimate} min</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.taskType}
                            </Badge>
                          </div>

                          {/* Default Instructions Preview */}
                          {template.defaultInstructions && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Instruções Padrão
                              </h4>
                              <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground border">
                                <p className="line-clamp-3">{template.defaultInstructions}</p>
                              </div>
                            </div>
                          )}

                          {/* Proof Requirements Preview */}
                          {template.proofRequirements && template.proofRequirements.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                Requisitos de Prova
                              </h4>
                              <div className="space-y-1.5">
                                {template.proofRequirements.slice(0, 3).map((req, idx) => {
                                  const reqLabel = typeof req === 'string' ? req : req.label;
                                  return (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                      <span className="text-muted-foreground">{reqLabel}</span>
                                    </div>
                                  );
                                })}
                                {template.proofRequirements.length > 3 && (
                                  <p className="text-xs text-muted-foreground italic pl-3.5">
                                    +{template.proofRequirements.length - 3} mais requisitos...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Apply Button */}
                          <Button 
                            className="w-full mt-2" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyTemplate(template);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Usar Este Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                        </>
                      )}

                      {/* Other Templates Section */}
                      {templates.filter(t => !favoriteTemplates.includes(t.id || '')).length > 0 && (
                        <>
                          {favoriteTemplates.length > 0 && templates.some(t => favoriteTemplates.includes(t.id || '')) && (
                            <div className="flex items-center gap-2 mt-6 mb-3">
                              <h3 className="text-sm font-semibold text-muted-foreground">Outros Templates</h3>
                            </div>
                          )}
                          {templates
                            .filter(template => !favoriteTemplates.includes(template.id || ''))
                            .map((template) => (
                      <Card
                        key={template.id}
                        className="hover:border-primary transition-all hover:shadow-md"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 cursor-pointer" onClick={() => handleApplyTemplate(template)}>
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <Badge variant="outline">{template.platform}</Badge>
                              </div>
                              <CardDescription className="text-sm">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(template.id || '');
                              }}
                              className="h-8 w-8 flex-shrink-0"
                            >
                              <Star 
                                className={`h-5 w-5 transition-colors ${
                                  favoriteTemplates.includes(template.id || '')
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground hover:text-yellow-500'
                                }`} 
                              />
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Quick Stats */}
                          <div className="flex flex-wrap gap-3 pb-3 border-b">
                            <div className="flex items-center gap-1.5 text-sm">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="font-medium">{template.defaultBounty} Kz</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{template.defaultTimeEstimate} min</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.taskType}
                            </Badge>
                          </div>

                          {/* Default Instructions Preview */}
                          {template.defaultInstructions && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Instruções Padrão
                              </h4>
                              <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground border">
                                <p className="line-clamp-3">{template.defaultInstructions}</p>
                              </div>
                            </div>
                          )}

                          {/* Proof Requirements Preview */}
                          {template.proofRequirements && template.proofRequirements.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                Requisitos de Prova
                              </h4>
                              <div className="space-y-1.5">
                                {template.proofRequirements.slice(0, 3).map((req, idx) => {
                                  const reqLabel = typeof req === 'string' ? req : req.label;
                                  return (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                      <span className="text-muted-foreground">{reqLabel}</span>
                                    </div>
                                  );
                                })}
                                {template.proofRequirements.length > 3 && (
                                  <p className="text-xs text-muted-foreground italic pl-3.5">
                                    +{template.proofRequirements.length - 3} mais requisitos...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Apply Button */}
                          <Button 
                            className="w-full mt-2" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyTemplate(template);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Usar Este Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Preview Sidebar - Desktop only, sticky */}
          <div className="hidden lg:block lg:col-span-1">
            <JobPreview
              title={formData.title}
              description={formData.description}
              bounty={formData.bounty}
              platform={formData.platform}
              difficulty={formData.difficulty}
              timeEstimate={formData.timeEstimate}
              location={formData.location}
              category={formData.category}
              subcategory={formData.subcategory}
            />
          </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;