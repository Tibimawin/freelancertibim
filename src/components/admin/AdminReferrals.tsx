import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Clock, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReferralService } from '@/services/referralService';
import { Referral } from '@/types/firebase';
import { useUserName } from '@/hooks/useUserName';

// Componente auxiliar para exibir o nome do usuário (indicador ou indicado)
const UserDisplay = ({ userId, label }: { userId: string, label: string }) => {
  const { userName, loading } = useUserName(userId);
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Users className="h-3 w-3" />
      {label}: {loading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <span className="font-medium text-foreground">{userName}</span>}
    </div>
  );
};

const AdminReferrals = () => {
  const { t } = useTranslation();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAllReferrals = async () => {
    setLoading(true);
    try {
      // Nota: Precisamos de um método no ReferralService para buscar TODAS as referências
      // Como não temos um método getAllReferrals, vamos simular ou criar um.
      // Vou criar um método temporário no ReferralService para buscar todas as referências.
      const allReferrals = await ReferralService.getAllReferrals();
      setReferrals(allReferrals);
    } catch (error) {
      console.error('Error fetching all referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReferrals();
  }, []);

  const filteredReferrals = referrals.filter(ref => {
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    // A busca por nome é complexa aqui sem um índice, então vamos focar na busca por ID/código por enquanto
    const matchesSearch = searchTerm === '' || ref.referrerId.includes(searchTerm) || ref.referredId.includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />{t("completed")}</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />{t("pending")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("referral_program")} - {t("admin_dashboard")}
          </CardTitle>
          <CardDescription>
            Monitore o desempenho do programa de indicação e as recompensas pagas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID do indicador ou indicado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_statuses')}</SelectItem>
                <SelectItem value="pending">{t('pending_status')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAllReferrals} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('refresh')}
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Carregando referências...</p>
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma referência encontrada.</p>
              </div>
            ) : (
              filteredReferrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="font-semibold text-lg text-success">
                        {ref.rewardAmount.toFixed(2)} KZ
                      </span>
                      {getStatusBadge(ref.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <UserDisplay userId={ref.referrerId} label="Indicador" />
                      <UserDisplay userId={ref.referredId} label="Indicado" />
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {t('submitted_on')}: {ref.createdAt.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <Button variant="ghost" size="sm" disabled>
                    {t('view_details')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferrals;