import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Flag, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ReportService } from '@/services/reportService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  reportedEmail: z.string().email("Email inválido").min(1, "Email do denunciado é obrigatório"),
  reason: z.string().min(1, "O motivo da denúncia é obrigatório"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  jobId?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  reportedUserEmail?: string;
}

const ReportModal = ({ isOpen, onClose, applicationId, jobId, reportedUserId, reportedUserName, reportedUserEmail }: ReportModalProps) => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportedEmail: reportedUserEmail || '',
      reason: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !userData) {
      toast({
        title: t("error"),
        description: t("unauthenticated_report"),
        variant: "destructive",
      });
      return;
    }

    if (!reportedUserId) {
      toast({
        title: t("error"),
        description: t("reported_user_id_missing"),
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: Omit<
        import('@/types/firebase').Report,
        'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'adminNotes' | 'resolution'
      > = {
        reporterId: currentUser.uid,
        reporterName: userData.name,
        reporterEmail: userData.email,
        reportedUserId: reportedUserId,
        reportedUserName: reportedUserName || values.reportedEmail,
        reportedUserEmail: values.reportedEmail,
        reason: values.reason,
        description: values.description,
        ...(applicationId ? { applicationId } : {}),
        ...(jobId ? { jobId } : {}),
      };

      await ReportService.createReport(payload);

      toast({
        title: t("report_submitted_success"),
        description: t("report_submitted_description"),
      });
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: t("error_submitting_report"),
        description: t("error_submitting_report_description"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            {t("report_contractor")}
          </DialogTitle>
          <DialogDescription>
            {t("report_contractor_description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="reportedEmail">{t("reported_email")} *</Label>
            <Input
              id="reportedEmail"
              type="email"
              placeholder={t("reported_email_placeholder")}
              {...form.register("reportedEmail")}
              disabled={!!reportedUserEmail}
            />
            {form.formState.errors.reportedEmail && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.reportedEmail.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">{t("reason_for_report")} *</Label>
            <Select onValueChange={(value) => form.setValue("reason", value)} value={form.watch("reason")}>
              <SelectTrigger>
                <SelectValue placeholder={t("select_reason")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task_not_approved">{t("task_not_approved")}</SelectItem>
                <SelectItem value="late_approval">{t("late_approval")}</SelectItem>
                <SelectItem value="payment_issues">{t("payment_issues")}</SelectItem>
                <SelectItem value="harassment">{t("harassment")}</SelectItem>
                <SelectItem value="other">{t("other_reason")}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.reason && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{t("detailed_description")} *</Label>
            <Textarea
              id="description"
              placeholder={t("detailed_description_placeholder_report")}
              rows={5}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={form.formState.isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit_report")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;