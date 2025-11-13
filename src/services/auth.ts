import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorResolver
} from 'firebase/auth';
import { reload } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types/firebase';
import { NotificationService } from './notificationService'; // Import NotificationService
import { ReferralService } from './referralService'; // Import ReferralService
import { getOrCreateDeviceId, getPublicIp } from '@/lib/device';

export class AuthService {
  static async signUp(email: string, password: string, name: string, referralCode?: string) {
    try {
      // Vínculo de dispositivo (permitir múltiplas contas por dispositivo)
      const deviceId = getOrCreateDeviceId();
      const deviceRef = doc(db, 'device_links', deviceId);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // 1. Gerar código de referência único para o novo usuário
      const newReferralCode = await ReferralService.generateUniqueCode();
      
      // 2. Verificar se há um código de indicação sendo usado
      let referredBy: string | undefined;
      if (referralCode) {
        const referrerId = await ReferralService.getReferrerIdByCode(referralCode);
        if (referrerId) {
          referredBy = referrerId;
        }
      }

      // Create user document in Firestore
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      const userData: Omit<User, 'id'> = {
        name,
        email,
        currentMode: 'tester',
        rating: 0,
        ratingCount: 0,
        testerWallet: { availableBalance: 0, pendingBalance: 0, totalEarnings: 0 },
        posterWallet: { balance: 0, pendingBalance: 0, totalDeposits: 0, bonusBalance: 500, bonusIssuedAt: issuedAt, bonusExpiresAt: expiresAt },
        completedTests: 0,
        approvalRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        referralCode: newReferralCode, // Salvar o código gerado
        referredBy: referredBy, // Salvar quem indicou, se houver
        verificationStatus: 'incomplete', // Adicionando status inicial
        accountStatus: 'active',
        deviceId
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Registrar transação de bônus de boas-vindas
      try {
        const txRef = doc(collection(db, 'transactions'));
        await setDoc(txRef, {
          userId: firebaseUser.uid,
          type: 'deposit',
          amount: 500,
          currency: 'KZ',
          status: 'completed',
          description: 'Bônus de boas-vindas para novos usuários',
          provider: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn('Falha ao registrar transação de bônus:', e);
      }

      // Enviar e-mail de verificação para ativar a conta
      try {
        await sendEmailVerification(firebaseUser);
      } catch (e) {
        console.warn('Falha ao enviar e-mail de verificação:', e);
      }

      // Não sair automaticamente após cadastro: manter sessão para reconhecer o usuário imediatamente
      // A UI pode restringir funcionalidades até a verificação de e-mail

      // Vincular dispositivo ao usuário
      try {
        const snap = await getDoc(deviceRef);
        const current = snap.exists() ? (snap.data() as any) : {};
        const uids: string[] = Array.isArray(current.uids) ? current.uids : [];
        // Ler política administrativa de dispositivos
        let enforceLimit = false;
        let maxUidsPerDevice = 3;
        let monitorOnly = true;
        let alertThreshold = 5;
        try {
          const policySnap = await getDoc(doc(db, 'admin_settings', 'devicePolicy'));
          if (policySnap.exists()) {
            const pdata: any = policySnap.data();
            enforceLimit = !!pdata.enforceLimit;
            maxUidsPerDevice = typeof pdata.maxUidsPerDevice === 'number' ? pdata.maxUidsPerDevice : maxUidsPerDevice;
            monitorOnly = pdata.monitorOnly ?? monitorOnly;
            alertThreshold = typeof pdata.alertThreshold === 'number' ? pdata.alertThreshold : alertThreshold;
          }
        } catch {}

        const wouldAdd = uids.includes(firebaseUser.uid) ? uids.length : uids.length + 1;
        if (enforceLimit && wouldAdd > maxUidsPerDevice) {
          const err: any = new Error('Limite de contas por dispositivo atingido. Entre em contato com o suporte.');
          err.code = 'device_limit_exceeded';
          throw err;
        }
        if (monitorOnly && wouldAdd >= alertThreshold) {
          try {
            await setDoc(doc(collection(db, 'admin_alerts')), {
              type: 'device_link_threshold',
              deviceId,
              uidsCount: wouldAdd,
              userId: firebaseUser.uid,
              createdAt: new Date(),
            });
          } catch {}
        }

        const nextUids = uids.includes(firebaseUser.uid) ? uids : [...uids, firebaseUser.uid];
        await setDoc(
          deviceRef,
          {
            uids: nextUids,
            createdAt: current.createdAt ?? new Date(),
            lastSeenAt: new Date(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Falha ao vincular dispositivo durante cadastro', e);
      }
      
      // 3. Registrar a referência se o usuário foi indicado
      if (referredBy) {
        await ReferralService.registerReferral(referredBy, firebaseUser.uid);
      }

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

      // Se e-mail não verificado: reenviar, mas NÃO sair nem bloquear sessão
      // A UI deve limitar ações críticas até a verificação
      if (!firebaseUser.emailVerified) {
        try {
          await sendEmailVerification(firebaseUser);
        } catch (e) {
          console.warn('Falha ao reenviar e-mail de verificação:', e);
        }
        // Prosseguir com sessão limitada; não lançar erro
      }

      // Fetch user data to check settings
      const userData = await this.getUserData(firebaseUser.uid);

      // Atualizar vínculo de dispositivo (use setDoc with merge to avoid missing doc errors)
      try {
        const deviceId = getOrCreateDeviceId();
        const deviceRef = doc(db, 'device_links', deviceId);
        const snap = await getDoc(deviceRef);
        const current = snap.exists() ? (snap.data() as any) : {};
        const uids: string[] = Array.isArray(current.uids) ? current.uids : [];
        // Ler política administrativa de dispositivos
        let enforceLimit = false;
        let maxUidsPerDevice = 3;
        let monitorOnly = true;
        let alertThreshold = 5;
        try {
          const policySnap = await getDoc(doc(db, 'admin_settings', 'devicePolicy'));
          if (policySnap.exists()) {
            const pdata: any = policySnap.data();
            enforceLimit = !!pdata.enforceLimit;
            maxUidsPerDevice = typeof pdata.maxUidsPerDevice === 'number' ? pdata.maxUidsPerDevice : maxUidsPerDevice;
            monitorOnly = pdata.monitorOnly ?? monitorOnly;
            alertThreshold = typeof pdata.alertThreshold === 'number' ? pdata.alertThreshold : alertThreshold;
          }
        } catch {}

        const wouldAdd = uids.includes(firebaseUser.uid) ? uids.length : uids.length + 1;
        if (enforceLimit && wouldAdd > maxUidsPerDevice) {
          const err: any = new Error('Limite de contas por dispositivo atingido. Entre em contato com o suporte.');
          err.code = 'device_limit_exceeded';
          throw err;
        }
        if (monitorOnly && wouldAdd >= alertThreshold) {
          try {
            await setDoc(doc(collection(db, 'admin_alerts')), {
              type: 'device_link_threshold',
              deviceId,
              uidsCount: wouldAdd,
              userId: firebaseUser.uid,
              createdAt: new Date(),
            });
          } catch {}
        }

        const nextUids = uids.includes(firebaseUser.uid) ? uids : [...uids, firebaseUser.uid];
        await setDoc(
          deviceRef,
          {
            uids: nextUids,
            createdAt: current.createdAt ?? new Date(),
            lastSeenAt: new Date(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Falha ao atualizar vínculo de dispositivo', e);
      }

      // If login alerts are enabled, send a notification
      if (userData?.settings?.loginAlerts) {
        await NotificationService.createNotification({
          userId: firebaseUser.uid,
          type: 'login_alert',
          title: 'Alerta de Login',
          message: 'Sua conta foi acessada agora mesmo.',
          read: false,
          metadata: {
            // IP e dispositivo serão registrados em atividades abaixo
          },
        });
      }

      // Capture public IP and log login activity
      try {
        const ip = await getPublicIp();
        const deviceId = getOrCreateDeviceId();
        await addDoc(collection(db, 'userActivities'), {
          userId: firebaseUser.uid,
          type: 'login',
          description: 'Login efetuado',
          ip,
          deviceId,
          timestamp: Timestamp.now(),
        });
        // Persist last login IP on user document for admin display
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginIp: ip,
          lastLoginAt: Timestamp.now(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn('Falha ao registrar atividade/IP de login:', e);
      }

      return firebaseUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Helper para reenviar e-mail de verificação
  static async resendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (e) {
      console.error('Erro ao reenviar e-mail de verificação:', e);
      throw e;
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

  // --- Multi-Factor Authentication (MFA) helpers ---
  // Start MFA enrollment by sending an SMS to the provided phone number.
  // Returns verificationId and the RecaptchaVerifier instance so caller can clear it later.
  static async startMfaEnrollment(phoneNumber: string, recaptchaContainerId: string): Promise<{ verificationId: string; recaptchaVerifier: RecaptchaVerifier; }>{
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado');
    }
    // Garantir que o usuário esteja atualizado para expor multiFactor
    await reload(auth.currentUser);
    const user = auth.currentUser as FirebaseUser;
    const multiFactor = (user as any).multiFactor;
    if (!multiFactor || typeof multiFactor.getSession !== 'function') {
      throw new Error('MFA indisponível para este usuário agora. Tente sair e entrar novamente.');
    }
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
    const session = await multiFactor.getSession();
    const provider = new PhoneAuthProvider(auth);
    const verificationId = await provider.verifyPhoneNumber({ phoneNumber, session }, recaptchaVerifier);
    return { verificationId, recaptchaVerifier };
  }

  // Confirm MFA enrollment using the code received via SMS.
  static async confirmMfaEnrollment(verificationId: string, code: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado');
    }
    const cred = PhoneAuthProvider.credential(verificationId, code);
    const assertion = PhoneMultiFactorGenerator.assertion(cred);
    await (auth.currentUser as FirebaseUser).multiFactor.enroll(assertion, 'SMS');
  }

  // Disable MFA by unenrolling a given factor UID.
  static async disableMfa(factorUid: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado');
    }
    await (auth.currentUser as FirebaseUser).multiFactor.unenroll(factorUid);
  }

  static async getUserData(uid: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const raw: any = userDoc.data();
        
        // --- Lógica de Fallback para Referral Code ---
        let referralCode = raw.referralCode;
        if (!referralCode) {
          // Se o código estiver faltando, gere um novo e salve no Firestore
          referralCode = await ReferralService.generateUniqueCode();
          await updateDoc(userRef, { referralCode });
        }
        // ---------------------------------------------

        const testerWallet = raw.testerWallet ?? (raw.wallet ? { 
          availableBalance: raw.wallet.balance ?? 0, 
          pendingBalance: 0, 
          totalEarnings: raw.wallet.totalEarnings ?? 0 
        } : { availableBalance: 0, pendingBalance: 0, totalEarnings: 0 });
        const posterWallet = raw.posterWallet ?? { balance: 0, pendingBalance: 0, totalDeposits: 0, bonusBalance: 0 };
        if (posterWallet && typeof posterWallet.bonusBalance !== 'number') {
          (posterWallet as any).bonusBalance = raw.posterWallet?.bonusBalance ?? 0;
        }
        const currentMode = raw.currentMode ?? (raw.role === 'poster' ? 'poster' : 'tester');
        
        const toDate = (v: any) => (v?.toDate ? v.toDate() : (v ? new Date(v) : new Date()));

        const user: User = {
          id: uid,
          name: raw.name ?? 'Usuário',
          email: raw.email ?? '',
          currentMode,
          rating: raw.rating ?? 0,
          ratingCount: raw.ratingCount ?? 0,
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
          referralCode: referralCode, // Usar o código garantido
          referredBy: raw.referredBy,
          verificationStatus: raw.verificationStatus || 'incomplete', // GARANTIR O STATUS
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