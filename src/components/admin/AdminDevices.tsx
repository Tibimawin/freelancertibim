import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdminService } from '@/services/admin';
import { DevicePolicy, DeviceLinkReportItem } from '@/types/admin';
import { Smartphone, AlertTriangle } from 'lucide-react';

const AdminDevices = () => {
  const [policy, setPolicy] = useState<DevicePolicy | null>(null);
  const [report, setReport] = useState<DeviceLinkReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        AdminService.getDevicePolicy(),
        AdminService.getDeviceLinksReport(200),
      ]);
      setPolicy(p);
      setReport(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!policy) return;
    setSaving(true);
    try {
      await AdminService.updateDevicePolicy(policy);
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Preferências de Dispositivos
          </CardTitle>
          <CardDescription>Limite ou monitore contas por dispositivo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aplicar limite</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!policy?.enforceLimit}
                  onChange={(e) => setPolicy(p => p ? { ...p, enforceLimit: e.target.checked } : p)}
                />
                <span className="text-sm text-muted-foreground">Bloquear cadastro/login acima do limite</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Máximo de contas por dispositivo</Label>
              <Input
                type="number"
                min={1}
                value={policy?.maxUidsPerDevice ?? 3}
                onChange={(e) => setPolicy(p => p ? { ...p, maxUidsPerDevice: Number(e.target.value) } : p)}
              />
            </div>
            <div className="space-y-2">
              <Label>Somente monitorar</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!policy?.monitorOnly}
                  onChange={(e) => setPolicy(p => p ? { ...p, monitorOnly: e.target.checked } : p)}
                />
                <span className="text-sm text-muted-foreground">Gerar alertas sem bloquear</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Limite para alerta</Label>
              <Input
                type="number"
                min={1}
                value={policy?.alertThreshold ?? 5}
                onChange={(e) => setPolicy(p => p ? { ...p, alertThreshold: Number(e.target.value) } : p)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar preferências'}</Button>
          </div>
          {policy?.enforceLimit && (
            <div className="flex items-center gap-2 text-yellow-600 mt-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">O limite será aplicado durante cadastro e login.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> Relatório de Dispositivos
          </CardTitle>
          <CardDescription>Dispositivos com maior número de contas vinculadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {report.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum dispositivo encontrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">Device ID</th>
                      <th className="py-2 px-2">Contas</th>
                      <th className="py-2 px-2">Último uso</th>
                      <th className="py-2 px-2">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((item) => (
                      <tr key={item.deviceId} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono text-xs">{item.deviceId}</td>
                        <td className="py-2 px-2">
                          <Badge variant={item.uidsCount >= (policy?.alertThreshold ?? 5) ? 'destructive' : 'secondary'}>
                            {item.uidsCount}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString('pt-BR') : '-'}</td>
                        <td className="py-2 px-2">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDevices;