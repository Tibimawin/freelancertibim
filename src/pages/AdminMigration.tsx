import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MigrationBackupManager } from '@/components/admin/MigrationBackupManager';
import { migrateUserLevels } from '@/scripts/migrateUserLevels';
import { migrateWelcomeBonus, MigrationResult, MigrationLog } from '@/scripts/migrateWelcomeBonus';
import { Database, AlertCircle, CheckCircle2, Loader2, Gift, Download, FileText, Clock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';

export default function AdminMigration() {
  const { currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processed?: number;
    migrated?: number;
    skipped: number;
    errors: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para migração de bônus
  const [runningBonus, setRunningBonus] = useState(false);
  const [bonusResult, setBonusResult] = useState<MigrationResult | null>(null);
  const [bonusError, setBonusError] = useState<string | null>(null);

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

  const handleBonusMigration = async () => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    setRunningBonus(true);
    setBonusError(null);
    setBonusResult(null);

    try {
      const migrationResult = await migrateWelcomeBonus(currentUser.uid, true); // Com backup
      setBonusResult(migrationResult);
      
      if (migrationResult.backupId) {
        toast.success(`Backup criado: ${migrationResult.backupId}`);
      }
    } catch (err) {
      setBonusError(err instanceof Error ? err.message : 'Erro desconhecido ao executar migração de bônus');
      console.error('Bonus migration error:', err);
    } finally {
      setRunningBonus(false);
    }
  };

  const exportToJSON = () => {
    if (!bonusResult) return;
    
    const dataStr = JSON.stringify(bonusResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `migration-bonus-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!bonusResult || !bonusResult.logs) return;
    
    const headers = ['Nº', 'Usuário ID', 'Nome', 'Status', 'Razão', 'Saldo Tester Antes', 'Bônus Poster Antes', 'Valor Migrado', 'Timestamp', 'Erro'];
    const rows = bonusResult.logs.map((log, index) => [
      (index + 1).toString(),
      log.userId,
      log.userName || '',
      log.status,
      log.reason,
      log.testerBalanceBefore.toString(),
      log.posterBonusBefore.toString(),
      log.amountMigrated?.toString() || '0',
      new Date(log.timestamp).toLocaleString('pt-BR'),
      log.error || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `migration-bonus-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportMigratedUsersOnly = () => {
    if (!bonusResult || !bonusResult.logs) return;
    
    const migratedUsers = bonusResult.logs.filter(log => log.status === 'success');
    
    const headers = ['Nº', 'Nome do Usuário', 'ID do Usuário', 'Valor Migrado', 'Data/Hora'];
    const rows = migratedUsers.map((log, index) => [
      (index + 1).toString(),
      log.userName || 'Não disponível',
      log.userId,
      `${log.amountMigrated} Kz`,
      new Date(log.timestamp).toLocaleString('pt-BR')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios-migrados-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: MigrationLog['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'skipped': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: MigrationLog['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'skipped': return '⏭️';
      case 'error': return '❌';
      default: return '•';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Migrações do Sistema</h1>
        <p className="text-muted-foreground">
          Execute scripts de migração de dados com segurança e backups automáticos
        </p>
      </div>

      <Tabs defaultValue="migrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="migrations">Executar Migrações</TabsTrigger>
          <TabsTrigger value="backups">Backups & Rollbacks</TabsTrigger>
        </TabsList>

        <TabsContent value="migrations" className="space-y-6">
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

      {/* Migração de Bônus */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Migração de Bônus de Boas-Vindas
          </CardTitle>
          <CardDescription>
            Corrige bônus creditados incorretamente em <code className="bg-muted px-1 py-0.5 rounded">testerWallet</code>, movendo para <code className="bg-muted px-1 py-0.5 rounded">posterWallet.bonusBalance</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta migração irá:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Buscar usuários que receberam o bônus de 500 Kz</li>
                <li>Remover 500 Kz de <code>testerWallet.availableBalance</code></li>
                <li>Adicionar 500 Kz em <code>posterWallet.bonusBalance</code> (não-sacável)</li>
                <li>Pular usuários já migrados ou sem saldo suficiente</li>
              </ul>
            </AlertDescription>
          </Alert>

          {bonusError && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{bonusError}</AlertDescription>
            </Alert>
          )}

          {bonusResult && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  <strong>Migração de bônus concluída!</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>✅ Migrados: <strong>{bonusResult.migrated}</strong></div>
                    <div>⏭️ Pulados: <strong>{bonusResult.skipped}</strong></div>
                    <div>❌ Erros: <strong>{bonusResult.errors}</strong></div>
                    <div>📊 Total: <strong>{bonusResult.total}</strong></div>
                    <div>⏱️ Duração: <strong>{(bonusResult.duration / 1000).toFixed(2)}s</strong></div>
                    {bonusResult.backupId && (
                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        🔒 Backup ID: <code className="text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{bonusResult.backupId}</code>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Relatório de Usuários Migrados */}
              {bonusResult.migrated > 0 && (
                <Card className="border-2 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-green-600" />
                      Relatório de Usuários Migrados ({bonusResult.logs.filter(l => l.status === 'success').length})
                    </CardTitle>
                    <CardDescription>
                      Lista completa de usuários que tiveram o bônus migrado com sucesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {bonusResult.logs
                          .filter(log => log.status === 'success')
                          .map((log, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {log.userName || 'Nome não disponível'}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono truncate">
                                    ID: {log.userId}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <div className="text-sm font-bold text-green-600">
                                  +{log.amountMigrated} Kz
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Botões de Exportação */}
              <div className="flex gap-2 flex-wrap">
                <Button onClick={exportMigratedUsersOnly} variant="default" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Usuários Migrados
                </Button>
                <Button onClick={exportToJSON} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar JSON Completo
                </Button>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV Completo
                </Button>
              </div>

              {/* Logs Detalhados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Logs Detalhados ({bonusResult.logs.length})</CardTitle>
                  <CardDescription>Registro de cada usuário processado durante a migração</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {bonusResult.logs.map((log, index) => (
                        <div 
                          key={index}
                          className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg">{getStatusIcon(log.status)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium truncate">{log.userName}</span>
                                  <Badge variant="outline" className={`${getStatusColor(log.status)} text-white border-0`}>
                                    {log.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                  {log.userId}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {log.reason}
                          </div>

                          <div className="flex gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Tester:</span>{' '}
                              <span className="font-medium">{log.testerBalanceBefore} Kz</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Bônus:</span>{' '}
                              <span className="font-medium">{log.posterBonusBefore} Kz</span>
                            </div>
                            {log.amountMigrated && (
                              <div className="text-green-600 font-medium">
                                +{log.amountMigrated} Kz migrado
                              </div>
                            )}
                          </div>

                          {log.error && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="w-3 h-3" />
                              <AlertDescription className="text-xs">
                                {log.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleBonusMigration}
              disabled={runningBonus}
              size="lg"
              className="flex-1"
              variant="secondary"
            >
              {runningBonus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executando migração...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Executar Migração de Bônus
                </>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Nota:</strong> Você também pode executar esta migração via console do navegador:</p>
            <code className="block bg-muted p-2 rounded text-xs">
              await window.migrateWelcomeBonus()
            </code>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="backups">
          <MigrationBackupManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
