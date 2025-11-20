import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface KycGuardProps {
  children: React.ReactNode;
}

const KycGuard: React.FC<KycGuardProps> = ({ children }) => {
  const { loading } = useAuth();

  return <>{children}</>;
};

export default KycGuard;