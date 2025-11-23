import { useSystemConfig } from './useSystemConfig';

export const useTaskLimits = () => {
  const { config, loading } = useSystemConfig();

  // Debug log para verificar se config está correto
  console.log('[useTaskLimits] Config:', config, 'Loading:', loading);

  return {
    minBounty: config.taskLimits.minBounty,
    maxBounty: config.taskLimits.maxBounty,
    highValueThreshold: config.taskLimits.highValueThreshold,
    loading,
  };
};
