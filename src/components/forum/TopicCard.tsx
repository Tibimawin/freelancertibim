import { Link } from 'react-router-dom';
import { ForumTopic } from '@/services/forumService';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, ThumbsUp, CheckCircle2, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TopicCardProps {
  topic: ForumTopic;
}

const CATEGORY_CONFIG = {
  geral: { label: 'Geral', color: 'bg-blue-500' },
  dicas: { label: 'Dicas & Truques', color: 'bg-green-500' },
  ajuda: { label: 'Preciso de Ajuda', color: 'bg-orange-500' },
  bugs: { label: 'Bugs & Problemas', color: 'bg-red-500' },
  sugestoes: { label: 'Sugestões', color: 'bg-purple-500' },
  anuncios: { label: 'Anúncios', color: 'bg-yellow-500' }
};

export const TopicCard = ({ topic }: TopicCardProps) => {
  const categoryConfig = CATEGORY_CONFIG[topic.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.geral;

  return (
    <Link to={`/community/forum/${topic.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={topic.authorAvatar} />
              <AvatarFallback>{topic.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {topic.isPinned && (
                      <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                      {topic.title}
                    </h3>
                    {topic.isResolved && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium text-foreground">{topic.authorName}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(topic.createdAt, {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                </div>

                <div className={`h-2 w-2 rounded-full ${categoryConfig.color} flex-shrink-0 mt-1`} />
              </div>

              {/* Preview do conteúdo */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {topic.content}
              </p>

              {/* Tags */}
              {topic.tags && topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {topic.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{topic.replyCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{topic.viewCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{topic.upvotes}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {categoryConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
