import { useSystemConfig } from './useSystemConfig';

export const useTaskLimits = () => {
  const { config, loading } = useSystemConfig();

  return {
    minBounty: config?.taskLimits?.minBounty || 5,
    maxBounty: config?.taskLimits?.maxBounty || 50000,
    highValueThreshold: config?.taskLimits?.highValueThreshold || 10000,
    loading,
  };
};
