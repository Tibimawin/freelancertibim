import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AdminVerificationService } from '@/services/adminVerification';
import VerificationForm from '@/components/VerificationForm';
import { CloudinaryService } from '@/lib/cloudinary';
import { Loader2, UserCheck, AlertCircle, CheckCircle, IdCard, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const KYCPage = () => {
  const { currentUser, userData, updateUserData } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    governmentIdNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    state: '',
    city: '',
    country: '',
    postalCode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  // Estado dos documentos para envio unificado
  interface DocumentFile { file: File | null; status: 'idle' | 'uploading' | 'uploaded' | 'error'; url?: string; publicId?: string; }
  const initialDocs: { id_front: DocumentFile; id_back: DocumentFile; selfie: DocumentFile; address_proof: DocumentFile } = {
    id_front: { file: null, status: 'idle' },
    id_back: { file: null, status: 'idle' },
    selfie: { file: null, status: 'idle' },
    address_proof: { file: null, status: 'idle' },
  };
  const [documents, setDocuments] = useState(initialDocs);

  const verificationStatus = userData?.verificationStatus || 'incomplete';
  const isLocked = verificationStatus === 'pending' || verificationStatus === 'approved';

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleUnifiedSubmit = async () => {
    if (!currentUser || !userData) return;

    // Campos obrigatórios
    if (!form.governmentIdNumber || !form.firstName || !form.lastName || !form.dateOfBirth) {
      toast({
        title: 'Campos obrigatórios faltando',
        description: 'Preencha Número do BI, Nome, Sobrenome e Data de nascimento.',
        variant: 'destructive',
      });
      return;
    }

    // Validar documentos selecionados (mínimo frente, verso e selfie)
    const filesToUpload = Object.entries(documents).filter(([, doc]) => (doc as DocumentFile).file) as [keyof typeof initialDocs, DocumentFile][];
    if (filesToUpload.length < 3) {
      toast({
        title: 'Documentos faltando',
        description: 'Anexe BI (frente e verso) e selfie com documento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      // 1) Upload dos documentos ao Cloudinary
      const uploadedDocs: { type: string; url: string; publicId: string }[] = [];
      const folder = `verifications/${currentUser.uid}`;
      for (const [key, doc] of filesToUpload) {
        if (doc.file) {
          setDocuments(prev => ({ ...prev, [key]: { ...prev[key], status: 'uploading' } }));
          const docType = key === 'id_front' || key === 'id_back' ? 'bi' : (key as string);
          const result = await CloudinaryService.uploadFile(doc.file, folder);
          uploadedDocs.push({ type: docType, url: result.url, publicId: result.public_id });
          setDocuments(prev => ({ ...prev, [key]: { ...prev[key], status: 'uploaded', url: result.url, publicId: result.public_id } }));
        }
      }

      // 2) Submeter dados pessoais
      await AdminVerificationService.submitIdentityInfo(
        currentUser.uid,
        userData.name,
        userData.email,
        {
          governmentIdNumber: form.governmentIdNumber,
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          address: form.address,
          state: form.state,
          city: form.city,
          country: form.country,
          postalCode: form.postalCode,
        }
      );

      // 3) Submeter documentos
      await AdminVerificationService.submitVerification(
        currentUser.uid,
        userData.name,
        userData.email,
        uploadedDocs
      );

      // 4) Atualizar status
      await updateUserData({ verificationStatus: 'pending' });

      toast({
        title: 'KYC enviado para verificação',
        description: 'Seus dados e documentos foram enviados para análise.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao enviar verificação',
        description: 'Tente novamente mais tarde ou verifique os campos e documentos.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      incomplete: 'outline',
    };

    const labels: Record<string, string> = {
      approved: 'Aprovado',
      pending: 'Pendente',
      rejected: 'Rejeitado',
      incomplete: 'Incompleto',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-electric-purple" />
                Verificação de Identidade (KYC)
              </h1>
              <p className="text-muted-foreground text-lg">
                Preencha seus dados pessoais e envie seus documentos para validação.
              </p>
            </div>
            {getVerificationBadge(verificationStatus)}
          </div>
          {/* Steps */}
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="text-muted-foreground">Passo 1: Dados pessoais</Badge>
            <Badge variant="outline" className="text-muted-foreground">Passo 2: Documentos</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Dados Pessoais */}
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-cosmic-blue" />
                <span>Identidade/KYC</span>
              </CardTitle>
              <CardDescription>
                Preencha suas informações de identidade. O administrador irá comparar com seus documentos.
              </CardDescription>
              {verificationStatus === 'rejected' && (
                <Alert className="bg-destructive/10 border-destructive/20 text-destructive mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Verificação Rejeitada</AlertTitle>
                  <AlertDescription>
                    Revise seus dados e reenvie. Verifique se correspondem aos documentos.
                  </AlertDescription>
                </Alert>
              )}
              {verificationStatus === 'approved' && (
                <Alert className="bg-success/10 border-success/20 text-success mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Verificação Aprovada</AlertTitle>
                  <AlertDescription>
                    Sua identidade foi aprovada. Obrigado!
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="governmentIdNumber" className="flex items-center space-x-2">
                      <IdCard className="h-4 w-4 text-muted-foreground" />
                      <span>Número do BI *</span>
                    </Label>
                    <Input id="governmentIdNumber" value={form.governmentIdNumber} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">Primeiro Nome(s) *</Label>
                    <Input id="firstName" value={form.firstName} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome(s) *</Label>
                    <Input id="lastName" value={form.lastName} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Data de nascimento *</Label>
                    <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" value={form.address} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" value={form.state} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" value={form.city} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" value={form.country} onChange={onChange} disabled={isLocked || submitting} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input id="postalCode" value={form.postalCode} onChange={onChange} disabled={isLocked || submitting} />
                  </div>
                </div>

                {/* Botão removido do Passo 1: envio ficará no Passo 2 */}
              </form>
            </CardContent>
          </Card>

          {/* Upload de Documentos (controlado, sem botão próprio) */}
          <VerificationForm
            documents={documents}
            onChangeDocument={(key, file) => setDocuments(prev => ({ ...prev, [key]: { file, status: 'idle' } }))}
            isSubmitting={submitting}
            verificationStatus={verificationStatus}
            onSubmit={handleUnifiedSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default KYCPage;