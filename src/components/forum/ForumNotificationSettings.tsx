import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, CheckCircle2 } from 'lucide-react';

export const ForumNotificationSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações do Fórum</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium mb-1">Novas Respostas</div>
              <p className="text-sm text-muted-foreground">
                Receba notificação quando alguém responder nos seus tópicos
              </p>
              <Badge variant="secondary" className="mt-2">Ativo</Badge>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium mb-1">Solução Aceita</div>
              <p className="text-sm text-muted-foreground">
                Receba notificação quando sua resposta for aceita como solução
              </p>
              <Badge variant="secondary" className="mt-2">Ativo</Badge>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <ThumbsUp className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium mb-1">Upvotes</div>
              <p className="text-sm text-muted-foreground">
                Receba notificação quando seus tópicos ou respostas receberem upvotes
              </p>
              <Badge variant="secondary" className="mt-2">Ativo</Badge>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Dica: As notificações do fórum aparecem no sino de notificações e também podem gerar notificações push do navegador se você permitir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
