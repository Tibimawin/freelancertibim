import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Ban, 
  Shield, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Activity 
} from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { AdminVerificationService } from '@/services/adminVerification';
import type { UserVerification } from '@/types/admin';

const AdminUsers = () => {
  const { currentUser } = useAuth();
  const { users, loading, fetchUsers, suspendUser, banUser, unbanUser } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userStats, setUserStats] = useState<{
    tasks: {
      applied: number;
      in_progress: number;
      submitted: number;
      approved: number;
      rejected: number;
    };
    jobsCreated: number;
    depositsCount: number;
    depositsTotal: number;
    withdrawalsCount: number;
    withdrawalsTotal: number;
  } | null>(null);
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    description?: string;
    ip?: string;
    timestamp: Date;
  }>>([]);
  const [actionDialog, setActionDialog] = useState<{
    type: 'suspend' | 'ban' | 'unban' | null;
    user: any;
  }>({ type: null, user: null });
  const [actionReason, setActionReason] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState<number | undefined>();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.accountStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUserAction = async () => {
    if (!actionDialog.type || !actionDialog.user || !currentUser) return;

    try {
      switch (actionDialog.type) {
        case 'suspend':
          await suspendUser(actionDialog.user.id, actionReason, suspensionDuration);
          toast.success('Usuário suspenso com sucesso');
          break;
        case 'ban':
          await banUser(actionDialog.user.id, actionReason);
          toast.success('Usuário banido com sucesso');
          break;
        case 'unban':
          await unbanUser(actionDialog.user.id);
          toast.success('Usuário reativado com sucesso');
          break;
      }
      
      setActionDialog({ type: null, user: null });
      setActionReason('');
      setSuspensionDuration(undefined);
    } catch (error) {
      toast.error('Erro ao executar ação');
      console.error('Error executing user action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      suspended: "secondary",
      banned: "destructive"
    };
    
    const labels: Record<string, string> = {
      active: "Ativo",
      suspended: "Suspenso",
      banned: "Banido"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      incomplete: "outline"
    };
    
    const labels: Record<string, string> = {
      approved: "Verificado",
      pending: "Pendente",
      rejected: "Rejeitado",
      incomplete: "Incompleto"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Load detailed stats when opening selected user
  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedUser) return;
      try {
        setDetailsLoading(true);
        // Applications by tester
        const appsSnap = await getDocs(query(collection(db, 'applications'), where('testerId', '==', selectedUser.id)));
        const statusCounts: Record<string, number> = {
          applied: 0,
          in_progress: 0,
          submitted: 0,
          approved: 0,
          rejected: 0
        };
        appsSnap.docs.forEach(d => {
          const st = d.data().status as keyof typeof statusCounts;
          if (st && statusCounts[st] !== undefined) statusCounts[st] += 1;
        });

        // Jobs created by poster
        const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('posterId', '==', selectedUser.id)));

        // Transactions: deposits count and total (include admin_deposit)
        const txSnap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', selectedUser.id)));
        const depositDocs = txSnap.docs.filter(d => {
          const t = d.data();
          return t.type === 'deposit' || t.type === 'admin_deposit';
        });
        const depositsCount = depositDocs.length;
        const depositsTotal = depositDocs.reduce((sum, d) => sum + (typeof d.data().amount === 'number' ? d.data().amount : 0), 0);

        // Withdrawals count and total
        const wdSnap = await getDocs(query(collection(db, 'withdrawalRequests'), where('userId', '==', selectedUser.id)));
        const withdrawalsTotal = wdSnap.docs.reduce((sum, d) => sum + (typeof d.data().amount === 'number' ? d.data().amount : 0), 0);

        setUserStats({
          tasks: {
            applied: statusCounts.applied,
            in_progress: statusCounts.in_progress,
            submitted: statusCounts.submitted,
            approved: statusCounts.approved,
            rejected: statusCounts.rejected
          },
          jobsCreated: jobsSnap.size,
          depositsCount,
          depositsTotal,
          withdrawalsCount: wdSnap.size,
          withdrawalsTotal
        });

        // Verifications (identity + documents)
        const verifs = await AdminVerificationService.getUserVerifications(selectedUser.id);
        setVerifications(verifs);

        // Recent activities timeline (max 20)
        const actSnap = await getDocs(
          query(
            collection(db, 'userActivities'),
            where('userId', '==', selectedUser.id),
            orderBy('timestamp', 'desc'),
            limit(20)
          )
        );
        setActivities(
          actSnap.docs.map((d) => {
            const data = d.data() as any;
            const ts = data.timestamp?.toDate?.() || data.timestamp || new Date();
            return {
              id: d.id,
              type: data.type || 'activity',
              description: data.description,
              ip: data.ip,
              timestamp: ts,
            };
          })
        );
      } catch (err) {
        console.error('Erro ao carregar detalhes do usuário:', err);
      } finally {
        setDetailsLoading(false);
      }
    };
    loadDetails();
  }, [selectedUser]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="banned">Banidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      {getStatusBadge(user.accountStatus)}
                      {getVerificationBadge(user.verificationStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Kz {(user.testerWallet?.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {user.completedTests} tarefas
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {user.lastActivity.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.accountStatus === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionDialog({ type: 'suspend', user })}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Suspender
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setActionDialog({ type: 'ban', user })}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Banir
                      </Button>
                    </>
                  )}
                  
                  {(user.accountStatus === 'suspended' || user.accountStatus === 'banned') && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setActionDialog({ type: 'unban', user })}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Reativar
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Action Dialog */}
      <Dialog 
        open={!!actionDialog.type} 
        onOpenChange={() => setActionDialog({ type: null, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'suspend' && 'Suspender Usuário'}
              {actionDialog.type === 'ban' && 'Banir Usuário'}
              {actionDialog.type === 'unban' && 'Reativar Usuário'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'suspend' && 'Suspender temporariamente o acesso do usuário'}
              {actionDialog.type === 'ban' && 'Banir permanentemente o usuário da plataforma'}
              {actionDialog.type === 'unban' && 'Reativar o acesso do usuário'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog.type !== 'unban' && (
              <>
                <div>
                  <Label htmlFor="reason">Motivo *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo da ação..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    required
                  />
                </div>

                {actionDialog.type === 'suspend' && (
                  <div>
                    <Label htmlFor="duration">Duração (dias)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="Ex: 7 (deixe vazio para suspensão indefinida)"
                      value={suspensionDuration || ''}
                      onChange={(e) => setSuspensionDuration(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, user: null })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUserAction}
              disabled={actionDialog.type !== 'unban' && !actionReason.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações completas de conta e atividades</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{selectedUser.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{selectedUser.name}</h3>
                    {getStatusBadge(selectedUser.accountStatus)}
                    {getVerificationBadge(selectedUser.verificationStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              {/* Account State */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado da Conta</CardTitle>
                  <CardDescription>Informações gerais</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Modo atual</p>
                    <p className="font-medium">{selectedUser.currentMode === 'tester' ? 'Freelancer' : 'Contratante'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localização</p>
                    <p className="font-medium">{selectedUser.location || 'Não disponível'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IP atual</p>
                    <p className="font-medium">{selectedUser.lastLoginIp || 'Não disponível'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última atividade</p>
                    <p className="font-medium">{new Date(selectedUser.lastActivity).toLocaleString('pt-BR')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks and Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle>Tarefas e Anúncios</CardTitle>
                  <CardDescription>Resumo das atividades</CardDescription>
                </CardHeader>
                <CardContent>
                  {detailsLoading || !userStats ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tarefas feitas</p>
                        <p className="font-medium">{selectedUser.completedTests}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Aprovadas</p>
                        <p className="font-medium">{userStats.tasks.approved}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rejeitadas</p>
                        <p className="font-medium">{userStats.tasks.rejected}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Submetidas</p>
                        <p className="font-medium">{userStats.tasks.submitted}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Em progresso</p>
                        <p className="font-medium">{userStats.tasks.in_progress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Anúncios criados</p>
                        <p className="font-medium">{userStats.jobsCreated}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Balances */}
              <Card>
                <CardHeader>
                  <CardTitle>Saldos</CardTitle>
                  <CardDescription>Freelancer e Contratante</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Freelancer (disponível)</p>
                    <p className="font-medium">Kz {(selectedUser.testerWallet?.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Freelancer (pendente)</p>
                    <p className="font-medium">Kz {(selectedUser.testerWallet?.pendingBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Contratante</p>
                    <p className="font-medium">Kz {(selectedUser.posterWallet?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contratante (pendente)</p>
                    <p className="font-medium">Kz {(selectedUser.posterWallet?.pendingBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Movimentações */}
              <Card>
                <CardHeader>
                  <CardTitle>Movimentações</CardTitle>
                  <CardDescription>Saques e Depósitos</CardDescription>
                </CardHeader>
                <CardContent>
                  {detailsLoading || !userStats ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Quantidade de saques</p>
                        <p className="font-medium">{userStats.withdrawalsCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saques pendentes</p>
                        <p className="font-medium">{selectedUser.pendingWithdrawals}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saques concluídos</p>
                        <p className="font-medium">{selectedUser.successfulWithdrawals}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantidade de depósitos</p>
                        <p className="font-medium">{userStats.depositsCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de depósitos</p>
                        <p className="font-medium">Kz {Number(userStats.depositsTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de saques</p>
                        <p className="font-medium">Kz {Number(userStats.withdrawalsTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Atividades Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividades Recentes</CardTitle>
                  <CardDescription>Últimos eventos (máx. 20)</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem atividades registradas ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activities.map((a) => (
                        <li key={a.id} className="p-2 border rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{a.type}</span>
                            <span className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                          {a.description && (
                            <p className="text-sm text-muted-foreground">{a.description}</p>
                          )}
                          {a.ip && (
                            <p className="text-xs text-muted-foreground">IP: {a.ip}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Verificação de Identidade */}
              <Card>
                <CardHeader>
                  <CardTitle>Verificação de Identidade</CardTitle>
                  <CardDescription>Dados e documentos enviados</CardDescription>
                </CardHeader>
                <CardContent>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : verifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum envio de verificação encontrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {verifications.map((v) => (
                        <div key={v.id} className="space-y-3">
                          {v.identityInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Nº BI</p>
                                <p className="font-medium">{v.identityInfo.governmentIdNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Nome</p>
                                <p className="font-medium">{v.identityInfo.firstName} {v.identityInfo.lastName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Nascimento</p>
                                <p className="font-medium">{v.identityInfo.dateOfBirth}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Endereço</p>
                                <p className="font-medium">{v.identityInfo.address || '—'}</p>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Documentos</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {v.documents.map((doc, idx) => (
                                <div key={`${doc.publicId}-${idx}`} className="border rounded-md p-2">
                                  <p className="text-xs text-muted-foreground mb-1">{doc.type}</p>
                                  {doc.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                    <img src={doc.url} alt={doc.type} className="w-full h-24 object-cover rounded" />
                                  ) : (
                                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">Prévia não disponível</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;