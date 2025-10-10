import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Smartphone, 
  Shield, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  CheckCircle, 
  Zap,
  Target,
  TrendingUp,
  Globe,
  Award
} from "lucide-react";

const LandingContent = () => {
  return (
    <div className="space-y-20">
      {/* Como Funciona */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Como Funciona</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simples, Rápido e Seguro
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Em apenas 3 passos você pode começar a ganhar dinheiro como freelancer de aplicativos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>1. Cadastre-se</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crie sua conta gratuita e complete seu perfil em menos de 2 minutos
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>2. Escolha Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Navegue pelas tarefas disponíveis e escolha as que mais se adequam ao seu perfil
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>3. Receba</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete as tarefas e receba seu pagamento de forma rápida e segura
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefícios para Freelancers */}
      <section className="bg-gradient-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Para Freelancers</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ganhe Dinheiro no Seu Tempo Livre
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Transforme seu conhecimento em tecnologia em uma fonte de renda extra. 
                Trabalhe quando e onde quiser.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Pagamentos de 250 a 5000 KZ por tarefa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Flexibilidade total de horários</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Trabalhe de qualquer lugar</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Pagamento em até 48h após aprovação</span>
                </div>
              </div>

              <Button size="lg" className="text-lg px-8">
                Começar a Trabalhar Agora
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Flexível</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Trabalhe quando quiser, sem compromissos fixos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Seguro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Pagamentos garantidos e dados protegidos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Tarefas de 30 minutos a 4 horas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Focado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Tarefas relevantes para seu perfil
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios para Empresas */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-2">
            <Badge variant="outline" className="mb-4">Para Empresas</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Validação Profissional para Seus Apps
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Conecte-se com freelancers qualificados e obtenha feedback valioso 
              antes do lançamento do seu produto.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Freelancers pré-qualificados</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Relatórios detalhados de bugs</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Feedback de usabilidade</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Tarefas em múltiplas plataformas</span>
              </div>
            </div>

            <Button variant="outline" size="lg" className="text-lg px-8">
              Postar uma Tarefa
            </Button>
          </div>

          <div className="lg:order-1">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-gradient-primary text-white border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Globe className="h-8 w-8" />
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      Multiplataforma
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">iOS, Android, Web</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">
                    Trabalhe em todas as plataformas com uma única postagem
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <TrendingUp className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-sm">Qualidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">98%</p>
                    <p className="text-xs text-muted-foreground">Satisfação</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <Award className="h-6 w-6 text-primary mb-2" />
                    <CardTitle className="text-sm">Experiência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">5+</p>
                    <p className="text-xs text-muted-foreground">Anos</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Depoimentos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O Que Nossos Usuários Dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">MS</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm">Maria Silva</CardTitle>
                    <p className="text-xs text-muted-foreground">Freelancer</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  "Consegui uma renda extra excelente trabalhando em apps. A plataforma é super fácil de usar!"
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">JO</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm">João Oliveira</CardTitle>
                    <p className="text-xs text-muted-foreground">CEO, TechStart</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  "Os freelancers encontraram bugs críticos antes do lançamento. Economizamos muito dinheiro!"
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">AS</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm">Ana Santos</CardTitle>
                    <p className="text-xs text-muted-foreground">Desenvolvedora</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  "Trabalho meio período como freelancer e já consegui comprar meu primeiro notebook!"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de freelancers e empresas que já confiam na nossa plataforma
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              Cadastrar como Freelancer
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Postar uma Tarefa
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingContent;