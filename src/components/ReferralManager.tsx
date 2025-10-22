import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import { 
  Users, 
  Copy, 
  Share2, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Loader2,
  QrCode
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { QRCode } from 'react-qrcode-logo';

const ReferralManager = () => {
  const { userData, currentUser } = useAuth();
  const { referrals, loading, refetch } = useReferrals();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const referralCode = userData?.referralCode || 'N/A';
  const referralLink = useMemo(() => {
    if (referralCode === 'N/A') return '';
    // Usando a URL base da aplicação (simulação)
    return `${window.location.origin}/referral?code=${referralCode}`;
  }, [referralCode]);

  const totalPending = referrals.filter(r => r.status === 'pending').length;
  const totalCompleted = referrals.filter(r => r.status === 'completed').length;
  const totalEarned = referrals
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: t("copied"),
        description: t("copied_to_clipboard", { field: t("referral_code") }),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t("error_copying"),
        description: t("error_copying_description"),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />{t("completed")}</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />{t("pending")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  // Placeholder para buscar o nome do usuário indicado (em um app real, usaríamos um hook ou serviço)
  const getReferredUserName = (referredId: string) => {
    // Simulação: em um app real, você buscaria o nome do usuário pelo ID
    return `Usuário #${referredId.substring(0, 4)}`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-electric-purple" />
            <span>{t("referral_program")}</span>
          </CardTitle>
          <CardDescription>
            {t("referral_program_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Recompensa e Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-2xl font-bold text-primary">{totalCompleted}</p>
              <p className="text-sm text-muted-foreground">{t("successful_referrals")}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-2xl font-bold text-warning">{totalPending}</p>
              <p className="text-sm text-muted-foreground">{t("pending_rewards")}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-2xl font-bold text-success">{totalEarned.toFixed(2)} KZ</p>
              <p className="text-sm text-muted-foreground">{t("total_earned_referrals")}</p>
            </div>
          </div>

          <Separator />

          {/* Código e Link de Compartilhamento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t("your_referral_code")}</h3>
            
            <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3">
              <div className="flex-1 w-full">
                <Label htmlFor="referral-code" className="text-sm text-muted-foreground">{t("code")}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="referral-code"
                    value={referralCode}
                    readOnly
                    className="font-mono text-lg text-center uppercase bg-muted/50 border-primary/30"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleCopy(referralCode)}
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <Label htmlFor="referral-link" className="text-sm text-muted-foreground">{t("share_link")}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="referral-link"
                    value={referralLink}
                    readOnly
                    className="text-sm bg-muted/50 border-border"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleCopy(referralLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="default" 
              className="w-full md:w-auto glow-effect"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: t("share_title"),
                    text: t("share_text", { code: referralCode, link: referralLink }),
                    url: referralLink,
                  });
                } else {
                  handleCopy(referralLink);
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t("share_now")}
            </Button>
          </div>
          
          <Separator />

          {/* QR Code */}
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-foreground flex items-center justify-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>{t("qr_code_share")}</span>
            </h3>
            <p className="text-sm text-muted-foreground">{t("qr_code_description")}</p>
            <div className="p-4 inline-block bg-white rounded-lg shadow-lg border border-border">
              <QRCode 
                value={referralLink} 
                size={180} 
                fgColor="#4c1d95" // Electric Purple
                logoImage={currentUser?.photoURL || undefined}
                logoWidth={40}
                logoHeight={40}
                qrStyle="dots"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Referências */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-cosmic-blue" />
            <span>{t("referral_history")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("no_referrals_yet")}</p>
              <p className="text-sm mt-1">{t("start_sharing_to_earn")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-sm font-medium">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{getReferredUserName(ref.referredId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("referred_on")} {ref.createdAt.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    {getStatusBadge(ref.status)}
                    <p className={`text-sm font-semibold ${ref.status === 'completed' ? 'text-success' : 'text-muted-foreground'}`}>
                      {ref.rewardAmount.toFixed(2)} KZ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralManager;