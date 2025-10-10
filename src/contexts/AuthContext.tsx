import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthService } from '@/services/auth';
import { User } from '@/types/firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
  switchUserMode: (newMode: 'tester' | 'poster') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const data = await AuthService.getUserData(user.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Initialize with default values if user data doesn't exist
          setUserData({
            id: user.uid,
            name: user.displayName || 'Usuário',
            email: user.email || '',
            currentMode: 'tester',
            rating: 0,
            testerWallet: { availableBalance: 0, pendingBalance: 0, totalEarnings: 0 },
            posterWallet: { balance: 0, pendingBalance: 0, totalDeposits: 0 },
            completedTests: 0,
            approvalRate: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, name);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const updateUserData = async (data: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    
    await AuthService.updateUserData(currentUser.uid, data);
    
    // Refresh user data
    const updatedData = await AuthService.getUserData(currentUser.uid);
    setUserData(updatedData);
  };

  const switchUserMode = async (newMode: 'tester' | 'poster') => {
    if (!currentUser || !userData) throw new Error('No user logged in');
    
    const updatedData: Partial<User> = { currentMode: newMode };
    await updateUserData(updatedData);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserData,
    switchUserMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};