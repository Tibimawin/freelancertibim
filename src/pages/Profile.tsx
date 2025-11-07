import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  AlertCircle
} from "lucide-react";
import ModeToggle from "@/components/ModeToggle";
import SocialMediaManager from "@/components/SocialMediaManager";
import SettingsManager from "@/components/SettingsManager";
import VerificationForm from "@/components/VerificationForm"; // Importando o novo componente
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { userData, currentUser, updateUserData } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(initialTab);

  const [formData, setFormData] = useState({
    name: userData?.name || "",
    bio: userData?.bio || "",
    phone: userData?.phone || "",
    location: userData?.location || "",
    skills: userData?.skills?.join(", ") || "",
  });

  useEffect(() => {
    // Sincronizar formData com userData sempre que userData mudar
    setFormData({
      name: userData?.name || "",
      bio: userData?.bio || "",
      phone: userData?.phone || "",
      location: userData?.location || "",
      skills: userData?.skills?.join(", ") || "",
    });
  }, [userData]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const handleCancel = () => {
    // Resetar o formulário para os dados atuais do usuário
    setFormData({
      name: userData?.name || "",
      bio: userData?.bio || "",
      phone: userData?.phone || "",
      location: userData?.location || "",
      skills: userData?.skills?.join(", ") || "",
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

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <div className="text-center text-foreground p-8 bg-card rounded-lg shadow-lg">
          <p className="text-muted-foreground">{t("loading_profile")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header do Perfil */}
          <Card className="mb-8 bg-card border-border shadow-md">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24 border-2 border-primary/50 shadow-lg">
                    <AvatarImage src={userData.avatarUrl} />
                    <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                      {userData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold text-foreground">{userData.name}</h1>
                      <Badge variant={userData.currentMode === 'tester' ? 'default' : 'secondary'}>
                        {userData.currentMode === 'tester' ? t("freelancer") : t("contractor")}
                      </Badge>
                      {getVerificationBadge(userData.verificationStatus)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{currentUser.email}</span>
                      </div>
                      
                      {userData.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{userData.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{t("member_since")} {new Date(userData.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    {userData.bio && (
                      <p className="text-muted-foreground max-w-md">{userData.bio}</p>
                    )}
                  </div>
                </div>
                
                <Button
                  variant={isEditing ? "destructive" : "outline"}
                  onClick={isEditing ? handleCancel : () => setIsEditing(true)}
                  className="flex items-center space-x-2 mt-4 md:mt-0"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span>{isEditing ? t("cancel") : t("edit_profile")}</span>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="stats">{t("stats")}</TabsTrigger>
              <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
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
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">{t("name")}</Label>
                            <p className="text-foreground">{userData.name}</p>
                          </div>
                          
                          {userData.bio && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">{t("bio")}</Label>
                              <p className="text-foreground">{userData.bio}</p>
                            </div>
                          )}
                          
                          {userData.phone && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">{t("phone")}</Label>
                              <p className="text-foreground">{userData.phone}</p>
                            </div>
                          )}
                          
                          {userData.location && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">{t("location")}</Label>
                              <p className="text-foreground">{userData.location}</p>
                            </div>
                          )}
                          
                          {userData.skills && userData.skills.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">{t("skills")}</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {userData.skills.map((skill, index) => (
                                  <Badge key={index} variant="outline" className="bg-muted/30 text-muted-foreground border-border">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Formulário de Verificação de Identidade */}
                  <VerificationForm />
                </div>

                {/* Quick Stats */}
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
                        <span className="font-semibold text-foreground">{userData.completedTests}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("average_rating")}</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-star-glow text-star-glow" />
                          <span className="font-semibold text-foreground">{(userData.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("approval_rate")}</span>
                        <span className="font-semibold text-success">{userData.approvalRate || 0}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("current_balance")}</span>
                        <span className="font-semibold text-foreground">
                          {(userData.currentMode === 'tester' 
                            ? userData.testerWallet?.availableBalance || 0 
                            : userData.posterWallet?.balance || 0
                          ).toFixed(2)} KZ
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
                    <div className="text-2xl font-bold text-foreground">{userData.completedTests}</div>
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
                    <div className="text-2xl font-bold text-foreground">{(userData.testerWallet?.totalEarnings || 0).toFixed(2)} KZ</div>
                    <div className="flex items-center text-xs text-success">
                      <DollarSign className="h-3 w-3 mr-1" />
                      +340 KZ {t("this_month")}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("average_rating_label")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{(userData.rating || 0).toFixed(1)}</div>
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
                    <div className="text-2xl font-bold text-foreground">{userData.approvalRate}%</div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {t("above_average")}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;