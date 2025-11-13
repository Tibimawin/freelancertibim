import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DownloadService } from '@/services/downloadService';

export default function DownloadPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setErrorMsg('Token ausente.');
        setStatus('error');
        return;
      }
      try {
        const t = await DownloadService.getToken(token);
        if (!t) {
          setErrorMsg('Token inválido ou inexistente.');
          setStatus('error');
          return;
        }
        const now = new Date();
        if (t.expiresAt <= now) {
          setErrorMsg('Token expirado. Solicite um novo download.');
          setStatus('error');
          return;
        }
        if (t.consumed) {
          setErrorMsg('Token já utilizado.');
          setStatus('error');
          return;
        }
        if (!currentUser || currentUser.uid !== t.buyerId) {
          setErrorMsg('Você não possui permissão para este download.');
          setStatus('error');
          return;
        }
        setDownloadUrl(t.downloadUrl);
        setStatus('ready');
        // Auto-iniciar o download
        try {
          window.open(t.downloadUrl, '_blank');
          await DownloadService.consumeToken(token);
          toast({ title: 'Download iniciado', description: 'Seu arquivo foi liberado.' });
        } catch (e) {
          // deixa o botão manual
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Falha ao validar token.');
        setStatus('error');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold">Download Seguro</h1>
          <p className="text-muted-foreground">Link temporário com expiração</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Preparar download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="text-sm text-muted-foreground">Validando token e preparando seu download...</div>
            )}
            {status === 'error' && (
              <div className="space-y-3">
                <div className="text-sm text-destructive">{errorMsg}</div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => navigate('/market')}>Ir ao Mercado</Button>
                </div>
              </div>
            )}
            {status === 'ready' && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Se o download não abriu automaticamente, use o botão abaixo.</div>
                <Button onClick={() => window.open(downloadUrl, '_blank')}>Abrir download</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}