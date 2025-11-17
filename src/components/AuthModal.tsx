import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowLeft, Users, Eye, EyeOff } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { auth } from '@/lib/firebase';
import { MultiFactorResolver, RecaptchaVerifier, PhoneAuthProvider, PhoneMultiFactorGenerator } from 'firebase/auth';
import { Checkbox } from "@/components/ui/checkbox";
import { AuthService } from "@/services/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { signIn, signUp, resetPassword, resendVerificationEmail } = useAuth();
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
  const [unverified, setUnverified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  

  // Password visibility states
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  // MFA states
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaVerificationId, setMfaVerificationId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState<string>("");
  const [mfaSending, setMfaSending] = useState<boolean>(false);
  const [mfaRecaptcha, setMfaRecaptcha] = useState<RecaptchaVerifier | null>(null);

  

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      await signIn(signInForm.email, signInForm.password);
      toast({
        title: t("login_success"),
        description: t("welcome_back_freelincer"),
      });
      onClose();
    } catch (error: any) {
      // Handle MFA challenge
      if (error?.code === 'auth/multi-factor-auth-required' && error?.resolver) {
        try {
          const resolver = error.resolver as MultiFactorResolver;
          setMfaResolver(resolver);
          setActiveTab('signin'); // Ensure we're on sign-in tab
          setMfaSending(true);
          // Prepare invisible reCAPTCHA
          const recaptcha = new RecaptchaVerifier(auth, 'mfa-recaptcha-container', { size: 'invisible' });
          setMfaRecaptcha(recaptcha);
          const provider = new PhoneAuthProvider(auth);
          const verificationId = await provider.verifyPhoneNumber({ multiFactorHint: resolver.hints[0], session: resolver.session }, recaptcha);
          setMfaVerificationId(verificationId);
          toast({ title: t('mfa_code_sent'), description: t('mfa_enter_code_description') });
        } catch (mfaErr: any) {
          toast({ title: t('login_error'), description: mfaErr?.message || t('login_error_description'), variant: 'destructive' });
          // Cleanup if created
          try { mfaRecaptcha?.clear(); } catch {}
        } finally {
          setMfaSending(false);
          setLoading(false);
        }
        return;
      } else {
        // Mensagem em português para credenciais inválidas
        if (
          error?.code === 'auth/invalid-credential' ||
          error?.code === 'auth/wrong-password' ||
          error?.code === 'auth/user-not-found'
        ) {
          toast({
            title: t('login_error'),
            description: 'Email ou senha errado',
            variant: 'destructive',
          });
        } else if (error?.code === 'device_limit_exceeded') {
          toast({
            title: t('login_error'),
            description: error.message || 'Limite de contas por dispositivo atingido.',
            variant: 'destructive',
          });
        } else if (error?.code === 'auth/email-not-verified') {
          toast({
            title: t('email_not_verified'),
            description: t('please_check_email_to_activate'),
            variant: 'destructive',
          });
          setUnverified(true);
          try {
            await resendVerificationEmail();
            toast({ title: t('verification_email_resent'), description: t('please_check_email_to_activate') });
          } catch {}
        } else {
          toast({
            title: t("login_error"),
            description: error.message || t("login_error_description"),
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver || !mfaVerificationId) return;
    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(mfaVerificationId, mfaCode);
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      await mfaResolver.resolveSignIn(assertion);
      toast({ title: t('login_success'), description: t('welcome_back_freelincer') });
      // Clear MFA state
      try { mfaRecaptcha?.clear(); } catch {}
      setMfaResolver(null);
      setMfaVerificationId("");
      setMfaCode("");
      setMfaRecaptcha(null);
      onClose();
    } catch (err: any) {
      toast({ title: t('mfa_code_invalid'), description: err?.message || t('login_error_description'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        title: t("password_error"),
        description: t("password_mismatch_signup"),
        variant: "destructive",
      });
      return;
    }

    const hasMinLength = signUpForm.password.length >= 8;
    const hasUpper = /[A-Z]/.test(signUpForm.password);
    const hasLower = /[a-z]/.test(signUpForm.password);
    const hasDigit = /\d/.test(signUpForm.password);
    const hasSymbol = /[^A-Za-z0-9]/.test(signUpForm.password);
    if (!(hasMinLength && hasUpper && hasLower && hasDigit && hasSymbol)) {
      toast({
        title: t("weak_password"),
        description: "A senha deve ter pelo menos 8 caracteres e incluir letras maiúsculas, minúsculas, números e símbolos.",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: 'Aceite necessário',
        description: 'Você deve ler e aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.',
        variant: 'destructive',
      });
      return;
    }

    

    setLoading(true);

    try {
      await signUp(signUpForm.email, signUpForm.password, signUpForm.name, signUpForm.referralCode.toUpperCase());
      // Persistir aceite dos termos e privacidade no documento do usuário
      try {
        const uid = auth.currentUser?.uid;
        if (uid) {
          await AuthService.updateUserData(uid, {
            termsAccepted: true,
            termsAcceptedAt: new Date(),
            termsVersion: '2024-10-08',
            privacyAccepted: true,
            privacyAcceptedAt: new Date(),
          });
        }
      } catch (persistErr) {
        console.warn('Falha ao salvar aceite de termos no usuário:', persistErr);
      }
      toast({
        title: t('verification_email_sent'),
        description: t('please_check_email_to_activate'),
      });
      setActiveTab('signin');
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        toast({
          title: t('signup_error'),
          description: 'Esse email já tem uma conta cadastrada no sistema.',
          variant: 'destructive',
        });
        // Sugerir login: mudar para aba de login
        setActiveTab('signin');
      } else if (error?.code === 'device_limit_exceeded') {
        toast({
          title: t('signup_error'),
          description: error.message || t('device_limit_exceeded_description'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t("signup_error"),
          description: error.message || t("signup_error_description"),
          variant: "destructive",
        });
      }
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
        title: t("email_sent_reset"),
        description: t("email_sent_reset_description"),
      });
      setActiveTab("signin");
    } catch (error: any) {
      toast({
        title: t("error_sending_reset_email"),
        description: error.message || t("error_sending_reset_email"),
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
              <span className="text-sm font-bold text-primary-foreground">AT</span>
            </div>
            <span className="text-xl font-bold text-foreground">Ango Tarefas</span>
          </div>
          
          <CardTitle className="text-2xl">
            {activeTab === "signin" ? t("enter") : activeTab === "signup" ? t("create_account") : t("recover_password")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {activeTab === "signin" 
              ? t("enter_your_account") 
              : activeTab === "signup" 
              ? t("join_freelancer_community") 
              : t("enter_email_to_recover_password")
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="max-h-[80vh] overflow-y-auto">
          {activeTab !== "reset" ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t("enter")}</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t("signup")}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                {/* MFA reCAPTCHA container */}
                <div id="mfa-recaptcha-container" />
                
                {/* Render MFA code form when resolver is present */}
                {mfaResolver ? (
                  <form onSubmit={handleVerifyMfaCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mfa-code">{t('verification_code')}</Label>
                      <Input
                        id="mfa-code"
                        placeholder={t('enter_verification_code')}
                        className="bg-input border-border text-foreground"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full glow-effect" variant="hero" disabled={loading || mfaSending}>
                      {(loading || mfaSending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('verify_code')}
                    </Button>
                    <Button type="button" variant="link" className="w-full text-sm text-primary" onClick={() => setMfaResolver(null)}>
                      {t('back_to_login')}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t("email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t("your_email_placeholder")}
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
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-input border-border text-foreground"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showSignInPassword ? t("hide_password") : t("show_password")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignInPassword(v => !v)}
                      >
                        {showSignInPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
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

                  {unverified && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm text-primary hover:text-primary-hover"
                      onClick={async () => {
                        try {
                          await resendVerificationEmail();
                          toast({ title: t('verification_email_resent'), description: t('please_check_email_to_activate') });
                        } catch (err: any) {
                          toast({ title: t('login_error'), description: err?.message || t('login_error_description'), variant: 'destructive' });
                        }
                      }}
                    >
                      {t('resend_verification_email')}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm text-primary hover:text-primary-hover"
                    onClick={() => setActiveTab("reset")}
                  >
                    {t("forgot_password")}
                  </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t("full_name")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder={t("your_name_placeholder")}
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
                        placeholder={t("your_email_placeholder")}
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
                    type={showSignUpPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-input border-border text-foreground"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showSignUpPassword ? t("hide_password") : t("show_password")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSignUpPassword(v => !v)}
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {(() => {
                    const pwd = signUpForm.password || "";
                    const len = pwd.length >= 8;
                    const up = /[A-Z]/.test(pwd);
                    const low = /[a-z]/.test(pwd);
                    const dig = /\d/.test(pwd);
                    const sym = /[^A-Za-z0-9]/.test(pwd);
                    let score = 0;
                    if (len) score += 25;
                    if (up && low) score += 25;
                    if (dig) score += 25;
                    if (sym) score += 25;
                    const label = score < 50 ? 'Fraca' : score < 75 ? 'Média' : score < 100 ? 'Forte' : 'Excelente';
                    const color = score < 50 ? 'text-destructive' : score < 75 ? 'text-warning' : 'text-success';
                    return (
                      <>
                        <Progress value={score} />
                        <div className={`text-xs ${color}`}>Força da senha: {label}</div>
                        <div className="text-[11px] text-muted-foreground">Mínimo 8 caracteres, incluir maiúsculas, minúsculas, números e símbolos.</div>
                      </>
                    );
                  })()}
                </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t("confirm_password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showSignUpConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-input border-border text-foreground"
                        value={signUpForm.confirmPassword}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showSignUpConfirm ? t("hide_password") : t("show_password")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignUpConfirm(v => !v)}
                      >
                        {showSignUpConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
              {/* Novo campo de código de referência */}
              <div className="space-y-2">
                <Label htmlFor="signup-referral">{t("referral_code_optional")}</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-referral"
                    placeholder={t("referral_code_placeholder")}
                    className="pl-10 bg-input border-border text-foreground uppercase"
                    value={signUpForm.referralCode}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, referralCode: e.target.value }))}
                  />
                </div>
              </div>

              {/* Aceite de Termos e Privacidade */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox id="accept-terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(!!v)} />
                  <Label htmlFor="accept-terms" className="text-sm text-muted-foreground">
                    Eu li e aceito os
                    {' '}<a href="/terms" target="_blank" rel="noreferrer" className="text-primary hover:underline">Termos de Uso</a>
                    {' '}e a{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Política de Privacidade</a>.
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">Para criar a conta é obrigatório aceitar nossos termos e políticas, dado que o site exige KYC e acessa dados pessoais.</p>
              </div>

              <Button 
                type="submit" 
                className="w-full glow-effect" 
                variant="hero"
                disabled={loading || !termsAccepted}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("create_account")}
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
                    placeholder={t("your_email_placeholder")}
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
                {t("send_recovery_email")}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-primary hover:text-primary-hover"
                onClick={() => setActiveTab("signin")}
              >
                {t("back_to_login")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;