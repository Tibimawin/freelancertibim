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
    <div className="relative overflow-hidden bg-nebula-bg min-h-[70vh] flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Plataforma de testes de aplicativos freelancers"
          className="h-full w-full object-cover opacity-10"
          decoding="async"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-nebula-bg/90 via-nebula-bg/70 to-nebula-bg/90" /> {/* Darker, more subtle overlay */}
      </div>

      <div className="relative z-10 py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-5xl text-center text-nebula-fg">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 bg-electric-purple/20 text-electric-purple border-electric-purple/30 backdrop-blur-sm animate-float-subtle">
            🚀 {t("platform_1_freelancers")}
          </Badge>

          {/* Promo Banner */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center rounded-full px-4 py-2 border border-green-400/30 bg-green-500/10 text-green-300 backdrop-blur-sm shadow-sm">
              <span className="mr-2">🎁</span>
              <span>ganhe 500kz de bonus a se registrar pela primeira vez</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            {t("earn_money")}
            <br />
            <span className="bg-gradient-to-r from-electric-purple to-cosmic-blue bg-clip-text text-transparent">
              {t("with_digital_tasks")}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl mb-8 text-nebula-fg/80 animate-slide-up max-w-3xl mx-auto">
            {t("hero_description")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-scale-in">
            <Button
              variant="hero"
              size="lg"
              className="text-lg px-8 py-4 glow-effect"
              onClick={() => navigate('/login')}
            >
              {t("start_working_now")}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 bg-transparent border-electric-purple/50 text-electric-purple hover:bg-electric-purple/10 backdrop-blur-sm"
              onClick={() => navigate('/create-job')}
            >
              {t("post_task")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12">
            <div className="text-center animate-fade-in delay-100">
              <div className="flex items-center justify-center mb-2 text-electric-purple">
                <Users className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">5,000+</span>
              </div>
              <p className="text-sm text-nebula-fg/70">{t("active_freelancers")}</p>
            </div>
            
            <div className="text-center animate-fade-in delay-200">
              <div className="flex items-center justify-center mb-2 text-electric-purple">
                <DollarSign className="h-6 w-6 mr-2" />
        <span className="text-2xl font-bold">2M+ Kz</span>
              </div>
              <p className="text-sm text-nebula-fg/70">{t("paid_to_freelancers")}</p>
            </div>
            
            <div className="text-center animate-fade-in delay-300">
              <div className="flex items-center justify-center mb-2 text-electric-purple">
                <Star className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">4.9</span>
              </div>
              <p className="text-sm text-nebula-fg/70">{t("average_rating")}</p>
            </div>
            
            <div className="text-center animate-fade-in delay-400">
              <div className="flex items-center justify-center mb-2 text-electric-purple">
                <Clock className="h-6 w-6 mr-2" />
                <span className="text-2xl font-bold">24h</span>
              </div>
              <p className="text-sm text-nebula-fg/70">{t("average_support")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;