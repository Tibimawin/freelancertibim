import { useState } from "react";
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
  X
} from "lucide-react";
import ModeToggle from "@/components/ModeToggle";
import SocialMediaManager from "@/components/SocialMediaManager";
import SettingsManager from "@/components/SettingsManager";

const Profile = () => {
  const { userData, currentUser, updateUserData } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    bio: userData?.bio || "",
    phone: userData?.phone || "",
    location: userData?.location || "",
    skills: userData?.skills?.join(", ") || "",
  });

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
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || "",
      bio: userData?.bio || "",
      phone: userData?.phone || "",
      location: userData?.location || "",
      skills: userData?.skills?.join(", ") || "",
    });
    setIsEditing(false);
  };

  if (!userData || !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
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
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      {userData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold text-foreground">{userData.name}</h1>
                      <Badge variant={userData.currentMode === 'tester' ? 'default' : 'secondary'}>
                        {userData.currentMode === 'tester' ? 'Testador' : 'Contratante'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                        <span>Membro desde {new Date(userData.createdAt).toLocaleDateString('pt-BR')}</span>
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
                  className="flex items-center space-x-2"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span>{isEditing ? "Cancelar" : "Editar Perfil"}</span>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informações Pessoais */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Informações Pessoais</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="bio">Biografia</Label>
                            <Textarea
                              id="bio"
                              placeholder="Conte um pouco sobre você..."
                              value={formData.bio}
                              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                              id="phone"
                              placeholder="(11) 99999-9999"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="location">Localização</Label>
                            <Input
                              id="location"
                              placeholder="São Paulo, SP"
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
                            <Input
                              id="skills"
                              placeholder="React, JavaScript, Mobile Testing..."
                              value={formData.skills}
                              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                            />
                          </div>
                          
                          <Button onClick={handleSave} disabled={isLoading} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                            <p className="text-foreground">{userData.name}</p>
                          </div>
                          
                          {userData.bio && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Biografia</Label>
                              <p className="text-foreground">{userData.bio}</p>
                            </div>
                          )}
                          
                          {userData.phone && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                              <p className="text-foreground">{userData.phone}</p>
                            </div>
                          )}
                          
                          {userData.location && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Localização</Label>
                              <p className="text-foreground">{userData.location}</p>
                            </div>
                          )}
                          
                          {userData.skills && userData.skills.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Habilidades</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {userData.skills.map((skill, index) => (
                                  <Badge key={index} variant="outline">
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
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Testes Completados</span>
                        <span className="font-semibold text-foreground">{userData.completedTests}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avaliação</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="font-semibold text-foreground">{(userData.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Taxa de Aprovação</span>
                        <span className="font-semibold text-success">{userData.approvalRate || 0}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Saldo Atual</span>
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
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Testes Completados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{userData.completedTests}</div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% este mês
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ganhos Totais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{(userData.testerWallet?.totalEarnings || 0).toFixed(2)} KZ</div>
                    <div className="flex items-center text-xs text-success">
                      <DollarSign className="h-3 w-3 mr-1" />
                      +340 KZ este mês
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avaliação Média</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{(userData.rating || 0).toFixed(1)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                      Excelente
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{userData.approvalRate}%</div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Acima da média
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configurações da Conta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Configurações da Conta</span>
                    </CardTitle>
                    <CardDescription>
                      Gerencie suas preferências e configurações básicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modo Atual</Label>
                    <Select value={userData.currentMode} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tester">Testador</SelectItem>
                        <SelectItem value="poster">Contratante</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Use o botão "Alternar Modo" para mudar entre testador e contratante
                    </p>
                  </div>

                    <div className="space-y-2">
                      <Label>Email da Conta</Label>
                      <Input value={currentUser.email || ""} disabled />
                      <p className="text-xs text-muted-foreground">
                        O email não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Status da Conta</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-success/10 text-success">
                          Verificada
                        </Badge>
                        <Badge variant="outline">
                          Premium
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      Alterar Senha
                    </Button>
                    
                    <ModeToggle />
                  </CardContent>
                </Card>

                {/* Redes Sociais */}
                <Card>
                  <CardHeader>
                    <CardTitle>Redes Sociais</CardTitle>
                    <CardDescription>
                      Conecte suas redes sociais para compartilhar conquistas
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