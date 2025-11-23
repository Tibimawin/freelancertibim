import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SystemConfig {
  withdrawalSettings: {
    minAmount: number;
    maxAmount: number;
    expressEnabled: boolean;
    ibanEnabled: boolean;
    expressFeePercent: number;
    ibanFeePercent: number;
  };
  depositSettings: {
    minAmount: number;
    maxAmount: number;
    bonusPercent: number;
  };
  platformSettings: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    platformFeePercent: number;
  };
  taskLimits: {
    minBounty: number;
    maxBounty: number;
    highValueThreshold: number;
  };
  updatedAt?: any;
  updatedBy?: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  withdrawalSettings: {
    minAmount: 500,
    maxAmount: 1000000,
    expressEnabled: true,
    ibanEnabled: true,
    expressFeePercent: 0,
    ibanFeePercent: 2.5,
  },
  depositSettings: {
    minAmount: 100,
    maxAmount: 5000000,
    bonusPercent: 0,
  },
  platformSettings: {
    maintenanceMode: false,
    maintenanceMessage: 'Sistema em manutenção. Voltaremos em breve.',
    platformFeePercent: 0,
  },
  taskLimits: {
    minBounty: 5,
    maxBounty: 50000,
    highValueThreshold: 10000,
  },
};

export class SystemConfigService {
  private static CONFIG_DOC_ID = 'global';

  static async getConfig(): Promise<SystemConfig> {
    try {
      const docRef = doc(db, 'systemConfig', this.CONFIG_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as SystemConfig;
      }

      // Se não existir, criar com valores padrão
      await this.initializeConfig();
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting system config:', error);
      return DEFAULT_CONFIG;
    }
  }

