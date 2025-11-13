import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, TrendingUp, Loader2, Plus, RefreshCw, LayoutGrid, List, PanelsTopLeft, AlertCircle } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import LandingContent from "@/components/LandingContent";
import JobCard from "@/components/JobCard";
import WalletCard from "@/components/WalletCard";
import FilterDialog from "@/components/FilterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/useFirebase";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LevelService } from "@/services/levelService";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TaxonomyService, NamedItem, SubcategoryItem, PaymentRangeItem } from "@/services/taxonomyService";

const Index = () => {
  const { userData, currentUser, switchUserMode } = useAuth();
  const { jobs, loading: jobsLoading } = useJobs({ limitCount: 10 });
  const navigate = useNavigate();
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'micro' | 'surveys'>('micro');
  const [workLevel, setWorkLevel] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [payment, setPayment] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [stats, setStats] = useState<string | null>(null);
  // Listas dinâmicas do admin
  const [jobLevelOptions, setJobLevelOptions] = useState<NamedItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<NamedItem[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<SubcategoryItem[]>([]);
  const [paymentRangeOptions, setPaymentRangeOptions] = useState<PaymentRangeItem[]>([]);
  const [locationOptions, setLocationOptions] = useState<NamedItem[]>([]);
  const [statsLabelOptions, setStatsLabelOptions] = useState<NamedItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'panels' | 'list'>('list');
  const { t } = useTranslation(); // Initialize useTranslation
  const [userLevelIndex, setUserLevelIndex] = useState<0 | 1 | 2>(0);
  const { settings, updateSettings } = useSettings();
  const [showTips, setShowTips] = useState<boolean>(false);

  useEffect(() => {
    setShowTips(settings?.showOnboardingTips !== false);
  }, [settings?.showOnboardingTips]);

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

  // Carregar listas dinâmicas
  useEffect(() => {
    const loadTaxonomies = async () => {
      try {
        const [levels, cats, subs, pays, locs, stats] = await Promise.all([
          TaxonomyService.getJobLevels(),
          TaxonomyService.getCategories(),
          TaxonomyService.getSubcategories(),
          TaxonomyService.getPaymentRanges(),
          TaxonomyService.getLocations(),
          TaxonomyService.getStatsLabels(),
        ]);
        setJobLevelOptions(levels);
        setCategoryOptions(cats);
        setSubcategoryOptions(subs);
        setPaymentRangeOptions(pays);
        setLocationOptions(locs);
        setStatsLabelOptions(stats);
      } catch (e) {
        // silencioso: se falhar, mantém listas padrão estáticas
      }
    };
    loadTaxonomies();
  }, []);

  // Filtrar jobs baseado na dificuldade selecionada e gate por nível
  const maxAllowed = LevelService.maxAllowedBountyKZ(userLevelIndex);
  const filteredJobs = jobs.filter(job => {
    const byDifficulty = difficultyFilter ? job.difficulty === difficultyFilter : true;
    const byWorkLevel = workLevel ? job.difficulty === workLevel : true;
    const byCategory = category ? job.category === category : true;
    const bySubcategory = subcategory ? job.subcategory === subcategory : true;
    const byLocation = location ? (job.location || '').toLowerCase() === location.toLowerCase() : true;
    let byPayment = true;
    if (payment) {
      const bounty = Number(job.bounty || 0);
      const range = paymentRangeOptions.find((r) => r.id === payment);
      if (range) {
        const minOk = typeof range.min === 'number' ? bounty >= (range.min as number) : true;
        const maxOk = typeof range.max === 'number' ? bounty <= (range.max as number) : true;
        byPayment = minOk && maxOk;
      } else {
        // fallback para etiquetas antigas
        if (payment === 'Até 1.000 Kz') byPayment = bounty <= 1000;
        else if (payment === '1.000–5.000 Kz') byPayment = bounty > 1000 && bounty <= 5000;
        else if (payment === '> 5.000 Kz') byPayment = bounty > 5000;
      }
    }
    let byStats = true;
    if (stats === 'Alta aprovação') {
      const approval = typeof job.posterApprovalRate === 'number' ? job.posterApprovalRate : undefined;
      const rating = typeof job.posterRating === 'number' ? job.posterRating : (typeof job.rating === 'number' ? job.rating : undefined);
      byStats = (typeof approval === 'number' && approval >= 80) || (typeof rating === 'number' && rating >= 4.0);
    } else if (stats === 'Pagador confiável') {
      const rating = typeof job.posterRating === 'number' ? job.posterRating : (typeof job.rating === 'number' ? job.rating : 0);
      const count = typeof job.posterRatingCount === 'number' ? job.posterRatingCount : (typeof job.ratingCount === 'number' ? job.ratingCount : 0);
      byStats = rating >= 4.5 && count >= 10;
    }
    const byLevelGate = Number(job.bounty || 0) <= maxAllowed;
    return byDifficulty && byWorkLevel && byCategory && bySubcategory && byLocation && byPayment && byStats && byLevelGate;
  });

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
      <main className="container mx-auto px-4 py-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar (Mover para o topo em mobile: order-1) */}
          <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
            {/* Wallet Card */}
            <WalletCard />

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
                  >
                    Micro Empregos
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md font-medium ${activeSection === 'surveys' ? 'bg-warning/20 text-warning border-b-2 border-warning' : 'text-foreground'}`}
                    onClick={() => setActiveSection('surveys')}
                  >
                    Pesquisas pagas
                  </button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </div>
            </div>

            {/* Linha de filtros conforme imagem */}
            <div className="mb-8 rounded-md bg-muted/30 border border-border p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nível de trabalho</Label>
                  <Select value={workLevel || ''} onValueChange={(v) => setWorkLevel(v === 'all' ? null : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {(jobLevelOptions.length ? jobLevelOptions : [
                        { id: 'Fácil', name: 'Fácil' },
                        { id: 'Médio', name: 'Médio' },
                        { id: 'Difícil', name: 'Difícil' },
                      ]).map((lvl) => (
                        <SelectItem key={lvl.id} value={lvl.name}>{lvl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <Select
                    value={category || ''}
                    onValueChange={(v) => {
                      const next = v === 'all' ? null : v;
                      setCategory(next);
                      // Ao mudar a categoria, limpar subcategoria selecionada
                      setSubcategory(null);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(categoryOptions.length ? categoryOptions : [
                        { id: 'Mobile', name: 'Mobile' },
                        { id: 'Web', name: 'Web' },
                        { id: 'Social', name: 'Social' },
                      ]).map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subcategoria</Label>
                  <Select value={subcategory || ''} onValueChange={(v) => setSubcategory(v === 'all' ? null : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(subcategoryOptions.length ? subcategoryOptions.filter((s) => !category || s.category === category) : []).map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Pagamento</Label>
                  <Select value={payment || ''} onValueChange={(v) => setPayment(v === 'all' ? null : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {(paymentRangeOptions.length ? paymentRangeOptions : [
                        { id: 'r1', label: 'Até 1.000 Kz', min: 0, max: 1000 },
                        { id: 'r2', label: '1.000–5.000 Kz', min: 1000, max: 5000 },
                        { id: 'r3', label: '> 5.000 Kz', min: 5000 },
                      ]).map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Localização</Label>
                  <Select value={location || ''} onValueChange={(v) => setLocation(v === 'all' ? null : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(locationOptions.length ? locationOptions : [
                        { id: 'Luanda', name: 'Luanda' },
                        { id: 'Online', name: 'Online' },
                      ]).map((l) => (
                        <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Emp. Estatísticas</Label>
                  <Select value={stats || ''} onValueChange={(v) => setStats(v === 'all' ? null : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(statsLabelOptions.length ? statsLabelOptions : [
                        { id: 'Alta aprovação', name: 'Alta aprovação' },
                        { id: 'Pagador confiável', name: 'Pagador confiável' },
                      ]).map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Lista de tarefas */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : viewMode === 'panels'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                : 'space-y-6'
            }>
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <JobCard 
                    key={job.id}
                    {...job}
                    applicants={job.applicantCount}
                    postedBy={job.posterName}
                    posterId={job.posterId}
                  />
                ))
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

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10">
                {t("load_more_tasks")}
              </Button>
            </div>
          </div>
        </div>

        {/* Mensagem de bônus e verificação de conta */}
        {showTips && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-40">
            <Card className="shadow-lg border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">Bônus de 500 KZ</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verifique sua conta para ganhar 500 KZ de bônus.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" className="glow-effect" onClick={() => navigate('/kyc')}>
                        Verificar conta agora
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowTips(false)}>Fechar</Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await updateSettings({ showOnboardingTips: false });
                          setShowTips(false);
                        } catch (e) {
                          setShowTips(false);
                        }
                      }}
                    >
                      Não mostrar novamente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;