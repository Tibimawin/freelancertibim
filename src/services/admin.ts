import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  AdminUser, 
  AdminUserView, 
  WithdrawalRequest, 
  UserVerification, 
  AdminStatistics, 
  UserAction 
} from '@/types/admin';
import { User, Job, Transaction, Report } from '@/types/firebase'; // Import Report

export class AdminService {
  // Admin authentication
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      return adminDoc.exists();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  static async getAdminData(userId: string): Promise<AdminUser | null> {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      if (adminDoc.exists()) {
        return { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting admin data:', error);
      throw error;
    }
  }

  // Create admin user
  static async createAdmin(userId: string, adminData: {
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'moderator';
    permissions: string[];
  }): Promise<void> {
    try {
      await setDoc(doc(db, 'admins', userId), {
        ...adminData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  // Make first admin (temporary method for initial setup)
  static async makeFirstAdmin(email: string): Promise<boolean> {
    try {
      // Check if any admin exists
      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      if (adminsSnapshot.size > 0) {
        return false; // Admin already exists
      }

      // Find user by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        throw new Error('Usuário não encontrado');
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      await this.createAdmin(userDoc.id, {
        name: userData.name,
        email: userData.email,
        role: 'super_admin',
        permissions: ['all']
      });

      return true;
    } catch (error) {
      console.error('Error making first admin:', error);
      throw error;
    }
  }

  // User management
  static async getAllUsers(options?: {
    status?: 'active' | 'suspended' | 'banned';
    verified?: boolean;
    limit?: number;
    startAfter?: any;
  }): Promise<AdminUserView[]> {
    try {
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );

      if (options?.status) {
        q = query(q, where('accountStatus', '==', options.status));
      }

      if (options?.verified !== undefined) {
        q = query(q, where('verificationStatus', '==', options.verified ? 'approved' : 'pending'));
      }

      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      if (options?.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const users: AdminUserView[] = [];

      for (const docSnap of querySnapshot.docs) {
        const userData = docSnap.data();
        
        // Get additional admin data
        const [transactionsQuery, withdrawalsQuery, lastActivityQuery] = await Promise.all([
          getDocs(query(collection(db, 'transactions'), where('userId', '==', docSnap.id))),
          getDocs(query(collection(db, 'withdrawalRequests'), where('userId', '==', docSnap.id))),
          getDocs(query(collection(db, 'userActivities'), where('userId', '==', docSnap.id), orderBy('timestamp', 'desc'), limit(1)))
        ]);

        const user: AdminUserView = {
          ...userData as User,
          id: docSnap.id,
          verificationStatus: userData.verificationStatus || 'incomplete',
          accountStatus: userData.accountStatus || 'active',
          suspensionReason: userData.suspensionReason,
          suspensionExpiresAt: userData.suspensionExpiresAt?.toDate(),
          lastActivity: lastActivityQuery.docs[0]?.data()?.timestamp?.toDate() || new Date(),
          totalTransactions: transactionsQuery.docs.length,
          successfulWithdrawals: withdrawalsQuery.docs.filter(d => d.data().status === 'completed').length,
          pendingWithdrawals: withdrawalsQuery.docs.filter(d => d.data().status === 'pending').length,
          riskScore: this.calculateRiskScore(userData)
        };

        users.push(user);
      }

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  static async suspendUser(userId: string, reason: string, duration?: number, adminId?: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', userId);
      
      const updateData: any = {
        accountStatus: 'suspended',
        suspensionReason: reason,
        updatedAt: Timestamp.now()
      };

      if (duration) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);
        updateData.suspensionExpiresAt = Timestamp.fromDate(expiresAt);
      }

      batch.update(userRef, updateData);

      // Log the action
      if (adminId) {
        const actionRef = doc(collection(db, 'userActions'));
        batch.set(actionRef, {
          userId,
          adminId,
          action: 'suspend',
          reason,
          duration,
          createdAt: Timestamp.now(),
          expiresAt: duration ? Timestamp.fromDate(new Date(Date.now() + duration * 24 * 60 * 60 * 1000)) : null
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  static async banUser(userId: string, reason: string, adminId?: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', userId);
      
      batch.update(userRef, {
        accountStatus: 'banned',
        suspensionReason: reason,
        updatedAt: Timestamp.now()
      });

      // Log the action
      if (adminId) {
        const actionRef = doc(collection(db, 'userActions'));
        batch.set(actionRef, {
          userId,
          adminId,
          action: 'ban',
          reason,
          createdAt: Timestamp.now()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  static async unbanUser(userId: string, adminId?: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', userId);
      
      batch.update(userRef, {
        accountStatus: 'active',
        suspensionReason: null,
        suspensionExpiresAt: null,
        updatedAt: Timestamp.now()
      });

      // Log the action
      if (adminId) {
        const actionRef = doc(collection(db, 'userActions'));
        batch.set(actionRef, {
          userId,
          adminId,
          action: 'unban',
          reason: 'Account reactivated by admin',
          createdAt: Timestamp.now()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  // Helper method to calculate risk score
  private static calculateRiskScore(userData: any): number {
    let score = 0;
    
    // Increase score for suspicious activities
    if (!userData.verificationStatus || userData.verificationStatus === 'rejected') score += 30;
    if (userData.completedTests === 0 && userData.createdAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) score += 20;
    if (userData.approvalRate < 0.8) score += 15;
    
    return Math.min(score, 100);
  }

  // Statistics
  static async addBalance(userId: string, amount: number, reason: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data();
      const currentBalance = userData.posterWallet?.balance || 0;
      const newBalance = currentBalance + amount;

      await updateDoc(userRef, {
        'posterWallet.balance': newBalance,
        'posterWallet.totalDeposits': (userData.posterWallet?.totalDeposits || 0) + amount,
        updatedAt: new Date(),
      });

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId,
        type: 'admin_deposit',
        amount,
        description: `Depósito administrativo: ${reason}`,
        status: 'completed',
        adminReason: reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Balance added: ${amount} KZ to user ${userId}`);
    } catch (error) {
      console.error('Error adding balance:', error);
      throw error;
    }
  }

  static async getStatistics(): Promise<AdminStatistics> {
    try {
      const [usersSnapshot, jobsSnapshot, transactionsSnapshot, reportsSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'jobs')),
        getDocs(collection(db, 'transactions')),
        getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))) // Fetch only pending reports
      ]);

      const users = usersSnapshot.docs.map(doc => doc.data());
      const jobs = jobsSnapshot.docs.map(doc => doc.data());
      const transactions = transactionsSnapshot.docs.map(doc => doc.data());
      const pendingReports = reportsSnapshot.docs.map(doc => doc.data());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return {
        users: {
          total: users.length,
          active: users.filter(u => (u.accountStatus || 'active') === 'active').length,
          suspended: users.filter(u => u.accountStatus === 'suspended').length,
          banned: users.filter(u => u.accountStatus === 'banned').length,
          verified: users.filter(u => u.verificationStatus === 'approved').length,
          unverified: users.filter(u => !u.verificationStatus || u.verificationStatus !== 'approved').length
        },
        jobs: {
          total: jobs.length,
          active: jobs.filter(j => j.status === 'active').length,
          completed: jobs.filter(j => j.status === 'completed').length,
          cancelled: jobs.filter(j => j.status === 'cancelled').length
        },
        finances: {
          totalDeposits: transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
          totalWithdrawals: transactions.filter(t => t.type === 'payout' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
          pendingWithdrawals: transactions.filter(t => t.type === 'payout' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
          platformFees: transactions.filter(t => t.type === 'fee' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
          totalBalance: users.reduce((sum, u) => sum + ((u.testerWallet?.balance || 0) + (u.posterWallet?.balance || 0)), 0)
        },
        activities: {
          newUsersToday: users.filter(u => u.createdAt?.toDate() >= today).length,
          newJobsToday: jobs.filter(j => j.createdAt?.toDate() >= today).length,
          withdrawalsToday: transactions.filter(t => t.type === 'payout' && t.createdAt?.toDate() >= today).length,
          transactionsToday: transactions.filter(t => t.createdAt?.toDate() >= today).length,
          pendingReports: pendingReports.length, // Add pending reports count
        }
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}