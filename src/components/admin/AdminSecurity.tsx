import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminService } from '@/services/admin';

const AdminSecurity = () => {
  const [siteKey, setSiteKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await AdminService.getSecurityConfig();
      setSiteKey(cfg.recaptchaSiteKey || '');
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AdminService.updateSecurityConfig({ recaptchaSiteKey: siteKey.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>Configure reCAPTCHA para o login (use a chave do site do Google reCAPTCHA v2 Invisível).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>reCAPTCHA Site Key</Label>
          <Input value={siteKey} onChange={(e) => setSiteKey(e.target.value)} placeholder="ex: 6Lc..." />
          <p className="text-xs text-muted-foreground">A chave do site será usada para validar reCAPTCHA no login.</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSecurity;