import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { AdminService } from '@/services/admin';
import { useNavigate } from 'react-router-dom';

const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  const handleCreateFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, insira um email' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const success = await AdminService.makeFirstAdmin(email);
      
      if (success) {
        setMessage({ 
          type: 'success', 
          text: 'Administrador criado com sucesso! Agora você pode acessar o painel admin.' 
        });
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Já existe um administrador no sistema.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao criar administrador' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Configuração Inicial
          </CardTitle>
          <CardDescription>
            Configure o primeiro administrador do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFirstAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite o email de um usuário cadastrado"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                O usuário deve já estar cadastrado no sistema
              </p>
            </div>

            {message && (
              <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Administrador'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;