import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateUserLevels } from '@/scripts/migrateUserLevels';
import { Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';

export default function AdminMigration() {
  const { currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processed: number;
    skipped: number;
    errors: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar se usuário é admin
  if (!currentUser || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleMigration = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const migrationResult = await migrateUserLevels();
      setResult(migrationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao executar migração');
      console.error('Migration error:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Migrações do Sistema</h1>
        <p className="text-muted-foreground">
          Execute scripts de migração de dados com segurança
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Migração de XP e Níveis
          </CardTitle>
          <CardDescription>
            Popula retroativamente a coleção <code className="bg-muted px-1 py-0.5 rounded">user_levels</code> com base no histórico de aplicações e avaliações dos usuários existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta migração irá:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Buscar todos os usuários do sistema</li>
                <li>Calcular XP baseado em tarefas aprovadas e avaliações</li>
                <li>Criar documentos em <code>user_levels</code> (pulando usuários que já têm XP)</li>
                <li>Criar histórico de transações de XP</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Migração concluída com sucesso!</strong>
                <div className="mt-2 space-y-1 text-sm">
                  <div>✅ Processados: <strong>{result.processed}</strong></div>
                  <div>⏭️ Pulados (já tinham XP): <strong>{result.skipped}</strong></div>
                  <div>❌ Erros: <strong>{result.errors}</strong></div>
                  <div>📊 Total de usuários: <strong>{result.total}</strong></div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleMigration}
              disabled={running}
              size="lg"
              className="flex-1"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executando migração...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Executar Migração
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Nota:</strong> Você também pode executar esta migração via console do navegador:</p>
            <code className="block bg-muted p-2 rounded text-xs">
              await window.migrateUserLevels()
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
