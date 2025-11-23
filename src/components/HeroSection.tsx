import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, DollarSign, Clock } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5 min-h-[85vh] flex items-center justify-center">
      {/* Background decorativo */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Plataforma de tarefas digitais profissional"
          className="h-full w-full object-cover opacity-[0.03]"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-secondary/20" />
        
        {/* Efeitos de luz modernos */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          {/* Badge Premium */}
          <div className="mb-6 flex justify-center animate-fade-in">
            <div className="inline-flex items-center gap-3 rounded-full px-6 py-3 bg-gradient-hero text-white font-bold shadow-xl border-2 border-white/20 backdrop-blur-sm">
              <span className="text-2xl">⚡</span>
              <span className="text-sm md:text-base">{t("platform_1_freelancers")}</span>
            </div>
          </div>

          {/* Promo Banner Melhorado */}
          <div className="mb-10 flex justify-center animate-slide-up">
            <div className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 border-2 border-success/40 bg-success/15 text-foreground backdrop-blur-md shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <span className="text-2xl">🎁</span>
              <span className="font-bold text-base md:text-lg">Ganhe 500 Kz de bônus ao se registrar</span>
            </div>
          </div>

          {/* Heading Principal Melhorado */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 animate-fade-in font-jakarta leading-[1.1]">
            {t("earn_money")}
            <br />
            <span className="bg-gradient-hero bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              {t("with_digital_tasks")}
            </span>
          </h1>

          {/* Descrição Aprimorada */}
          <p className="text-xl md:text-2xl mb-12 text-muted-foreground animate-slide-up max-w-4xl mx-auto leading-relaxed font-medium">
            {t("hero_description")}
          </p>

          {/* CTA Buttons Premium */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 animate-scale-in">
            <Button
              variant="hero"
              size="lg"
              className="text-lg px-12 py-7 h-auto font-bold shadow-2xl"
              onClick={() => navigate('/login')}
            >
              {t("start_working_now")}
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              className="text-lg px-12 py-7 h-auto font-bold shadow-xl"
              onClick={() => navigate('/create-job')}
            >
              {t("post_task")}
            </Button>
          </div>

          {/* Stats Redesenhados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="group text-center p-6 rounded-2xl bg-card/80 backdrop-blur-md border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <span className="block text-4xl font-black bg-gradient-primary bg-clip-text text-transparent mb-2">5K+</span>
              <p className="text-sm text-muted-foreground font-semibold">{t("active_freelancers")}</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl bg-card/80 backdrop-blur-md border-2 border-border hover:border-success/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
              <span className="block text-4xl font-black text-success mb-2">2M+</span>
              <p className="text-sm text-muted-foreground font-semibold">{t("paid_to_freelancers")}</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl bg-card/80 backdrop-blur-md border-2 border-border hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                  <Star className="h-6 w-6 text-accent" />
                </div>
              </div>
              <span className="block text-4xl font-black text-accent mb-2">4.9</span>
              <p className="text-sm text-muted-foreground font-semibold">{t("average_rating")}</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl bg-card/80 backdrop-blur-md border-2 border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <span className="block text-4xl font-black text-secondary mb-2">24h</span>
              <p className="text-sm text-muted-foreground font-semibold">{t("average_support")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;