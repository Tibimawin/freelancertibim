import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DepositNegotiationService } from '@/services/depositNegotiationService';
import { DepositNegotiation as DepositNegotiationType } from '@/types/depositNegotiation';
import { DepositNegotiationThread } from '@/components/DepositNegotiationThread';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CloudinaryService } from '@/lib/cloudinary';

const DepositNegotiation = () => {
  const [searchParams] = useSearchParams();
  const negotiationId = searchParams.get('id');
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [negotiation, setNegotiation] = useState<DepositNegotiationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!negotiationId) {
      navigate('/carteira');
      return;
    }

    loadNegotiation();
  }, [negotiationId, currentUser]);

  const loadNegotiation = async () => {
    if (!negotiationId) return;

    setLoading(true);
    try {
      const data = await DepositNegotiationService.getNegotiationById(negotiationId);
      if (!data) {
        toast.error('Negociação não encontrada');
        navigate('/carteira');
        return;
      }

      // Verificar se o usuário tem permissão
      if (data.userId !== currentUser?.uid) {
        toast.error('Você não tem permissão para acessar esta negociação');
        navigate('/carteira');
        return;
      }

      setNegotiation(data);
    } catch (error) {
      console.error('Error loading negotiation:', error);
      toast.error('Erro ao carregar negociação');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !negotiationId || !currentUser) return;

    setUploading(true);
    try {
      const result = await CloudinaryService.uploadFile(selectedFile, `deposit-proofs/${currentUser.uid}`);
      await DepositNegotiationService.uploadProof(negotiationId, result.url);
      
      toast.success('Comprovante enviado com sucesso!');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      await loadNegotiation();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error('Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando negociação...</p>
        </div>
      </div>
    );
  }

  if (!negotiation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/carteira')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Negociação de Depósito
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Negocie diretamente com nossa equipe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-[calc(100vh-250px)] min-h-[500px]">
            <DepositNegotiationThread
              negotiation={negotiation}
              role="user"
              onUploadProof={() => setUploadDialogOpen(true)}
            />
          </div>

          {/* Info Cards */}
          {negotiation.agreedDetails && (
            <div className="mt-6 p-4 rounded-lg bg-accent/50 border border-accent">
              <h3 className="font-semibold text-sm mb-2">Detalhes do Pagamento</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {negotiation.agreedDetails}
              </p>
            </div>
          )}

          {negotiation.proofUrl && (
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
              <h3 className="font-semibold text-sm mb-2">Comprovante Enviado</h3>
              <a
                href={negotiation.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Ver comprovante →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Comprovante</DialogTitle>
            <DialogDescription>
              Faça upload da imagem do comprovante de pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar'}
                  </p>
                </div>
                <Input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadProof}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepositNegotiation;
