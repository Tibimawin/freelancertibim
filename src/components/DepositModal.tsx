import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, Phone, MapPin, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: 'express' | 'iban';
}

const DepositModal = ({ open, onOpenChange, method }: DepositModalProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast({
        title: t("copied"),
        description: t("copied_to_clipboard", { field }),
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: t("error_copying"),
        description: t("error_copying_description"),
        variant: "destructive",
      });
    }
  };

  const expressData = {
    phone: "926 234 567",
    name: "TaskBoost Angola",
    reference: "DEPOSIT-TB-001"
  };

  const ibanData = {
    iban: "AO06 0040 0000 4562 3745 1018 5",
    bank: "Banco BIC Angola",
    accountName: "TaskBoost Angola Lda",
    swift: "BCGAAOAO",
    reference: "DEPOSIT-TB-002"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {method === 'express' ? t('deposit_modal_title_express') : t('deposit_modal_title_iban')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {method === 'express' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5" />
                  {t('express_transfer_data')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('phone_number')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {expressData.phone}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.phone, t('phone_number'))}
                    >
                      {copied === t('phone_number') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('beneficiary_name')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center">
                      {expressData.name}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.name, t('beneficiary_name'))}
                    >
                      {copied === t('beneficiary_name') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('reference')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {expressData.reference}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(expressData.reference, t('reference'))}
                    >
                      {copied === t('reference') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-5 w-5" />
                  {t('iban_transfer_data')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('iban_code')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono text-sm">
                      {ibanData.iban}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.iban, t('iban_code'))}
                    >
                      {copied === t('iban_code') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('bank')}</label>
                  <div className="p-2 bg-muted rounded text-center">
                    {ibanData.bank}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('account_name')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center">
                      {ibanData.accountName}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.accountName, t('account_name'))}
                    >
                      {copied === t('account_name') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('swift_code')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {ibanData.swift}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.swift, t('swift_code'))}
                    >
                      {copied === t('swift_code') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('reference')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded text-center font-mono">
                      {ibanData.reference}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(ibanData.reference, t('reference'))}
                    >
                      {copied === t('reference') ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t('important')}</Badge>
                  <span className="text-muted-foreground">
                    {t('use_reference_to_identify_deposit')}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {t('balance_credited_within_24h')}
                </p>
                <p className="text-muted-foreground">
                  {t('keep_proof_of_transfer')}
                </p>
                <p className="text-muted-foreground">
                  {t('contact_us_if_problems')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            {t('understood')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;