import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  sendPasswordResetEmail, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface UserSettings {
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  jobAlerts: boolean;
  paymentAlerts: boolean;
  marketingEmails: boolean;
  
  // Privacy
  profilePublic: boolean;
  showRating: boolean;
  showEarnings: boolean;
  allowDirectMessages: boolean;
  
  // Interface
  language: string;
  soundEffects: boolean;
  
  // Security
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;
  showOnboardingTips?: boolean;
  showTutorial?: boolean;
  
  // Social Media Accounts
  socialAccounts?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
    youtube?: string;
  };
  messageTemplates?: {
    directMessageInitial?: string;
  };
}

export const useSettings = () => {
  const { userData, currentUser, updateUserData: updateAuthUserData } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    jobAlerts: true,
    paymentAlerts: true,
    marketingEmails: false,
    profilePublic: true,
    showRating: true,
    showEarnings: false,
    allowDirectMessages: true,
    language: "pt-BR",
    soundEffects: true,
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: "30",
    showOnboardingTips: true,
    showTutorial: true,
    socialAccounts: {},
    messageTemplates: {
      directMessageInitial: 'tenho interesse nesse produto: {{title}}',
    },
  });

  useEffect(() => {
    if (userData?.settings) {
      setSettings(prev => ({ ...prev, ...userData.settings }));
    }
  }, [userData]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) throw new Error('User not authenticated');
    
    const userRef = doc(db, 'users', currentUser.uid);
    const updatedSettings = { ...settings, ...newSettings };
    
    await updateDoc(userRef, {
      settings: updatedSettings,
    });
    
    setSettings(updatedSettings);
    // Also update the user data in AuthContext to reflect changes globally
    await updateAuthUserData({ settings: updatedSettings });
  };

  const resetPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) throw new Error('User not authenticated');
    
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  const sendResetPasswordEmail = async () => {
    if (!currentUser?.email) throw new Error('User not authenticated');
    await sendPasswordResetEmail(auth, currentUser.email);
  };

  const resetToDefault = async () => {
    const defaultSettings: UserSettings = {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      jobAlerts: true,
      paymentAlerts: true,
      marketingEmails: false,
      profilePublic: true,
      showRating: true,
      showEarnings: false,
      allowDirectMessages: true,
      language: "pt-BR",
      soundEffects: true,
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: "30",
      showOnboardingTips: true,
      showTutorial: true,
      socialAccounts: {},
      messageTemplates: {
        directMessageInitial: 'tenho interesse nesse produto: {{title}}',
      },
    };
    
    await updateSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetPassword,
    sendResetPasswordEmail,
    resetToDefault,
  };
};