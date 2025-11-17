import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface KycGuardProps {
  children: React.ReactNode;
}

const KycGuard: React.FC<KycGuardProps> = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Verificando seu status de KYC...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const isVerified = userData?.verificationStatus === 'approved';
  if (!isVerified) {
    return <Navigate to="/kyc" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default KycGuard;