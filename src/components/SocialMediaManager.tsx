import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface SocialMediaAccount {
  id: string;
  platform: string;
  username: string;
  url: string;
  connected: boolean;
  verified: boolean;
}

const SocialMediaManager = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([
    {
      id: "1",
      platform: "facebook",
      username: "",
      url: "",
      connected: false,
      verified: false
    },
    {
      id: "2", 
      platform: "instagram",
      username: "",
      url: "",
      connected: false,
      verified: false
    },
    {
      id: "3",
      platform: "twitter",
      username: "",
      url: "",
      connected: false,
      verified: false
    },
    {
      id: "4",
      platform: "linkedin",
      username: "",
      url: "",
      connected: false,
      verified: false
    },
    {
      id: "5",
      platform: "youtube",
      username: "",
      url: "",
      connected: false,
      verified: false
    }
  ]);

  const [autoShare, setAutoShare] = useState(false);
  const [shareOnJobComplete, setShareOnJobComplete] = useState(false);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "Facebook";
      case "instagram":
        return "Instagram";
      case "twitter":
        return "Twitter / X";
      case "linkedin":
        return "LinkedIn";
      case "youtube":
        return "YouTube";
      default:
        return platform;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "text-blue-600";
      case "instagram":
        return "text-pink-600";
      case "twitter":
        return "text-blue-400";
      case "linkedin":
        return "text-blue-700";
      case "youtube":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const handleConnect = (accountId: string) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, connected: !account.connected }
        : account
    ));

    const account = accounts.find(a => a.id === accountId);
    if (account) {
      toast({
        title: account.connected ? "Conta desconectada" : "Conta conectada",
        description: `${getPlatformName(account.platform)} ${account.connected ? "foi desconectada" : "foi conectada"} com sucesso.`,
      });
    }
  };

  const handleUpdateAccount = (accountId: string, field: 'username' | 'url', value: string) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, [field]: value }
        : account
    ));
  };

  const handleVerifyAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account?.username && !account?.url) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha o usuário ou URL antes de verificar.",
        variant: "destructive",
      });
      return;
    }

    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, verified: !account.verified }
        : account
    ));

    toast({
      title: "Conta verificada",
      description: `${getPlatformName(account!.platform)} foi verificada com sucesso.`,
    });
  };

  const handleShareToSocial = async (platform: string) => {
    const shareText = "🎯 Acabei de completar mais um teste na plataforma Freelincer! 💪 Ajudando empresas a melhorar suas aplicações. #FreelincerTester #AppTesting #QualityAssurance";
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Freelincer - Teste de Aplicativos',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        // Fallback para desktop - copiar para clipboard
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
        toast({
          title: "Texto copiado!",
          description: "O texto foi copiado para a área de transferência. Cole nas suas redes sociais!",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar automaticamente. Tente copiar o texto manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configurações de Compartilhamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Configurações de Compartilhamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Compartilhamento Automático</Label>
              <p className="text-sm text-muted-foreground">
                Compartilhar automaticamente quando completar testes
              </p>
            </div>
            <Switch
              checked={autoShare}
              onCheckedChange={setAutoShare}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Compartilhar ao Finalizar Teste</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar opção de compartilhamento ao completar um teste
              </p>
            </div>
            <Switch
              checked={shareOnJobComplete}
              onCheckedChange={setShareOnJobComplete}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contas de Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Contas de Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {accounts.map((account) => (
            <div key={account.id} className="space-y-4 p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${getPlatformColor(account.platform)}`}>
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div>
                    <h4 className="font-medium">{getPlatformName(account.platform)}</h4>
                    <div className="flex items-center space-x-2">
                      {account.connected && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                      )}
                      {account.verified && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareToSocial(account.platform)}
                    disabled={!account.connected}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Compartilhar
                  </Button>
                  
                  <Button
                    variant={account.connected ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleConnect(account.id)}
                  >
                    {account.connected ? "Desconectar" : "Conectar"}
                  </Button>
                </div>
              </div>
              
              {account.connected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${account.platform}-username`}>
                      Usuário/Handle
                    </Label>
                    <Input
                      id={`${account.platform}-username`}
                      placeholder={`@usuario${account.platform === 'linkedin' ? '' : ''}`}
                      value={account.username}
                      onChange={(e) => handleUpdateAccount(account.id, 'username', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`${account.platform}-url`}>
                      URL do Perfil
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id={`${account.platform}-url`}
                        placeholder="https://..."
                        value={account.url}
                        onChange={(e) => handleUpdateAccount(account.id, 'url', e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleVerifyAccount(account.id)}
                        disabled={!account.username && !account.url}
                      >
                        {account.verified ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {account.connected && account.url && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">
                    Perfil: {account.url}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(account.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Compartilhamento Rápido */}
      <Card>
        <CardHeader>
          <CardTitle>Compartilhamento Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {accounts.filter(account => account.connected).map((account) => (
              <Button
                key={account.id}
                variant="outline"
                className="flex flex-col items-center space-y-2 h-auto py-4"
                onClick={() => handleShareToSocial(account.platform)}
              >
                <div className={getPlatformColor(account.platform)}>
                  {getPlatformIcon(account.platform)}
                </div>
                <span className="text-xs">{getPlatformName(account.platform)}</span>
              </Button>
            ))}
          </div>
          
          {accounts.filter(account => account.connected).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Conecte suas redes sociais para compartilhamento rápido</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaManager;