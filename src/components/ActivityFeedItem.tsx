import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  UserPlus, 
  Briefcase, 
  CheckCircle, 
  DollarSign,
  Star,
  MessageSquare
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

interface ActivityEvent {
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

interface ActivityFeedItemProps {
  activity: ActivityEvent;
}

export const ActivityFeedItem = ({ activity }: ActivityFeedItemProps) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'user_registered':
        return <UserPlus className="h-5 w-5 text-primary" />;
      case 'task_created':
        return <Briefcase className="h-5 w-5 text-blue-500" />;
      case 'proof_submitted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <DollarSign className="h-5 w-5 text-orange-500" />;
      case 'task_rated':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'comment_added':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Briefcase className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0">
        {activity.userId ? (
          <Link to={`/freelancer/${activity.userId}`}>
            <Avatar>
              <AvatarImage src={activity.userAvatar} />
              <AvatarFallback>
                {activity.userName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {getIcon()}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {activity.userId && (
            <Link 
              to={`/freelancer/${activity.userId}`}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {activity.userName}
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(activity.timestamp, { 
              addSuffix: true,
              locale: ptBR 
            })}
          </span>
        </div>
        
        <p className="text-sm text-foreground mb-1">{activity.title}</p>
        <p className="text-xs text-muted-foreground">{activity.description}</p>
      </div>
    </div>
  );
};
