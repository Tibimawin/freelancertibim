import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Check, 
  X, 
  Flag, 
  Calendar,
  User,
  Eye,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useAdminReports } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';
import { Report } from '@/types/firebase';
import { useTranslation } from 'react-i18next';

const AdminReports = () => {
  const { currentUser } = useAuth();
  const { adminData } = useAdmin();
  const { reports, loading, fetchReports, reviewReport } = useAdminReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | null;
    report: Report | null;
  }>({ type: null, report: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState(false);
  const { t } = useTranslation();

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleReportAction = async () => {
    if (!actionDialog.type || !actionDialog.report || !currentUser || !adminData) return;

    try {
      setProcessing(true);
      await reviewReport(
        actionDialog.report.id, 
        actionDialog.type, 
        currentUser.uid, 
        adminData.name,
        adminNotes,
        resolution
      );
      toast.success(actionDialog.type === 'approve' ? t('report_approved_success') : t('report_rejected_success'));
      
      setActionDialog({ type: null, report: null });
      setAdminNotes('');
      setResolution('');
    } catch (error) {
      toast.error(t('error_processing_report'));
      console.error('Error processing report:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_review: "outline",
      approved: "default",
      rejected: "destructive"
    };
    
    const labels: Record<string, string> = {
      pending: t('pending_status'),
      in_review: t('in_review_status'),
      approved: t('approved_status'),
      rejected: t('rejected_status')
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('search_reports_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_statuses')}</SelectItem>
                <SelectItem value="pending">{t('pending_status')}</SelectItem>
                <SelectItem value="in_review">{t('in_review_status')}</SelectItem>
                <SelectItem value="approved">{t('approved_status')}</SelectItem>
                <SelectItem value="rejected">{t('rejected_status')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('no_reports_found')}</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{report.reason}</h3>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t('reporter')}: {report.reporterName}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t('reported')}: {report.reportedUserName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('submitted_on')}: {report.submittedAt.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    {report.adminNotes && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>{t('admin_notes')}:</strong> {report.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('view_details')}
                    </Button>
                    
                    {report.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setActionDialog({ type: 'approve', report })}
                          disabled={processing}
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          {processing ? t('processing') : t('approve_button')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setActionDialog({ type: 'reject', report })}
                          disabled={processing}
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          {processing ? t('processing') : t('reject_button')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      <Dialog 
        open={!!selectedReport} 
        onOpenChange={() => setSelectedReport(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('report_details')}</DialogTitle>
            <DialogDescription>
              {t('full_report_info')}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
                <div>
                  <Label>{t('reporter')}</Label>
                  <p className="font-medium">{selectedReport.reporterName}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reporterEmail}</p>
                </div>
                <div>
                  <Label>{t('reported')}</Label>
                  <p className="font-medium">{selectedReport.reportedUserName}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reportedUserEmail}</p>
                </div>
                <div>
                  <Label>{t('reason')}</Label>
                  <p className="font-medium">{selectedReport.reason}</p>
                </div>
                <div>
                  <Label>{t('overall_status')}</Label>
                  <div className="pt-1">
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>{t('detailed_description')}</Label>
                <p className="bg-muted p-3 rounded text-sm mt-1">{selectedReport.description}</p>
              </div>

              {/* Related Info */}
              {(selectedReport.applicationId || selectedReport.jobId) && (
                <div>
                  <Label>{t('related_info')}</Label>
                  <div className="bg-muted p-3 rounded text-sm mt-1 space-y-1">
                    {selectedReport.jobId && (
                      <p><strong>{t('job_id')}:</strong> {selectedReport.jobId}</p>
                    )}
                    {selectedReport.applicationId && (
                      <p><strong>{t('application_id')}:</strong> {selectedReport.applicationId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <Label className="text-base">{t('history')}</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{t('submitted_at')}: {selectedReport.submittedAt.toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedReport.reviewedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4" />
                      <span>{t('reviewed_at')}: {selectedReport.reviewedAt.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.adminNotes && (
                <div>
                  <Label>{t('admin_notes_label')}</Label>
                  <p className="bg-muted p-3 rounded text-sm mt-1">{selectedReport.adminNotes}</p>
                </div>
              )}
              
              {selectedReport.resolution && (
                <div>
                  <Label>{t('resolution')}</Label>
                  <p className="bg-success/10 p-3 rounded text-sm mt-1 text-success">{selectedReport.resolution}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              {t('close')}
            </Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button
                  onClick={() => setActionDialog({ type: 'reject', report: selectedReport })}
                  variant="destructive"
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : null}
                  {processing ? t('processing') : t('reject_button')}
                </Button>
                <Button
                  onClick={() => setActionDialog({ type: 'approve', report: selectedReport })}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : null}
                  {processing ? t('processing') : t('approve_button')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog 
        open={!!actionDialog.type} 
        onOpenChange={() => setActionDialog({ type: null, report: null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? t('approve_report') : t('reject_report')}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' 
                ? t('confirm_report_approval')
                : t('confirm_report_rejection')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog.type === 'approve' && (
              <div>
                <Label htmlFor="resolution">{t('resolution_action')}</Label>
                <Textarea
                  id="resolution"
                  placeholder={t('resolution_action_placeholder')}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}

            <div>
              <Label htmlFor="adminNotes">{t('admin_notes_label')}</Label>
              <Textarea
                id="adminNotes"
                placeholder={t('admin_notes_placeholder')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, report: null })}
              disabled={processing}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleReportAction}
              disabled={processing || (actionDialog.type === 'approve' && !resolution.trim())}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {processing ? t('processing') : t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;