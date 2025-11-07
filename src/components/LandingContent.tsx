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
import { useTranslation } from 'react-i18next';

const LandingContent = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-20 py-16 bg-nebula-bg text-nebula-fg">
      {/* Como Funciona */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-electric-purple/20 text-electric-purple border-electric-purple/30">
            {t("how it works")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("simple fast secure")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("how it works description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale">
            <CardHeader>
              <div className="w-16 h-16 bg-electric-purple/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-electric-purple/20">
                <Users className="h-8 w-8 text-electric-purple" />
              </div>
              <CardTitle className="text-xl text-foreground">1. {t("register")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                {t("register description")}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale">
            <CardHeader>
              <div className="w-16 h-16 bg-cosmic-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cosmic-blue/20">
                <Smartphone className="h-8 w-8 text-cosmic-blue" />
              </div>
              <CardTitle className="text-xl text-foreground">2. {t("choose tasks")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                {t("choose tasks description")}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale">
            <CardHeader>
              <div className="w-16 h-16 bg-star-glow/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-star-glow/20">
                <DollarSign className="h-8 w-8 text-star-glow" />
              </div>
              <CardTitle className="text-xl text-foreground">3. {t("receive payment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                {t("receive payment description")}
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
              <Badge variant="secondary" className="mb-4 bg-electric-purple/20 text-electric-purple border-electric-purple/30">
                {t("for freelancers")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("earn money free time")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("earn money free time description")}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("payment range")}</span>
                </div>
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("flexible hours")}</span>
                </div>
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("work anywhere")}</span>
                </div>
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("payment approval time")}</span>
                </div>
              </div>

              <Button size="lg" variant="hero" className="text-lg px-8 glow-effect">
                {t("start working now")}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
                <CardHeader className="pb-3">
                  <Clock className="h-8 w-8 text-cosmic-blue mb-2" />
                  <CardTitle className="text-lg text-foreground">{t("flexible")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("flexible description")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
                <CardHeader className="pb-3">
                  <Shield className="h-8 w-8 text-electric-purple mb-2" />
                  <CardTitle className="text-lg text-foreground">{t("secure")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("secure description")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
                <CardHeader className="pb-3">
                  <Zap className="h-8 w-8 text-star-glow mb-2" />
                  <CardTitle className="text-lg text-foreground">{t("fast")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("fast description")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
                <CardHeader className="pb-3">
                  <Target className="h-8 w-8 text-success mb-2" />
                  <CardTitle className="text-lg text-foreground">{t("focused")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("focused description")}
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
            <Badge variant="secondary" className="mb-4 bg-cosmic-blue/20 text-cosmic-blue border-cosmic-blue/30">
              {t("for companies")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("professional validation apps")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("professional validation apps description")}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("pre qualified freelancers")}</span>
              </div>
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("detailed bug reports")}</span>
              </div>
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("usability feedback")}</span>
              </div>
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("multi platform tasks")}</span>
              </div>
            </div>

            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent border-cosmic-blue/50 text-cosmic-blue hover:bg-cosmic-blue/10">
              {t("post task")}
            </Button>
          </div>

          <div className="lg:order-1">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-gradient-primary text-white border-0 p-6 shadow-lg interactive-scale">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Globe className="h-8 w-8 text-white" />
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {t("multiplatform")}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">{t("ios android web")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">
                    {t("multiplatform description")}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <TrendingUp className="h-6 w-6 text-success mb-2" />
                    <CardTitle className="text-sm text-foreground">{t("quality")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">98%</p>
                    <p className="text-xs text-muted-foreground">{t("satisfaction")}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
                  <CardHeader className="pb-3">
                    <Award className="h-6 w-6 text-star-glow mb-2" />
                    <CardTitle className="text-sm text-foreground">{t("experience")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">5+</p>
                    <p className="text-xs text-muted-foreground">{t("years")}</p>
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
            <Badge variant="secondary" className="mb-4 bg-star-glow/20 text-star-glow border-star-glow/30">
              {t("testimonials")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("what our users say")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-electric-purple/10 rounded-full flex items-center justify-center border border-electric-purple/20">
                    <span className="font-bold text-electric-purple">MS</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground">{t("maria silva")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("freelancer role")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-star-glow text-star-glow" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("maria silva quote")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-cosmic-blue/10 rounded-full flex items-center justify-center border border-cosmic-blue/20">
                    <span className="font-bold text-cosmic-blue">JO</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground">{t("joao oliveira")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("ceo techstart")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-star-glow text-star-glow" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("joao oliveira quote")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border p-6 shadow-md interactive-scale">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-electric-purple/10 rounded-full flex items-center justify-center border border-electric-purple/20">
                    <span className="font-bold text-electric-purple">AS</span>
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground">{t("ana santos")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("developer role")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-star-glow text-star-glow" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("ana santos quote")}
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
            {t("ready to start")}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t("ready to start description")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4 glow-effect">
              {t("register as freelancer")}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              {t("post task")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingContent;