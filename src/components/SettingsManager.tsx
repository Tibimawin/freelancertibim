import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import { 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Volume2,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  EyeOff,
  Lock,
  Key,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from "lucide-react";

const SettingsManager = () => {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme: setAppTheme } = useTheme();
  const { settings, updateSettings, resetPassword, sendResetPasswordEmail, resetToDefault } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado local para formulários
  const [localSettings, setLocalSettings] = useState(settings);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await updateSettings(localSettings);
      
      toast({
        title: "Configurações salvas!",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendResetPasswordEmail();
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email de redefinição.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      await resetPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      await resetToDefault();
      toast({
        title: "Configurações restauradas!",
        description: "As configurações foram restauradas para os valores padrão.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível restaurar as configurações.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notificações</span>
          </CardTitle>
          <CardDescription>
            Gerencie como e quando você recebe notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Receba emails sobre atividades importantes</p>
                </div>
              </div>
              <Switch
                checked={localSettings.emailNotifications}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, emailNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                </div>
              </div>
              <Switch
                checked={localSettings.pushNotifications}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, pushNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>SMS</Label>
                  <p className="text-sm text-muted-foreground">Receba alertas importantes por SMS</p>
                </div>
              </div>
              <Switch
                checked={localSettings.smsNotifications}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, smsNotifications: checked})}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Tipos de Notificação</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Novos Testes Disponíveis</Label>
                <p className="text-sm text-muted-foreground">Seja notificado sobre oportunidades de teste</p>
              </div>
              <Switch
                checked={localSettings.jobAlerts}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, jobAlerts: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Pagamentos e Transações</Label>
                <p className="text-sm text-muted-foreground">Alertas sobre pagamentos e movimentações financeiras</p>
              </div>
              <Switch
                checked={localSettings.paymentAlerts}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, paymentAlerts: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing e Promoções</Label>
                <p className="text-sm text-muted-foreground">Receba ofertas especiais e novidades</p>
              </div>
              <Switch
                checked={localSettings.marketingEmails}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, marketingEmails: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacidade</span>
          </CardTitle>
          <CardDescription>
            Configure a visibilidade do seu perfil e dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Perfil Público</Label>
                <p className="text-sm text-muted-foreground">Permitir que outros usuários vejam seu perfil</p>
              </div>
            </div>
            <Switch
              checked={localSettings.profilePublic}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, profilePublic: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mostrar Avaliação</Label>
              <p className="text-sm text-muted-foreground">Exibir sua avaliação média no perfil público</p>
            </div>
            <Switch
              checked={localSettings.showRating}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, showRating: checked})}
              disabled={!localSettings.profilePublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mostrar Ganhos</Label>
              <p className="text-sm text-muted-foreground">Exibir seus ganhos totais publicamente</p>
            </div>
            <Switch
              checked={localSettings.showEarnings}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, showEarnings: checked})}
              disabled={!localSettings.profilePublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Mensagens Diretas</Label>
                <p className="text-sm text-muted-foreground">Permitir que outros usuários entrem em contato</p>
              </div>
            </div>
            <Switch
              checked={localSettings.allowDirectMessages}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, allowDirectMessages: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Interface e Aparência</span>
          </CardTitle>
          <CardDescription>
            Personalize a aparência da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select value={theme} onValueChange={setAppTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <span>Claro</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4" />
                    <span>Escuro</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span>Sistema</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={localSettings.language} onValueChange={(value) => setLocalSettings({...localSettings, language: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Efeitos Sonoros</Label>
                <p className="text-sm text-muted-foreground">Reproduzir sons para notificações e ações</p>
              </div>
            </div>
            <Switch
              checked={localSettings.soundEffects}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, soundEffects: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Segurança</span>
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {localSettings.twoFactorAuth && (
                <Badge variant="outline" className="text-xs">
                  Ativado
                </Badge>
              )}
              <Switch
                checked={localSettings.twoFactorAuth}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, twoFactorAuth: checked})}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas de Login</Label>
              <p className="text-sm text-muted-foreground">Notificação quando alguém acessa sua conta</p>
            </div>
            <Switch
              checked={localSettings.loginAlerts}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, loginAlerts: checked})}
            />
          </div>

          <div className="space-y-2">
            <Label>Timeout da Sessão</Label>
            <Select value={localSettings.sessionTimeout} onValueChange={(value) => setLocalSettings({...localSettings, sessionTimeout: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="240">4 horas</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Alterar Senha</h4>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword} className="w-full" variant="secondary">
                  Alterar Senha
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={handleResetPassword} className="w-full">
              Enviar Email de Redefinição
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contas de Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Contas de Redes Sociais</span>
          </CardTitle>
          <CardDescription>
            Conecte suas contas de redes sociais ao seu perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Instagram className="h-4 w-4" />
              <span>Instagram</span>
            </Label>
            <Input
              placeholder="@seu_usuario"
              value={localSettings.socialAccounts?.instagram || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                socialAccounts: { ...localSettings.socialAccounts, instagram: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Facebook className="h-4 w-4" />
              <span>Facebook</span>
            </Label>
            <Input
              placeholder="facebook.com/seu_perfil"
              value={localSettings.socialAccounts?.facebook || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                socialAccounts: { ...localSettings.socialAccounts, facebook: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Twitter className="h-4 w-4" />
              <span>X (Twitter)</span>
            </Label>
            <Input
              placeholder="@seu_usuario"
              value={localSettings.socialAccounts?.twitter || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                socialAccounts: { ...localSettings.socialAccounts, twitter: e.target.value }
              })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </Label>
            <Input
              placeholder="linkedin.com/in/seu_perfil"
              value={localSettings.socialAccounts?.linkedin || ''}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                socialAccounts: { ...localSettings.socialAccounts, linkedin: e.target.value }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handleRestoreDefaults}>
          Restaurar Padrões
        </Button>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsManager;