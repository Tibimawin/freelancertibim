import { Badge } from "@/components/ui/badge";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import JobApplyButton from "./JobApplyButton";
import { useTranslation } from 'react-i18next';
import { Progress } from "@/components/ui/progress";

interface JobCardProps {
  id: string;
  title: string;
  description: string;
  bounty: number;
  platform: "iOS" | "Android" | "Web" | "TikTok" | "Instagram" | "Facebook" | "Play Store" | "App Store" | "X (Twitter)" | "Telegram" | "YouTube" | "LinkedIn" | "Discord";
  difficulty: "Fácil" | "Médio" | "Difícil";
  timeEstimate: string;
  rating?: number;
  location?: string;
  postedBy: string;
  applicants: number;
  posterId: string;
  maxApplicants?: number;
  status?: 'active' | 'completed' | 'paused' | 'cancelled' | string;
}

const JobCard = ({ 
  id,
  title, 
  description, 
  bounty, 
  platform, 
  difficulty, 
  timeEstimate, 
  rating = 0, 
  location, 
  postedBy,
  applicants,
  posterId,
  maxApplicants,
  status
}: JobCardProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnJob = currentUser && posterId === currentUser.uid;
  const { t } = useTranslation();

  const preview = {
    id,
    title,
    description,
    posterId,
    posterName: postedBy,
    bounty,
    platform,
    difficulty,
    timeEstimate,
    location,
    applicantCount: applicants,
    maxApplicants,
    status: status || 'active',
    rating,
    ratingCount: undefined,
    detailedInstructions: [],
    proofRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const storePreview = () => {
    try {
      sessionStorage.setItem(`job_preview_${id}`, JSON.stringify(preview));
    } catch {}
  };

  const handleCardClick = () => {
    storePreview();
    navigate(`/job/${id}`, { state: { job: preview } });
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case "iOS":
      case "Android":
        return <Smartphone className="h-4 w-4" />;
      case "Web":
        return <Globe className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
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

  const isFull = typeof maxApplicants === 'number' && (applicants || 0) >= maxApplicants;
  const progressValue = typeof maxApplicants === 'number' && maxApplicants > 0
    ? Math.min(100, Math.round(((applicants || 0) / maxApplicants) * 100))
    : undefined;

  return (
    <div 
      className="group relative rounded-2xl bg-card p-6 shadow-lg border-2 border-border hover:border-primary/40 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 animate-fade-in" 
      onClick={handleCardClick}
    >
      {/* Gradiente de fundo animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glow effect no canto */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
      
      {/* Header com plataforma e recompensa */}
      <div className="flex items-start justify-between mb-5 gap-4 relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2.5 bg-gradient-primary rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
            <div className="text-white">
              {getPlatformIcon()}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${getDifficultyColor()} transition-all duration-300 group-hover:shadow-md border-2 font-semibold`}>
                {t(difficulty.toLowerCase())}
              </Badge>
              <Badge className="bg-gradient-secondary text-white border-0 shadow-sm group-hover:shadow-md transition-all duration-300 font-semibold">
                {platform}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 text-primary" />
            <p className="text-3xl font-black bg-gradient-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 origin-right">
              {bounty.toFixed(2)}
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Kz</p>
        </div>
      </div>

      {/* Título e descrição */}
      <div className="mb-5 relative z-10">
        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-1">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Barra de progresso de candidatos */}
      {typeof maxApplicants === 'number' && (
        <div className="mb-5 relative z-10">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
              {applicants || 0} {t("applicants")}
            </span>
            <span>{t("max")}: {maxApplicants}</span>
          </div>
          <Progress value={progressValue} className="h-2.5 bg-muted" />
          {isFull && (
            <div className="mt-2 px-3 py-1.5 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
              <p className="text-xs font-bold text-destructive text-center">{t("applications_full")}</p>
            </div>
          )}
        </div>
      )}

      {/* Informações adicionais */}
      <div className="flex items-center gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-all duration-300">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{timeEstimate}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg group-hover:bg-accent/10 transition-all duration-300">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
        </div>

        {location && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg group-hover:bg-secondary/10 transition-all duration-300">
            <MapPin className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">{location}</span>
          </div>
        )}
      </div>

      {/* Rodapé com autor e ações */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-border relative z-10">
        <div className="text-sm">
          <span className="text-muted-foreground">{t("posted_by")} </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${posterId}`);
            }}
            className="font-bold text-primary hover:text-primary-hover transition-colors duration-300 hover:underline"
            aria-label={t("posted_by") + ": " + postedBy}
          >
            {postedBy}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {isFull || status === 'completed' ? (
            <Badge className="bg-muted/60 text-muted-foreground border-2 border-border font-semibold">
              {t("applications_full")}
            </Badge>
          ) : (
            <div onClick={storePreview} className="hover:scale-110 transition-transform duration-300">
              <JobApplyButton jobId={id} posterId={posterId} />
            </div>
          )}
          <Link
            to={`/job/${id}`}
            state={{ job: preview }}
            onClick={storePreview}
            className="text-sm font-bold text-primary hover:text-primary-hover transition-all duration-300 group-hover:translate-x-1 flex items-center gap-1"
          >
            {t("view_details")} 
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;