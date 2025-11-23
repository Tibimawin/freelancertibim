import { Badge } from "@/components/ui/badge";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, DollarSign, Eye } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JobPreviewProps {
  title: string;
  description: string;
  bounty: string;
  platform: string;
  difficulty: string;
  timeEstimate: string;
  location?: string;
  category?: string;
  subcategory?: string;
}

const JobPreview = ({ 
  title, 
  description, 
  bounty, 
  platform, 
  difficulty, 
  timeEstimate, 
  location,
  category,
  subcategory
}: JobPreviewProps) => {
  const { t } = useTranslation();

  const getPlatformIcon = () => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('ios') || platformLower.includes('android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (platformLower.includes('web')) {
      return <Globe className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "Fácil":
        return "bg-success/10 text-success border-success/20";
      case "Médio":
        return "bg-warning/10 text-warning border-warning/20";
      case "Difícil":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const displayTitle = title || "Título da tarefa aparecerá aqui";
  const displayDescription = description || "A descrição da tarefa será exibida aqui. Quanto mais detalhada, melhor para os freelancers entenderem o que precisam fazer.";
  const displayBounty = bounty ? parseFloat(bounty) : 0;
  const displayPlatform = subcategory || platform || "Plataforma";
  const displayDifficulty = difficulty || "Fácil";
  const displayTime = timeEstimate || "Não especificado";

  return (
    <Card className="sticky top-6 bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 shadow-xl">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-primary" />
          <span className="bg-gradient-primary bg-clip-text text-transparent">Pré-visualização</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Como os freelancers verão sua tarefa</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="group relative rounded-2xl bg-card p-6 shadow-lg border-2 border-border overflow-hidden transition-all duration-500">
          {/* Gradiente de fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-100" />
          
          {/* Glow effects */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl opacity-50" />
          
          {/* Header com plataforma e recompensa */}
          <div className="flex items-start justify-between mb-5 gap-4 relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 bg-gradient-primary rounded-xl shadow-md">
                <div className="text-white">
                  {getPlatformIcon()}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${getDifficultyColor()} border-2 font-semibold`}>
                    {t(displayDifficulty.toLowerCase())}
                  </Badge>
                  <Badge className="bg-gradient-secondary text-white border-0 shadow-sm font-semibold">
                    {displayPlatform}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-primary" />
                <p className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent">
                  {displayBounty.toFixed(2)}
                </p>
              </div>
              <p className="text-xs font-medium text-muted-foreground">Kz</p>
            </div>
          </div>

          {/* Título e descrição */}
          <div className="mb-5 relative z-10">
            <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${title ? 'text-foreground' : 'text-muted-foreground italic'}`}>
              {displayTitle}
            </h3>
            
            <p className={`text-sm leading-relaxed line-clamp-3 ${description ? 'text-muted-foreground' : 'text-muted-foreground/50 italic'}`}>
              {displayDescription}
            </p>
          </div>

          {/* Informações adicionais */}
          <div className="flex items-center gap-4 relative z-10 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{displayTime}</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-bold text-foreground">0.0</span>
            </div>

            {location && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">{location}</span>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-border relative z-10">
            <div className="text-sm">
              <span className="text-muted-foreground">{t("posted_by")} </span>
              <span className="font-bold text-primary">Você</span>
            </div>
            
            <div className="text-sm font-bold text-primary flex items-center gap-1">
              {t("view_details")} 
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            ✨ Esta é uma prévia em tempo real. Continue preenchendo o formulário para ver as alterações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobPreview;
