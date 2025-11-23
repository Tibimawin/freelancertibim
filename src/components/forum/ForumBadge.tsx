import { FORUM_BADGES } from '@/types/forumBadges';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as LucideIcons from 'lucide-react';

interface ForumBadgeProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
};

const TIER_COLORS = {
  bronze: 'bg-amber-700/20 border-amber-700 text-amber-700',
  silver: 'bg-gray-400/20 border-gray-400 text-gray-600',
  gold: 'bg-yellow-500/20 border-yellow-500 text-yellow-600',
  platinum: 'bg-purple-500/20 border-purple-500 text-purple-600',
  diamond: 'bg-cyan-400/20 border-cyan-400 text-cyan-600'
};

export const ForumBadge = ({ badgeId, size = 'md', showTooltip = true }: ForumBadgeProps) => {
  const badge = FORUM_BADGES.find(b => b.id === badgeId);
  
  if (!badge) return null;

  const IconComponent = (LucideIcons as any)[badge.icon];
  const iconSize = SIZE_MAP[size];
  const tierColor = TIER_COLORS[badge.tier];

  const badgeContent = (
    <Badge variant="outline" className={`${tierColor} gap-1 px-2 py-1`}>
      {IconComponent && <IconComponent className={iconSize} />}
      <span className="text-xs font-semibold">{badge.name}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">Tier: {badge.tier}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
