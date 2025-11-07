import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AdminService } from '@/services/admin';
import { AdminUser } from '@/types/admin';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  adminData: AdminUser | null;
  loading: boolean;
  checkAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAuth();

  const checkAdminStatus = async (): Promise<boolean> => {
    if (authLoading) {
      // Ainda carregando o estado de autenticação, não faça nada ainda
      return false;
    }
    
    if (!currentUser) {
      console.log('Admin Check: No current user. Not Admin.');
      setIsAdmin(false);
      setAdminData(null);
      setLoading(false);
      return false;
    }

    console.log('Admin Check: Checking status for UID:', currentUser.uid);

    try {
      const adminStatus = await AdminService.isAdmin(currentUser.uid);
      setIsAdmin(adminStatus);

      if (adminStatus) {
        console.log('Admin Check: User IS Admin. Fetching data...');
        const data = await AdminService.getAdminData(currentUser.uid);
        setAdminData(data);
      } else {
        console.log('Admin Check: User is NOT Admin.');
        setAdminData(null);
      }

      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminData(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser, authLoading]);

  const value: AdminContextType = {
    isAdmin,
    adminData,
    loading,
    checkAdminStatus,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};