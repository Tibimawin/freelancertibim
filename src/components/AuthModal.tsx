import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowLeft, Users } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Form states
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "",
    referralCode: "" // Novo campo
  });
  const [resetForm, setResetForm] = useState({ email: "" });

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(signInForm.email, signInForm.password);
      toast({
        title: t("login success"),
        description: t("welcome back freelincer"),
      });
      onClose();
    } catch (error: any) {
      toast({
        title: t("login error"),
        description: error.message || t("login error description"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        title: t("password error"),
        description: t("password mismatch signup"),
        variant: "destructive",
      });
      return;
    }

    if (signUpForm.password.length < 6) {
      toast({
        title: t("weak password"),
        description: t("weak password description"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await signUp(signUpForm.email, signUpForm.password, signUpForm.name, signUpForm.referralCode.toUpperCase());
      toast({
        title: t("account created success"),
        description: t("welcome freelincer journey"),
      });
      onClose();
    } catch (error: any) {
      toast({
        title: t("signup error"),
        description: error.message || t("signup error description"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(resetForm.email);
      toast({
        title: t("email sent reset"),
        description: t("email sent reset description"),
      });
      setActiveTab("signin");
    } catch (error: any) {
      toast({
        title: t("error sending reset email"),
        description: error.message || t("error sending reset email"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-xl border-border bg-card text-foreground">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="text-xl font-bold text-foreground">Freelincer</span>
          </div>
          
          <CardTitle className="text-2xl">
            {activeTab === "signin" ? t("enter") : activeTab === "signup" ? t("create account") : t("recover password")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {activeTab === "signin" 
              ? t("enter your account") 
              : activeTab === "signup" 
              ? t("join freelancer community") 
              : t("enter email to recover password")
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeTab !== "reset" ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t("enter")}</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t("signup")}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t("email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t("your email placeholder")}
                        className="pl-10 bg-input border-border text-foreground"
                        value={signInForm.email}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t("password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-input border-border text-foreground"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full glow-effect" 
                    variant="hero"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("enter")}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-primary hover:text-primary-hover"
                    onClick={() => setActiveTab("reset")}
                  >
                    {t("forgot password")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t("full name")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder={t("your name placeholder")}
                        className="pl-10 bg-input border-border text-foreground"
                        value={signUpForm.name}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t("email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t("your email placeholder")}
                        className="pl-10 bg-input border-border text-foreground"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t("password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-input border-border text-foreground"
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t("confirm password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-input border-border text-foreground"
                        value={signUpForm.confirmPassword}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Novo campo de código de referência */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-referral">{t("referral code optional")}</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-referral"
                        placeholder={t("referral code placeholder")}
                        className="pl-10 bg-input border-border text-foreground uppercase"
                        value={signUpForm.referralCode}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, referralCode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full glow-effect" 
                    variant="hero"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("create account")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t("your email placeholder")}
                    className="pl-10 bg-input border-border text-foreground"
                    value={resetForm.email}
                    onChange={(e) => setResetForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full glow-effect" 
                variant="hero"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("send recovery email")}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-primary hover:text-primary-hover"
                onClick={() => setActiveTab("signin")}
              >
                {t("back to login")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;