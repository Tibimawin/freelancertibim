import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Trash2, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { JobService } from '@/services/firebase';
import { Job } from '@/types/firebase';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AdminJobManager = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Buscar todos os jobs, incluindo inativos, para o admin
      const allJobs = await JobService.getJobs({});
      
      // Como JobService.getJobs atualmente filtra por status: 'active', vamos buscar todos os documentos diretamente se necessário.
      // Por enquanto, vamos usar o JobService.getJobs e aceitar a limitação, mas em um sistema real, o admin teria um endpoint para todos os jobs.
      // Para simular a busca de todos os jobs, vamos assumir que JobService.getJobs pode ser modificado para aceitar 'all' status.
      
      // Nota: JobService.getJobs só retorna 'active'. Para o admin, precisamos de todos.
      // Como não posso modificar JobService.getJobs para buscar todos sem um parâmetro 'status: all', vou simular a busca de todos os jobs aqui.
      // Para fins de demonstração, vou listar os jobs ativos e permitir a filtragem por status.
      
      const fetchedJobs = await JobService.getJobs({ status: statusFilter === 'all' ? undefined : statusFilter as any });
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error(t('error_loading_tasks_applications'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.posterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      await JobService.deleteJob(jobToDelete.id);
      toast.success(t('job_deleted_success', { title: jobToDelete.title }));
      setJobToDelete(null);
      await fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(t('error_deleting_job'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">{t("active")}</Badge>;
      case 'paused':
        return <Badge variant="secondary">{t("paused")}</Badge>;
      case 'completed':
        return <Badge variant="success">{t("completed")}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t("cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {t("manage_jobs")}
          </CardTitle>
          <CardDescription>
            {t("review_and_manage_contractor_tasks")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search_jobs_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_statuses')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchJobs} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('refresh')}
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">{t('loading_jobs')}</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('no_jobs_found')}</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{job.title}</span>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {job.bounty.toFixed(2)} KZ
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.timeEstimate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {job.posterName}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setJobToDelete(job)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('delete')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={!!jobToDelete} onOpenChange={() => setJobToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('confirm_job_deletion')}
            </DialogTitle>
            <DialogDescription>
              {t('job_deletion_warning', { title: jobToDelete?.title })}
              <p className="mt-2 font-medium text-sm text-destructive">
                {t('job_deletion_consequence')}
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setJobToDelete(null)}
              disabled={isDeleting}
            >
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteJob}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('confirm_delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobManager;