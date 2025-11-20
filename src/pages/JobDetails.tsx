import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, User, Calendar, Upload, ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Job, Application } from "@/types/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { JobService } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { ApplicationService } from "@/services/applicationService";
import { useTranslation } from 'react-i18next';
import JobComments from '@/components/JobComments';
import { CloudinaryService } from '@/lib/cloudinary';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useAdmin } from '@/contexts/AdminContext';

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
  const [ytEmbedOpen, setYtEmbedOpen] = useState(false);
  const [ytWatchElapsed, setYtWatchElapsed] = useState(0);
  const [ytSubscribedConfirmed, setYtSubscribedConfirmed] = useState(false);
  const [ytIsPlaying, setYtIsPlaying] = useState(false);
  const ytPlayerRef = useRef<any>(null);
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
  const isTikTokJob = Boolean(job?.tiktok) || ((job?.subcategory || '').toLowerCase().includes('tiktok'));
  const isVKJob = Boolean(job?.vk) || ((job?.subcategory || '').toLowerCase().includes('vk'));
  const ytRequiredSeconds = job?.youtube?.viewTimeSeconds || 30;
  const ytCanSubmit = isYouTubeJob && (job?.youtube?.actionType === 'watch' ? ytWatchElapsed >= ytRequiredSeconds : ytSubscribedConfirmed);
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
  const ytVideoId = job?.youtube?.videoUrl ? extractYouTubeId(job.youtube.videoUrl) : '';

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


  const handleProofChange = (requirementId: string, field: 'text' | 'comment', value: string) => {
    setProofs(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        [field]: value,
        file: prev[requirementId]?.file || null
      }
    }));
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

    if (isYouTubeJob) {
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
        if (myApplication) {
          const folder = `jobs/${job.id}/applications/${myApplication.id}`;
          const proofsToSubmit = [
            {
              requirementId: 'youtube_watch',
              type: 'text',
              content: `Watched ${ytRequiredSeconds}s`,
              comment: 'Auto-confirmed watch',
            },
          ];
          await ApplicationService.submitProofs(myApplication.id, proofsToSubmit as any);
          await ApplicationService.reviewApplication(myApplication.id, 'approved', job.posterId);
          toast({
            title: t("proofs_submitted_success"),
            description: t('task_auto_approved'),
          });
          setShowSubmittedBanner(true);
        }
      } catch (error: any) {
        toast({ title: t('error'), description: String(error?.message || error) });
      } finally {
        setIsApplying(false);
      }
    } else if (isTikTokJob) {
      if (!tkCanSubmit) {
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
    } else if (isVKJob) {
      if (!vkJoinConfirmed) {
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
    } else {
      const requiredProofs = job.proofRequirements?.filter(req => req.isRequired) || [];
      const missingProofs = requiredProofs.filter(req => {
        const proof = proofs[req.id];
        return !proof || (!proof.text && !proof.file);
      });

      if (missingProofs.length > 0) {
        toast({
          title: t("missing_required_proofs"),
          description: t("missing_required_proofs_description"),
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
        try {
          const refreshed = await JobService.getJobById(job.id);
          if (refreshed) {
            setJob({
              ...refreshed,
              detailedInstructions: refreshed.detailedInstructions || [],
              proofRequirements: refreshed.proofRequirements || [],
            } as any);
          }
        } catch {}
      }
      
      // Preparar provas para envio com upload ao Cloudinary (screenshots/arquivos)
      const folder = `proofs/${currentUser.uid}/${job.id}`;
      const proofsToSubmit: any[] = isYouTubeJob
        ? [
            {
              requirementId: 'youtube_channel',
              type: 'url',
              content: userData?.settings?.socialAccounts?.youtube || '',
              comment: 'Canal do YouTube vinculado',
            },
          ]
        : await Promise.all((job.proofRequirements || []).map(async (req) => {
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

      // Enviar provas
      await ApplicationService.submitProofs(applicationId, proofsToSubmit);
      
      toast({
        title: t("proofs_submitted_success"),
        description: t("proofs_submitted_description"),
      });
      setShowSubmittedBanner(true);
      try {
        const applications = await ApplicationService.getApplicationsForJob(job.id);
        if (currentUser) {
          const mine = applications.find(app => app.testerId === currentUser.uid) || null;
          setMyApplication(mine);
        }
      } catch {}
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
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground italic">
                    {t("no_detailed_instructions")}
                  </p>
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
              <span>{t("proof_requirements")}</span>
            </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
            {isYouTubeJob ? (
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
                      {(!ytVideoId || job?.youtube?.actionType === 'subscribe') && (
                        <div className="flex items-center gap-3">
                          <Button variant="outline" onClick={() => window.open(job?.youtube?.videoUrl || '', '_blank')}>{t('open_video')}</Button>
                          {job?.youtube?.actionType === 'subscribe' && (
                            <Button variant={ytSubscribedConfirmed ? 'default' : 'secondary'} onClick={() => setYtSubscribedConfirmed(!ytSubscribedConfirmed)}>
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
                    <p className="text-sm text-muted-foreground">{t('youtube_verification_info')}</p>
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
                        <span>{t('tiktok_verification_info')}</span>
                      </div>
                      <Button onClick={handleSubmitProofs} disabled={!tkCanSubmit || isApplying} className="glow-effect">
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
                        <span>{t('vk_verification_info')}</span>
                      </div>
                    <Button onClick={handleSubmitProofs} disabled={!vkJoinConfirmed || isApplying} className="glow-effect">
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
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>{t('approved')}</AlertTitle>
                            <AlertDescription>{t('task_approved_description', { jobTitle: job.title })}</AlertDescription>
                          </Alert>
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