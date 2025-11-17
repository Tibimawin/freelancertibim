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
import { useNavigate } from "react-router-dom";

const LandingContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-20 py-16 bg-nebula-bg text-nebula-fg">
      {/* Como Funciona */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-electric-purple/20 text-electric-purple border-electric-purple/30">
            {t("how_it_works")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("simple_fast_secure")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("how_it_works_description")}
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
                {t("register_description")}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale">
            <CardHeader>
              <div className="w-16 h-16 bg-cosmic-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cosmic-blue/20">
                <Smartphone className="h-8 w-8 text-cosmic-blue" />
              </div>
              <CardTitle className="text-xl text-foreground">2. {t("choose_tasks")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                {t("choose_tasks_description")}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border border-border bg-card p-6 shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale">
            <CardHeader>
              <div className="w-16 h-16 bg-star-glow/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-star-glow/20">
                <DollarSign className="h-8 w-8 text-star-glow" />
              </div>
              <CardTitle className="text-xl text-foreground">3. {t("receive_payment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                {t("receive_payment_description")}
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
                {t("for_freelancers")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("earn_money_free_time")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("earn_money_free_time_description")}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("payment_range")}</span>
                </div>
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("flexible_hours")}</span>
                </div>
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("work_anywhere")}</span>
                </div>
                <div className="flex items-center space-x-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{t("payment_approval_time")}</span>
                </div>
              </div>

              <Button
                size="lg"
                variant="hero"
                className="text-lg px-8 glow-effect"
                onClick={() => navigate('/login')}
              >
                {t("start_working_now")}
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
                    {t("flexible_description")}
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
                    {t("secure_description")}
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
                    {t("fast_description")}
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
                    {t("focused_description")}
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
              {t("for_companies")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("professional_validation_apps")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("professional_validation_apps_description")}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("pre_qualified_freelancers")}</span>
              </div>
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("detailed_bug_reports")}</span>
              </div>
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("usability_feedback")}</span>
              </div>
              <div className="flex items-center space-x-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <span>{t("multi_platform_tasks")}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 bg-transparent border-cosmic-blue/50 text-cosmic-blue hover:bg-cosmic-blue/10"
              onClick={() => navigate('/create-job')}
            >
              {t("post_task")}
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
                  <CardTitle className="text-xl text-white">{t("ios_android_web")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">
                    {t("multiplatform_description")}
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
              {t("what_our_users_say")}
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
                    <CardTitle className="text-sm text-foreground">{t("maria_silva")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("freelancer_role")}</p>
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
                  {t("maria_silva_quote")}
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
                    <CardTitle className="text-sm text-foreground">{t("joao_oliveira")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("ceo_techstart")}</p>
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
                  {t("joao_oliveira_quote")}
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
                    <CardTitle className="text-sm text-foreground">{t("ana_santos")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("developer_role")}</p>
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
                  {t("ana_santos_quote")}
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
            {t("ready_to_start")}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t("ready_to_start_description")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              className="text-lg px-8 py-4 glow-effect"
              onClick={() => navigate('/profile')}
            >
              {t("register_as_freelancer")}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate('/create-job')}
            >
              {t("post_task")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingContent;