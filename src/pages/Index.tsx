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
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Index = () => {
  const { userData, currentUser } = useAuth();
  const { jobs, loading: jobsLoading } = useJobs({ limitCount: 10 });
  const navigate = useNavigate();
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const { t } = useTranslation(); // Initialize useTranslation

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
                <h2 className="text-2xl font-bold text-foreground mb-2">{t("available_tasks")}</h2>
                <p className="text-muted-foreground">{t("find_opportunities")}</p>
              </div>
              
              <FilterDialog 
                onFilterChange={setDifficultyFilter}
                currentFilter={difficultyFilter}
              />
            </div>

            {/* Platform Tabs */}
            <Tabs defaultValue="all" className="mb-8">
              <TabsList className="flex flex-wrap w-full gap-1 h-auto">
                <TabsTrigger value="all">{t("all")}</TabsTrigger>
                <TabsTrigger value="iOS">{t("ios")}</TabsTrigger>
                <TabsTrigger value="Android">{t("android")}</TabsTrigger>
                <TabsTrigger value="Web">{t("web")}</TabsTrigger>
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
                        ? t("no_tasks_for_difficulty", { difficulty: difficultyFilter })
                        : t("no_tasks_found")}
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
                          ? t("no_tasks_for_platform_difficulty", { platform: platform, difficulty: difficultyFilter })
                          : t("no_tasks_for_platform", { platform: platform })}
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* Load More */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                {t("load_more_tasks")}
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
                           ? `${(userData.testerWallet?.availableBalance || 0).toFixed(2)} KZ`
                           : `${(userData.posterWallet?.balance || 0).toFixed(2)} KZ`
                         }
                       </span>
                     </div>
                     
                     {userData.currentMode === 'tester' && (
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-muted-foreground">{t("pending_balance")}</span>
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
                    {t("create_job")}
                  </Button>
                  <Button 
                    onClick={() => navigate('/manage-applications')}
                    variant="outline"
                    className="flex-1"
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
        </div>
      </main>
    </div>
  );
};

export default Index;