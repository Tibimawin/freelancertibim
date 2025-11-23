import { useState, useEffect } from 'react';
import { SystemConfig, SystemConfigService } from '@/services/systemConfigService';

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
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
    minWithdrawal: config?.withdrawalSettings.minAmount || 500,
    maxWithdrawal: config?.withdrawalSettings.maxAmount || 1000000,
    minDeposit: config?.depositSettings.minAmount || 100,
    maxDeposit: config?.depositSettings.maxAmount || 5000000,
    withdrawalFees: {
      express: config?.withdrawalSettings.expressFeePercent || 0,
      iban: config?.withdrawalSettings.ibanFeePercent || 2.5,
    },
  };
};
