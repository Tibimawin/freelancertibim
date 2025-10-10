import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types/firebase';
import { NotificationService } from './notificationService'; // Import NotificationService

export class AuthService {
  static async signUp(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        name,
        email,
        currentMode: 'tester',
        rating: 0,
        testerWallet: { availableBalance: 0, pendingBalance: 0, totalEarnings: 0 },
        posterWallet: { balance: 0, pendingBalance: 0, totalDeposits: 0 },
        completedTests: 0,
        approvalRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      return { user: firebaseUser, userData };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user data to check settings
      const userData = await this.getUserData(firebaseUser.uid);

      // If login alerts are enabled, send a notification
      if (userData?.settings?.loginAlerts) {
        await NotificationService.createNotification({
          userId: firebaseUser.uid,
          type: 'login_alert',
          title: 'Alerta de Login',
          message: 'Sua conta foi acessada agora mesmo.',
          read: false,
          metadata: {
            // Podemos adicionar mais metadados como IP, dispositivo, etc., se necessário
          },
        });
      }

      return firebaseUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  static async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  static async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const raw: any = userDoc.data();
        const testerWallet = raw.testerWallet ?? (raw.wallet ? { 
          availableBalance: raw.wallet.balance ?? 0, 
          pendingBalance: 0, 
          totalEarnings: raw.wallet.totalEarnings ?? 0 
        } : { availableBalance: 0, pendingBalance: 0, totalEarnings: 0 });
        const posterWallet = raw.posterWallet ?? { balance: 0, pendingBalance: 0, totalDeposits: 0 };
        const currentMode = raw.currentMode ?? (raw.role === 'poster' ? 'poster' : 'tester');
        
        const toDate = (v: any) => (v?.toDate ? v.toDate() : (v ? new Date(v) : new Date()));

        const user: User = {
          id: uid,
          name: raw.name ?? 'Usuário',
          email: raw.email ?? '',
          currentMode,
          rating: raw.rating ?? 0,
          testerWallet,
          posterWallet,
          completedTests: raw.completedTests ?? 0,
          approvalRate: raw.approvalRate ?? 0,
          createdAt: toDate(raw.createdAt),
          updatedAt: toDate(raw.updatedAt),
          avatarUrl: raw.avatarUrl,
          bio: raw.bio,
          phone: raw.phone,
          location: raw.location,
          skills: raw.skills ?? [],
          settings: raw.settings, // Ensure settings are loaded
        } as User;
        
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  static async updateUserData(uid: string, data: Partial<User>) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  static onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}