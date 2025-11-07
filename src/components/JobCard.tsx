import { Badge } from "@/components/ui/badge";
import { Clock, Star, MapPin, Smartphone, Monitor, Globe, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import JobApplyButton from "./JobApplyButton";
import { useTranslation } from 'react-i18next';

interface JobCardProps {
  id: string;
  title: string;
  description: string;
  bounty: number;
  platform: "iOS" | "Android" | "Web" | "TikTok" | "Instagram" | "Facebook" | "OnlyFans" | "Play Store" | "App Store" | "Pornhub" | "X (Twitter)" | "Telegram" | "YouTube" | "WeChat" | "Snapchat" | "Pinterest" | "Threads" | "LinkedIn" | "Discord" | "Reddit";
  difficulty: "Fácil" | "Médio" | "Difícil";
  timeEstimate: string;
  rating?: number;
  location?: string;
  postedBy: string;
  applicants: number;
  posterId: string;
}

const JobCard = ({ 
  id,
  title, 
  description, 
  bounty, 
  platform, 
  difficulty, 
  timeEstimate, 
  rating = 4.5, 
  location, 
  postedBy,
  applicants,
  posterId
}: JobCardProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnJob = currentUser && posterId === currentUser.uid;
  const { t } = useTranslation();

  const handleCardClick = () => {
    navigate(`/job/${id}`);
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

  return (
    <div 
      className="card-hover group rounded-xl bg-card p-6 shadow-md cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border border-border" 
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getPlatformIcon()}
          <Badge variant="outline" className={getDifficultyColor()}>
            {t(difficulty.toLowerCase())}
          </Badge>
          <Badge variant="secondary" className="bg-cosmic-blue/20 text-cosmic-blue border-cosmic-blue/30">{platform}</Badge>
        </div>
        <div className="text-right">
          <p className="balance-display text-2xl font-bold">{bounty.toFixed(2)} KZ</p>
          <p className="text-sm text-muted-foreground">{t("applicants count", { count: applicants })}</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-electric-purple transition-colors">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{timeEstimate}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 fill-star-glow text-star-glow" />
            <span>{rating.toFixed(1)}</span>
          </div>

          {location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">{t("posted by")} </span>
          <span className="font-medium text-foreground">{postedBy}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <JobApplyButton jobId={id} posterId={posterId} />
          <div className="text-sm text-primary hover:text-primary-hover transition-colors">
            {t("view details")} →
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;