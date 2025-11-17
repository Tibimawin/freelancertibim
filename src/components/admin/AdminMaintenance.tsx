import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminService } from '@/services/admin';

const AdminMaintenance = () => {
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('Estamos temporariamente em manutenção. Voltamos em breve.');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const st = await AdminService.getSiteStatus();
      setMaintenance(!!st.maintenance);
      if (st.message) setMessage(st.message);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AdminService.updateSiteStatus({ maintenance, message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistema de Manutenção</CardTitle>
        <CardDescription>Ative o modo de manutenção para exibir uma mensagem de indisponibilidade.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Ativar manutenção</Label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
            <span className="text-sm text-muted-foreground">Quando ativo, o site exibirá a mensagem abaixo para visitantes.</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminMaintenance;