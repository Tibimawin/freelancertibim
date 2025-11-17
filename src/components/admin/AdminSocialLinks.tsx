import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AdminService } from '@/services/admin';

const AdminSocialLinks = () => {
  const [email, setEmail] = useState('');
  const [rss, setRss] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const links = await AdminService.getSocialLinks();
        setEmail(links.email || '');
        setRss(links.rss || '');
        setFacebook(links.facebook || '');
        setTwitter(links.twitter || '');
        setInstagram(links.instagram || '');
        setLinkedin(links.linkedin || '');
      } catch (e: any) {
        setMessage({ type: 'error', text: e?.message || 'Erro ao carregar links' });
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await AdminService.updateSocialLinks({ email, rss, facebook, twitter, instagram, linkedin });
      setMessage({ type: 'success', text: 'Links atualizados com sucesso.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Erro ao salvar links.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links do Rodapé</CardTitle>
        <CardDescription>Configure os links das redes sociais exibidos no rodapé do site.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email de suporte</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mailto:suporte@freelincer.com" />
            </div>
            <div>
              <Label>RSS/Blog</Label>
              <Input value={rss} onChange={(e) => setRss(e.target.value)} placeholder="https://blog.exemplo.com" />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/seu-perfil" />
            </div>
            <div>
              <Label>Twitter/X</Label>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/seu-perfil" />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/seu-perfil" />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/seu-perfil" />
            </div>
          </div>
          {message && (
            <div className={`text-sm p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{message.text}</div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="glow-effect">
              {loading ? 'Salvando...' : 'Salvar links'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSocialLinks;