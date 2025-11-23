import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, TrendingUp, Loader2, Plus, RefreshCw, LayoutGrid, List, PanelsTopLeft, AlertCircle } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import LandingContent from "@/components/LandingContent";
import JobCard from "@/components/JobCard";
import WalletCard from "@/components/WalletCard";
import FilterDialog from "@/components/FilterDialog";
import XPRanking from "@/components/XPRanking";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/useFirebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { LevelService } from "@/services/levelService";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ServicesPage from "@/pages/Services";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { userData, currentUser, switchUserMode } = useAuth();
  const [jobsLimit, setJobsLimit] = useState(10);
  const { jobs, loading: jobsLoading } = useJobs({ limitCount: jobsLimit });
  const navigate = useNavigate();
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'micro' | 'services'>('micro');
  const [viewMode, setViewMode] = useState<'grid' | 'panels' | 'list'>('list');
  const { t } = useTranslation();
  const [userLevelIndex, setUserLevelIndex] = useState<0 | 1 | 2>(0);
  const { settings } = useSettings();
  const [showTips, setShowTips] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const tasksTopRef = useRef<HTMLDivElement>(null);
  const [previousJobsCount, setPreviousJobsCount] = useState(0);
  const [newlyLoadedJobs, setNewlyLoadedJobs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    setShowTips(settings?.showOnboardingTips !== false);
  }, [settings?.showOnboardingTips]);

  // Detectar novas tarefas carregadas e aplicar animação
  useEffect(() => {
    if (jobs.length > previousJobsCount && previousJobsCount > 0) {
      // Identificar as novas tarefas (as que foram adicionadas)
      const newJobIds = new Set(
        jobs.slice(previousJobsCount).map(job => job.id)
      );
      setNewlyLoadedJobs(newJobIds);
      
      // Remover a marcação de "nova" após a animação terminar
      setTimeout(() => {
        setNewlyLoadedJobs(new Set());
      }, 1500);
    }
    setPreviousJobsCount(jobs.length);
  }, [jobs.length]);


  useEffect(() => {
    const computeLevel = async () => {
      if (!currentUser) return;
      try {
        const rs = await LevelService.getUserLevel(currentUser.uid);
        setUserLevelIndex(rs.levelIndex);
      } catch {
        setUserLevelIndex(0);
      }
    };
    computeLevel();
  }, [currentUser]);


  // Filtrar jobs baseado na dificuldade selecionada e gate por nível
  const maxAllowed = LevelService.maxAllowedBountyKZ(userLevelIndex);
  const filteredJobs = jobs.filter(job => {
    const byDifficulty = difficultyFilter ? job.difficulty === difficultyFilter : true;
    const byLevelGate = Number(job.bounty || 0) <= maxAllowed;
    return byDifficulty && byLevelGate;
  });

  const handleLoadMore = () => {
    const currentJobsCount = jobs.length;
    setLoadingMore(true);
    setJobsLimit(prev => prev + 10);
    
    // Scroll suave até o topo da lista após um pequeno delay para o conteúdo carregar
    setTimeout(() => {
      const newJobsCount = jobs.length - currentJobsCount;
      
      if (newJobsCount > 0) {
        toast({
          title: "✅ Tarefas carregadas!",
          description: `${newJobsCount} ${newJobsCount === 1 ? 'nova tarefa foi carregada' : 'novas tarefas foram carregadas'}.`,
          duration: 3000,
        });
      } else {
        toast({
          title: "📋 Sem mais tarefas",
          description: "Todas as tarefas disponíveis já foram carregadas.",
          duration: 3000,
        });
      }
      
      if (tasksTopRef.current) {
        tasksTopRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
      setLoadingMore(false);
    }, 600);
  };

  const hasMoreJobs = jobs.length >= jobsLimit;

  // Se o usuário não estiver logado, mostra apenas a página de apresentação
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <HeroSection />
        <LandingContent />
      </div>
    );
  }

  // Se o usuário estiver logado, mostra a interface da aplicação
  return (
    <div className="min-h-screen bg-background">
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Aviso: modo contratante não permite fazer tarefas */}
        {userData?.currentMode === 'poster' && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Você está no modo Contratante</AlertTitle>
              <AlertDescription>
                Para fazer tarefas criadas pelos contratantes, você precisa estar na conta Freelancer.
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => switchUserMode('tester')}>
                    Mudar para Freelancer
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
        {/* Ajuste do grid: lg:grid-cols-4 para desktop, grid-cols-1 para mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          
          {/* Sidebar (Mover para o topo em mobile: order-1) */}
          <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
            {/* Wallet Card */}
            <div className="hidden md:block" id="tour-wallet-card">
              <WalletCard />
            </div>

            {/* Quick Stats */}
            {userData && (
              <div className="rounded-xl bg-card p-6 shadow-md border border-border">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">{t("your_stats")}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("completed_tasks")}</span>
                    <span className="font-semibold text-foreground">{userData.completedTests || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("average_rating")}</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-foreground">{(userData.rating || 0).toFixed(1)}</span>
                      <TrendingUp className="h-3 w-3 text-success" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("approval_rate")}</span>
                    <span className="font-semibold text-success">{userData.approvalRate || 0}%</span>
                  </div>
                  
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <span className="text-sm text-muted-foreground">
                         {userData.currentMode === 'tester' ? t("available_balance") : t("current_balance")}
                       </span>
                       <span className="font-semibold text-foreground">
                         {userData.currentMode === 'tester' 
            ? `${(userData.testerWallet?.availableBalance || 0).toFixed(2)} Kz`
            : `${(userData.posterWallet?.balance || 0).toFixed(2)} Kz`
                         }
                       </span>
                     </div>
                     
                     {userData.currentMode === 'tester' && (
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground">{t("pending_balance")}</span>
                         <span className="font-medium text-warning">
          {(userData.testerWallet?.pendingBalance || 0).toFixed(2)} Kz
                         </span>
                       </div>
                     )}
                   </div>
                </div>
                
              {userData?.currentMode === 'poster' && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => navigate('/create-job')}
                    className="flex-1 glow-effect"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("create_job")}
                  </Button>
                  <Button 
                    onClick={() => navigate('/manage-applications')}
                    variant="outline"
                    className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
                  >
                    {t("manage_applications")}
                  </Button>
                </div>
              )}
              </div>
            )}

            {/* Ranking XP - Apenas na aba Micro Empregos */}
            {activeSection === 'micro' && <XPRanking />}

            {/* Tips Card */}
            <div className="rounded-xl bg-gradient-secondary p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">💡 {t("tip_of_the_day")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("tip_message")}
              </p>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {t("tip_number")}
              </Badge>
            </div>
        </div>

        {/* Main Content Area (Mover para baixo em mobile: order-2) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Barra superior como na imagem */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    className={`px-4 py-2 rounded-md font-medium ${activeSection === 'micro' ? 'bg-warning/20 text-warning border-b-2 border-warning' : 'text-foreground'}`}
                    onClick={() => setActiveSection('micro')}
                    data-tour="toggle-micro"
                  >
                    Micro Empregos
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md font-medium ${activeSection === 'services' ? 'bg-primary/15 text-primary border-b-2 border-primary' : 'text-foreground'}`}
                    onClick={() => setActiveSection('services')}
                    data-tour="toggle-services"
                  >
                    Serviços
                  </button>
                  {activeSection === 'micro' && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeSection === 'micro' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-pressed={viewMode === 'grid'}
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'text-primary bg-muted/30' : 'text-muted-foreground'}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-pressed={viewMode === 'panels'}
                        onClick={() => setViewMode('panels')}
                        className={viewMode === 'panels' ? 'text-primary bg-muted/30' : 'text-muted-foreground'}
                      >
                        <PanelsTopLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-pressed={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'text-primary bg-muted/30' : 'text-muted-foreground'}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {activeSection === 'services' && (
                    <Button className="glow-effect" onClick={() => navigate('/services/create')} data-tour="create-service">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Serviço
                    </Button>
                  )}
                </div>
              </div>
            </div>




            {activeSection === 'micro' ? (
              <>
                {/* Referência para scroll automático */}
                <div ref={tasksTopRef} className="scroll-mt-4" />
                
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
                    : viewMode === 'panels'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6'
                    : 'space-y-4 lg:space-y-6'
                }>
                {jobsLoading ? (
                  <div className="flex items-center justify-center py-8 lg:py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredJobs.length > 0 ? (
                  filteredJobs.map((job, index) => {
                    const isNewlyLoaded = newlyLoadedJobs.has(job.id);
                    const animationDelay = isNewlyLoaded 
                      ? `${(index - previousJobsCount + newlyLoadedJobs.size) * 0.1}s` 
                      : '0s';
                    
                    return (
                      <div
                        key={job.id}
                        className={isNewlyLoaded ? 'animate-fade-in animate-scale-in' : ''}
                        style={{ animationDelay }}
                      >
                        <JobCard 
                          {...job}
                          applicants={job.applicantCount}
                          postedBy={job.posterName}
                          posterId={job.posterId}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {difficultyFilter 
                        ? t("no_tasks_for_difficulty", { difficulty: difficultyFilter })
                        : t("no_tasks_found")}
                    </p>
                  </div>
                )}
              </div>
              </>
            ) : (
              <div className="mt-4">
                <ServicesPage hideHeader />
              </div>
            )}

            {activeSection === 'micro' && filteredJobs.length > 0 && hasMoreJobs && (
              <div className="text-center mt-4 md:mt-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-primary/50 text-primary hover:bg-primary/10"
                  onClick={handleLoadMore}
                  disabled={loadingMore || jobsLoading}
                >
                  {loadingMore || jobsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("load_more_tasks")
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        
      </main>
    </div>
  );
};

export default Index;