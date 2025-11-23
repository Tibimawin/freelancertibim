import { useState, useEffect } from 'react';
import { SystemConfig, SystemConfigService } from '@/services/systemConfigService';

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

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = SystemConfigService.subscribeToConfig((newConfig) => {
      setConfig(newConfig);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    config,
    loading,
    minWithdrawal: config.withdrawalSettings.minAmount,
    maxWithdrawal: config.withdrawalSettings.maxAmount,
    minDeposit: config.depositSettings.minAmount,
    maxDeposit: config.depositSettings.maxAmount,
    withdrawalFees: {
      express: config.withdrawalSettings.expressFeePercent,
      iban: config.withdrawalSettings.ibanFeePercent,
    },
  };
};
