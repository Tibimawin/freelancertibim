import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  DollarSign,
  Calendar
} from 'lucide-react';
import { DepositNegotiation } from '@/types/depositNegotiation';
import { DepositNegotiationService } from '@/services/depositNegotiationService';
import { useNavigate } from 'react-router-dom';

export const DepositHistory = () => {
  const [negotiations, setNegotiations] = useState<DepositNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // This would be replaced with actual userId from auth
    const userId = 'current-user-id'; // TODO: Get from useAuth
    
    const unsubscribe = DepositNegotiationService.subscribeToUserNegotiations(
      userId,
      (data) => {
        setNegotiations(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status: DepositNegotiation['status']) => {
    const variants: Record<DepositNegotiation['status'], { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pendente', icon: Clock },
      negotiating: { variant: 'default', label: 'Em Negociação', icon: Clock },
      awaiting_payment: { variant: 'outline', label: 'Aguardando Pagamento', icon: Clock },
      awaiting_proof: { variant: 'outline', label: 'Aguardando Comprovante', icon: Clock },
      approved: { variant: 'default', label: 'Aprovado', icon: CheckCircle },
      rejected: { variant: 'destructive', label: 'Rejeitado', icon: XCircle },
      cancelled: { variant: 'secondary', label: 'Cancelado', icon: XCircle }
    };

    const config = variants[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (negotiations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">Nenhuma negociação encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Suas negociações de depósito aparecerão aqui
              </p>
            </div>
            <Button onClick={() => navigate('/wallet')}>
              Ir para Carteira
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Histórico de Negociações</h2>
      
      <div className="grid gap-4">
        {negotiations.map((negotiation) => (
          <Card key={negotiation.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Negociação #{negotiation.id.slice(0, 8)}
                </CardTitle>
                {getStatusBadge(negotiation.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Solicitado</p>
                  <p className="font-semibold">{negotiation.requestedAmount.toFixed(2)} Kz</p>
                </div>
                
                {negotiation.agreedAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Acordado</p>
                    <p className="font-semibold text-success">{negotiation.agreedAmount.toFixed(2)} Kz</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">Data de Criação</p>
                  <p className="font-semibold flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(negotiation.createdAt.toDate()).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                {negotiation.agreedMethod && (
                  <div>
                    <p className="text-sm text-muted-foreground">Método</p>
                    <p className="font-semibold capitalize">{negotiation.agreedMethod}</p>
                  </div>
                )}
              </div>

              {negotiation.agreedDetails && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Detalhes do Acordo</p>
                  <p className="text-sm text-muted-foreground">{negotiation.agreedDetails}</p>
                </div>
              )}

              {negotiation.rejectionReason && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1 text-destructive">Motivo da Rejeição</p>
                  <p className="text-sm text-muted-foreground">{negotiation.rejectionReason}</p>
                </div>
              )}

              {negotiation.proofUrl && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Comprovante enviado
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(negotiation.proofUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Comprovante
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
