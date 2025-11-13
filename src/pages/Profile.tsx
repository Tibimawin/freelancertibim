import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  TrendingUp, 
  DollarSign,
  Settings,
  Edit,
  Save,
  X,
  BarChart3,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Lock,
  KeyRound,
  Smartphone,
  LogOut,
  MailCheck
} from "lucide-react";
import ModeToggle from "@/components/ModeToggle";
import SocialMediaManager from "@/components/SocialMediaManager";
import SettingsManager from "@/components/SettingsManager";
import VerificationForm from "@/components/VerificationForm"; // Importando o novo componente
import { useLocation, Link, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import AvatarService from '@/services/avatarService';
import { useSettings } from "@/hooks/useSettings";
import { AuthService } from "@/services/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReportModal from '@/components/ReportModal';
import { Application, Job } from '@/types/firebase';
import { ApplicationService } from '@/services/applicationService';
import { JobService } from '@/services/firebase';
import DirectChatThread from '@/components/DirectChatThread';
// Upload de avatar removido: não usamos mais Cloudinary aqui
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Profile = () => {
  const { userData, currentUser, updateUserData } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  const { t } = useTranslation();
  const { uid } = useParams();
  const isViewingOtherUser = !!uid && currentUser && uid !== currentUser.uid;
  const [viewedUserData, setViewedUserData] = useState<any | null>(null);
  const displayUser = isViewingOtherUser ? viewedUserData : userData;
  const [showReportModal, setShowReportModal] = useState(false);
  const blockedUsers = (userData?.blockedUsers || []) as string[];
  const isBlocked = isViewingOtherUser && blockedUsers.includes(uid as string);
  const [eligibleContractorApplication, setEligibleContractorApplication] = useState<Application | null>(null);
  const [contractorRatingState, setContractorRatingState] = useState<{ rating: number; comment: string }>({ rating: 0, comment: "" });
  const [isSubmittingContractorFeedback, setIsSubmittingContractorFeedback] = useState<boolean>(false);
  const [eligibleContractorJob, setEligibleContractorJob] = useState<Job | null>(null);
  const [showDirectChat, setShowDirectChat] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);

  // Removidos limites e tipos de upload: fluxo agora é somente seleção de avatares padrão

  const [activeTab, setActiveTab] = useState(initialTab);

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    bio: userData?.bio || "",
    phone: userData?.phone || "",
    location: userData?.location || "",
    skills: userData?.skills?.join(", ") || "",
  });

  useEffect(() => {
    // Sincronizar formData com usuário exibido (próprio ou outro)
    const base = displayUser || userData;
    setFormData({
      name: base?.name || "",
      bio: base?.bio || "",
      phone: base?.phone || "",
      location: base?.location || "",
      skills: base?.skills?.join(", ") || "",
    });
  }, [userData, displayUser]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Carregar avatares padrão do RTDB (com fallback)
  useEffect(() => {
    const loadAvatars = async () => {
      const urls = await AvatarService.getDefaultAvatars();
      setDefaultAvatars(urls);
    };
    if (!isViewingOtherUser) {
      loadAvatars();
    }
  }, [isViewingOtherUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const skillsArray = formData.skills
        .split(",")
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      await updateUserData({
        name: formData.name,
        bio: formData.bio,
        phone: formData.phone,
        location: formData.location,
        skills: skillsArray,
      });

      setIsEditing(false);
      toast({
        title: t("profile_updated"),
        description: t("profile_updated_description"),
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: t("error_saving"),
        description: t("error_saving_description"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de upload removidas: seleção de avatar padrão substitui o fluxo

  const handleCancel = () => {
    // Resetar o formulário para os dados atuais do usuário exibido
    setFormData({
      name: displayUser?.name || "",
      bio: displayUser?.bio || "",
      phone: displayUser?.phone || "",
      location: displayUser?.location || "",
      skills: displayUser?.skills?.join(", ") || "",
    });
    setIsEditing(false);
  };
  
  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("verified")}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            {t("pending_status")}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t("rejected_status")}
          </Badge>
        );
      case 'incomplete':
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {t("incomplete_status")}
          </Badge>
        );
    }
  };

  // Buscar dados do usuário quando visualizando perfil de outro
  useEffect(() => {
    const fetchViewedUser = async () => {
      if (isViewingOtherUser && uid) {
        try {
          const userRef = doc(db, 'users', uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setViewedUserData({ id: snap.id, ...snap.data() });
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
        }
      }
    };
    fetchViewedUser();
  }, [isViewingOtherUser, uid]);

  // Encontrar aplicação aprovada elegível para avaliar o contratante visualizado
  useEffect(() => {
    const findEligibleApplication = async () => {
      if (isViewingOtherUser && currentUser && uid) {
        try {
          const applications = await ApplicationService.getUserApplications(currentUser.uid, 'approved');
          for (const app of applications) {
            if (app.contractorFeedback?.rating) continue;
            const job = await JobService.getJobById(app.jobId);
            if (job && job.posterId === uid) {
              setEligibleContractorApplication(app);
              setEligibleContractorJob(job);
              break;
            }
          }
        } catch (error) {
          console.error('Erro ao verificar aplicações elegíveis:', error);
        }
      }
    };
    findEligibleApplication();
  }, [isViewingOtherUser, currentUser, uid]);

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-foreground p-8 bg-card rounded-lg shadow-lg">
          <p className="text-muted-foreground">{t("loading_profile")}</p>
        </div>
      </div>
    );
  }

  const handleBlockUser = async () => {
    if (!currentUser || !uid) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(uid),
        updatedAt: Timestamp.now(),
      } as any);
      toast({ title: 'Usuário bloqueado', description: 'Você não verá mais conteúdo deste usuário.' });
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      toast({ title: 'Erro ao bloquear', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    }
  };

  const handleUnblockUser = async () => {
    if (!currentUser || !uid) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(uid),
        updatedAt: Timestamp.now(),
      } as any);
      toast({ title: 'Usuário desbloqueado', description: 'Você voltou a ver conteúdo deste usuário.' });
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      toast({ title: 'Erro ao desbloquear', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    }
  };

  const handleSetContractorRating = (rating: number) => {
    setContractorRatingState(prev => ({ ...prev, rating }));
  };

  const handleSetContractorComment = (comment: string) => {
    setContractorRatingState(prev => ({ ...prev, comment }));
  };

  const handleSubmitContractorRating = async () => {
    if (!eligibleContractorApplication) return;
    try {
      setIsSubmittingContractorFeedback(true);
      await ApplicationService.submitContractorFeedback(
        eligibleContractorApplication.id,
        contractorRatingState.rating,
        contractorRatingState.comment
      );
      // Atualizar visual local para exibir avaliação registrada
      setEligibleContractorApplication(prev => prev ? ({
        ...prev,
        contractorFeedback: {
          rating: contractorRatingState.rating,
          comment: contractorRatingState.comment,
          providedAt: new Date() as any,
        }
      }) : prev);
      toast({ title: t('submit_contractor_rating'), description: t('rating_submitted_successfully') });
    } catch (error: any) {
      console.error('Erro ao enviar avaliação do contratante:', error);
      toast({ title: 'Erro', description: error?.message || 'Não foi possível enviar a avaliação.', variant: 'destructive' });
    } finally {
      setIsSubmittingContractorFeedback(false);
    }
  };

  // Indicar visualmente quando o avatar é um dos padrão
  const isDefaultAvatar = !!displayUser?.avatarUrl && defaultAvatars.includes(displayUser.avatarUrl);

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header do Perfil */}
          <Card className="mb-8 bg-card border-border shadow-md">
            <CardHeader>
              {!displayUser ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex items-center space-x-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-3 w-full max-w-md">
                      <Skeleton className="h-8 w-48" />
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                      <Skeleton className="h-4 w-72" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-primary/50 shadow-lg cursor-pointer" onClick={() => { if (!isViewingOtherUser) setAvatarPickerOpen(true); }}>
                        <AvatarImage src={displayUser?.avatarUrl || ""} />
                        <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                          {(displayUser?.name?.charAt(0) || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isDefaultAvatar && (
                        <Badge variant="secondary" className="absolute -bottom-2 left-1 text-[10px] px-1 py-0.5">Padrão</Badge>
                      )}
                    </div>
                    {!isViewingOtherUser && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-muted-foreground">Clique na foto para escolher entre 10 imagens padrão do site.</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-foreground">{displayUser?.name || ''}</h1>
                        <Badge variant={displayUser?.currentMode === 'tester' ? 'default' : 'secondary'}>
                          {displayUser?.currentMode === 'tester' ? t("freelancer") : t("contractor")}
                        </Badge>
                        {getVerificationBadge(displayUser?.verificationStatus as any)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{displayUser?.email || ''}</span>
                        </div>
                        
                        {displayUser?.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{displayUser?.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{t("member_since")} {displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('pt-BR') : ''}</span>
                        </div>
                      </div>
                      
                      {displayUser.bio && (
                        <p className="text-muted-foreground max-w-md">{displayUser.bio}</p>
                      )}
                    </div>
                  </div>
                  {!isViewingOtherUser ? (
                    <Button
                      variant={isEditing ? "destructive" : "outline"}
                      onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                      className="flex items-center space-x-2 mt-4 md:mt-0"
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                      <span>{isEditing ? t("cancel") : t("edit_profile")}</span>
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                      {eligibleContractorApplication && (
                        <Button variant="default" onClick={() => setActiveTab('overview')}>
                          {t('rate_contractor')}
                        </Button>
                      )}
                      {/* Iniciar conversa com o usuário */}
                      {!isBlocked && (
                        <Button
                          variant="default"
                          onClick={() => setShowDirectChat((v) => !v)}
                        >
                          {showDirectChat ? t('close_chat') : t('start_conversation')}
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setShowReportModal(true)}>
                        {t('report_contractor')}
                      </Button>
                      {isBlocked ? (
                        <Button variant="destructive" onClick={handleUnblockUser}>Desbloquear</Button>
                      ) : (
                        <Button variant="secondary" onClick={handleBlockUser}>Bloquear</Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Seletor de avatar padrão */}
          {!isViewingOtherUser && (
            <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Escolha sua foto de perfil</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {defaultAvatars.map((url) => (
                    <button key={url} className="rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary focus:outline-none" onClick={async () => {
                      if (!currentUser) return;
                      try {
                        await updateUserData({ avatarUrl: url });
                        setAvatarPickerOpen(false);
                        toast({ title: 'Foto atualizada', description: 'Sua foto de perfil foi alterada com sucesso.' });
                      } catch (e: any) {
                        toast({ title: 'Erro ao salvar', description: e?.message || 'Falha ao atualizar foto.', variant: 'destructive' });
                      }
                    }}>
                      <img src={url} alt="Avatar padrão" className="w-full h-28 object-cover" />
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {/* Chat direto entre usuários (renderizado abaixo do cabeçalho quando habilitado) */}
          {isViewingOtherUser && showDirectChat && uid && (
            <div className="mb-6">
              <DirectChatThread
                recipientUserId={uid}
                disabled={
                  (userData?.settings && userData.settings.allowDirectMessages === false) ||
                  (displayUser?.settings && displayUser.settings.allowDirectMessages === false) ||
                  isBlocked
                }
              />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/** Definir número de colunas conforme abas disponíveis */}
            <TabsList className={`grid w-full ${!isViewingOtherUser ? 'grid-cols-4' : 'grid-cols-2'}`}>
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="stats">{t("stats")}</TabsTrigger>
              {!isViewingOtherUser && (
                <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
              )}
              {!isViewingOtherUser && (
                <TabsTrigger value="security">Segurança</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informações Pessoais */}
                <div className="lg:col-span-2">
                  <Card className="mb-6 bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-electric-purple" />
                        <span>{t("personal_information")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">{t("full_name")}</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="bio">{t("bio")}</Label>
                            <Textarea
                              id="bio"
                              placeholder={t("tell_about_yourself")}
                              value={formData.bio}
                              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">{t("phone")}</Label>
                            <Input
                              id="phone"
                              placeholder="(11) 99999-9999"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="location">{t("location")}</Label>
                            <Input
                              id="location"
                              placeholder="São Paulo, SP"
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="skills">{t("skills")}</Label>
                            <Input
                              id="skills"
                              placeholder="React, JavaScript, Mobile Testing..."
                              value={formData.skills}
                              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                            />
                          </div>
                          
                          <Button onClick={handleSave} disabled={isLoading} className="w-full glow-effect">
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? t("saving") : t("save_changes")}
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Mobile: Accordion compact view */}
                          <div className="md:hidden">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="basic">
                                <AccordionTrigger>
                                  <span className="text-sm font-medium">{t("personal_information")}</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">{t("name")}</Label>
                                      <p className="text-sm text-foreground">{displayUser?.name}</p>
                                    </div>
                                    {displayUser?.bio && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground">{t("bio")}</Label>
                                        <p className="text-sm text-foreground">{displayUser?.bio}</p>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="contact">
                                <AccordionTrigger>
                                  <span className="text-sm font-medium">{t("contact")}</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3">
                                    {displayUser?.phone && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground">{t("phone")}</Label>
                                        <p className="text-sm text-foreground">{displayUser?.phone}</p>
                                      </div>
                                    )}
                                    {displayUser?.location && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground">{t("location")}</Label>
                                        <p className="text-sm text-foreground">{displayUser?.location}</p>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                              {Array.isArray(displayUser?.skills) && displayUser?.skills.length > 0 && (
                                <AccordionItem value="skills">
                                  <AccordionTrigger>
                                    <span className="text-sm font-medium">{t("skills")}</span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {displayUser?.skills?.map((skill: string, index: number) => (
                                        <Badge key={index} variant="outline" className="bg-muted/30 text-muted-foreground border-border">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )}
                            </Accordion>
                          </div>

                          {/* Desktop: Original detailed view */}
                          <div className="hidden md:block space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">{t("name")}</Label>
                              <p className="text-foreground">{displayUser?.name}</p>
                            </div>
                            
                            {displayUser?.bio && (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">{t("bio")}</Label>
                                <p className="text-foreground">{displayUser?.bio}</p>
                              </div>
                            )}
                            
                            {displayUser?.phone && (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">{t("phone")}</Label>
                                <p className="text-foreground">{displayUser?.phone}</p>
                              </div>
                            )}
                            
                            {displayUser?.location && (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">{t("location")}</Label>
                                <p className="text-foreground">{displayUser?.location}</p>
                              </div>
                            )}
                            
                            {Array.isArray(displayUser?.skills) && displayUser?.skills.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">{t("skills")}</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {displayUser?.skills?.map((skill: string, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-muted/30 text-muted-foreground border-border">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Formulário de Verificação de Identidade */}
                  <VerificationForm />
                </div>

                {/* Quick Stats */}
                {isViewingOtherUser && eligibleContractorApplication && (
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Star className="h-5 w-5 text-star-glow" />
                        <span>{t("rate_contractor")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Contexto do job e contratante */}
                      <div className="text-sm text-muted-foreground">
                        {eligibleContractorJob?.title && (
                          <div>
                            {t('job')}: {eligibleContractorJob.title}
                          </div>
                        )}
                        {eligibleContractorJob?.posterName && (
                          <div>
                            {t('contractor')}: {eligibleContractorJob.posterName}
                          </div>
                        )}
                      </div>

                      {/* Exibição da avaliação enviada */}
                      {eligibleContractorApplication.contractorFeedback?.rating ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, idx) => (
                              <Star key={idx} className={`h-4 w-4 ${ (eligibleContractorApplication.contractorFeedback!.rating) > idx ? 'fill-star-glow text-star-glow' : 'text-muted-foreground' }`} />
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {t('your_contractor_rating')} {eligibleContractorApplication.contractorFeedback.rating.toFixed(1)}/5
                            </span>
                          </div>
                          {eligibleContractorApplication.contractorFeedback.comment && (
                            <p className="mt-1 text-sm">{eligibleContractorApplication.contractorFeedback.comment}</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            {[1,2,3,4,5].map((i) => (
                              <button
                                key={i}
                                type="button"
                                className="p-1"
                                onClick={() => handleSetContractorRating(i)}
                              >
                                <Star className={`h-5 w-5 ${ (contractorRatingState.rating || 0) >= i ? 'fill-star-glow text-star-glow' : 'text-muted-foreground' }`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="w-full rounded-md border border-border bg-input p-2 text-sm"
                            placeholder={t('optional_comment')}
                            value={contractorRatingState.comment}
                            onChange={(e) => handleSetContractorComment(e.target.value)}
                          />
                          <Button 
                            className="glow-effect"
                            onClick={handleSubmitContractorRating}
                            disabled={isSubmittingContractorFeedback || contractorRatingState.rating === 0}
                          >
                            {isSubmittingContractorFeedback ? t('saving') : t('submit_contractor_rating')}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
                <div className="space-y-6">
                  <Card className="bg-card border-border shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-cosmic-blue" />
                        <span>{t("your_stats")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("completed_tasks")}</span>
                          <span className="font-semibold text-foreground">{displayUser?.completedTests ?? 0}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("average_rating")}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-star-glow text-star-glow" />
                          <span className="font-semibold text-foreground">{(displayUser.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("approval_rate")}</span>
                        <span className="font-semibold text-success">{displayUser?.approvalRate || 0}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("current_balance")}</span>
                        <span className="font-semibold text-foreground">
                          {(
                            displayUser?.currentMode === 'tester'
                              ? (displayUser?.testerWallet?.availableBalance ?? 0)
                              : (displayUser?.posterWallet?.balance ?? 0)
            ).toFixed(2)} Kz
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border-border shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_completed_tasks")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{displayUser?.completedTests ?? 0}</div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% {t("this_month")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_earnings")}</CardTitle>
                  </CardHeader>
                  <CardContent>
        <div className="text-2xl font-bold text-foreground">{(displayUser?.testerWallet?.totalEarnings ?? 0).toFixed(2)} Kz</div>
                    <div className="flex items-center text-xs text-success">
                      <DollarSign className="h-3 w-3 mr-1" />
        +340 Kz {t("this_month")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("average_rating_label")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{(displayUser?.rating ?? 0).toFixed(1)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 fill-star-glow text-star-glow" />
                      {t("excellent")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("approval_rate_label")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{displayUser?.approvalRate ?? 0}%</div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {t("above_average")}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            { !isViewingOtherUser && (
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configurações da Conta */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-electric-purple" />
                      <span>{t("account_settings")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("manage_preferences_basic_settings")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("current_mode_label")}</Label>
                    <Select value={userData.currentMode} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tester">{t("freelancer")}</SelectItem>
                        <SelectItem value="poster">{t("contractor")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t("use_toggle_to_change_mode")}
                    </p>
                  </div>

                    <div className="space-y-2">
                      <Label>{t("account_email")}</Label>
                      <Input value={currentUser.email || ""} disabled />
                      <p className="text-xs text-muted-foreground">
                        {t("email_cannot_be_changed")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("account_status")}</Label>
                      <div className="flex items-center space-x-2">
                        {getVerificationBadge(userData.verificationStatus)}
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {t("premium")}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" asChild>
                      <Link to="/profile?tab=settings">
                        {t("change_password")}
                      </Link>
                    </Button>
                    
                    <ModeToggle />
                  </CardContent>
                </Card>

                {/* Redes Sociais */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-cosmic-blue" />
                      <span>{t("social_media")}</span>
                    </CardTitle>
                    <CardDescription>
                      {t("connect_social_media")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SocialMediaManager />
                  </CardContent>
                </Card>
              </div>
              
              {/* Configurações Avançadas */}
              <div className="lg:col-span-2">
                <SettingsManager />
              </div>
            </TabsContent>
            )}

            { !isViewingOtherUser && (
            <TabsContent value="security" className="space-y-6">
              {/** Hook de configurações para senha e alertas de login */}
              {/** Estados locais para operações de segurança */}
              {(() => {
                // Estados dentro de uma IIFE para evitar declarar no topo de arquivo imenso
                // Em projetos maiores, ideal extrair para componente.
                const SecuritySection = () => {
                  const { currentUser, userData, signOut } = useAuth();
                  const { settings, updateSettings, resetPassword } = useSettings();
                  const { toast } = useToast();

                  const [currentPassword, setCurrentPassword] = useState("");
                  const [newPassword, setNewPassword] = useState("");
                  const [confirmPassword, setConfirmPassword] = useState("");
                  const [passwordLoading, setPasswordLoading] = useState(false);

                  const [emailLoading, setEmailLoading] = useState(false);

                  const [phoneNumber, setPhoneNumber] = useState("");
                  const [verificationId, setVerificationId] = useState<string | null>(null);
                  const [mfaCode, setMfaCode] = useState("");
                  const [mfaLoading, setMfaLoading] = useState(false);
                  const [recaptchaRefId] = useState("recaptcha-security-mfa");

                  const handleResendEmailVerification = async () => {
                    try {
                      setEmailLoading(true);
                      await AuthService.resendVerificationEmail();
                      toast({ title: "E-mail de verificação reenviado", description: "Verifique sua caixa de entrada." });
                    } catch (e: any) {
                      toast({ title: "Falha ao reenviar verificação", description: e?.message || "Tente novamente mais tarde.", variant: "destructive" });
                    } finally {
                      setEmailLoading(false);
                    }
                  };

                  const handleChangePassword = async () => {
                    if (newPassword.length < 6) {
                      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      toast({ title: "Confirmação diferente", description: "A nova senha e a confirmação não coincidem.", variant: "destructive" });
                      return;
                    }
                    try {
                      setPasswordLoading(true);
                      await resetPassword(currentPassword, newPassword);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      toast({ title: "Senha atualizada", description: "Sua senha foi alterada com sucesso." });
                    } catch (e: any) {
                      toast({ title: "Erro ao alterar senha", description: e?.message || "Verifique sua senha atual.", variant: "destructive" });
                    } finally {
                      setPasswordLoading(false);
                    }
                  };

                  const handleToggleLoginAlerts = async () => {
                    try {
                      await updateSettings({ loginAlerts: !settings?.loginAlerts });
                      toast({ title: "Preferência atualizada", description: `Alertas de login ${!settings?.loginAlerts ? 'ativados' : 'desativados'}.` });
                    } catch (e: any) {
                      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
                    }
                  };

                  const handleStartMfa = async () => {
                    if (!phoneNumber) {
                      toast({ title: "Informe o número", description: "Digite um telefone válido para SMS.", variant: "destructive" });
                      return;
                    }
                    try {
                      setMfaLoading(true);
                      const { verificationId: vid } = await AuthService.startMfaEnrollment(phoneNumber, recaptchaRefId);
                      setVerificationId(vid);
                      toast({ title: "Código enviado", description: "Digite o código recebido por SMS." });
                    } catch (e: any) {
                      toast({ title: "Falha ao iniciar MFA", description: e?.message || "Tente novamente mais tarde.", variant: "destructive" });
                    } finally {
                      setMfaLoading(false);
                    }
                  };

                  const handleConfirmMfa = async () => {
                    if (!verificationId || !mfaCode) {
                      toast({ title: "Dados incompletos", description: "Envie o código e informe o SMS recebido.", variant: "destructive" });
                      return;
                    }
                    try {
                      setMfaLoading(true);
                      await AuthService.confirmMfaEnrollment(verificationId, mfaCode);
                      setVerificationId(null);
                      setMfaCode("");
                      toast({ title: "MFA ativada", description: "Autenticação por SMS foi habilitada." });
                    } catch (e: any) {
                      toast({ title: "Falha ao confirmar MFA", description: e?.message || "Verifique o código e tente novamente.", variant: "destructive" });
                    } finally {
                      setMfaLoading(false);
                    }
                  };

                  const handleSignOut = async () => {
                    try {
                      await signOut();
                    } catch (e: any) {
                      toast({ title: "Erro ao sair", description: e?.message || "Tente novamente.", variant: "destructive" });
                    }
                  };

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Verificação de e-mail */}
                      <Card className="bg-card border-border shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <MailCheck className="h-5 w-5 text-electric-purple" />
                            <span>Verificação de e-mail</span>
                          </CardTitle>
                          <CardDescription>
                            Status: {currentUser?.emailVerified ? 'Verificado' : 'Não verificado'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button onClick={handleResendEmailVerification} disabled={emailLoading}>
                            {emailLoading ? 'Enviando...' : 'Reenviar verificação'}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Alterar senha */}
                      <Card className="bg-card border-border shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Lock className="h-5 w-5 text-cosmic-blue" />
                            <span>Alterar senha</span>
                          </CardTitle>
                          <CardDescription>Reautenticação necessária para mudar sua senha.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label>Senha atual</Label>
                            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••" />
                          </div>
                          <div>
                            <Label>Nova senha</Label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
                          </div>
                          <div>
                            <Label>Confirmar nova senha</Label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" />
                          </div>
                          <Button onClick={handleChangePassword} disabled={passwordLoading}>
                            {passwordLoading ? 'Atualizando...' : 'Salvar nova senha'}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Alertas de login */}
                      <Card className="bg-card border-border shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Shield className="h-5 w-5 text-electric-purple" />
                            <span>Alertas de login</span>
                          </CardTitle>
                          <CardDescription>Receba avisos quando sua conta for acessada.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status: {settings?.loginAlerts ? 'Ativado' : 'Desativado'}</span>
                          <Button variant="outline" onClick={handleToggleLoginAlerts}>
                            {settings?.loginAlerts ? 'Desativar' : 'Ativar'}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* MFA via SMS */}
                      <Card className="bg-card border-border shadow-md">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Smartphone className="h-5 w-5 text-cosmic-blue" />
                            <span>Autenticação em dois fatores (SMS)</span>
                          </CardTitle>
                          <CardDescription>Adicione uma camada extra de segurança usando código via SMS.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label>Número de telefone</Label>
                            <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+244 900 000 000" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={handleStartMfa} disabled={mfaLoading}>
                              {mfaLoading ? 'Enviando...' : 'Enviar código'}
                            </Button>
                            {verificationId && (
                              <>
                                <Input className="w-40" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="Código" />
                                <Button variant="secondary" onClick={handleConfirmMfa} disabled={mfaLoading}>Confirmar</Button>
                              </>
                            )}
                          </div>
                          <div id={recaptchaRefId} className="h-0 w-0 overflow-hidden" aria-hidden="true"></div>
                        </CardContent>
                      </Card>

                      {/* Sessões e dispositivo */}
                      <Card className="bg-card border-border shadow-md lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <KeyRound className="h-5 w-5 text-electric-purple" />
                            <span>Sessões e dispositivo</span>
                          </CardTitle>
                          <CardDescription>Informações da última atividade de login.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Último login IP</div>
                            <div className="font-medium text-foreground">{(userData as any)?.lastLoginIp || '—'}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Última atividade</div>
                            <div className="font-medium text-foreground">{(userData as any)?.lastLoginAt ? new Date((userData as any).lastLoginAt.toDate?.() || (userData as any).lastLoginAt).toLocaleString('pt-BR') : '—'}</div>
                          </div>
                          <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Sair da sessão
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  );
                };
                return <SecuritySection />;
              })()}
            </TabsContent>
            )}
          </Tabs>
          {/* Modal de Denúncia */}
          {isViewingOtherUser && (
            <ReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              reportedUserId={(displayUser?.id as string) || (uid as string)}
              reportedUserName={displayUser?.name}
              reportedUserEmail={displayUser?.email}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;