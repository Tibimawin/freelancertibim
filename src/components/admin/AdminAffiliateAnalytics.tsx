import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AffiliateService, AffiliateMetricsItem } from '@/services/affiliateService';
import { AuthService } from '@/services/auth';
import { Loader2 } from 'lucide-react';

const AdminAffiliateAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<AffiliateMetricsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState('30');
  const [search, setSearch] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});

  const dateRange = useMemo(() => {
    const d = parseInt(days || '30', 10);
    const end = new Date();
    const start = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    return { start, end };
  }, [days]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const list = await AffiliateService.getMetrics({ startDate: dateRange.start, endDate: dateRange.end });
      setMetrics(list);
      // carregar nomes dos afiliados para exibição amigável
      const ids = Array.from(new Set(list.map(m => m.affiliateId).filter(Boolean)));
      const settlements = await Promise.allSettled(ids.map(id => AuthService.getUserData(id)));
      const m: Record<string, string> = {};
      ids.forEach((id, idx) => {
        const r = settlements[idx];
        m[id] = r.status === 'fulfilled' ? (r.value?.name || id) : id;
      });
      setNames(m);
    } catch (e) {
      // silencioso; o Admin verá tabela vazia se erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start.getTime(), dateRange.end.getTime()]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return metrics;
    return metrics.filter((m) => {
      const name = names[m.affiliateId] || m.affiliateId;
      const txt = `${m.affiliateId} ${name}`.toLowerCase();
      return txt.includes(s);
    });
  }, [metrics, search, names]);

  const formatKZ = (v: number) => `Kz ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Afiliados: Ganhe dinheiro compartilhando</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar afiliado por nome ou ID" />
            <Select value={days} onValueChange={(v) => setDays(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchMetrics} disabled={loading}>
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Atualizando...</>) : 'Atualizar'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum dado de afiliado no período.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => (
                <div key={m.affiliateId} className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{names[m.affiliateId] || m.affiliateId} <span className="text-muted-foreground">• {m.affiliateId}</span></div>
                      <div className="text-xs text-muted-foreground">Última atividade: {m.lastActivity ? new Date(m.lastActivity).toLocaleString('pt-BR') : '—'}</div>
                      <div className="text-xs flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">Compartilhamentos: {m.shares}</span>
                        <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">Cliques: {m.clicks}</span>
                        <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">Conversões: {m.conversions}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">Pagas: {formatKZ(m.commissionPaid)}</div>
                      <Badge variant="secondary" className="mt-1">Pendentes: {formatKZ(m.commissionPending)}</Badge>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchMetrics()} disabled={loading}>Recalcular</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAffiliateAnalytics;