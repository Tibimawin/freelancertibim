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

  const verificationStatus = userData?.verificationStatus || 'incomplete';
  const isLocked = verificationStatus === 'pending' || verificationStatus === 'approved';

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    try {
      setSubmitting(true);
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

      await updateUserData({ verificationStatus: 'pending' });

      toast({
        title: 'KYC enviado para análise',
        description: 'Suas informações de identidade foram enviadas. Agora anexe os documentos ao lado.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao enviar KYC',
        description: 'Tente novamente mais tarde ou verifique os campos.',
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
              <form onSubmit={onSubmit} className="space-y-4">
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

                <Button type="submit" className="w-full glow-effect" disabled={isLocked || submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando KYC
                    </>
                  ) : (
                    'Enviar para análise'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Upload de Documentos (já existente) */}
          <VerificationForm />
        </div>
      </div>
    </div>
  );
};

export default KYCPage;