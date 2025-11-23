import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, CheckCircle, XCircle, Eye, EyeOff, AlertTriangle, ExternalLink } from 'lucide-react';
import { Application, Job } from '@/types/firebase';
import { ApplicationService } from '@/services/applicationService';
import { JobService } from '@/services/firebase';
import { AdminInterventionService } from '@/services/adminInterventionService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function AdminEmailCreationTasks() {
  const { currentUser, userData } = useAuth();
  const [applications, setApplications] = useState<(Application & { job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'rejected'>('all');
  const [selectedApp, setSelectedApp] = useState<(Application & { job?: Job }) | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [stats, setStats] = useState<{ total: number; approved: number; rejected: number; admin: number }>({
    total: 0,
    approved: 0,
    rejected: 0,
    admin: 0,
  });

  useEffect(() => {
    fetchEmailCreationApplications();
    fetchInterventionStats();
  }, [filter]);

  const fetchEmailCreationApplications = async () => {
    setLoading(true);
    try {
      // Buscar todas as aplicações
      const allApps = await ApplicationService.getAllApplications({ limit: 500 });
      
      // Buscar jobs para cada aplicação e filtrar por email creation
      const appsWithJobs = await Promise.all(
        allApps.map(async (app) => {
          const job = await JobService.getJobById(app.jobId);
          return { ...app, job };
        })
      );

      // Filtrar apenas tarefas de criação de e-mail
      const emailApps = appsWithJobs.filter(app => app.job?.emailCreation !== undefined);

      // Aplicar filtro de status
      let filtered = emailApps;
      if (filter === 'submitted') {
        filtered = emailApps.filter(app => app.status === 'submitted');
      } else if (filter === 'rejected') {
        filtered = emailApps.filter(app => app.status === 'rejected');
      }

      setApplications(filtered);

      // Calcular estatísticas
      setStats({
        total: emailApps.length,
        approved: emailApps.filter(app => app.status === 'approved').length,
        rejected: emailApps.filter(app => app.status === 'rejected').length,
        admin: 0, // Will be updated by fetchInterventionStats
      });
    } catch (error) {
      console.error('Error fetching email creation applications:', error);
      toast.error('Erro ao carregar aplicações');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterventionStats = async () => {
    try {
      const interventionStats = await AdminInterventionService.getInterventionStats();
      setStats(prev => ({ ...prev, admin: interventionStats.total }));
    } catch (error) {
      console.error('Error fetching intervention stats:', error);
    }
  };

  const handleManualApproval = async () => {
    if (!selectedApp || !currentUser || !userData || !approvalReason.trim()) {
      toast.error('Preencha o motivo da aprovação');
      return;
    }

    setIsApproving(true);
    try {
      // Aprovar manualmente via ApplicationService
      await ApplicationService.adminManualApproval(
        selectedApp.id,
        currentUser.uid,
        userData.name,
        approvalReason
      );

      toast.success('Tarefa aprovada manualmente', {
        description: 'O pagamento foi liberado ao freelancer',
      });

      // Atualizar lista
      await fetchEmailCreationApplications();
      await fetchInterventionStats();
      
      setShowProofModal(false);
      setSelectedApp(null);
      setApprovalReason('');
    } catch (error) {
      console.error('Error approving manually:', error);
      toast.error('Erro ao aprovar tarefa');
    } finally {
      setIsApproving(false);
    }
  };

  const getProofValue = (proofs: any[], requirementId: string): string => {
    const proof = proofs.find(p => p.requirementId === requirementId);
    return proof?.content || '';
  };

  const openProviderLogin = (provider: string) => {
    const urls: Record<string, string> = {
      gmail: 'https://mail.google.com',
      outlook: 'https://outlook.live.com',
      yahoo: 'https://mail.yahoo.com',
      protonmail: 'https://mail.protonmail.com',
    };
    const url = urls[provider.toLowerCase()] || `https://www.google.com/search?q=${provider}+login`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Supervisão: Tarefas de Criação de E-mail
              </CardTitle>
              <CardDescription>
                Monitore e revise tarefas de criação de e-mail para prevenir fraudes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total de Tarefas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-success">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">Aprovadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Rejeitadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-warning">{stats.admin}</div>
                <p className="text-xs text-muted-foreground">Intervenções Admin</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="submitted">Submetidas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alertas */}
          {applications.filter(app => app.status === 'rejected').length > 0 && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                <strong>{applications.filter(app => app.status === 'rejected').length}</strong> tarefas rejeitadas aguardando revisão
              </p>
            </div>
          )}

          {/* Tabela */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma tarefa de criação de e-mail encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Contratante</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className={app.status === 'rejected' ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono text-xs">#{app.id.slice(0, 8)}</TableCell>
                    <TableCell>{app.testerName}</TableCell>
                    <TableCell>{app.job?.posterName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.job?.emailCreation?.provider || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {app.status === 'approved' && <Badge className="bg-success">Aprovada</Badge>}
                      {app.status === 'rejected' && <Badge variant="destructive">Rejeitada</Badge>}
                      {app.status === 'submitted' && <Badge variant="secondary">Submetida</Badge>}
                    </TableCell>
                    <TableCell>{app.job?.bounty?.toFixed(2) || 0} Kz</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(app);
                          setShowProofModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Revisão */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Prova - Criação de E-mail</DialogTitle>
            <DialogDescription>
              Verifique as credenciais submetidas pelo freelancer
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              {/* Informações da Tarefa */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Freelancer</p>
                      <p className="font-medium">{selectedApp.testerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contratante</p>
                      <p className="font-medium">{selectedApp.job?.posterName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Provedor</p>
                      <Badge variant="outline">{selectedApp.job?.emailCreation?.provider}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium">{selectedApp.job?.bounty?.toFixed(2)} Kz</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Credenciais Submetidas */}
              {selectedApp.proofSubmission?.proofs && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm">Credenciais Submetidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">E-mail Criado</p>
                      <div className="p-2 bg-muted rounded border">
                        <p className="font-mono text-sm">{getProofValue(selectedApp.proofSubmission.proofs, 'email')}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Senha</p>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 bg-muted rounded border">
                          <p className="font-mono text-sm">
                            {showPassword ? getProofValue(selectedApp.proofSubmission.proofs, 'password') : '••••••••'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Provedor</p>
                      <div className="p-2 bg-muted rounded border">
                        <p className="font-mono text-sm">{getProofValue(selectedApp.proofSubmission.proofs, 'provider')}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openProviderLogin(selectedApp.job?.emailCreation?.provider || '')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Testar Login no Provedor
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Histórico de Rejeição */}
              {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-sm text-destructive">Rejeitado pelo Contratante</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedApp.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Aprovação Manual */}
              {selectedApp.status === 'rejected' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Motivo da Aprovação Manual
                    </label>
                    <Textarea
                      placeholder="Explique por que você está aprovando esta tarefa apesar da rejeição do contratante..."
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProofModal(false);
                setSelectedApp(null);
                setApprovalReason('');
                setShowPassword(false);
              }}
            >
              Fechar
            </Button>
            {selectedApp?.status === 'rejected' && (
              <Button
                onClick={handleManualApproval}
                disabled={isApproving || !approvalReason.trim()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? 'Aprovando...' : 'Aprovar Manualmente'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
