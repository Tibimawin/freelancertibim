import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Smartphone, Monitor, Globe, TrendingUp, Loader2, Plus } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import LandingContent from "@/components/LandingContent";
import JobCard from "@/components/JobCard";
import WalletCard from "@/components/WalletCard";
import FilterDialog from "@/components/FilterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/useFirebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const { userData, currentUser } = useAuth();
  const { jobs, loading: jobsLoading } = useJobs({ limitCount: 10 });
  const navigate = useNavigate();
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);

  // Debug log to help understand the userData structure
  console.log('Index - userData:', userData);
  console.log('Index - currentUser:', currentUser);

  // Filtrar jobs baseado na dificuldade selecionada
  const filteredJobs = difficultyFilter 
    ? jobs.filter(job => job.difficulty === difficultyFilter)
    : jobs;

  // Se o usuário não estiver logado, mostra apenas a página de apresentação
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <LandingContent />
      </div>
    );
  }

  // Se o usuário estiver logado, mostra a interface da aplicação
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Filter Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Tarefas Disponíveis</h2>
                <p className="text-muted-foreground">Encontre oportunidades para ganhar dinheiro como freelancer de apps</p>
              </div>
              
              <FilterDialog 
                onFilterChange={setDifficultyFilter}
                currentFilter={difficultyFilter}
              />
            </div>

            {/* Platform Tabs */}
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="flex flex-wrap w-full gap-1 h-auto">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="iOS">iOS</TabsTrigger>
                <TabsTrigger value="Android">Android</TabsTrigger>
                <TabsTrigger value="Web">Web</TabsTrigger>
                <TabsTrigger value="TikTok">TikTok</TabsTrigger>
                <TabsTrigger value="Instagram">Instagram</TabsTrigger>
                <TabsTrigger value="Facebook">Facebook</TabsTrigger>
                <TabsTrigger value="OnlyFans">OnlyFans</TabsTrigger>
                <TabsTrigger value="Play Store">Play Store</TabsTrigger>
                <TabsTrigger value="App Store">App Store</TabsTrigger>
                <TabsTrigger value="Pornhub">Pornhub</TabsTrigger>
                <TabsTrigger value="X (Twitter)">X</TabsTrigger>
                <TabsTrigger value="Telegram">Telegram</TabsTrigger>
                <TabsTrigger value="YouTube">YouTube</TabsTrigger>
                <TabsTrigger value="WeChat">WeChat</TabsTrigger>
                <TabsTrigger value="Snapchat">Snapchat</TabsTrigger>
                <TabsTrigger value="Pinterest">Pinterest</TabsTrigger>
                <TabsTrigger value="Threads">Threads</TabsTrigger>
                <TabsTrigger value="LinkedIn">LinkedIn</TabsTrigger>
                <TabsTrigger value="Discord">Discord</TabsTrigger>
                <TabsTrigger value="Reddit">Reddit</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
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
                        ? `Nenhuma tarefa encontrada com dificuldade "${difficultyFilter}"`
                        : "Nenhuma tarefa disponível no momento"}
                    </p>
                  </div>
                )}
              </TabsContent>

              {["iOS", "Android", "Web", "TikTok", "Instagram", "Facebook", "OnlyFans", "Play Store", "App Store", "Pornhub", "X (Twitter)", "Telegram", "YouTube", "WeChat", "Snapchat", "Pinterest", "Threads", "LinkedIn", "Discord", "Reddit"].map((platform) => (
                <TabsContent key={platform} value={platform} className="space-y-6">
                  {filteredJobs.filter(job => job.platform === platform).length > 0 ? (
                    filteredJobs.filter(job => job.platform === platform).map((job) => (
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
                          ? `Nenhuma tarefa encontrada para ${platform} com dificuldade "${difficultyFilter}"`
                          : `Nenhuma tarefa disponível para ${platform}`}
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Carregar Mais Tarefas
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Card */}
            <WalletCard />

            {/* Quick Stats */}
            {userData && (
              <div className="rounded-xl bg-card p-6 shadow-md border border-border">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Suas Estatísticas</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tarefas Completadas</span>
                    <span className="font-semibold text-foreground">{userData.completedTests || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avaliação Média</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-foreground">{(userData.rating || 0).toFixed(1)}</span>
                      <TrendingUp className="h-3 w-3 text-success" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de Aprovação</span>
                    <span className="font-semibold text-success">{userData.approvalRate || 0}%</span>
                  </div>
                  
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <span className="text-sm text-muted-foreground">
                         {userData.currentMode === 'tester' ? 'Saldo Disponível' : 'Saldo Atual'}
                       </span>
                       <span className="font-semibold text-foreground">
                         {userData.currentMode === 'tester' 
                           ? `${(userData.testerWallet?.availableBalance || 0).toFixed(2)} KZ`
                           : `${(userData.posterWallet?.balance || 0).toFixed(2)} KZ`
                         }
                       </span>
                     </div>
                     
                     {userData.currentMode === 'tester' && (
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground">Saldo Pendente</span>
                         <span className="font-medium text-warning">
                           {(userData.testerWallet?.pendingBalance || 0).toFixed(2)} KZ
                         </span>
                       </div>
                     )}
                   </div>
                </div>
                
              {userData?.currentMode === 'poster' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate('/create-job')}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Anúncio
                  </Button>
                  <Button 
                    onClick={() => navigate('/manage-applications')}
                    variant="outline"
                    className="flex-1"
                  >
                    Gerenciar Aplicações
                  </Button>
                </div>
              )}
              </div>
            )}

            {/* Tips Card */}
            <div className="rounded-xl bg-gradient-secondary p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-card-foreground mb-3">💡 Dica do Dia</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trabalhe em aplicativos durante horários de pico para encontrar mais bugs e aumentar suas chances de receber bônus!
              </p>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Dica #12
              </Badge>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;