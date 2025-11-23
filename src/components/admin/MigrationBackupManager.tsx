import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { migrationBackupService, MigrationBackup, RollbackResult } from '@/services/migrationBackupService';
import { Database, RotateCcw, Clock, Users, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function MigrationBackupManager() {
  const { currentUser } = useAuth();
  const [backups, setBackups] = useState<MigrationBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<MigrationBackup | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<RollbackResult | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const data = await migrationBackupService.listBackups(50);
      setBackups(data);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      toast.error('Erro ao carregar backups');
    } finally {
      setLoading(false);
    }
  };

  const handleRollbackClick = (backup: MigrationBackup) => {
    setSelectedBackup(backup);
    setShowRollbackDialog(true);
    setRollbackResult(null);
  };

  const executeRollback = async () => {
    if (!selectedBackup || !currentUser) return;

    setRollingBack(true);
    setRollbackResult(null);

    try {
      const result = await migrationBackupService.performRollback(
        selectedBackup.id!,
        currentUser.uid
      );

      setRollbackResult(result);

      if (result.success) {
        toast.success(`Rollback concluído: ${result.restored} usuários restaurados`);
        await loadBackups(); // Recarregar lista
      } else {
        toast.error('Rollback falhou parcialmente');
      }
    } catch (error) {
      console.error('Erro ao executar rollback:', error);
      toast.error('Erro ao executar rollback');
    } finally {
      setRollingBack(false);
    }
  };

  const getStatusBadge = (status: MigrationBackup['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Concluída</Badge>;
      case 'rolled_back':
        return <Badge className="bg-orange-500">Revertida</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMigrationTypeLabel = (type: string) => {
    switch (type) {
      case 'welcome_bonus':
        return 'Bônus de Boas-Vindas';
      case 'user_levels':
        return 'Níveis de Usuário';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backups de Migração ({backups.length})
          </CardTitle>
          <CardDescription>
            Gerenciar backups e executar rollbacks de migrações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Nenhum backup encontrado. Backups são criados automaticamente antes de executar migrações.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {backups.map((backup) => (
                  <Card key={backup.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">
                              {getMigrationTypeLabel(backup.migrationType)}
                            </h3>
                            {getStatusBadge(backup.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(backup.createdAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{backup.affectedUsers.length} usuários</span>
                            </div>
                          </div>

                          {backup.rolledBackAt && (
                            <div className="text-xs text-muted-foreground">
                              Revertido em: {new Date(backup.rolledBackAt).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          <Button
                            size="sm"
                            variant={backup.status === 'rolled_back' ? 'outline' : 'destructive'}
                            onClick={() => handleRollbackClick(backup)}
                            disabled={backup.status === 'rolled_back' || backup.status === 'pending'}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {backup.status === 'rolled_back' ? 'Já Revertido' : 'Reverter'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Rollback */}
      <AlertDialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Rollback
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {!rollbackResult ? (
                <>
                  <p>
                    Você está prestes a reverter a migração:{' '}
                    <strong>{selectedBackup && getMigrationTypeLabel(selectedBackup.migrationType)}</strong>
                  </p>
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>ATENÇÃO:</strong> Esta ação irá restaurar os dados de{' '}
                      <strong>{selectedBackup?.affectedUsers.length} usuários</strong> para o estado
                      anterior à migração. Esta operação não pode ser desfeita!
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Criado em:</strong>{' '}
                      {selectedBackup && new Date(selectedBackup.createdAt).toLocaleString('pt-BR')}
                    </div>
                    <div>
                      <strong>Usuários afetados:</strong> {selectedBackup?.affectedUsers.length}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {rollbackResult.success ? (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        <strong>Rollback concluído com sucesso!</strong>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>✅ Restaurados: <strong>{rollbackResult.restored}</strong></div>
                          <div>❌ Erros: <strong>{rollbackResult.errors}</strong></div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Rollback falhou</strong>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>✅ Restaurados: {rollbackResult.restored}</div>
                          <div>❌ Erros: {rollbackResult.errors}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {rollbackResult.errorDetails.length > 0 && (
                    <ScrollArea className="h-[150px] border rounded p-2">
                      <div className="space-y-1 text-xs">
                        {rollbackResult.errorDetails.map((err, idx) => (
                          <div key={idx} className="text-destructive">
                            <strong>{err.userId}:</strong> {err.error}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {!rollbackResult ? (
              <>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeRollback}
                  disabled={rollingBack}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {rollingBack ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Confirmar Rollback
                    </>
                  )}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => setShowRollbackDialog(false)}>
                Fechar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
