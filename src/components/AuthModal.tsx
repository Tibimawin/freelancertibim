import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  // Form states
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: ""
  });
  const [resetForm, setResetForm] = useState({ email: "" });

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(signInForm.email, signInForm.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Freelincer.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
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
        title: "Erro na senha",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (signUpForm.password.length < 6) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await signUp(signUpForm.email, signUpForm.password, signUpForm.name);
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao Freelincer. Sua jornada começa agora!",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Algo deu errado. Tente novamente.",
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
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setActiveTab("signin");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar email de recuperação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-xl border-border">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-xl font-bold text-foreground">Freelincer</span>
          </div>
          
          <CardTitle className="text-2xl">
            {activeTab === "signin" ? "Entrar" : activeTab === "signup" ? "Criar Conta" : "Recuperar Senha"}
          </CardTitle>
          <CardDescription>
            {activeTab === "signin" 
              ? "Entre na sua conta para continuar" 
              : activeTab === "signup" 
              ? "Junte-se à comunidade de freelancers" 
              : "Digite seu email para recuperar a senha"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeTab !== "reset" ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={signInForm.email}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signInForm.password}
                        onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setActiveTab("reset")}
                  >
                    Esqueceu sua senha?
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder="Seu nome"
                        className="pl-10"
                        value={signUpForm.name}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signUpForm.confirmPassword}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    variant="hero"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={resetForm.email}
                    onChange={(e) => setResetForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="hero"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Email de Recuperação
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setActiveTab("signin")}
              >
                Voltar ao Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;