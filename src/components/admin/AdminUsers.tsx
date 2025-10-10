import { useState } from 'react';
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

const AdminUsers = () => {
  const { currentUser } = useAuth();
  const { users, loading, fetchUsers, suspendUser, banUser, unbanUser } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
                        R$ {(user.testerWallet?.availableBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
    </div>
  );
};

export default AdminUsers;