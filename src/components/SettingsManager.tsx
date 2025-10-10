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
import { useTranslation } from 'react-i18next'; // Import useTranslation

const SettingsManager = () => {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme: setAppTheme } = useTheme();
  const { settings, updateSettings, resetPassword, sendResetPasswordEmail, resetToDefault } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  
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
        title: t("profile_updated"),
        description: t("profile_updated_description"),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t("error_saving"),
        description: t("error_saving_description"),
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
        title: t("email_sent"),
        description: t("email_sent_description"),
      });
    } catch (error) {
      toast({
        title: t("error_sending_email"),
        description: t("error_sending_email"),
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t("password_error"),
        description: t("password_mismatch"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("weak_password"),
        description: t("password_too_short"),
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
        title: t("password_changed"),
        description: t("password_changed_description"),
      });
    } catch (error: any) {
      toast({
        title: t("error_saving"),
        description: error.message || t("error_changing_password"),
        variant: "destructive",
      });
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      await resetToDefault();
      toast({
        title: t("settings_restored"),
        description: t("settings_restored_description"),
      });
    } catch (error) {
      toast({
        title: t("error_restoring"),
        description: t("error_restoring_description"),
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
            <span>{t("notifications")}</span>
          </CardTitle>
          <CardDescription>
            {t("manage_notifications")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>{t("email_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("email_notifications_description")}</p>
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
                  <Label>{t("push_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("push_notifications_description")}</p>
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
                  <Label>{t("sms_notifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("sms_notifications_description")}</p>
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
            <h4 className="font-medium">{t("notification_types")}</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>{t("new_jobs_available")}</Label>
                <p className="text-sm text-muted-foreground">{t("new_jobs_available_description")}</p>
              </div>
              <Switch
                checked={localSettings.jobAlerts}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, jobAlerts: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t("payments_transactions")}</Label>
                <p className="text-sm text-muted-foreground">{t("payments_transactions_description")}</p>
              </div>
              <Switch
                checked={localSettings.paymentAlerts}
                onCheckedChange={(checked) => setLocalSettings({...localSettings, paymentAlerts: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t("marketing_promotions")}</Label>
                <p className="text-sm text-muted-foreground">{t("marketing_promotions_description")}</p>
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
            <span>{t("privacy")}</span>
          </CardTitle>
          <CardDescription>
            {t("configure_profile_visibility")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>{t("public_profile")}</Label>
                <p className="text-sm text-muted-foreground">{t("public_profile_description")}</p>
              </div>
            </div>
            <Switch
              checked={localSettings.profilePublic}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, profilePublic: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t("show_rating")}</Label>
              <p className="text-sm text-muted-foreground">{t("show_rating_description")}</p>
            </div>
            <Switch
              checked={localSettings.showRating}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, showRating: checked})}
              disabled={!localSettings.profilePublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>{t("show_earnings")}</Label>
              <p className="text-sm text-muted-foreground">{t("show_earnings_description")}</p>
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
                <Label>{t("direct_messages")}</Label>
                <p className="text-sm text-muted-foreground">{t("direct_messages_description")}</p>
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
            <span>{t("interface_appearance")}</span>
          </CardTitle>
          <CardDescription>
            {t("customize_platform_appearance")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("theme")}</Label>
            <Select value={theme} onValueChange={setAppTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <span>{t("light")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4" />
                    <span>{t("dark")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span>{t("system")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("language")}</Label>
            <Select 
              value={localSettings.language} 
              onValueChange={(value) => {
                setLocalSettings(prev => ({ ...prev, language: value }));
                i18n.changeLanguage(value); // Change the display language immediately
              }}
            >
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
                <Label>{t("sound_effects")}</Label>
                <p className="text-sm text-muted-foreground">{t("sound_effects_description")}</p>
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
            <span>{t("security")}</span>
          </CardTitle>
          <CardDescription>
            {t("keep_account_secure")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>{t("two_factor_auth")}</Label>
                <p className="text-sm text-muted-foreground">{t("two_factor_auth_description")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {localSettings.twoFactorAuth && (
                <Badge variant="outline" className="text-xs">
                  {t("enabled")}
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
              <Label>{t("login_alerts")}</Label>
              <p className="text-sm text-muted-foreground">{t("login_alerts_description")}</p>
            </div>
            <Switch
              checked={localSettings.loginAlerts}
              onCheckedChange={(checked) => setLocalSettings({...localSettings, loginAlerts: checked})}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("session_timeout")}</Label>
            <Select value={localSettings.sessionTimeout} onValueChange={(value) => setLocalSettings({...localSettings, sessionTimeout: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 {t("minutes")}</SelectItem>
                <SelectItem value="30">30 {t("minutes")}</SelectItem>
                <SelectItem value="60">1 {t("hour")}</SelectItem>
                <SelectItem value="240">4 {t("hours")}</SelectItem>
                <SelectItem value="never">{t("never")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t("change_password_section")}</h4>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t("current_password")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder={t("new_password")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder={t("confirm_new_password")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button onClick={handleChangePassword} className="w-full" variant="secondary">
                  {t("change_password")}
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={handleResetPassword} className="w-full">
              {t("send_reset_email")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contas de Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>{t("social_media_accounts")}</span>
          </CardTitle>
          <CardDescription>
            {t("connect_social_media_profile")}
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
          {t("restore_defaults")}
        </Button>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? t("saving") : t("save_settings")}
        </Button>
      </div>
    </div>
  );
};

export default SettingsManager;