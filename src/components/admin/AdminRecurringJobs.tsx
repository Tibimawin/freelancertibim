import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RecurringJobService } from '@/services/recurringJobService';
import { Job } from '@/types/firebase';
import { Clock, Calendar, RefreshCw, Pause, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminRecurringJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecurringJobs = async () => {
    setLoading(true);
    try {
      const allJobs = await RecurringJobService.getJobsToRepublish();
      setJobs(allJobs);
    } catch (error) {
      console.error('Erro ao carregar tarefas recorrentes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas recorrentes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurringJobs();
  }, []);

  const handleToggleRecurrence = async (jobId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await RecurringJobService.disableRecurrence(jobId);
        toast({
          title: 'Sucesso',
          description: 'Recorrência desativada',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Use a interface de edição para reativar a recorrência',
          variant: 'destructive',
        });
      }
      fetchRecurringJobs();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da recorrência',
        variant: 'destructive',
      });
    }
  };

  const getFrequencyText = (frequency: 'daily' | 'weekly' | 'monthly', interval: number) => {
    const base = frequency === 'daily' ? 'dia' : frequency === 'weekly' ? 'semana' : 'mês';
    const plural = interval > 1 ? (base === 'mês' ? 'meses' : `${base}s`) : base;
    return `A cada ${interval} ${plural}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Tarefas Recorrentes</h2>
          <p className="text-muted-foreground">
            Gerencie tarefas com republicação automática
          </p>
        </div>
        <Button onClick={fetchRecurringJobs} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas Ativas com Recorrência</CardTitle>
          <CardDescription>
            {jobs.length} tarefa(s) configurada(s) para republicação automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma tarefa recorrente encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      <Badge variant={job.recurrence?.enabled ? 'default' : 'secondary'}>
                        {job.recurrence?.enabled ? 'Ativa' : 'Pausada'}
                      </Badge>
                      {job.republicationNumber && (
                        <Badge variant="outline">
                          Republicação #{job.republicationNumber}
                        </Badge>
                      )}
                    </div>

                    {job.recurrence && (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {getFrequencyText(
                              job.recurrence.frequency,
                              job.recurrence.interval
                            )}
                          </span>
                        </div>

                        {job.recurrence.nextPublishDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Próxima publicação:{' '}
                              {format(
                                job.recurrence.nextPublishDate,
                                "dd 'de' MMMM 'às' HH:mm",
                                { locale: ptBR }
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-4">
                          <span>
                            Republicações: {job.recurrence.totalRepublications || 0}
                            {job.recurrence.maxRepublications &&
                              ` / ${job.recurrence.maxRepublications}`}
                          </span>
                          {job.recurrence.endDate && (
                            <span>
                              Termina em:{' '}
                              {format(job.recurrence.endDate, 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </span>
                          )}
                        </div>

                        <div className="text-xs">
                          <span className="font-medium">Contratante:</span> {job.posterName}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={job.recurrence?.enabled || false}
                      onCheckedChange={() =>
                        handleToggleRecurrence(job.id, job.recurrence?.enabled || false)
                      }
                    />
                    {job.recurrence?.enabled ? (
                      <Pause className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
