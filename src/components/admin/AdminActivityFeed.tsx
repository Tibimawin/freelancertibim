import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useActivityFeed, ActivityEvent } from '@/hooks/useActivityFeed';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Activity } from 'lucide-react';

const ActivityItem = ({ activity }: { activity: ActivityEvent }) => {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="text-2xl flex-shrink-0 mt-1">
        {activity.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`font-medium text-sm ${activity.color}`}>
              {activity.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {activity.description}
            </p>
          </div>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {formatDistanceToNow(activity.timestamp, {
              addSuffix: true,
              locale: ptBR
            })}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export const AdminActivityFeed = () => {
  const { activities, loading } = useActivityFeed();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Atividades em Tempo Real</CardTitle>
            <CardDescription>Feed ao vivo de eventos da plataforma</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos aparecerão aqui em tempo real
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
