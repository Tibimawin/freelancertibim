import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Plus, Search, DollarSign } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdmin';
import { AdminService } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';

const AdminBalances = () => {
  const { users, fetchUsers } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [addBalanceDialog, setAddBalanceDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const contractors = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const isContractor = user.currentMode === 'poster' || (user.posterWallet?.balance || 0) > 0;
    return isContractor && matchesSearch;
  });

  const handleAddBalance = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos corretamente",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await AdminService.addBalance(selectedUser.id, parseFloat(amount), reason);
      
      toast({
        title: "Sucesso",
        description: `Saldo de ${amount} Kz adicionado para ${selectedUser.name}`,
      });

      setAddBalanceDialog(false);
      setAmount('');
      setReason('');
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error adding balance:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar saldo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Gerenciar Saldos de Contratantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contratantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-4">
            {contractors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum contratante encontrado</p>
              </div>
            ) : (
              contractors.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">Contratante</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {(user.posterWallet?.balance || 0).toFixed(2)} Kz
                      </p>
                      <p className="text-sm text-muted-foreground">Saldo atual</p>
                    </div>
                    
                    <Dialog open={addBalanceDialog && selectedUser?.id === user.id} onOpenChange={(open) => {
                      setAddBalanceDialog(open);
                      if (open) setSelectedUser(user);
                      else setSelectedUser(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Saldo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Adicionar Saldo - {user.name}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Valor (Kz)</Label>
                            <Input
                              id="amount"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="reason">Motivo/Observação</Label>
                            <Textarea
                              id="reason"
                              placeholder="Descreva o motivo do depósito..."
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddBalance}
                              disabled={loading}
                              className="flex-1"
                            >
                              {loading ? 'Adicionando...' : 'Confirmar Depósito'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setAddBalanceDialog(false)}
                              disabled={loading}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBalances;