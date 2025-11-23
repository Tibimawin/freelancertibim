import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, User, Calendar, Upload, ArrowLeft, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Job, Application, Transaction } from "@/types/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { JobService, TransactionService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { ApplicationService } from "@/services/applicationService";
import { useTranslation } from 'react-i18next';
import JobComments from '@/components/JobComments';
import { CloudinaryService } from '@/lib/cloudinary';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useAdmin } from '@/contexts/AdminContext';
import { generateAutomaticInstructions } from '@/utils/taskInstructionsGenerator';
import { cleanFirebaseData } from '@/lib/firebaseUtils';

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateJob = (location.state as { job?: Partial<Job> } | null)?.job || null;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [proofs, setProofs] = useState<{ [key: string]: { text: string; file: File | null; comment: string } }>({});
  const [actualApplicantCount, setActualApplicantCount] = useState(0);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  // Mover uploadProgress para o topo para manter ordem consistente dos hooks
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });
  const [passwordValidation, setPasswordValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showSubmittedBanner, setShowSubmittedBanner] = useState(false);
  // Estados para avaliação da tarefa
  const [jobRating, setJobRating] = useState(0);
  const [jobComment, setJobComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ytEmbedOpen, setYtEmbedOpen] = useState(false);
  const [ytWatchElapsed, setYtWatchElapsed] = useState(0);
  const [ytSubscribedConfirmed, setYtSubscribedConfirmed] = useState(false);
  const [ytIsPlaying, setYtIsPlaying] = useState(false);
  const [ytChannelDialogOpen, setYtChannelDialogOpen] = useState(false);
  const [ytSubscribeDwell, setYtSubscribeDwell] = useState(0);
  const [tkFollowConfirmed, setTkFollowConfirmed] = useState(false);
  const [vkJoinConfirmed, setVkJoinConfirmed] = useState(false);
  const [igWatchElapsed, setIgWatchElapsed] = useState(0);
  const [igIsWatching, setIgIsWatching] = useState(false);
  const [igEmbedOpen, setIgEmbedOpen] = useState(false);
  const [igIframeError, setIgIframeError] = useState(false);
  const igPlayerRef = useRef<HTMLIFrameElement | null>(null);
  const igWindowRef = useRef<Window | null>(null);
  const igWindowCheckInterval = useRef<any>(null);
  const [fbWatchElapsed, setFbWatchElapsed] = useState(0);
  const [fbIsWatching, setFbIsWatching] = useState(false);
  const [fbFollowConfirmed, setFbFollowConfirmed] = useState(false);
  const [fbPageDialogOpen, setFbPageDialogOpen] = useState(false);
  const [igDialogOpen, setIgDialogOpen] = useState(false);
  const [webIsWatching, setWebIsWatching] = useState(false);
  const [webWatchElapsed, setWebWatchElapsed] = useState(0);
  const [webScrolledToEnd, setWebScrolledToEnd] = useState(false);
  const [webEmbedOpen, setWebEmbedOpen] = useState(false);
  const subscribeRequiredSeconds = 10;
  const ytPlayerRef = useRef<any>(null);
  const dwellTimerRef = useRef<any>(null);
  const platformLoadedRef = useRef(false);
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);
  
  // Email creation task states
  const [showPassword, setShowPassword] = useState(false);
  const [emailCreationChecklist, setEmailCreationChecklist] = useState({
    created: false,
    loggedOut: false,
    verified: false,
    understood: false
  });
  
  // Twitter/X task states
  const [twitterActionConfirmed, setTwitterActionConfirmed] = useState(false);
  const [instagramActionConfirmed, setInstagramActionConfirmed] = useState(false);
  const applicantCount = useMemo(() => {
    return typeof job?.applicantCount === 'number' ? job.applicantCount : actualApplicantCount;
  }, [job?.applicantCount, actualApplicantCount]);

  const overallProgress = useMemo(() => {
    const reqs = job?.proofRequirements || [];
    if (!reqs.length) return 0;
    let sum = 0;
    for (const req of reqs) {
      if (req.type === 'screenshot' || req.type === 'file') {
        const p = uploadProgress[req.id];
        const hasFile = !!(proofs[req.id]?.file);
        sum += p !== undefined ? p : (hasFile ? 0 : 100);
      } else {
        const hasText = !!(proofs[req.id]?.text);
        sum += hasText ? 100 : 0;
      }
    }
    return Math.min(100, Math.round(sum / reqs.length));
  }, [job, uploadProgress, proofs]);

  const isYouTubeJob = Boolean(job?.youtube) || ((job?.subcategory || '').toLowerCase().includes('youtube') || (job?.subcategory || '').toLowerCase().includes('ver vídeo'));
  const isInstagramJob = Boolean(job?.instagram) || ((job?.subcategory || '').toLowerCase().includes('instagram'));
  const isFacebookJob = Boolean(job?.facebook) || ((job?.subcategory || '').toLowerCase().includes('facebook'));
  const isTikTokJob = Boolean(job?.tiktok) || ((job?.subcategory || '').toLowerCase().includes('tiktok'));
  const isVKJob = Boolean(job?.vk) || ((job?.subcategory || '').toLowerCase().includes('vk'));
  const isWebsiteJob = Boolean(job?.website) || (((job?.category || '').toLowerCase() === 'web') && ((job?.subcategory || '').toLowerCase().includes('website')));
  const isEmailCreationJob = Boolean(job?.emailCreation);
  const isTwitterJob = Boolean(job?.twitter) || ((job?.subcategory || '').toLowerCase().includes('twitter') || (job?.subcategory || '').toLowerCase().includes('x.com'));
  const ytRequiredSeconds = job?.youtube?.viewTimeSeconds || 30;
  const ytCanSubmit = isYouTubeJob && (job?.youtube?.actionType === 'watch' ? ytWatchElapsed >= ytRequiredSeconds : (ytSubscribedConfirmed && ytSubscribeDwell >= subscribeRequiredSeconds));
  const tkRequiredSeconds = job?.tiktok?.viewTimeSeconds || 30;
  const tkCanSubmit = isTikTokJob && ((job?.tiktok?.actionType) === 'watch' ? ytWatchElapsed >= tkRequiredSeconds : tkFollowConfirmed);
  
  const igRequiredSeconds = useMemo(() => {
    if (!isInstagramJob || job?.instagram?.actionType !== 'watch') return 0;
    const est = job?.timeEstimate?.toLowerCase() || '';
    if (est.includes('30 segundos')) return 30;
    if (est.includes('1 minuto')) return 60;
    if (est.includes('2 minutos')) return 120;
    if (est.includes('5 minutos')) return 300;
    return 60;
  }, [isInstagramJob, job?.instagram?.actionType, job?.timeEstimate]);
  
  const igCanSubmit = isInstagramJob && (job?.instagram?.actionType === 'watch' ? igWatchElapsed >= igRequiredSeconds : instagramActionConfirmed);
  
  const fbRequiredSeconds = useMemo(() => {
    if (!isFacebookJob || job?.facebook?.actionType !== 'watch') return 0;
    const est = job?.timeEstimate?.toLowerCase() || '';
    if (est.includes('30 segundos')) return 30;
    if (est.includes('1 minuto')) return 60;
    if (est.includes('2 minutos')) return 120;
    if (est.includes('5 minutos')) return 300;
    return 60;
  }, [isFacebookJob, job?.facebook?.actionType, job?.timeEstimate]);
  const fbCanSubmit = isFacebookJob && (job?.facebook?.actionType === 'watch' ? fbWatchElapsed >= fbRequiredSeconds : (job?.facebook?.actionType === 'follow' ? fbFollowConfirmed : false));
  const webRequiredSeconds = job?.website?.viewTimeSeconds || 10;
  const webCanSubmit = isWebsiteJob && ((job?.website?.actionType === 'visit' && webWatchElapsed >= webRequiredSeconds) || (job?.website?.actionType === 'visit_scroll' && webWatchElapsed >= webRequiredSeconds && webScrolledToEnd));
  const extractYouTubeId = (url: string) => {
    try {
      const u = new URL(url);
      const host = u.hostname;
      if (host.includes('youtu.be')) {
        const id = u.pathname.split('/')[1];
        return id || '';
      }
      if (host.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
        const m = u.pathname.match(/\/shorts\/([^/]+)/);
        if (m) return m[1];
      }
      return '';
    } catch {
      return '';
    }
  };
  
  // Converte URLs do Instagram/Facebook para formato embed
  const convertToEmbedUrl = (url: string, platform: 'instagram' | 'facebook'): string => {
    try {
      if (platform === 'instagram') {
        // Instagram: converter para formato /embed/
        // https://www.instagram.com/p/ABC123/ -> https://www.instagram.com/p/ABC123/embed/
        // https://www.instagram.com/reel/ABC123/ -> https://www.instagram.com/reel/ABC123/embed/
        const instagramMatch = url.match(/instagram\.com\/(p|reel|reels)\/([^/?]+)/);
        if (instagramMatch) {
          const [, type, code] = instagramMatch;
          return `https://www.instagram.com/${type}/${code}/embed/`;
        }
      } else if (platform === 'facebook') {
        // Facebook: usar player embed oficial
        // https://www.facebook.com/share/v/ABC/ -> embed plugin
        const encodedUrl = encodeURIComponent(url);
        return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=500`;
      }
      return url; // Retorna URL original se não conseguir converter
    } catch {
      return url;
    }
  };
  
  const ytVideoId = job?.youtube?.videoUrl ? extractYouTubeId(job.youtube.videoUrl) : '';
  const extractChannelHandleOrId = (url: string) => {
    try {
      const u = new URL(url);
      const p = u.pathname;
      const m1 = p.match(/\/@([^/]+)/);
      if (m1) return { handle: m1[1] };
      const m2 = p.match(/\/channel\/([^/]+)/);
      if (m2) return { channelId: m2[1] };
      return {} as any;
    } catch { return {} as any; }
  };
  const channelData = job?.youtube?.videoUrl ? extractChannelHandleOrId(job.youtube.videoUrl) : {} as any;

  // Auto-popular provedor para tarefas de email
  useEffect(() => {
    if (job && isEmailCreationJob) {
      const providerValue = job.emailCreation?.customProvider || job.emailCreation?.provider;
      if (providerValue && !proofs['provider']?.text) {
        setProofs(prev => ({
          ...prev,
          provider: { text: providerValue, file: null as any, comment: '' }
        }));
      }
    }
  }, [job, isEmailCreationJob]);

  useEffect(() => {
    let timer: any;
    if (isYouTubeJob && job?.youtube?.actionType === 'watch' && ytIsPlaying) {
      timer = setInterval(() => {
        setYtWatchElapsed((prev) => Math.min(prev + 1, ytRequiredSeconds));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isYouTubeJob, job?.youtube?.actionType, ytIsPlaying, ytRequiredSeconds]);

  useEffect(() => {
    let timer: any;
    if (isInstagramJob && job?.instagram?.actionType === 'watch' && igIsWatching && document.visibilityState === 'visible') {
      timer = setInterval(() => {
        setIgWatchElapsed((prev) => Math.min(prev + 1, igRequiredSeconds));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isInstagramJob, job?.instagram?.actionType, igIsWatching, igRequiredSeconds]);

  useEffect(() => {
    let timer: any;
    if (isFacebookJob && job?.facebook?.actionType === 'watch' && fbIsWatching && document.visibilityState === 'visible') {
      timer = setInterval(() => {
        setFbWatchElapsed((prev) => Math.min(prev + 1, fbRequiredSeconds));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isFacebookJob, job?.facebook?.actionType, fbIsWatching, fbRequiredSeconds]);

  useEffect(() => {
    let timer: any;
    if (isWebsiteJob && webIsWatching && document.visibilityState === 'visible') {
      timer = setInterval(() => {
        setWebWatchElapsed((prev) => Math.min(prev + 1, webRequiredSeconds));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isWebsiteJob, webIsWatching, webRequiredSeconds]);

  // Instagram watch counter - only counts when iframe is focused/playing or window is open
  useEffect(() => {
    let timer: any;
    if (isInstagramJob && job?.instagram?.actionType === 'watch' && igIsWatching && document.visibilityState === 'visible') {
      timer = setInterval(() => {
        setIgWatchElapsed((prev) => Math.min(prev + 1, igRequiredSeconds));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isInstagramJob, job?.instagram?.actionType, igIsWatching, igRequiredSeconds]);
  
  // Monitor new window for Instagram (quando iframe falha)
  useEffect(() => {
    if (igWindowRef.current && !igWindowRef.current.closed) {
      // Verifica a cada segundo se a janela ainda está aberta e em foco
      igWindowCheckInterval.current = setInterval(() => {
        if (igWindowRef.current && !igWindowRef.current.closed) {
          setIgIsWatching(true);
        } else {
          setIgIsWatching(false);
          if (igWindowCheckInterval.current) {
            clearInterval(igWindowCheckInterval.current);
          }
          igWindowRef.current = null;
        }
      }, 1000);
    }
    
    return () => {
      if (igWindowCheckInterval.current) {
        clearInterval(igWindowCheckInterval.current);
      }
    };
  }, [igWindowRef.current]);

  // Stop Instagram counter when tab is not visible
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        setIgIsWatching(false);
        setWebIsWatching(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (webEmbedOpen && job?.website?.extras?.blockRefresh) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [webEmbedOpen, job?.website?.extras?.blockRefresh]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!webEmbedOpen || !job?.website?.extras?.blockCopy) return;
      const isCopy = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'v');
      if (isCopy) {
        e.preventDefault();
      }
    };
    const onCopy = (e: ClipboardEvent) => {
      if (webEmbedOpen && job?.website?.extras?.blockCopy) e.preventDefault();
    };
    const onPaste = (e: ClipboardEvent) => {
      if (webEmbedOpen && job?.website?.extras?.blockCopy) e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('copy', onCopy);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('paste', onPaste);
    };
  }, [webEmbedOpen, job?.website?.extras?.blockCopy]);

  useEffect(() => {
    if (job?.youtube?.actionType !== 'subscribe') return;
    if (ytChannelDialogOpen) {
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
      setYtSubscribeDwell(0);
      dwellTimerRef.current = setInterval(() => {
        setYtSubscribeDwell((prev) => Math.min(prev + 1, subscribeRequiredSeconds));
      }, 1000);
      if (!platformLoadedRef.current) {
        const s = document.createElement('script');
        s.src = 'https://apis.google.com/js/platform.js';
        s.async = true;
        s.onload = () => { platformLoadedRef.current = true; };
        document.body.appendChild(s);
      }
    } else {
      if (dwellTimerRef.current) { clearInterval(dwellTimerRef.current); dwellTimerRef.current = null; }
    }
    return () => { if (dwellTimerRef.current) { clearInterval(dwellTimerRef.current); dwellTimerRef.current = null; } };
  }, [ytChannelDialogOpen, job?.youtube?.actionType]);

  useEffect(() => {
    const fetchLatestTransaction = async () => {
      if (!currentUser || !isYouTubeJob) return;
      if (!(showSubmittedBanner || myApplication?.status === 'approved')) return;
      try {
        const txs = await TransactionService.getUserTransactions(currentUser.uid, 10);
        const byApp = txs.find((tx) => tx.type === 'payout' && tx.metadata?.applicationId === myApplication?.id);
        const byJob = txs.find((tx) => tx.type === 'payout' && tx.metadata?.jobId === job?.id);
        const anyPayout = txs.find((tx) => tx.type === 'payout');
        setLatestTransaction(byApp || byJob || anyPayout || txs[0] || null);
      } catch {}
    };
    fetchLatestTransaction();
  }, [currentUser, isYouTubeJob, showSubmittedBanner, myApplication?.status, myApplication?.id, job?.id]);

  useEffect(() => {
    if (!isYouTubeJob || !ytEmbedOpen || job?.youtube?.actionType !== 'watch' || !ytVideoId) return;
    const loadApi = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
        (window as any).onYouTubeIframeAPIReady = () => initPlayer();
      }
    };
    const initPlayer = () => {
      try {
        ytPlayerRef.current = new (window as any).YT.Player('yt-player', {
          videoId: ytVideoId,
          playerVars: { autoplay: 1, controls: 1, rel: 0 },
          events: {
            onStateChange: (e: any) => {
              const code = e?.data;
              setYtIsPlaying(code === 1);
              if (code === 0) {
                setYtWatchElapsed(ytRequiredSeconds);
              }
            },
          },
        });
      } catch {}
    };
    loadApi();
    return () => {
      try {
        if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
          ytPlayerRef.current.destroy();
          ytPlayerRef.current = null;
        }
      } catch {}
    };
  }, [isYouTubeJob, ytEmbedOpen, job?.youtube?.actionType, ytVideoId, ytRequiredSeconds]);

  const toISODate = (v: any) => {
    try {
      const d = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
      if (!d || isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const primeFromStateOrCache = () => {
      if (stateJob) {
        const normalizedJob = {
          detailedInstructions: [],
          proofRequirements: [],
          rating: 0,
          ratingCount: 0,
          applicantCount: 0,
          status: 'active',
          ...stateJob,
        } as Job;
        setJob(normalizedJob);
        setEditTitle(normalizedJob.title || '');
        setEditDescription(normalizedJob.description || '');
        setEditLocation(normalizedJob.location || '');
        setEditDueDate(normalizedJob.dueDate ? toISODate(normalizedJob.dueDate) : '');
      } else if (id) {
        try {
          const raw = sessionStorage.getItem(`job_preview_${id}`);
          if (raw) {
            const cached = JSON.parse(raw);
            const normalizedJob = {
              detailedInstructions: [],
              proofRequirements: [],
              rating: 0,
              ratingCount: 0,
              applicantCount: 0,
              status: 'active',
              ...cached,
            } as Job;
            setJob(normalizedJob);
            setEditTitle(normalizedJob.title || '');
            setEditDescription(normalizedJob.description || '');
            setEditLocation(normalizedJob.location || '');
            setEditDueDate(normalizedJob.dueDate ? toISODate(normalizedJob.dueDate) : '');
          }
        } catch {}
      }
    };

    const fetchJob = async () => {
      if (!id) { setLoading(false); return; }
      try {
        const jobData = await JobService.getJobById(id);
        if (jobData) {
          const normalizedJob = {
            ...jobData,
            detailedInstructions: jobData.detailedInstructions || [],
            proofRequirements: jobData.proofRequirements || [],
          };
          setJob(normalizedJob);
          setEditTitle(normalizedJob.title || '');
          setEditDescription(normalizedJob.description || '');
          setEditLocation(normalizedJob.location || '');
          setEditDueDate(normalizedJob.dueDate ? toISODate(normalizedJob.dueDate) : '');

          const applications = await ApplicationService.getApplicationsForJob(id);
          setActualApplicantCount(applications.length);
          if (currentUser) {
            const mine = applications.find(app => app.testerId === currentUser.uid) || null;
            setMyApplication(mine);
          }

          const initialProofs: { [key: string]: { text: string; file: null; comment: string } } = {};
          normalizedJob.proofRequirements.forEach(req => {
            initialProofs[req.id] = { text: '', file: null, comment: '' };
          });
          setProofs(initialProofs);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      } finally {
        setLoading(false);
      }
    };

    primeFromStateOrCache();
    fetchJob();
  }, [id, stateJob, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">{t("loading_task")}</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("task_not_found")}</h2>
          <Button onClick={() => navigate('/')}>{t("back_to_home")}</Button>
        </div>
      </div>
    );
  }

  const getPlatformIcon = () => {
    switch (job.platform) {
      case "iOS":
      case "Android":
        return <Smartphone className="h-5 w-5" />;
      case "Web":
        return <Globe className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = () => {
    switch (job.difficulty) {
      case "Fácil":
        return "bg-success/10 text-success border-success/20";
      case "Médio":
        return "bg-warning/10 text-warning border-warning/20";
      case "Difícil":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const canApply = Boolean(
    currentUser &&
    job.posterId !== currentUser.uid &&
    job.status === 'active' &&
    (!job.maxApplicants || applicantCount < (job.maxApplicants || 0)) &&
    !myApplication
  );

  // Usuário pode enviar provas se estiver autenticado, tarefa ativa e já tiver aplicação
  const canSubmitProofs = Boolean(
    currentUser &&
    job.status === 'active' &&
    (canApply || !!myApplication) &&
    (!myApplication || (myApplication.status !== 'submitted' && myApplication.status !== 'approved'))
  );
  
  // Email creation specific validation
  const isEmailCreationComplete = !isEmailCreationJob || (
    emailCreationChecklist.created &&
    emailCreationChecklist.loggedOut &&
    emailCreationChecklist.verified &&
    emailCreationChecklist.understood
  );


  // Validação de email em tempo real
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailValidation({ isValid: false, message: 'E-mail é obrigatório' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailValidation({
      isValid,
      message: isValid ? 'E-mail válido ✓' : 'Formato de e-mail inválido'
    });
    return isValid;
  };

  // Validação de senha em tempo real
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordValidation({ isValid: false, message: 'Senha é obrigatória' });
      return false;
    }
    const isValid = password.length >= 6;
    setPasswordValidation({
      isValid,
      message: isValid ? 'Senha válida ✓' : 'Senha deve ter no mínimo 6 caracteres'
    });
    return isValid;
  };

  const handleProofChange = (requirementId: string, field: 'text' | 'comment', value: string) => {
    setProofs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        [field]: value,
        file: prev[requirementId]?.file || null
      }
    }));

    // Validar em tempo real para campos de email
    if (requirementId === 'email' && field === 'text' && typeof value === 'string') {
      validateEmail(value);
    }
    if (requirementId === 'password' && field === 'text' && typeof value === 'string') {
      validatePassword(value);
    }
  };

  const handleFileChange = (requirementId: string, file: File | null) => {
    setProofs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        file,
        text: prev[requirementId]?.text || '',
        comment: prev[requirementId]?.comment || ''
      }
    }));
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
  // Restringir "Arquivo" a somente imagens (PNG/JPG)
  const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg'];

  const validateFile = (reqId: string, reqType: string, file: File): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: t('error'),
        description: t('file_too_large') || `Arquivo ultrapassa ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive',
      });
      return false;
    }
    const allowed = reqType === 'screenshot' ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowed.includes(file.type)) {
      toast({
        title: t('invalid_file_type_title') || 'Formato de arquivo inválido',
        description: t('invalid_file_type_desc') || 'Permitidos: PNG e JPG (imagens).',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSubmitProofs = async () => {
    if (!currentUser || !userData) {
      toast({
        title: t("error"),
        description: t("unauthenticated_apply"),
        variant: "destructive",
      });
      return;
    }

    if (isYouTubeJob && job?.youtube?.actionType === 'watch') {
      const channelLink = userData?.settings?.socialAccounts?.youtube;
      if (!ytCanSubmit) {
        toast({
          title: t('error'),
          description: t('complete_to_submit'),
          variant: 'destructive',
        });
        return;
      }
      try {
        setIsApplying(true);
        let applicationId = myApplication?.id;
        if (!applicationId) {
          applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
        }
        if (applicationId) {
          const proofsToSubmit = [
            {
              requirementId: 'youtube_watch',
              type: 'text',
              content: `Watched ${ytRequiredSeconds}s`,
              comment: 'Auto-confirmed watch',
            },
          ];
          await ApplicationService.submitProofs(applicationId, proofsToSubmit as any);
          toast({
            title: t('payout_credited_success'),
            description: t('payout_credited_description'),
          });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
      return;
    } else if (isInstagramJob && job?.instagram?.actionType === 'watch') {
      if (!igCanSubmit) {
        toast({ title: t('error'), description: t('submit_disabled_until_watch'), variant: 'destructive' });
        return;
      }
      try {
        setIsApplying(true);
        let applicationId = myApplication?.id;
        if (!applicationId) {
          applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
        }
        if (applicationId) {
          const proofsToSubmit = [
            {
              requirementId: 'instagram_watch',
              type: 'text',
              content: `Watched ${igRequiredSeconds}s`,
              comment: 'Auto-confirmed watch',
            },
          ];
          await ApplicationService.submitProofs(applicationId, proofsToSubmit as any);
          toast({ title: t('payout_credited_success'), description: t('payout_credited_description') });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
      return;
    } else if (isFacebookJob && job?.facebook?.actionType === 'watch') {
      if (!fbCanSubmit) {
        toast({ title: t('error'), description: t('submit_disabled_until_watch'), variant: 'destructive' });
        return;
      }
      try {
        setIsApplying(true);
        let applicationId = myApplication?.id;
        if (!applicationId) {
          applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
        }
        if (applicationId) {
          const proofsToSubmit = [
            {
              requirementId: 'facebook_watch',
              type: 'text',
              content: `Watched ${fbRequiredSeconds}s`,
              comment: 'Auto-confirmed watch',
            },
          ];
          await ApplicationService.submitProofs(applicationId, proofsToSubmit as any);
          toast({ title: t('payout_credited_success'), description: t('payout_credited_description') });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
      return;
    } else if (isWebsiteJob) {
      if (!webCanSubmit) {
        toast({ title: t('error'), description: job?.website?.actionType === 'visit_scroll' ? t('submit_disabled_until_scroll') : t('submit_disabled_until_watch'), variant: 'destructive' });
        return;
      }
      try {
        setIsApplying(true);
        let applicationId = myApplication?.id;
        if (!applicationId) {
          applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
        }
        if (applicationId) {
          const proofsToSubmit = [
            {
              requirementId: job?.website?.actionType === 'visit_scroll' ? 'website_visit_scroll' : 'website_visit',
              type: 'text',
              content: job?.website?.actionType === 'visit_scroll' ? `Visited ${webRequiredSeconds}s + scrolled to end` : `Visited ${webRequiredSeconds}s`,
              comment: 'Auto-confirmed website task',
            },
          ];
          await ApplicationService.submitProofs(applicationId, proofsToSubmit as any);
          toast({ title: t('payout_credited_success'), description: t('payout_credited_description') });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
      return;
    } else if (isTikTokJob) {
      if (!tkCanSubmit || !userData?.settings?.socialAccounts?.tiktok) {
        toast({ title: t('error'), description: (job?.tiktok?.actionType) === 'follow' ? t('submit_disabled_until_follow') : t('submit_disabled_until_watch'), variant: 'destructive' });
        return;
      }
      try {
        setIsApplying(true);
        if (myApplication) {
          const proofsToSubmit = [
            {
              requirementId: (job?.tiktok?.actionType) === 'follow' ? 'tiktok_follow' : 'tiktok_watch',
              type: 'text',
              content: (job?.tiktok?.actionType) === 'follow' ? 'Follow confirmed' : `Watched ${tkRequiredSeconds}s`,
              comment: 'Auto-confirmed TikTok task',
            },
          ];
          await ApplicationService.submitProofs(myApplication.id, proofsToSubmit as any);
          await ApplicationService.reviewApplication(myApplication.id, 'approved', job.posterId);
          toast({ title: t('proofs_submitted_success'), description: t('task_auto_approved') });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
      return;
    } else if (isVKJob) {
      if (!vkJoinConfirmed || !userData?.settings?.socialAccounts?.vk) {
        toast({ title: t('error'), description: (job?.vk?.actionType) === 'join' ? t('submit_disabled_until_join') : t('submit_disabled_until_like'), variant: 'destructive' });
        return;
      }
      try {
        setIsApplying(true);
        if (myApplication) {
          const proofsToSubmit = [
            {
              requirementId: (job?.vk?.actionType) === 'join' ? 'vk_join' : 'vk_like',
              type: 'text',
              content: (job?.vk?.actionType) === 'join' ? 'Join confirmed' : 'Like confirmed',
              comment: 'Auto-confirmed VK task',
            },
          ];
          await ApplicationService.submitProofs(myApplication.id, proofsToSubmit as any);
          await ApplicationService.reviewApplication(myApplication.id, 'approved', job.posterId);
          toast({ title: t('proofs_submitted_success'), description: t('task_auto_approved') });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
      return;
    } else {
      // Email creation specific validation
      if (isEmailCreationJob) {
        if (!isEmailCreationComplete) {
          toast({
            title: t("error"),
            description: "Complete todos os itens do checklist antes de enviar as credenciais.",
            variant: "destructive",
          });
          return;
        }
        
        const emailProof = proofs['email'];
        const passwordProof = proofs['password'];
        const providerProof = proofs['provider'];
        
        // Aceitar provedor tanto do estado quanto do job (fallback)
        const providerValue = providerProof?.text || job.emailCreation?.customProvider || job.emailCreation?.provider;
        
        // Debug: verificar estado das provas
        console.log('Email Creation Proofs:', {
          email: emailProof?.text,
          password: passwordProof?.text ? '***' : undefined,
          provider: providerValue,
          jobProvider: job.emailCreation?.customProvider || job.emailCreation?.provider
        });
        
        if (!emailProof?.text || !passwordProof?.text || !providerValue) {
          toast({
            title: t("missing_required_proofs"),
            description: "Preencha e-mail, senha e provedor.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailProof.text)) {
          toast({
            title: t("error"),
            description: "Formato de e-mail inválido.",
            variant: "destructive",
          });
          return;
        }
        
        // Validate password length
        if (passwordProof.text.length < 8) {
          toast({
            title: t("error"),
            description: "A senha deve ter no mínimo 8 caracteres.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const requiredProofs = job.proofRequirements?.filter(req => req.isRequired) || [];
      const missingProofs = requiredProofs.filter(req => {
        const proof = proofs[req.id];
        
        // Para provider em tarefas de email, aceitar valor do job como fallback
        if (isEmailCreationJob && req.id === 'provider') {
          const providerValue = proof?.text || job.emailCreation?.customProvider || job.emailCreation?.provider;
          return !providerValue;
        }
        
        return !proof || (!proof.text && !proof.file);
      });

      if (missingProofs.length > 0) {
        const missingLabels = missingProofs.map(p => p.label).join(', ');
        toast({
          title: t("missing_required_proofs"),
          description: `Provas obrigatórias em falta: ${missingLabels}`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsApplying(true);
    try {
      let applicationId: string;
      // Se já existe uma aplicação do usuário para este job, tratar reenvio
      if (myApplication) {
        if (myApplication.status === 'submitted' || myApplication.status === 'approved') {
          toast({
            title: t("error"),
            description: t("cannot_resubmit_yet"),
            variant: "destructive",
          });
          return;
        }
        applicationId = myApplication.id;
      } else {
        // Primeiro, criar a aplicação
        applicationId = await JobService.applyToJob(job.id, currentUser.uid, userData.name);
        
        // Tentar atualizar job - não falhar se offline
        try {
          const refreshed = await JobService.getJobById(job.id);
          if (refreshed) {
            setJob({
              ...refreshed,
              detailedInstructions: refreshed.detailedInstructions || [],
              proofRequirements: refreshed.proofRequirements || [],
            } as any);
          }
        } catch (refreshError) {
          console.warn('Could not refresh job (possibly offline):', refreshError);
          // Não é erro crítico, continuar com aplicação existente
        }
      }
      
      // Preparar provas para envio com upload ao Cloudinary (screenshots/arquivos)
      const folder = `proofs/${currentUser.uid}/${job.id}`;
      const proofsToSubmit: any[] = await Promise.all((job.proofRequirements || []).map(async (req) => {
            const proof = proofs[req.id];
            if (!proof) {
              return { requirementId: req.id, type: req.type, content: '', comment: '' };
            }

            if ((req.type === 'screenshot' || req.type === 'file') && proof.file) {
              if (!validateFile(req.id, req.type, proof.file)) {
                return { requirementId: req.id, type: req.type, content: '', comment: proof.comment || '' };
              }
              setUploadProgress(prev => ({ ...prev, [req.id]: 0 }));
              const result = await CloudinaryService.uploadFile(proof.file, folder, (p) => {
                setUploadProgress(prev => ({ ...prev, [req.id]: p }));
              });
              return {
                requirementId: req.id,
                type: req.type,
                content: result.url,
                fileUrl: result.url,
                filePublicId: result.public_id,
                comment: proof.comment || ''
              };
            }

            return {
              requirementId: req.id,
              type: req.type,
              content: proof.text || '',
              comment: proof.comment || ''
            };
          }));

      // Para tarefas de email, garantir que provedor está incluído
      if (isEmailCreationJob) {
        const providerValue = job.emailCreation?.customProvider || job.emailCreation?.provider;
        proofsToSubmit.push({
          requirementId: 'provider',
          type: 'text',
          content: providerValue || '',
        });
      }

      // Limpar dados antes de enviar (remove undefined/null)
      const cleanedProofs = proofsToSubmit.map(p => cleanFirebaseData(p)) as typeof proofsToSubmit;

      // Enviar provas com dados limpos
      await ApplicationService.submitProofs(applicationId, cleanedProofs);
      
      toast({
        title: t("proofs_submitted_success"),
        description: t("proofs_submitted_description"),
      });
      setShowSubmittedBanner(true);
      
      // Tentar atualizar aplicação - não falhar se offline
      try {
        const applications = await ApplicationService.getApplicationsForJob(job.id);
        if (currentUser) {
          const mine = applications.find(app => app.testerId === currentUser.uid) || null;
          setMyApplication(mine);
        }
      } catch (refreshError) {
        console.warn('Could not refresh applications (possibly offline):', refreshError);
        // Não é erro crítico, continuar normalmente
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: t("error"),
        description: (typeof error === 'object' && (error as any)?.message) ? (error as any).message : t("error_submitting_proofs"),
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const isContractorMode = userData?.currentMode === 'poster';
  const isOwner = !!(currentUser && job.posterId === currentUser.uid);
  const canDelete = Boolean(
    job && (
      isAdmin || (
        isOwner && (
          job.status === 'completed' || (typeof job.maxApplicants === 'number' && actualApplicantCount >= (job.maxApplicants || 0))
        )
      )
    )
  );

  const handleSaveEdit = async () => {
    if (!id) return;
    setSavingEdit(true);
    try {
      await JobService.updateJob(id, {
        title: editTitle || job?.title,
        description: editDescription || job?.description,
        location: editLocation || undefined,
        dueDate: editDueDate ? new Date(editDueDate) : undefined,
      } as any);
      toast({ title: 'Anúncio atualizado', description: 'As alterações foram salvas.' });
      setEditOpen(false);
      const refreshed = await JobService.getJobById(id);
      if (refreshed) setJob(refreshed);
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e?.message || 'Falha ao salvar alterações.', variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!id) return;
    try {
      await JobService.deleteJob(id);
      toast({ title: 'Anúncio removido', description: 'Seu anúncio foi removido.' });
      navigate('/');
    } catch (e: any) {
      toast({ title: 'Não foi possível remover', description: e?.message || 'Verifique se o anúncio já está concluído ou contate o admin.', variant: 'destructive' });
    }
  };

  const handleSubmitJobRating = async () => {
    if (!myApplication || !id) return;
    
    if (jobRating === 0) {
      toast({
        title: t("error"),
        description: "Por favor, selecione uma classificação",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingRating(true);
    try {
      await ApplicationService.submitJobFeedback(myApplication.id, jobRating, jobComment);
      
      // Atualizar estado local
      setMyApplication({
        ...myApplication,
        feedback: {
          rating: jobRating,
          comment: jobComment,
          providedAt: new Date() as any
        }
      });

      toast({
        title: "✨ Avaliação enviada!",
        description: `Obrigado pelo feedback! Você ganhou ${jobRating >= 4 ? '50' : '30'} XP.`
      });
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        title: t("error"),
        description: error?.message || "Erro ao enviar avaliação",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Aviso: modo contratante não permite fazer tarefas */}
        {isContractorMode && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Você está no modo Contratante</AlertTitle>
              <AlertDescription>
                Para fazer tarefas e enviar provas, mude para a conta Freelancer.
              </AlertDescription>
            </Alert>
          </div>
        )}
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
        </div>

        {/* Job Info Card */}
        <Card className="mb-8 bg-card border-border shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getPlatformIcon()}
                <Badge variant="outline" className={getDifficultyColor()}>
                  {t(job.difficulty.toLowerCase())}
                </Badge>
                <Badge variant="secondary" className="bg-cosmic-blue/20 text-cosmic-blue border-cosmic-blue/30">{job.platform}</Badge>
                <Badge
                  variant={job.status === 'active' ? 'default' : 'secondary'}
                  className={
                    job.status === 'active'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted/30 text-muted-foreground border-border'
                  }
                >
                  {job.status === 'active' && t('active')}
                  {job.status === 'completed' && t('completed')}
                  {job.status === 'paused' && t('paused')}
                  {job.status === 'cancelled' && t('cancelled')}
                  {['active','completed','paused','cancelled'].includes(job.status) ? '' : t('inactive')}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{job.bounty.toFixed(2)} Kz</p>
                <p className="text-sm text-muted-foreground">{t("applicants_count", { count: applicantCount })}</p>
                {(isOwner || isAdmin) && (
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={!canDelete}>Eliminar</Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground">{t("detailed_description")}</h3>
              <p className="text-muted-foreground leading-relaxed">{job.description}</p>
            </div>

            {/* Applicants Progress */}
            {typeof job.maxApplicants === 'number' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("applicants_count", { count: applicantCount })}</span>
                <span>{t("max_applicants")}: {job.maxApplicants}</span>
              </div>
              <Progress
                value={Math.min(100, Math.round(((applicantCount || 0) / job.maxApplicants) * 100))}
                className="h-2"
              />
              {applicantCount >= job.maxApplicants && (
                <p className="text-sm text-destructive">{t("applications_full")}</p>
              )}
            </div>
            )}

            {/* Detailed Instructions */}
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t("detailed_instructions_label")}</h3>
              {job.detailedInstructions && job.detailedInstructions.length > 0 ? (
                <div className="space-y-3">
                  {job.detailedInstructions.map((instruction) => (
                    <div key={instruction.id} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="bg-electric-purple/10 text-electric-purple rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {instruction.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{instruction.instruction}</p>
                        {instruction.isRequired && (
                          <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {t("required")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-primary/5 to-electric-purple/5 rounded-lg border border-primary/20">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <div 
                      className="whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: generateAutomaticInstructions(job).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("time_estimate")}:</span>
                  <span className="font-medium">{job.timeEstimate}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("posted_by")}:</span>
                  <span className="font-medium">{job.posterName}</span>
                </div>

                {job.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("location")}:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("posted")}:</span>
                  <span className="font-medium">
                    {job.createdAt && (job.createdAt as any).toDate 
                      ? (job.createdAt as any).toDate().toLocaleDateString('pt-BR')
                      : job.createdAt 
                        ? new Date(job.createdAt).toLocaleDateString('pt-BR') 
                        : t('date_not_available')}
                  </span>
                </div>

                {job.dueDate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("due_date")}:</span>
                    <span className="font-medium">
                      {(job.dueDate as any).toDate 
                        ? (job.dueDate as any).toDate().toLocaleDateString('pt-BR')
                        : new Date(job.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {job.maxApplicants && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("max_applicants")}:</span>
                    <span className="font-medium">{job.maxApplicants}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Comments Section */}
      <JobComments jobId={job.id} />

      {/* Proof Requirements Section */}
      <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-star-glow" />
              <span>{t(isYouTubeJob && job?.youtube?.actionType === 'watch' ? 'youtube_auto_verification' : 'proof_requirements')}</span>
            </CardTitle>
          </CardHeader>
        
        <CardContent className="space-y-6">
            {(isYouTubeJob) ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{job?.youtube?.actionType === 'watch' ? t('youtube_section_title_watch') : t('youtube_section_title_subscribe')}</p>
                    <div className="space-y-3">
                      {ytVideoId && (
                        <div className="space-y-2">
                          {!ytEmbedOpen && (
                            <Button onClick={() => setYtEmbedOpen(true)} variant="default" className="glow-effect">
                              {t('open_video')}
                            </Button>
                          )}
                          {ytEmbedOpen && (
                            <div className="space-y-2">
                              <div id="yt-player" className="w-full h-[360px] rounded-md border" />
                              {job?.youtube?.actionType === 'watch' && (
                                <div className="space-y-2">
                                  <Progress value={Math.min(100, Math.round((ytWatchElapsed / ytRequiredSeconds) * 100))} />
                                  <p className="text-xs text-muted-foreground">{t('watch_progress', { elapsed: ytWatchElapsed, required: ytRequiredSeconds })}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {(!ytVideoId || job?.youtube?.actionType !== 'watch') && (
                        <div className="flex items-center gap-3">
                          <Button variant="outline" onClick={() => { window.open(job?.youtube?.videoUrl || '', '_blank'); if (job?.youtube?.actionType === 'subscribe') { if (dwellTimerRef.current) clearInterval(dwellTimerRef.current); setYtSubscribeDwell(0); dwellTimerRef.current = setInterval(() => { setYtSubscribeDwell((prev) => Math.min(prev + 1, subscribeRequiredSeconds)); }, 1000); } }}>{job?.youtube?.actionType === 'subscribe' ? t('open_channel') : t('open_video')}</Button>
                          <Dialog open={ytChannelDialogOpen} onOpenChange={setYtChannelDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="secondary">Abrir em iframe</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Canal do YouTube</DialogTitle>
                                <DialogDescription>Use o botão Inscrever. Aguarde alguns segundos.</DialogDescription>
                              </DialogHeader>
                              <div className="w-full">
                                <div className="flex justify-center py-4">
                                  <div className="g-ytsubscribe" data-layout="default" data-count="default" {...(channelData?.channelId ? { ['data-channelid']: channelData.channelId } : {})} {...(channelData?.handle ? { ['data-channel']: channelData.handle } : {})} />
                                </div>
                                <div className="text-center text-xs text-muted-foreground">Tempo no iframe: {ytSubscribeDwell}s / {subscribeRequiredSeconds}s</div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {job?.youtube?.actionType === 'subscribe' && (
                            <Button variant={ytSubscribedConfirmed ? 'default' : 'secondary'} disabled={ytSubscribeDwell < subscribeRequiredSeconds} onClick={() => setYtSubscribedConfirmed(!ytSubscribedConfirmed)}>
                              {t('confirm_subscription')}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="text-sm text-muted-foreground">
                        {userData?.settings?.socialAccounts?.youtube ? (
                          <span>{userData.settings.socialAccounts.youtube}</span>
                        ) : (
                          <span>{t('link_youtube_channel_to_apply')}</span>
                        )}
                      </div>
                      <Button onClick={handleSubmitProofs} disabled={!ytCanSubmit || isApplying} className="glow-effect">
                        {isApplying ? t('submitting') : t('confirm_task')}
                      </Button>
                    </div>
                    {!ytCanSubmit && (
                      <p className="text-xs text-muted-foreground">
                        {job?.youtube?.actionType === 'watch' ? t('submit_disabled_until_watch') : t('submit_disabled_until_subscribe')}
                      </p>
                    )}
                    {job?.youtube?.actionType !== 'watch' && job.proofRequirements && job.proofRequirements.length > 0 && (
                      <>
                        <p className="text-sm text-muted-foreground mt-4">
                          {t("submit_your_proofs")}
                        </p>
                        {job.proofRequirements.map((proofReq) => (
                          <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                                {proofReq.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t("required")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                            </div>

                            <div className="space-y-3 ml-6">
                              {(proofReq.type === 'text' || proofReq.type === 'url') && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    {proofReq.type === 'url' ? t('link_url') : t('text_response')}
                                  </label>
                                  <Textarea
                                    placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof_placeholder_url') : t('proof_placeholder_text'))}
                                    value={proofs[proofReq.id]?.text || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                    className="min-h-[80px]"
                                  />
                                </div>
                              )}

                              {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground block">
                                    {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                                  </label>
                                  <Input
                                    type="file"
                                    accept={proofReq.type === 'screenshot' ? 'image/png,image/jpeg' : 'image/png,image/jpeg'}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      if (!file) { handleFileChange(proofReq.id, null); return; }
                                      const ok = validateFile(proofReq.id, proofReq.type, file);
                                      if (!ok) { return; }
                                      handleFileChange(proofReq.id, file);
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">Apenas PNG/JPG, até 5 MB</p>
                                  {proofs[proofReq.id]?.file && (
                                    <p className="text-sm text-muted-foreground">
                                      {t("file_selected")}: {proofs[proofReq.id].file?.name}
                                    </p>
                                  )}
                                  {uploadProgress[proofReq.id] !== undefined && (
                                    <div className="space-y-2">
                                      <Progress value={uploadProgress[proofReq.id]} className="w-full" />
                                      <p className="text-xs text-muted-foreground">
                                        {t('uploading')} {uploadProgress[proofReq.id]}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("optional_comment")}
                                </label>
                                <Textarea
                                  placeholder={t("optional_comment_placeholder")}
                                  value={proofs[proofReq.id]?.comment || ''}
                                  onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                                  className="min-h-[60px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={handleCancel}>
                            {t("cancel_button").toUpperCase()}
                          </Button>
                          <Button 
                            onClick={handleSubmitProofs} 
                            disabled={isApplying}
                            className="min-w-[140px] glow-effect"
                          >
                            {isApplying ? t("submitting").toUpperCase() : t("submit_proofs").toUpperCase()}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'approved') && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{t('payout_credited_success')}</AlertTitle>
                        <AlertDescription>{t('payout_credited_description')}</AlertDescription>
                      </Alert>
                    )}
                    {latestTransaction && (
                      <div className="p-3 border rounded-md bg-muted/30">
                        <p className="text-sm font-medium">{t('transaction_receipt')}</p>
                        <p className="text-xs text-muted-foreground">{t('transaction_id')}: {latestTransaction.id}</p>
                        <p className="text-xs text-muted-foreground">{t('transaction_amount')}: {(latestTransaction.amount || 0).toFixed(2)} Kz</p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{t('youtube_verification_info')}</p>
                  </div>
                )}
              </>
            ) : isInstagramJob ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    {job?.instagram?.actionType === 'watch' ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">Assista ao vídeo/reel do Instagram completo. O contador só avança enquanto você estiver visualizando.</p>
                        
                        <Dialog open={igEmbedOpen} onOpenChange={setIgEmbedOpen}>
                          <DialogTrigger asChild>
                            <Button variant="default" size="lg" className="w-full glow-effect">
                              Assistir Reel/Vídeo no Instagram
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>Assistir Instagram Reel/Vídeo</DialogTitle>
                              <DialogDescription>
                                Assista ao vídeo completo. Tentaremos abrir em iframe, se não funcionar abriremos em nova aba.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {!igIframeError ? (
                                <>
                                  <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden">
                                    <iframe
                                      ref={igPlayerRef}
                                      src={convertToEmbedUrl(job?.instagram?.videoUrl || '', 'instagram')}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                      onLoad={() => {
                                        setIgIsWatching(true);
                                      }}
                                      onError={() => {
                                        console.log('Iframe bloqueado, abrindo em nova aba...');
                                        setIgIframeError(true);
                                      }}
                                    />
                                  </div>
                                  
                                  <Alert className="border-blue-500/50 bg-blue-500/10">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                    <AlertTitle>Vídeo em iframe</AlertTitle>
                                    <AlertDescription>
                                      Se o vídeo não carregar, clique no botão abaixo para abrir em nova aba.
                                    </AlertDescription>
                                  </Alert>
                                  
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setIgIframeError(true)}
                                  >
                                    Vídeo não carrega? Abrir em nova aba
                                  </Button>
                                </>
                              ) : (
                                <div className="space-y-4">
                                  <Alert className="border-orange-500/50 bg-orange-500/10">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    <AlertTitle>Modo Nova Aba</AlertTitle>
                                    <AlertDescription>
                                      O vídeo será aberto em uma nova aba. Mantenha a aba aberta enquanto assiste para que o tempo seja contabilizado.
                                    </AlertDescription>
                                  </Alert>
                                  
                                  <Button
                                    variant="default"
                                    size="lg"
                                    className="w-full glow-effect"
                                    onClick={() => {
                                      const newWindow = window.open(job?.instagram?.videoUrl || '', '_blank', 'width=800,height=600');
                                      if (newWindow) {
                                        igWindowRef.current = newWindow;
                                        setIgIsWatching(true);
                                      }
                                    }}
                                  >
                                    Abrir Vídeo em Nova Aba
                                  </Button>
                                  
                                  {igWindowRef.current && !igWindowRef.current.closed && (
                                    <Alert className="border-success/50 bg-success/10">
                                      <CheckCircle className="h-4 w-4 text-success" />
                                      <AlertTitle>Janela aberta!</AlertTitle>
                                      <AlertDescription>
                                        Assista ao vídeo. O tempo está sendo contabilizado enquanto a janela permanecer aberta.
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              )}
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Progresso de Visualização</span>
                                  <span className="text-sm text-muted-foreground">
                                    {igWatchElapsed}s / {igRequiredSeconds}s
                                  </span>
                                </div>
                                <Progress 
                                  value={Math.min(100, Math.round((igWatchElapsed / igRequiredSeconds) * 100))} 
                                  className="h-3"
                                />
                                
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                                  <div className={`w-2 h-2 rounded-full ${igIsWatching ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {igIsWatching ? 'Contador ativo - Continue assistindo' : 'Abra/interaja com o vídeo para começar'}
                                  </span>
                                </div>
                                
                                {igWatchElapsed >= igRequiredSeconds && (
                                  <Alert className="border-success/50 bg-success/10">
                                    <CheckCircle className="h-4 w-4 text-success" />
                                    <AlertTitle>Tempo mínimo atingido!</AlertTitle>
                                    <AlertDescription>
                                      Você pode fechar esta janela e enviar suas provas agora.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                              
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIgIsWatching(false);
                                    setIgEmbedOpen(false);
                                    setIgIframeError(false);
                                    if (igWindowRef.current && !igWindowRef.current.closed) {
                                      igWindowRef.current.close();
                                    }
                                    igWindowRef.current = null;
                                  }}
                                >
                                  Fechar
                                </Button>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Seu Progresso</span>
                            <span className="text-sm text-muted-foreground">{igWatchElapsed}s / {igRequiredSeconds}s</span>
                          </div>
                          <Progress value={Math.min(100, Math.round((igWatchElapsed / igRequiredSeconds) * 100))} className="h-2" />
                        </div>
                        
                        {igWatchElapsed >= igRequiredSeconds && (
                          <Alert className="border-success/50 bg-success/10">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <AlertTitle>Tempo mínimo de visualização atingido!</AlertTitle>
                            <AlertDescription>
                              Agora você pode enviar as provas da tarefa.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <p className="text-sm text-muted-foreground mb-4">
                          {t("submit_your_proofs")}
                        </p>
                        {job.proofRequirements && job.proofRequirements.map((proofReq) => (
                          <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                                {proofReq.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t("required")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                            </div>

                            <div className="space-y-3 ml-6">
                              {(proofReq.type === 'text' || proofReq.type === 'url') && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    {proofReq.type === 'url' ? t('link_url') : t('text_response')}
                                  </label>
                                  <Textarea
                                    placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof_placeholder_url') : t('proof_placeholder_text'))}
                                    value={proofs[proofReq.id]?.text || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                    className="min-h-[80px]"
                                  />
                                </div>
                              )}

                              {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground block">
                                    {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                                  </label>
                                  <Input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      if (!file) { handleFileChange(proofReq.id, null); return; }
                                      const ok = validateFile(proofReq.id, proofReq.type, file);
                                      if (!ok) { return; }
                                      handleFileChange(proofReq.id, file);
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">Apenas PNG/JPG, até 5 MB</p>
                                  {proofs[proofReq.id]?.file && (
                                    <p className="text-sm text-muted-foreground">
                                      {t("file_selected")}: {proofs[proofReq.id].file?.name}
                                    </p>
                                  )}
                                  {uploadProgress[proofReq.id] !== undefined && (
                                    <div className="space-y-2">
                                      <Progress value={uploadProgress[proofReq.id]} className="w-full" />
                                      <p className="text-xs text-muted-foreground">
                                        {t('uploading')} {uploadProgress[proofReq.id]}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("optional_comment")}
                                </label>
                                <Textarea
                                  placeholder={t("optional_comment_placeholder")}
                                  value={proofs[proofReq.id]?.comment || ''}
                                  onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                                  className="min-h-[60px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={handleCancel}>
                            {t("cancel_button").toUpperCase()}
                          </Button>
                          <Button 
                            onClick={handleSubmitProofs} 
                            disabled={!igCanSubmit || isApplying}
                            className="min-w-[140px] glow-effect"
                          >
                            {isApplying ? t('submitting') : t('confirm_task')}
                          </Button>
                        </div>
                        {!igCanSubmit && (
                          <p className="text-xs text-muted-foreground">{t('submit_disabled_until_watch')}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {job?.instagram?.actionType === 'follow' ? 'Siga o perfil do Instagram para continuar.' :
                           job?.instagram?.actionType === 'like' ? 'Curta a publicação do Instagram para continuar.' :
                           job?.instagram?.actionType === 'comment' ? 'Comente na publicação do Instagram para continuar.' : 
                           'Complete a ação no Instagram para continuar.'}
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => window.open(job?.instagram?.videoUrl || '', '_blank')}
                            >
                              {job?.instagram?.actionType === 'follow' ? 'Abrir Perfil' : 'Abrir Publicação'}
                            </Button>
                            
                            {job?.instagram?.extras?.openInIframe && (
                              <Dialog open={igDialogOpen} onOpenChange={setIgDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="secondary">Abrir em iframe</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {job?.instagram?.actionType === 'follow' ? 'Perfil do Instagram' : 'Publicação do Instagram'}
                                    </DialogTitle>
                                    <DialogDescription>
                                      {job?.instagram?.actionType === 'follow' ? 'Clique em "Seguir" no perfil. Aguarde alguns segundos após seguir.' :
                                       job?.instagram?.actionType === 'like' ? 'Clique em "Curtir" na publicação. Aguarde alguns segundos após curtir.' :
                                       job?.instagram?.actionType === 'comment' ? 'Adicione seu comentário na publicação. Aguarde alguns segundos após comentar.' :
                                       'Complete a ação solicitada.'}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="w-full h-[500px]">
                                    <iframe 
                                      src={job?.instagram?.videoUrl} 
                                      className="w-full h-full border rounded-md"
                                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            <Button 
                              variant={instagramActionConfirmed ? 'default' : 'secondary'} 
                              onClick={() => setInstagramActionConfirmed(!instagramActionConfirmed)}
                            >
                              {instagramActionConfirmed ? 'Confirmado ✓' : 
                               job?.instagram?.actionType === 'follow' ? 'Confirmar Seguimento' :
                               job?.instagram?.actionType === 'like' ? 'Confirmar Curtida' :
                               job?.instagram?.actionType === 'comment' ? 'Confirmar Comentário' : 
                               'Confirmar Ação'}
                            </Button>
                          </div>
                        </div>
                        
                        {instagramActionConfirmed ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-4">
                              {t("submit_your_proofs")}
                            </p>
                            {job.proofRequirements && job.proofRequirements.map((proofReq) => (
                              <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                    <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                                    {proofReq.isRequired && (
                                      <Badge variant="destructive" className="text-xs">
                                        {t("required")}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                                </div>

                                <div className="space-y-3 ml-6">
                                  {(proofReq.type === 'text' || proofReq.type === 'url') && (
                                    <div>
                                      <label className="text-sm font-medium text-foreground mb-2 block">
                                        {proofReq.type === 'url' ? t('link_url') : t('text_response')}
                                      </label>
                                      <Textarea
                                        placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof_placeholder_url') : t('proof_placeholder_text'))}
                                        value={proofs[proofReq.id]?.text || ''}
                                        onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                        className="min-h-[80px]"
                                      />
                                    </div>
                                  )}

                                  {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-foreground block">
                                        {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                                      </label>
                                      <Input
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null;
                                          if (!file) { handleFileChange(proofReq.id, null); return; }
                                          const ok = validateFile(proofReq.id, proofReq.type, file);
                                          if (!ok) { return; }
                                          handleFileChange(proofReq.id, file);
                                        }}
                                        className="cursor-pointer"
                                      />
                                      <p className="text-xs text-muted-foreground">Apenas PNG/JPG, até 5 MB</p>
                                      {proofs[proofReq.id]?.file && (
                                        <p className="text-sm text-muted-foreground">
                                          {t("file_selected")}: {proofs[proofReq.id].file?.name}
                                        </p>
                                      )}
                                      {uploadProgress[proofReq.id] !== undefined && (
                                        <div className="space-y-2">
                                          <Progress value={uploadProgress[proofReq.id]} className="w-full" />
                                          <p className="text-xs text-muted-foreground">
                                            {t('uploading')} {uploadProgress[proofReq.id]}%
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                      {t("optional_comment")}
                                    </label>
                                    <Textarea
                                      placeholder={t("optional_comment_placeholder")}
                                      value={proofs[proofReq.id]?.comment || ''}
                                      onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                                      className="min-h-[60px]"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="flex justify-end space-x-3 pt-4">
                              <Button variant="outline" onClick={handleCancel}>
                                {t("cancel_button").toUpperCase()}
                              </Button>
                              <Button 
                                onClick={handleSubmitProofs} 
                                disabled={isApplying}
                                className="min-w-[140px] glow-effect"
                              >
                                {isApplying ? t("submitting").toUpperCase() : t("submit_proofs").toUpperCase()}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Complete a ação e confirme antes de enviar as provas.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'approved') && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{myApplication?.status === 'approved' ? t('payout_credited_success') : 'Provas enviadas com sucesso'}</AlertTitle>
                        <AlertDescription>{myApplication?.status === 'approved' ? t('payout_credited_description') : 'Suas provas foram enviadas e estão aguardando aprovação do contratante. O pagamento será creditado após aprovação.'}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">{t('youtube_verification_info')}</p>
                  </div>
                )}
              </>
            ) : (isFacebookJob && (job?.facebook?.actionType === 'watch' || job?.facebook?.actionType === 'follow')) ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {job?.facebook?.actionType === 'watch' ? 'Assista ao vídeo/publicação do Facebook para continuar.' : 'Siga a página do Facebook para continuar.'}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => { 
                          window.open((job?.facebook?.videoUrl) || '', '_blank'); 
                          if (job?.facebook?.actionType === 'watch') {
                            setFbIsWatching(true);
                          }
                        }}>
                          {job?.facebook?.actionType === 'watch' ? t('open_video') : 'Abrir página'}
                        </Button>
                        
                        {job?.facebook?.actionType === 'follow' && job?.facebook?.extras?.openInIframe && (
                          <Dialog open={fbPageDialogOpen} onOpenChange={setFbPageDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="secondary">Abrir em iframe</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Página do Facebook</DialogTitle>
                                <DialogDescription>Clique em "Seguir" ou "Curtir" na página. Aguarde alguns segundos após seguir.</DialogDescription>
                              </DialogHeader>
                              <div className="w-full h-[500px]">
                                <iframe 
                                  src={job?.facebook?.videoUrl} 
                                  className="w-full h-full border rounded-md"
                                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        {job?.facebook?.actionType === 'follow' && (
                          <Button 
                            variant={fbFollowConfirmed ? 'default' : 'secondary'} 
                            onClick={() => setFbFollowConfirmed(!fbFollowConfirmed)}
                          >
                            {fbFollowConfirmed ? 'Confirmado ✓' : 'Confirmar que segui'}
                          </Button>
                        )}
                      </div>
                      
                      {job?.facebook?.actionType === 'watch' && (
                        <div className="space-y-2">
                          <Progress value={Math.min(100, Math.round((fbWatchElapsed / fbRequiredSeconds) * 100))} />
                          <p className="text-xs text-muted-foreground">{t('watch_progress', { elapsed: fbWatchElapsed, required: fbRequiredSeconds })}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="text-sm text-muted-foreground">
                        {job?.facebook?.actionType === 'follow' 
                          ? (fbFollowConfirmed ? 'Pronto para enviar provas' : 'Confirme que seguiu a página')
                          : ''}
                      </div>
                      <Button onClick={handleSubmitProofs} disabled={!fbCanSubmit || isApplying} className="glow-effect">
                        {isApplying ? t('submitting') : t('confirm_task')}
                      </Button>
                    </div>
                    
                    {!fbCanSubmit && (
                      <p className="text-xs text-muted-foreground">
                        {job?.facebook?.actionType === 'watch' 
                          ? t('submit_disabled_until_watch') 
                          : 'Confirme que seguiu a página antes de enviar as provas.'}
                      </p>
                    )}
                    
                    {job?.facebook?.actionType === 'follow' && job.proofRequirements && job.proofRequirements.length > 0 && (
                      <>
                        <p className="text-sm text-muted-foreground mt-4">
                          {t("submit_your_proofs")}
                        </p>
                        {job.proofRequirements.map((proofReq) => (
                          <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                                {proofReq.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t("required")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                            </div>

                            <div className="space-y-3 ml-6">
                              {(proofReq.type === 'text' || proofReq.type === 'url') && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    {proofReq.type === 'url' ? t('link_url') : t('text_response')}
                                  </label>
                                  <Textarea
                                    placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof_placeholder_url') : t('proof_placeholder_text'))}
                                    value={proofs[proofReq.id]?.text || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                    className="min-h-[80px]"
                                  />
                                </div>
                              )}

                              {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground block">
                                    {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                                  </label>
                                  <Input
                                    type="file"
                                    accept={proofReq.type === 'screenshot' ? 'image/png,image/jpeg' : 'image/png,image/jpeg'}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      if (!file) { handleFileChange(proofReq.id, null); return; }
                                      const ok = validateFile(proofReq.id, proofReq.type, file);
                                      if (!ok) { return; }
                                      handleFileChange(proofReq.id, file);
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">Apenas PNG/JPG, até 5 MB</p>
                                  {proofs[proofReq.id]?.file && (
                                    <p className="text-sm text-muted-foreground">
                                      {t("file_selected")}: {proofs[proofReq.id].file?.name}
                                    </p>
                                  )}
                                  {uploadProgress[proofReq.id] !== undefined && (
                                    <div className="space-y-2">
                                      <Progress value={uploadProgress[proofReq.id]} className="w-full" />
                                      <p className="text-xs text-muted-foreground">
                                        {t('uploading')} {uploadProgress[proofReq.id]}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("optional_comment")}
                                </label>
                                <Textarea
                                  placeholder={t("optional_comment_placeholder")}
                                  value={proofs[proofReq.id]?.comment || ''}
                                  onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                                  className="min-h-[60px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'approved') && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{myApplication?.status === 'approved' ? t('payout_credited_success') : 'Provas enviadas com sucesso'}</AlertTitle>
                        <AlertDescription>{myApplication?.status === 'approved' ? t('payout_credited_description') : 'Suas provas foram enviadas e estão aguardando aprovação do contratante. O pagamento será creditado após aprovação.'}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">{t('youtube_verification_info')}</p>
                  </div>
                )}
              </>
            ) : isWebsiteJob ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => {
                          if (job?.website?.extras?.blockMultipleTabs) {
                            const existing = localStorage.getItem('web_task_lock');
                            if (existing && existing !== job.id) {
                              toast({ title: t('error'), description: t('multiple_tabs_blocked'), variant: 'destructive' });
                              return;
                            }
                            localStorage.setItem('web_task_lock', job.id);
                          }
                          setWebEmbedOpen(true);
                          setWebIsWatching(true);
                        }}>{t('open_website')}</Button>
                      </div>
                      {(job?.website?.actionType === 'visit' || job?.website?.actionType === 'visit_scroll') && (
                        <div className="space-y-2">
                          <Progress value={Math.min(100, Math.round((webWatchElapsed / webRequiredSeconds) * 100))} />
                          <p className="text-xs text-muted-foreground">{t('watch_progress', { elapsed: webWatchElapsed, required: webRequiredSeconds })}</p>
                          {job?.website?.actionType === 'visit_scroll' && (
                            <p className="text-xs text-muted-foreground">{webScrolledToEnd ? t('scroll_reached_end') : t('scroll_to_bottom_required')}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="text-sm text-muted-foreground" />
                      <Button onClick={handleSubmitProofs} disabled={!webCanSubmit || isApplying} className="glow-effect">
                        {isApplying ? t('submitting') : t('confirm_task')}
                      </Button>
                    </div>
                    {!webCanSubmit && (
                      <p className="text-xs text-muted-foreground">{job?.website?.actionType === 'visit_scroll' ? t('submit_disabled_until_scroll') : t('submit_disabled_until_watch')}</p>
                    )}
                    <Dialog open={webEmbedOpen} onOpenChange={(o) => {
                      setWebEmbedOpen(o);
                      if (o) {
                        setWebScrolledToEnd(false);
                        setWebWatchElapsed(0);
                      } else {
                        setWebIsWatching(false);
                        setWebScrolledToEnd(false);
                        if (job?.website?.extras?.blockMultipleTabs) {
                          const existing = localStorage.getItem('web_task_lock');
                          if (existing === job.id) localStorage.removeItem('web_task_lock');
                        }
                      }
                    }}>
                      <DialogContent className="max-w-[900px]">
                        <DialogHeader>
                          <DialogTitle>{job?.website?.pageTitle || t('website')}</DialogTitle>
                          <DialogDescription>{t('stay_on_page_message')}</DialogDescription>
                        </DialogHeader>
                        <div className="relative w-full h-[600px] border rounded-md overflow-hidden">
                          <iframe src={job?.website?.pageUrl} className="absolute inset-0 w-full h-full" sandbox="allow-scripts allow-same-origin allow-forms" />
                          {job?.website?.actionType === 'visit_scroll' && (
                            <div onScroll={(e) => {
                              const el = e.currentTarget;
                              const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
                              if (atBottom) setWebScrolledToEnd(true);
                            }} className="absolute inset-0 overflow-y-auto" style={{ background: 'transparent' }}>
                              <div style={{ height: '200vh' }} />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'approved') && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{myApplication?.status === 'approved' ? t('payout_credited_success') : 'Provas enviadas com sucesso'}</AlertTitle>
                        <AlertDescription>{myApplication?.status === 'approved' ? t('payout_credited_description') : 'Suas provas foram enviadas e estão aguardando aprovação do contratante. O pagamento será creditado após aprovação.'}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">{t('website_verification_info')}</p>
                  </div>
                )}
              </>
            ) : isTikTokJob ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{(job?.tiktok?.actionType) === 'follow' ? t('tiktok_section_title_follow') : t('tiktok_section_title_watch')}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => window.open((job?.tiktok?.videoUrl) || '', '_blank')}>{t('open_video')}</Button>
                        {(job?.tiktok?.actionType) === 'follow' && (
                          <Button variant={tkFollowConfirmed ? 'default' : 'secondary'} onClick={() => setTkFollowConfirmed(!tkFollowConfirmed)}>
                            {t('confirm_follow')}
                          </Button>
                        )}
                      </div>
                      {(job?.tiktok?.actionType) === 'watch' && (
                        <div className="space-y-2">
                          <Progress value={Math.min(100, Math.round((ytWatchElapsed / tkRequiredSeconds) * 100))} />
                          <p className="text-xs text-muted-foreground">{t('watch_progress', { elapsed: ytWatchElapsed, required: tkRequiredSeconds })}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="text-sm text-muted-foreground">
                        {userData?.settings?.socialAccounts?.tiktok ? (
                          <span>{userData.settings.socialAccounts.tiktok}</span>
                        ) : (
                          <span>{t('link_tiktok_profile_to_apply')}</span>
                        )}
                      </div>
                      <Button onClick={handleSubmitProofs} disabled={!tkCanSubmit || isApplying || !userData?.settings?.socialAccounts?.tiktok} className="glow-effect">
                        {isApplying ? t('submitting') : t('confirm_task')}
                      </Button>
                    </div>
                    {!tkCanSubmit && (
                      <p className="text-xs text-muted-foreground">
                        {(job?.tiktok?.actionType) === 'follow' ? t('submit_disabled_until_follow') : t('submit_disabled_until_watch')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'submitted') && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('proofs_submitted_success')}</AlertTitle>
                        <AlertDescription>{t('proofs_submitted_description')}</AlertDescription>
                      </Alert>
                    )}
                    {myApplication?.status === 'approved' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{t('approved')}</AlertTitle>
                        <AlertDescription>{t('task_approved_description', { jobTitle: job.title })}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">{t('tiktok_verification_info')}</p>
                  </div>
                )}
              </>
            ) : isVKJob ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{(job?.vk?.actionType) === 'join' ? t('vk_section_title_join') : t('vk_section_title_like')}</p>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={() => window.open((job?.vk?.targetUrl) || '', '_blank')}>{t('open_profile')}</Button>
                      {(job?.vk?.actionType) === 'join' && (
                        <Button variant={vkJoinConfirmed ? 'default' : 'secondary'} onClick={() => setVkJoinConfirmed(!vkJoinConfirmed)}>
                          {t('confirm_join')}
                        </Button>
                      )}
                      {(job?.vk?.actionType) === 'like' && (
                        <Button variant={vkJoinConfirmed ? 'default' : 'secondary'} onClick={() => setVkJoinConfirmed(!vkJoinConfirmed)}>
                          {t('confirm_like')}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="text-sm text-muted-foreground">
                        {userData?.settings?.socialAccounts?.vk ? (
                          <span>{userData.settings.socialAccounts.vk}</span>
                        ) : (
                          <span>{t('link_vk_profile_to_apply')}</span>
                        )}
                      </div>
                      <Button onClick={handleSubmitProofs} disabled={!vkJoinConfirmed || isApplying || !userData?.settings?.socialAccounts?.vk} className="glow-effect">
                        {isApplying ? t('submitting') : t('confirm_task')}
                      </Button>
                    </div>
                    {!vkJoinConfirmed && (
                      <p className="text-xs text-muted-foreground">
                        {(job?.vk?.actionType) === 'join' ? t('submit_disabled_until_join') : t('submit_disabled_until_like')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'submitted') && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('proofs_submitted_success')}</AlertTitle>
                        <AlertDescription>{t('proofs_submitted_description')}</AlertDescription>
                      </Alert>
                    )}
                    {myApplication?.status === 'approved' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{t('approved')}</AlertTitle>
                        <AlertDescription>{t('task_approved_description', { jobTitle: job.title })}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">{t('vk_verification_info')}</p>
                  </div>
                )}
              </>
            ) : isTwitterJob ? (
              <>
                {canSubmitProofs ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {job?.twitter?.actionType === 'follow' && 'Complete a ação de seguir o perfil no Twitter/X'}
                      {job?.twitter?.actionType === 'like' && 'Complete a ação de curtir o tweet no Twitter/X'}
                      {job?.twitter?.actionType === 'retweet' && 'Complete a ação de retweetar no Twitter/X'}
                      {job?.twitter?.actionType === 'comment' && 'Complete a ação de comentar no tweet no Twitter/X'}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            const url = job?.twitter?.actionType === 'follow' 
                              ? `https://twitter.com/${job?.twitter?.profileHandle}` 
                              : job?.twitter?.tweetUrl;
                            window.open(url || '', '_blank');
                          }}
                        >
                          {job?.twitter?.actionType === 'follow' ? 'Abrir Perfil' : 'Abrir Tweet'}
                        </Button>
                        <Button 
                          variant={twitterActionConfirmed ? 'default' : 'secondary'} 
                          onClick={() => setTwitterActionConfirmed(!twitterActionConfirmed)}
                        >
                          {job?.twitter?.actionType === 'follow' && 'Confirmar Seguimento'}
                          {job?.twitter?.actionType === 'like' && 'Confirmar Curtida'}
                          {job?.twitter?.actionType === 'retweet' && 'Confirmar Retweet'}
                          {job?.twitter?.actionType === 'comment' && 'Confirmar Comentário'}
                        </Button>
                      </div>
                    </div>
                    
                    {twitterActionConfirmed && job.proofRequirements && job.proofRequirements.length > 0 && (
                      <>
                        <p className="text-sm text-muted-foreground mt-4">
                          {t("submit_your_proofs")}
                        </p>
                        {job.proofRequirements.map((proofReq) => (
                          <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                                {proofReq.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t("required")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                            </div>

                            <div className="space-y-3 ml-6">
                              {(proofReq.type === 'text' || proofReq.type === 'url') && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    {proofReq.type === 'url' ? t('link_url') : t('text_response')}
                                  </label>
                                  <Textarea
                                    placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof_placeholder_url') : t('proof_placeholder_text'))}
                                    value={proofs[proofReq.id]?.text || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                    className="min-h-[80px]"
                                  />
                                </div>
                              )}

                              {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground block">
                                    {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                                  </label>
                                  <Input
                                    type="file"
                                    accept={proofReq.type === 'screenshot' ? 'image/png,image/jpeg' : 'image/png,image/jpeg'}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      if (!file) { handleFileChange(proofReq.id, null); return; }
                                      const ok = validateFile(proofReq.id, proofReq.type, file);
                                      if (!ok) { return; }
                                      handleFileChange(proofReq.id, file);
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">Apenas PNG/JPG, até 5 MB</p>
                                  {proofs[proofReq.id]?.file && (
                                    <p className="text-sm text-muted-foreground">
                                      {t("file_selected")}: {proofs[proofReq.id].file?.name}
                                    </p>
                                  )}
                                  {uploadProgress[proofReq.id] !== undefined && (
                                    <div className="space-y-2">
                                      <Progress value={uploadProgress[proofReq.id]} className="w-full" />
                                      <p className="text-xs text-muted-foreground">
                                        {t('uploading')} {uploadProgress[proofReq.id]}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                  {t("optional_comment")}
                                </label>
                                <Textarea
                                  placeholder={t("optional_comment_placeholder")}
                                  value={proofs[proofReq.id]?.comment || ''}
                                  onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                                  className="min-h-[60px]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={handleCancel}>
                            {t("cancel_button").toUpperCase()}
                          </Button>
                          <Button 
                            onClick={handleSubmitProofs} 
                            disabled={isApplying}
                            className="min-w-[140px] glow-effect"
                          >
                            {isApplying ? t("submitting").toUpperCase() : t("submit_proofs").toUpperCase()}
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {!twitterActionConfirmed && (
                      <p className="text-xs text-muted-foreground">
                        Confirme que completou a ação antes de enviar as provas
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showSubmittedBanner || myApplication?.status === 'submitted') && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('proofs_submitted_success')}</AlertTitle>
                        <AlertDescription>{t('proofs_submitted_description')}</AlertDescription>
                      </Alert>
                    )}
                    {myApplication?.status === 'approved' && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>{t('approved')}</AlertTitle>
                        <AlertDescription>{t('task_approved_description', { jobTitle: job.title })}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground">Suas provas foram enviadas e aguardam aprovação do contratante.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {job.proofRequirements && job.proofRequirements.length > 0 ? (
                  <>
                    {canSubmitProofs ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t("submit_your_proofs")}
                        </p>
                        {job.proofRequirements.map((proofReq) => (
                          <div key={proofReq.id} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                                <span className="text-sm font-medium text-foreground">{proofReq.label}</span>
                                {proofReq.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t("required")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                            </div>

                            <div className="space-y-3 ml-6">
                              {/* Email creation specific fields */}
                              {isEmailCreationJob && proofReq.id === 'email' && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    E-mail criado
                                  </label>
                                  <Input
                                    type="email"
                                    placeholder="exemplo@gmail.com"
                                    value={proofs[proofReq.id]?.text || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                    className={emailValidation.isValid === false && proofs[proofReq.id]?.text ? 'border-destructive focus-visible:ring-destructive' : emailValidation.isValid && proofs[proofReq.id]?.text ? 'border-success focus-visible:ring-success' : ''}
                                  />
                                  {proofs[proofReq.id]?.text && (
                                    <p className={`text-xs mt-1 ${emailValidation.isValid ? 'text-success' : 'text-destructive'}`}>
                                      {emailValidation.message}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {isEmailCreationJob && proofReq.id === 'password' && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    Senha da conta
                                  </label>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      placeholder="Digite a senha (mínimo 6 caracteres)"
                                      value={proofs[proofReq.id]?.text || ''}
                                      onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                      className={`pr-10 ${passwordValidation.isValid === false && proofs[proofReq.id]?.text ? 'border-destructive focus-visible:ring-destructive' : passwordValidation.isValid && proofs[proofReq.id]?.text ? 'border-success focus-visible:ring-success' : ''}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  </div>
                                  {proofs[proofReq.id]?.text && (
                                    <p className={`text-xs mt-1 ${passwordValidation.isValid ? 'text-success' : 'text-destructive'}`}>
                                      {passwordValidation.message}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {isEmailCreationJob && proofReq.id === 'provider' && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    Provedor
                                  </label>
                                  <Input
                                    type="text"
                                    placeholder="Gmail, Outlook, Yahoo, etc."
                                    value={job.emailCreation?.customProvider || job.emailCreation?.provider || ''}
                                    readOnly
                                    className="bg-muted/50"
                                  />
                                </div>
                              )}
                              
                              {/* Standard proof fields for non-email tasks */}
                              {!isEmailCreationJob && (proofReq.type === 'text' || proofReq.type === 'url') && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    {proofReq.type === 'url' ? t('link_url') : t('text_response')}
                                  </label>
                                  <Textarea
                                    placeholder={proofReq.placeholder || (proofReq.type === 'url' ? t('proof_placeholder_url') : t('proof_placeholder_text'))}
                                    value={proofs[proofReq.id]?.text || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'text', e.target.value)}
                                    className="min-h-[80px]"
                                  />
                                </div>
                              )}

                              {(proofReq.type === 'screenshot' || proofReq.type === 'file') && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground block">
                                    {proofReq.type === 'screenshot' ? t('screenshot') : t('file')}
                                  </label>
                                  <Input
                                    type="file"
                                    accept={proofReq.type === 'screenshot' ? 'image/png,image/jpeg' : 'image/png,image/jpeg'}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      if (!file) { handleFileChange(proofReq.id, null); return; }
                                      const ok = validateFile(proofReq.id, proofReq.type, file);
                                      if (!ok) { return; }
                                      handleFileChange(proofReq.id, file);
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    {isEmailCreationJob && proofReq.id === 'screenshot' ? 'Comprovante opcional (PNG/JPG, até 5 MB)' : 'Apenas PNG/JPG, até 5 MB'}
                                  </p>
                                  {proofs[proofReq.id]?.file && (
                                    <p className="text-sm text-muted-foreground">
                                      {t("file_selected")}: {proofs[proofReq.id].file?.name}
                                    </p>
                                  )}
                                  {uploadProgress[proofReq.id] !== undefined && (
                                    <div className="space-y-2">
                                      <Progress value={uploadProgress[proofReq.id]} className="w-full" />
                                      <p className="text-xs text-muted-foreground">
                                        {t('uploading')} {uploadProgress[proofReq.id]}%
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {!isEmailCreationJob && (
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    {t("optional_comment")}
                                  </label>
                                  <Textarea
                                    placeholder={t("optional_comment_placeholder")}
                                    value={proofs[proofReq.id]?.comment || ''}
                                    onChange={(e) => handleProofChange(proofReq.id, 'comment', e.target.value)}
                                    className="min-h-[60px]"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Email creation checklist */}
                        {isEmailCreationJob && (
                          <Card className="border-warning/30 bg-warning/5">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <AlertCircle className="w-5 h-5 text-warning" />
                                Checklist Obrigatório
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Alert className="border-destructive/50 bg-destructive/5">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <AlertTitle className="text-destructive">⚠️ CRÍTICO</AlertTitle>
                                <AlertDescription className="text-destructive">
                                  Faça logout COMPLETO da conta antes de enviar as credenciais! Caso contrário, sua prova será rejeitada.
                                </AlertDescription>
                              </Alert>
                              
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id="created"
                                    checked={emailCreationChecklist.created}
                                    onCheckedChange={(checked) =>
                                      setEmailCreationChecklist((prev) => ({ ...prev, created: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="created" className="cursor-pointer text-sm leading-relaxed">
                                    Criei a conta de e-mail com sucesso
                                  </Label>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id="loggedOut"
                                    checked={emailCreationChecklist.loggedOut}
                                    onCheckedChange={(checked) =>
                                      setEmailCreationChecklist((prev) => ({ ...prev, loggedOut: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="loggedOut" className="cursor-pointer text-sm leading-relaxed font-semibold text-destructive">
                                    Saí da sessão no meu dispositivo (logout completo)
                                  </Label>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id="verified"
                                    checked={emailCreationChecklist.verified}
                                    onCheckedChange={(checked) =>
                                      setEmailCreationChecklist((prev) => ({ ...prev, verified: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="verified" className="cursor-pointer text-sm leading-relaxed">
                                    Verifiquei que as credenciais estão corretas
                                  </Label>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id="understood"
                                    checked={emailCreationChecklist.understood}
                                    onCheckedChange={(checked) =>
                                      setEmailCreationChecklist((prev) => ({ ...prev, understood: checked as boolean }))
                                    }
                                  />
                                  <Label htmlFor="understood" className="cursor-pointer text-sm leading-relaxed">
                                    Entendo que credenciais inválidas resultarão em rejeição
                                  </Label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={handleCancel}>
                            {t("cancel_button").toUpperCase()}
                          </Button>
                          <Button 
                            onClick={handleSubmitProofs} 
                            disabled={isApplying || (isEmailCreationJob && !isEmailCreationComplete)}
                            className="min-w-[140px] glow-effect"
                          >
                            {isApplying ? t("submitting").toUpperCase() : t("submit_proofs").toUpperCase()}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          {t("contractor_requested_proofs")}
                        </p>
                        {(showSubmittedBanner || myApplication?.status === 'submitted') && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t('proofs_submitted_success')}</AlertTitle>
                            <AlertDescription>{t('proofs_submitted_description')}</AlertDescription>
                          </Alert>
                        )}
                        {myApplication?.status === 'approved' && (
                          <>
                            <Alert className="bg-success/10 border-success/20">
                              <CheckCircle className="h-4 w-4 text-success" />
                              <AlertTitle className="text-success">{t('approved')}</AlertTitle>
                              <AlertDescription>{t('task_approved_description', { jobTitle: job.title })}</AlertDescription>
                            </Alert>

                            {/* Seção de Avaliação da Tarefa */}
                            {!myApplication.feedback?.rating ? (
                              <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-lg">
                                    <Star className="w-5 h-5 text-warning" />
                                    Avaliar esta Tarefa
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    Compartilhe sua experiência e ganhe até 50 XP!
                                  </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Classificação</label>
                                    <div className="flex items-center gap-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setJobRating(star)}
                                          className="p-1 transition-transform hover:scale-110"
                                        >
                                          <Star
                                            className={`w-8 h-8 ${
                                              jobRating >= star
                                                ? 'fill-warning text-warning'
                                                : 'text-muted-foreground'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        {jobRating > 0 ? `${jobRating}/5` : 'Selecione'}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Comentário (opcional)
                                    </label>
                                    <Textarea
                                      placeholder="Compartilhe sua experiência com esta tarefa..."
                                      value={jobComment}
                                      onChange={(e) => setJobComment(e.target.value)}
                                      rows={3}
                                      className="resize-none"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="text-2xl">✨</div>
                                    <div className="flex-1 text-sm">
                                      <p className="font-semibold text-foreground">Ganhe XP por avaliar!</p>
                                      <p className="text-muted-foreground text-xs">
                                        {jobRating >= 4 ? '+50 XP' : jobRating > 0 ? '+30 XP' : '+30-50 XP'} por enviar sua avaliação
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    onClick={handleSubmitJobRating}
                                    disabled={isSubmittingRating || jobRating === 0}
                                    className="w-full glow-effect"
                                  >
                                    {isSubmittingRating ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Enviando...
                                      </>
                                    ) : (
                                      <>
                                        <Star className="w-4 h-4 mr-2" />
                                        Enviar Avaliação
                                      </>
                                    )}
                                  </Button>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card className="border-success/20 bg-success/5">
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2 text-lg text-success">
                                    <CheckCircle className="w-5 h-5" />
                                    Avaliação Enviada
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-5 h-5 ${
                                          myApplication.feedback.rating >= star
                                            ? 'fill-warning text-warning'
                                            : 'text-muted-foreground'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 text-sm font-semibold">
                                      {myApplication.feedback.rating}/5
                                    </span>
                                  </div>
                                  {myApplication.feedback.comment && (
                                    <div className="bg-muted/30 p-3 rounded-lg">
                                      <p className="text-sm text-foreground">
                                        {myApplication.feedback.comment}
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Obrigado pelo seu feedback!
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        )}
                        {job.proofRequirements.map((proofReq) => (
                          <div key={proofReq.id} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex items-center space-x-2 mb-2">
                              {proofReq.isRequired ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-success" />}
                              <span className="font-medium text-foreground">{proofReq.label}</span>
                              {proofReq.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  {t("required")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">{proofReq.description}</p>
                            <p className="text-xs text-muted-foreground ml-6 mt-1">
                              {t("type")}: <span className="font-medium">{
                                proofReq.type === 'screenshot' ? t('screenshot') :
                                proofReq.type === 'file' ? t('file') :
                                proofReq.type === 'url' ? t('link_url') : t('text_response')
                              }</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground italic">
                      {t("no_proof_requirements")}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Message for users who can't apply */}
        {!canApply && (
          <Card className="bg-card border-border shadow-md">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {currentUser && job.posterId === currentUser.uid 
                  ? t("your_own_job") 
                  : job.status !== 'active' 
                    ? t("task_inactive") 
                    : t("login_to_apply")
                }
              </p>
              {!currentUser && (
                <Button className="mt-4 glow-effect" onClick={() => navigate('/')}>
                  {t("login_button")}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Anúncio</DialogTitle>
            <DialogDescription>Atualize informações básicas do anúncio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Localização</label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Data limite</label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {isAdmin ? 'Como administrador, você pode remover imediatamente.' : 'Você só pode remover anúncios concluídos com todas as vagas preenchidas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} disabled={!canDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
      {isApplying && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md space-y-2 p-4 bg-card border border-border rounded-lg shadow-md z-50">
          <p className="text-sm text-muted-foreground">Enviando suas provas... aguarde</p>
          <Progress value={overallProgress} />
        </div>
      )}
    </>
  );
};

export default JobDetails;