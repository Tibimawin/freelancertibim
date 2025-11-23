import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SystemConfigService, SystemConfig } from '@/services/systemConfigService';
import {
  Settings,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  AlertCircle,
  Save,
  RotateCcw,
  Briefcase,
} from 'lucide-react';

export const AdminSystemConfig = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = SystemConfigService.subscribeToConfig((newConfig) => {
      setConfig(newConfig);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveWithdrawalSettings = async () => {
    if (!currentUser || !userData || !config) return;

    setSaving(true);
    try {
      await SystemConfigService.updateWithdrawalSettings(
        config.withdrawalSettings,
        currentUser.uid,
        userData.name
      );

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de saque foram atualizadas e todos os usuários foram notificados.',
      });
    } catch (error) {
      console.error('Error saving withdrawal settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDepositSettings = async () => {
    if (!currentUser || !userData || !config) return;

    setSaving(true);
    try {
      await SystemConfigService.updateDepositSettings(
        config.depositSettings,
        currentUser.uid,
        userData.name
      );

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de depósito foram atualizadas e todos os usuários foram notificados.',
      });
    } catch (error) {
      console.error('Error saving deposit settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    if (!currentUser || !userData || !config) return;

    setSaving(true);
    try {
      await SystemConfigService.updatePlatformSettings(
        config.platformSettings,
        currentUser.uid,
        userData.name
      );

      toast({
        title: 'Configurações salvas',
        description: 'As configurações da plataforma foram atualizadas e todos os usuários foram notificados.',
      });
    } catch (error) {
      console.error('Error saving platform settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaskLimits = async () => {
    if (!currentUser || !userData || !config) return;

    setSaving(true);
    try {
      await SystemConfigService.updateTaskLimits(
        config.taskLimits,
        currentUser.uid,
        userData.name
      );

      toast({
        title: 'Limites salvos',
        description: 'Os limites de tarefas foram atualizados e todos os contratantes foram notificados.',
      });
    } catch (error) {
      console.error('Error saving task limits:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os limites.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Configurações do Sistema
        </h2>
        <p className="text-muted-foreground mt-1">
          Gerencie valores mínimos, máximos e taxas da plataforma
        </p>
      </div>

      {/* Configurações de Saque */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle>Configurações de Saque</CardTitle>
            </div>
            <Badge variant="outline">Freelancers</Badge>
          </div>
          <CardDescription>
            Configure limites e taxas para saques de freelancers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-withdrawal">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor Mínimo de Saque (Kz)
              </Label>
              <Input
                id="min-withdrawal"
                type="number"
                value={config.withdrawalSettings.minAmount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    withdrawalSettings: {
                      ...config.withdrawalSettings,
                      minAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="0"
                step="100"
              />
              <p className="text-xs text-muted-foreground">
                Freelancers precisam ter no mínimo este valor para sacar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-withdrawal">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor Máximo de Saque (Kz)
              </Label>
              <Input
                id="max-withdrawal"
                type="number"
                value={config.withdrawalSettings.maxAmount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    withdrawalSettings: {
                      ...config.withdrawalSettings,
                      maxAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="0"
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                Valor máximo permitido por transação
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Taxas por Método de Saque</h4>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="express-fee">
                  <Percent className="h-4 w-4 inline mr-1" />
                  Taxa Express (%)
                </Label>
                <Input
                  id="express-fee"
                  type="number"
                  value={config.withdrawalSettings.expressFeePercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      withdrawalSettings: {
                        ...config.withdrawalSettings,
                        expressFeePercent: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Taxa cobrada para saques via Express
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban-fee">
                  <Percent className="h-4 w-4 inline mr-1" />
                  Taxa IBAN (%)
                </Label>
                <Input
                  id="iban-fee"
                  type="number"
                  value={config.withdrawalSettings.ibanFeePercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      withdrawalSettings: {
                        ...config.withdrawalSettings,
                        ibanFeePercent: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Taxa cobrada para saques via IBAN
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Métodos Ativos</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="express-enabled" className="text-sm">Express</Label>
                <Switch
                  id="express-enabled"
                  checked={config.withdrawalSettings.expressEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      withdrawalSettings: {
                        ...config.withdrawalSettings,
                        expressEnabled: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="iban-enabled" className="text-sm">IBAN</Label>
                <Switch
                  id="iban-enabled"
                  checked={config.withdrawalSettings.ibanEnabled}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      withdrawalSettings: {
                        ...config.withdrawalSettings,
                        ibanEnabled: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveWithdrawalSettings} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações de Saque'}
          </Button>
        </CardContent>
      </Card>

      {/* Configurações de Depósito */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <CardTitle>Configurações de Depósito</CardTitle>
            </div>
            <Badge variant="outline">Contratantes</Badge>
          </div>
          <CardDescription>
            Configure limites e bônus para depósitos de contratantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-deposit">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor Mínimo de Depósito (Kz)
              </Label>
              <Input
                id="min-deposit"
                type="number"
                value={config.depositSettings.minAmount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    depositSettings: {
                      ...config.depositSettings,
                      minAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-deposit">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor Máximo de Depósito (Kz)
              </Label>
              <Input
                id="max-deposit"
                type="number"
                value={config.depositSettings.maxAmount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    depositSettings: {
                      ...config.depositSettings,
                      maxAmount: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="0"
                step="1000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bonus-percent">
              <Percent className="h-4 w-4 inline mr-1" />
              Bônus de Depósito (%)
            </Label>
            <Input
              id="bonus-percent"
              type="number"
              value={config.depositSettings.bonusPercent}
              onChange={(e) =>
                setConfig({
                  ...config,
                  depositSettings: {
                    ...config.depositSettings,
                    bonusPercent: parseFloat(e.target.value) || 0,
                  },
                })
              }
              min="0"
              max="100"
              step="1"
            />
            <p className="text-xs text-muted-foreground">
              Percentual de bônus concedido em novos depósitos (0 = desabilitado)
            </p>
          </div>

          <Button onClick={handleSaveDepositSettings} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações de Depósito'}
          </Button>
        </CardContent>
      </Card>

      {/* Configurações de Limites de Tarefas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>Limites de Tarefas</CardTitle>
            </div>
            <Badge variant="outline">Contratantes</Badge>
          </div>
          <CardDescription>
            Configure valores mínimos, máximos e threshold de alerta para criação de tarefas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-bounty">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor Mínimo por Tarefa (Kz)
              </Label>
              <Input
                id="min-bounty"
                type="number"
                value={config.taskLimits.minBounty}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    taskLimits: {
                      ...config.taskLimits,
                      minBounty: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="1"
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                Valor mínimo que contratantes podem pagar por tarefa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-bounty">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor Máximo por Tarefa (Kz)
              </Label>
              <Input
                id="max-bounty"
                type="number"
                value={config.taskLimits.maxBounty}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    taskLimits: {
                      ...config.taskLimits,
                      maxBounty: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="1"
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                Valor máximo permitido por tarefa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="high-value-threshold">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Threshold de Alerta (Kz)
              </Label>
              <Input
                id="high-value-threshold"
                type="number"
                value={config.taskLimits.highValueThreshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    taskLimits: {
                      ...config.taskLimits,
                      highValueThreshold: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                min="1"
                step="1000"
              />
              <p className="text-xs text-muted-foreground">
                Valores acima deste limite exigem confirmação do usuário
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Informações Importantes</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Valores muito baixos podem atrair spam de tarefas inválidas</li>
                  <li>• Valores muito altos devem exigir confirmação para evitar erros</li>
                  <li>• O threshold de alerta mostra um diálogo de confirmação ao criar tarefas caras</li>
                  <li>• Mudanças nestes limites notificam automaticamente todos os contratantes</li>
                </ul>
              </div>
            </div>
          </div>

          <Button onClick={handleSaveTaskLimits} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Limites de Tarefas'}
          </Button>
        </CardContent>
      </Card>

      {/* Configurações da Plataforma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Configurações da Plataforma</CardTitle>
          </div>
          <CardDescription>
            Configure taxas gerais e modo de manutenção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="platform-fee">
              <Percent className="h-4 w-4 inline mr-1" />
              Taxa da Plataforma (%)
            </Label>
            <Input
              id="platform-fee"
              type="number"
              value={config.platformSettings.platformFeePercent}
              onChange={(e) =>
                setConfig({
                  ...config,
                  platformSettings: {
                    ...config.platformSettings,
                    platformFeePercent: parseFloat(e.target.value) || 0,
                  },
                })
              }
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Taxa cobrada sobre transações da plataforma
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance-mode">Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Bloqueia acesso de usuários não-admin
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={config.platformSettings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    platformSettings: {
                      ...config.platformSettings,
                      maintenanceMode: checked,
                    },
                  })
                }
              />
            </div>

            {config.platformSettings.maintenanceMode && (
              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
                <Input
                  id="maintenance-message"
                  value={config.platformSettings.maintenanceMessage}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      platformSettings: {
                        ...config.platformSettings,
                        maintenanceMessage: e.target.value,
                      },
                    })
                  }
                  placeholder="Sistema em manutenção..."
                />
              </div>
            )}
          </div>

          <Button onClick={handleSavePlatformSettings} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações da Plataforma'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
