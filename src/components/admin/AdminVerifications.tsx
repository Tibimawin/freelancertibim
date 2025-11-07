import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Check, 
  X, 
  FileCheck, 
  Calendar,
  User,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAdminVerifications } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';
import { UserVerification } from '@/types/admin';

const AdminVerifications = () => {
  const { currentUser } = useAuth();
  const { adminData } = useAdmin();
  const { verifications, loading, fetchVerifications, approveVerification, rejectVerification } = useAdminVerifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<UserVerification | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | null;
    verification: UserVerification | null;
  }>({ type: null, verification: null });
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({});

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || verification.overallStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleVerificationAction = async () => {
    if (!actionDialog.type || !actionDialog.verification || !currentUser || !adminData) return;

    try {
      switch (actionDialog.type) {
        case 'approve':
          await approveVerification(
            actionDialog.verification.id, 
            currentUser.uid, 
            adminData.name,
            actionNotes
          );
          toast.success('Verificação aprovada com sucesso');
          break;
        case 'reject':
          await rejectVerification(
            actionDialog.verification.id, 
            currentUser.uid, 
            adminData.name,
            rejectionReasons,
            actionNotes
          );
          toast.success('Verificação rejeitada com sucesso');
          break;
      }
      
      setActionDialog({ type: null, verification: null });
      setActionNotes('');
      setRejectionReasons({});
    } catch (error) {
      toast.error('Erro ao processar verificação');
      console.error('Error processing verification:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      incomplete: "outline"
    };
    
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      incomplete: "Incompleto"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cpf: "CPF",
      rg: "RG",
      passport: "Passaporte",
      selfie: "Selfie",
      address_proof: "Comprovante de Endereço"
    };
    return labels[type] || type;
  };

  const getDocumentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive"
    };
    
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado"
    };

    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
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
                  placeholder={t('search user id')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all statuses')}</SelectItem>
                <SelectItem value="pending">{t('pending status')}</SelectItem>
                <SelectItem value="approved">{t('approved status')}</SelectItem>
                <SelectItem value="rejected">{t('rejected status')}</SelectItem>
                <SelectItem value="incomplete">{t('incomplete status')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <div className="grid gap-4">
        {filteredVerifications.map((verification) => (
          <Card key={verification.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{verification.userName}</h3>
                    {getStatusBadge(verification.overallStatus)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {verification.userEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      {verification.documents.length} {t('documents count', { count: verification.documents.length })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('submitted on')}: {verification.submittedAt.toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Documents Status */}
                  <div className="flex flex-wrap gap-2">
                    {verification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <span>{getDocumentTypeLabel(doc.type)}:</span>
                        {getDocumentStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                  
                  {verification.adminNotes && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>{t('admin notes')}:</strong> {verification.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVerification(verification)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('analyze')}
                  </Button>
                  
                  {verification.overallStatus === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActionDialog({ type: 'approve', verification })}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('approve button')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setActionDialog({ type: 'reject', verification })}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('reject button')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Details Modal */}
      <Dialog 
        open={!!selectedVerification} 
        onOpenChange={() => setSelectedVerification(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('verification analysis')}</DialogTitle>
            <DialogDescription>
              {t('review all submitted documents')}
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
                <div>
                  <Label>{t('user')}</Label>
                  <p className="font-medium">{selectedVerification.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedVerification.userEmail}</p>
                </div>
                <div>
                  <Label>{t('overall status')}</Label>
                  <div className="pt-1">
                    {getStatusBadge(selectedVerification.overallStatus)}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <Label className="text-base">{t('submitted documents')}</Label>
                <div className="grid gap-4 mt-2">
                  {selectedVerification.documents.map((doc, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{getDocumentTypeLabel(doc.type)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('uploaded on')} {doc.uploadedAt.toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getDocumentStatusBadge(doc.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {t('view')}
                            </Button>
                          </div>
                        </div>

                        {/* Document Preview */}
                        <div className="bg-muted/50 rounded p-2">
                          <img 
                            src={doc.url} 
                            alt={`${doc.type} document`}
                            className="max-h-32 mx-auto object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="hidden items-center justify-center h-32 text-muted-foreground"
                          >
                            <FileCheck className="h-8 w-8 mr-2" />
                            {t('document available for viewing')}
                          </div>
                        </div>

                        {doc.rejectionReason && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                            <div className="flex items-center gap-1 text-destructive mb-1">
                              <AlertCircle className="h-3 w-3" />
                              <span className="font-medium">{t('rejected')}:</span>
                            </div>
                            <p>{doc.rejectionReason}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <Label className="text-base">{t('history')}</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{t('submitted at')}: {selectedVerification.submittedAt.toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedVerification.reviewedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4" />
                      <span>{t('reviewed at')}: {selectedVerification.reviewedAt.toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedVerification.adminNotes && (
                <div>
                  <Label>{t('admin notes label')}</Label>
                  <p className="bg-muted p-3 rounded text-sm mt-1">{selectedVerification.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVerification(null)}>
              {t('close')}
            </Button>
            {selectedVerification?.overallStatus === 'pending' && (
              <>
                <Button
                  onClick={() => setActionDialog({ type: 'reject', verification: selectedVerification })}
                  variant="destructive"
                >
                  {t('reject button')}
                </Button>
                <Button
                  onClick={() => setActionDialog({ type: 'approve', verification: selectedVerification })}
                >
                  {t('approve button')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog 
        open={!!actionDialog.type} 
        onOpenChange={() => setActionDialog({ type: null, verification: null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? t('approve verification') : t('reject verification')}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' 
                ? t('confirm user verification approval')
                : t('select documents to reject')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog.type === 'reject' && actionDialog.verification && (
              <div>
                <Label>{t('documents to reject')}</Label>
                <div className="space-y-2 mt-2">
                  {actionDialog.verification.documents.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`doc-${index}`}
                        checked={!!rejectionReasons[doc.type]}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRejectionReasons(prev => ({
                              ...prev,
                              [doc.type]: t('invalid document illegible')
                            }));
                          } else {
                            const { [doc.type]: removed, ...rest } = rejectionReasons;
                            setRejectionReasons(rest);
                          }
                        }}
                      />
                      <Label htmlFor={`doc-${index}`} className="flex-1">
                        {getDocumentTypeLabel(doc.type)}
                      </Label>
                      {rejectionReasons[doc.type] && (
                        <Input
                          placeholder={t('rejection reason placeholder')}
                          value={rejectionReasons[doc.type]}
                          onChange={(e) => setRejectionReasons(prev => ({
                            ...prev,
                            [doc.type]: e.target.value
                          }))}
                          className="flex-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">{t('admin notes label')}</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre a verificação..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, verification: null })}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleVerificationAction}
              disabled={actionDialog.type === 'reject' && Object.keys(rejectionReasons).length === 0}
            >
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;