import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DocumentFile {
  file: File | null;
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  url?: string;
  publicId?: string;
}

const initialDocs = {
  id_front: { file: null, status: 'idle' } as DocumentFile,
  id_back: { file: null, status: 'idle' } as DocumentFile,
  selfie: { file: null, status: 'idle' } as DocumentFile,
  address_proof: { file: null, status: 'idle' } as DocumentFile,
};

type DocsState = typeof initialDocs;
interface VerificationFormProps {
  documents: DocsState;
  onChangeDocument: (key: keyof DocsState, file: File | null) => void;
  isSubmitting: boolean;
  verificationStatus: string;
  onSubmit: () => void;
}

const VerificationForm = ({ documents, onChangeDocument, isSubmitting, verificationStatus, onSubmit }: VerificationFormProps) => {
  const { t } = useTranslation();

  const handleFileChange = (key: keyof typeof initialDocs, file: File | null) => {
    onChangeDocument(key, file);
  };

  // Removido upload e envio; o envio será feito no KYCPage com um único botão

  const getDocStatus = (key: keyof typeof initialDocs) => {
    const doc = documents[key];
    if (doc.status === 'uploaded') return <CheckCircle className="h-4 w-4 text-success" />;
    if (doc.status === 'uploading') return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    if (doc.status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const isVerificationLocked = verificationStatus === 'pending' || verificationStatus === 'approved';

  if (verificationStatus === 'pending') {
    return (
      <Alert className="bg-warning/10 border-warning/20 text-warning">
        <Clock className="h-4 w-4" />
        <AlertTitle>{t("verification_pending")}</AlertTitle>
        <AlertDescription>
          {t("verification_pending_description")}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (verificationStatus === 'approved') {
    return (
      <Alert className="bg-success/10 border-success/20 text-success">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>{t("verification_approved")}</AlertTitle>
        <AlertDescription>
          {t("verification_approved_description")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-cosmic-blue" />
          <span>{t("identity_verification")}</span>
        </CardTitle>
        <CardDescription>
          {t("identity_verification_description")}
        </CardDescription>
        {verificationStatus === 'rejected' && (
          <Alert className="bg-destructive/10 border-destructive/20 text-destructive mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("verification_rejected")}</AlertTitle>
            <AlertDescription>
              {t("verification_rejected_description")}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Documento de Identidade - Frente */}
            <div className="space-y-2">
              <Label htmlFor="id_front" className="flex items-center space-x-2">
                {getDocStatus('id_front')}
                <span>{t("document_id_front")} *</span>
              </Label>
              <Input
                id="id_front"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('id_front', e.target.files?.[0] || null)}
                required
                disabled={isSubmitting || isVerificationLocked}
              />
            </div>

            {/* Documento de Identidade - Verso */}
            <div className="space-y-2">
              <Label htmlFor="id_back" className="flex items-center space-x-2">
                {getDocStatus('id_back')}
                <span>{t("document_id_back")} *</span>
              </Label>
              <Input
                id="id_back"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('id_back', e.target.files?.[0] || null)}
                required
                disabled={isSubmitting || isVerificationLocked}
              />
            </div>

            {/* Selfie */}
            <div className="space-y-2">
              <Label htmlFor="selfie" className="flex items-center space-x-2">
                {getDocStatus('selfie')}
                <span>{t("selfie_with_document")} *</span>
              </Label>
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                required
                disabled={isSubmitting || isVerificationLocked}
              />
            </div>

            {/* Comprovante de Residência (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="address_proof" className="flex items-center space-x-2">
                {getDocStatus('address_proof')}
                <span>{t("proof_of_address")} ({t("optional")})</span>
              </Label>
              <Input
                id="address_proof"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('address_proof', e.target.files?.[0] || null)}
                disabled={isSubmitting || isVerificationLocked}
              />
            </div>
          </div>
          <Button
            type="button"
            className="w-full glow-effect"
            disabled={isSubmitting || isVerificationLocked}
            onClick={onSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('submitting_documents') || 'Enviando verificação'}
              </>
            ) : (
              t('submit_for_verification') || 'Enviar para Verificação'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VerificationForm;