  static async initializeConfig(): Promise<void> {
    try {
      const docRef = doc(db, 'systemConfig', this.CONFIG_DOC_ID);
      await setDoc(docRef, {
        ...DEFAULT_CONFIG,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error initializing config:', error);
      throw error;
    }
  }

  static async updateConfig(
    updates: Partial<SystemConfig>,
    adminId: string,
    adminName: string
  ): Promise<void> {
    try {
      // Buscar config anterior para comparar
      const oldConfig = await this.getConfig();
      
      const docRef = doc(db, 'systemConfig', this.CONFIG_DOC_ID);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: adminName,
        updatedById: adminId,
      });

      // Detectar mudanças importantes e notificar usuários
      await this.notifyImportantChanges(oldConfig, { ...oldConfig, ...updates });
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }

  private static async notifyImportantChanges(
    oldConfig: SystemConfig,
    newConfig: SystemConfig
  ): Promise<void> {
    const notifications: { title: string; message: string; type: string }[] = [];

    // Verificar mudanças no valor mínimo de saque
    if (oldConfig.withdrawalSettings.minAmount !== newConfig.withdrawalSettings.minAmount) {
      const diff = newConfig.withdrawalSettings.minAmount - oldConfig.withdrawalSettings.minAmount;
      if (diff < 0) {
        notifications.push({
          title: '🎉 Boas Notícias!',
          message: `Valor mínimo de saque reduzido de ${oldConfig.withdrawalSettings.minAmount} Kz para ${newConfig.withdrawalSettings.minAmount} Kz. Agora é mais fácil sacar seus ganhos!`,
          type: 'withdrawal_min_reduced',
        });
      } else {
        notifications.push({
          title: '📢 Mudança no Sistema',
          message: `Valor mínimo de saque atualizado de ${oldConfig.withdrawalSettings.minAmount} Kz para ${newConfig.withdrawalSettings.minAmount} Kz.`,
          type: 'withdrawal_min_increased',
        });
      }
    }

    // Verificar mudanças nas taxas de saque
    if (oldConfig.withdrawalSettings.expressFeePercent !== newConfig.withdrawalSettings.expressFeePercent) {
      const diff = newConfig.withdrawalSettings.expressFeePercent - oldConfig.withdrawalSettings.expressFeePercent;
      if (diff < 0) {
        notifications.push({
          title: '🎉 Taxa Reduzida!',
          message: `Taxa de saque Express reduzida de ${oldConfig.withdrawalSettings.expressFeePercent}% para ${newConfig.withdrawalSettings.expressFeePercent}%!`,
          type: 'express_fee_reduced',
        });
      } else if (diff > 0) {
        notifications.push({
          title: '📢 Alteração de Taxa',
          message: `Taxa de saque Express atualizada de ${oldConfig.withdrawalSettings.expressFeePercent}% para ${newConfig.withdrawalSettings.expressFeePercent}%.`,
          type: 'express_fee_increased',
        });
      }
    }

    if (oldConfig.withdrawalSettings.ibanFeePercent !== newConfig.withdrawalSettings.ibanFeePercent) {
      const diff = newConfig.withdrawalSettings.ibanFeePercent - oldConfig.withdrawalSettings.ibanFeePercent;
      if (diff < 0) {
        notifications.push({
          title: '🎉 Taxa Reduzida!',
          message: `Taxa de saque IBAN reduzida de ${oldConfig.withdrawalSettings.ibanFeePercent}% para ${newConfig.withdrawalSettings.ibanFeePercent}%!`,
          type: 'iban_fee_reduced',
        });
      } else if (diff > 0) {
        notifications.push({
          title: '📢 Alteração de Taxa',
          message: `Taxa de saque IBAN atualizada de ${oldConfig.withdrawalSettings.ibanFeePercent}% para ${newConfig.withdrawalSettings.ibanFeePercent}%.`,
          type: 'iban_fee_increased',
        });
      }
    }

    // Verificar bônus de depósito
    if (oldConfig.depositSettings.bonusPercent !== newConfig.depositSettings.bonusPercent) {
      const diff = newConfig.depositSettings.bonusPercent - oldConfig.depositSettings.bonusPercent;
      if (diff > 0 && newConfig.depositSettings.bonusPercent > 0) {
        notifications.push({
          title: '🎁 Bônus Disponível!',
          message: `Agora você ganha ${newConfig.depositSettings.bonusPercent}% de bônus em todos os depósitos! Recarregue e ganhe mais!`,
          type: 'deposit_bonus_activated',
        });
      } else if (diff < 0 && oldConfig.depositSettings.bonusPercent > 0) {
        notifications.push({
          title: '📢 Atualização de Bônus',
          message: `Bônus de depósito atualizado de ${oldConfig.depositSettings.bonusPercent}% para ${newConfig.depositSettings.bonusPercent}%.`,
          type: 'deposit_bonus_changed',
        });
      } else if (newConfig.depositSettings.bonusPercent === 0 && oldConfig.depositSettings.bonusPercent > 0) {
        notifications.push({
          title: '📢 Bônus Finalizado',
          message: 'Promoção de bônus de depósito finalizada.',
          type: 'deposit_bonus_ended',
        });
      }
    }

    // Verificar mudanças nos limites de tarefas
    if (oldConfig.taskLimits.minBounty !== newConfig.taskLimits.minBounty) {
      const diff = newConfig.taskLimits.minBounty - oldConfig.taskLimits.minBounty;
      if (diff < 0) {
        notifications.push({
          title: '🎉 Tarefas Mais Acessíveis!',
          message: `Valor mínimo de tarefas reduzido de ${oldConfig.taskLimits.minBounty} Kz para ${newConfig.taskLimits.minBounty} Kz. Agora você pode criar tarefas mais baratas!`,
          type: 'task_min_reduced',
        });
      } else {
        notifications.push({
          title: '📢 Atualização de Limites',
          message: `Valor mínimo de tarefas atualizado de ${oldConfig.taskLimits.minBounty} Kz para ${newConfig.taskLimits.minBounty} Kz.`,
          type: 'task_min_increased',
        });
      }
    }

    if (oldConfig.taskLimits.maxBounty !== newConfig.taskLimits.maxBounty) {
      const diff = newConfig.taskLimits.maxBounty - oldConfig.taskLimits.maxBounty;
      if (diff > 0) {
        notifications.push({
          title: '🚀 Tarefas Maiores Disponíveis!',
          message: `Valor máximo de tarefas aumentado de ${oldConfig.taskLimits.maxBounty.toLocaleString('pt-AO')} Kz para ${newConfig.taskLimits.maxBounty.toLocaleString('pt-AO')} Kz. Crie campanhas ainda maiores!`,
          type: 'task_max_increased',
        });
      } else {
        notifications.push({
          title: '📢 Atualização de Limites',
          message: `Valor máximo de tarefas atualizado de ${oldConfig.taskLimits.maxBounty.toLocaleString('pt-AO')} Kz para ${newConfig.taskLimits.maxBounty.toLocaleString('pt-AO')} Kz.`,
          type: 'task_max_reduced',
        });
      }
    }

    // Modo de manutenção
    if (!oldConfig.platformSettings.maintenanceMode && newConfig.platformSettings.maintenanceMode) {
      notifications.push({
        title: '🔧 Manutenção Programada',
        message: newConfig.platformSettings.maintenanceMessage || 'Sistema entrará em manutenção em breve.',
        type: 'maintenance_scheduled',
      });
    } else if (oldConfig.platformSettings.maintenanceMode && !newConfig.platformSettings.maintenanceMode) {
      notifications.push({
        title: '✅ Sistema Disponível',
        message: 'Manutenção concluída! O sistema está totalmente operacional.',
        type: 'maintenance_completed',
      });
    }

    // Enviar notificações se houver mudanças importantes
    if (notifications.length > 0) {
      await this.broadcastNotifications(notifications);
    }
  }

  private static async broadcastNotifications(
    notifications: { title: string; message: string; type: string }[]
  ): Promise<void> {
    try {
      const { NotificationService } = await import('./notificationService');
      const { BroadcastHistoryService } = await import('./broadcastHistoryService');
      
      // Buscar todos os usuários
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalRecipients = usersSnapshot.size;
      
      // Criar registro de broadcast para cada notificação
      const broadcastPromises = notifications.map(async (notification) => {
        const broadcastId = await BroadcastHistoryService.createBroadcastRecord({
          type: 'system_config',
          title: notification.title,
          message: notification.message,
          totalRecipients,
          changeType: notification.type,
        });

        return broadcastId;
      });

      const broadcastIds = await Promise.all(broadcastPromises);
      
      // Criar notificações para cada usuário
      const notificationPromises: Promise<any>[] = [];
      
      usersSnapshot.forEach((userDoc) => {
        notifications.forEach((notification, index) => {
          notificationPromises.push(
            NotificationService.createNotification({
              userId: userDoc.id,
              type: 'system_update',
              title: notification.title,
              message: notification.message,
              read: false,
              broadcastId: broadcastIds[index], // Associar com o broadcast
              metadata: {
                changeType: notification.type,
                timestamp: new Date().toISOString(),
              },
            })
          );
        });
      });

      await Promise.all(notificationPromises);
      console.log(`Broadcasted ${notifications.length} notifications to ${totalRecipients} users`);
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
      // Não falhar a atualização de config se notificações falharem
    }
  }

  static subscribeToConfig(callback: (config: SystemConfig) => void) {
    const docRef = doc(db, 'systemConfig', this.CONFIG_DOC_ID);
    
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SystemConfig);
      } else {
        // Inicializar se não existir
        this.initializeConfig().then(() => {
          callback(DEFAULT_CONFIG);
        });
      }
    }, (error) => {
      console.error('Error subscribing to config:', error);
      callback(DEFAULT_CONFIG);
    });
  }

  static async updateWithdrawalSettings(
    settings: Partial<SystemConfig['withdrawalSettings']>,
    adminId: string,
    adminName: string
  ): Promise<void> {
    const currentConfig = await this.getConfig();
    await this.updateConfig(
      {
        withdrawalSettings: {
          ...currentConfig.withdrawalSettings,
          ...settings,
        },
      },
      adminId,
      adminName
    );
  }

  static async updateDepositSettings(
    settings: Partial<SystemConfig['depositSettings']>,
    adminId: string,
    adminName: string
  ): Promise<void> {
    const currentConfig = await this.getConfig();
    await this.updateConfig(
      {
        depositSettings: {
          ...currentConfig.depositSettings,
          ...settings,
        },
      },
      adminId,
      adminName
    );
  }

  static async updatePlatformSettings(
    settings: Partial<SystemConfig['platformSettings']>,
    adminId: string,
    adminName: string
  ): Promise<void> {
    const currentConfig = await this.getConfig();
    await this.updateConfig(
      {
        platformSettings: {
          ...currentConfig.platformSettings,
          ...settings,
        },
      },
      adminId,
      adminName
    );
  }

  static async updateTaskLimits(
    limits: Partial<SystemConfig['taskLimits']>,
    adminId: string,
    adminName: string
  ): Promise<void> {
    const currentConfig = await this.getConfig();
    await this.updateConfig(
      {
        taskLimits: {
          ...currentConfig.taskLimits,
          ...limits,
        },
      },
      adminId,
      adminName
    );
  }
}
