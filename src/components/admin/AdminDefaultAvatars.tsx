import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { rtdb } from '@/lib/firebase';
import { ref as dbRef, get, set } from 'firebase/database';

const MAX_COUNT = 10;

const AdminDefaultAvatars = () => {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!rtdb) {
          setError('Realtime Database não está disponível neste ambiente.');
          setUrls([]);
          return;
        }
        const snap = await get(dbRef(rtdb, 'default_avatars'));
        if (snap.exists()) {
          const val = snap.val();
          let list: string[] = [];
          if (Array.isArray(val)) {
            list = val.filter(x => typeof x === 'string');
          } else if (typeof val === 'object' && val) {
            list = Object.values(val).filter((x): x is string => typeof x === 'string');
          }
          setUrls(list.slice(0, MAX_COUNT));
        } else {
          setUrls([]);
        }
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar avatares.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = () => {
    if (urls.length >= MAX_COUNT) return;
    setUrls(prev => [...prev, '']);
  };

  const handleRemove = (idx: number) => {
    setUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, val: string) => {
    setUrls(prev => prev.map((u, i) => (i === idx ? val : u)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const cleaned = urls.map(u => u.trim()).filter(u => !!u);
      if (!rtdb) throw new Error('RTDB indisponível');
      await set(dbRef(rtdb, 'default_avatars'), cleaned);
    } catch (e: any) {
      setError(e?.message || 'Falha ao salvar avatares.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatares Padrão</CardTitle>
        <CardDescription>Edite a lista de até 10 URLs usadas no seletor de perfil.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{urls.length}/{MAX_COUNT}</Badge>
          {loading && <span className="text-muted-foreground text-sm">Carregando...</span>}
          {error && <span className="text-destructive text-sm">{error}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {urls.map((u, idx) => (
            <div key={idx} className="space-y-2 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <Input value={u} onChange={(e) => handleChange(idx, e.target.value)} placeholder="https://..." />
                <Button variant="outline" onClick={() => handleRemove(idx)}>Remover</Button>
              </div>
              {u && (
                <img src={u} alt={`Avatar ${idx+1}`} className="w-full h-28 object-cover rounded" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleAdd} disabled={urls.length >= MAX_COUNT}>Adicionar URL</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDefaultAvatars;