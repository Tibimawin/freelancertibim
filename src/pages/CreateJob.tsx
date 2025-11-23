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
      actionType: 'watch' as 'watch' | 'subscribe' | 'like',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: true },
    },
    tiktok: {
      actionType: 'watch' as 'watch' | 'follow',
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
    website: {
      actionType: 'visit' as 'visit' | 'visit_scroll',
      pageTitle: '',
      pageUrl: '',
      viewTimeSeconds: 10,
      dailyMaxVisits: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { avoidRepeat: true, openInIframe: true, blockCopy: true, blockRefresh: true, blockMultipleTabs: true },
    },
    instagram: {
      actionType: 'watch' as 'watch' | 'follow' | 'like' | 'comment',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
    },
    facebook: {
      actionType: 'watch' as 'watch' | 'follow' | 'like' | 'comment',
      videoTitle: '',
      videoUrl: '',
      viewTimeSeconds: 30,
      dailyMaxViews: 500,
      guarantee: 'none' as 'none' | 'basic' | 'premium',
      extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
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
    actionType: 'watch' as 'watch' | 'follow' | 'like' | 'comment',
    videoTitle: '',
    videoUrl: '',
    viewTimeSeconds: 30,
    dailyMaxViews: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
  };
  const defaultFacebook = {
    actionType: 'watch' as 'watch' | 'follow' | 'like' | 'comment',
    videoTitle: '',
    videoUrl: '',
    viewTimeSeconds: 30,
    dailyMaxViews: 500,
    guarantee: 'none' as 'none' | 'basic' | 'premium',
    extras: { requireLogin: false, avoidRepeat: true, openInIframe: false },
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
    const sub = (formData.subcategory || '').toLowerCase();
    const isYouTube = sub.includes('youtube');
    const isInstagram = sub.includes('instagram');
    const isFacebook = sub.includes('facebook');
    const isTikTok = sub.includes('tiktok');
    const isVK = sub.includes('vk');
    const isWebsite = (formData.category || '').toLowerCase() === 'web' && sub === 'Website'.toLowerCase();
    const isVideoAd = (isYouTube && (formData.youtube?.actionType || 'watch') === 'watch') || (isInstagram && (formData.instagram?.actionType || 'watch') === 'watch') || (isFacebook && (formData.facebook?.actionType || 'watch') === 'watch') || sub.includes('ver vídeo');
    if (!formData.title || !formData.description || !formData.bounty ||
        (isYouTube && !formData.youtube?.videoUrl) ||
        (isInstagram && !formData.instagram?.videoUrl) ||
        (isFacebook && !formData.facebook?.videoUrl) ||
        (isTikTok && !formData.tiktok.videoUrl) ||
        (isVK && !formData.vk.targetUrl) ||
        (isWebsite && !formData.website?.pageUrl)) {
      toast({
        title: t("error"),
        description: isVideoAd ? 'Preencha os campos obrigatórios do vídeo.' : isTikTok ? 'Preencha os campos obrigatórios do TikTok.' : isVK ? 'Preencha os campos obrigatórios do VK.' : (isInstagram ? 'Preencha os campos obrigatórios do Instagram.' : (isFacebook ? 'Preencha os campos obrigatórios do Facebook.' : (isWebsite ? 'Preencha os campos obrigatórios do Website.' : t("fill_all_required_fields")))),
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

      if (isYouTube && formData.youtube) jobData.youtube = formData.youtube;
      if (isInstagram && formData.instagram) jobData.instagram = formData.instagram;
      if (isFacebook && formData.facebook) jobData.facebook = formData.facebook;
      if (isTikTok && formData.tiktok) jobData.tiktok = formData.tiktok;
      if (isVK && formData.vk) jobData.vk = formData.vk;
      if (isWebsite && formData.website) jobData.website = formData.website;

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
                          <input type="checkbox" id="ws-repeat" checked={!!formData.website?.extras?.avoidRepeat} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { ...(prev.website?.extras || {}), avoidRepeat: e.target.checked } } }))} />
                          <Label htmlFor="ws-repeat">Evitar repetição</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-iframe" checked={!!formData.website?.extras?.openInIframe} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { ...(prev.website?.extras || {}), openInIframe: e.target.checked } } }))} />
                          <Label htmlFor="ws-iframe">Abrir em iframe</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-copy" checked={!!formData.website?.extras?.blockCopy} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { ...(prev.website?.extras || {}), blockCopy: e.target.checked } } }))} />
                          <Label htmlFor="ws-copy">Bloquear copiar/colar</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-refresh" checked={!!formData.website?.extras?.blockRefresh} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { ...(prev.website?.extras || {}), blockRefresh: e.target.checked } } }))} />
                          <Label htmlFor="ws-refresh">Bloquear refresh</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="ws-tabs" checked={!!formData.website?.extras?.blockMultipleTabs} onChange={(e) => setFormData(prev => ({ ...prev, website: { ...(prev.website || defaultWebsite), extras: { ...(prev.website?.extras || {}), blockMultipleTabs: e.target.checked } } }))} />
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
                        <Button type="button" variant={(formData.instagram?.actionType || 'watch') === 'watch' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'watch' } }))}>Assistir vídeo</Button>
                        <Button type="button" variant={(formData.instagram?.actionType || 'watch') === 'follow' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'follow' } }))}>Seguir perfil</Button>
                        <Button type="button" variant={(formData.instagram?.actionType || 'watch') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'like' } }))}>Curtir publicação</Button>
                        <Button type="button" variant={(formData.instagram?.actionType || 'watch') === 'comment' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, instagram: { ...(prev.instagram || defaultInstagram), actionType: 'comment' } }))}>Comentar publicação</Button>
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
                        <Button type="button" variant={(formData.facebook?.actionType || 'watch') === 'watch' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'watch' } }))}>Assistir vídeo</Button>
                        <Button type="button" variant={(formData.facebook?.actionType || 'watch') === 'follow' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'follow' } }))}>Seguir página</Button>
                        <Button type="button" variant={(formData.facebook?.actionType || 'watch') === 'like' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'like' } }))}>Curtir publicação</Button>
                        <Button type="button" variant={(formData.facebook?.actionType || 'watch') === 'comment' ? 'default' : 'outline'} onClick={() => setFormData(prev => ({ ...prev, facebook: { ...(prev.facebook || defaultFacebook), actionType: 'comment' } }))}>Comentar publicação</Button>
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;