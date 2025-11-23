import { User } from './firebase';
import { Report } from './firebase'; // Import Report type from firebase.ts

// Admin types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin';
  permissions: AdminPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPermission {
  resource: 'users' | 'withdrawals' | 'jobs' | 'transactions' | 'statistics' | 'reports' | 'referrals'; // Added 'referrals'
  actions: ('read' | 'write' | 'delete' | 'approve')[];
}

// Withdrawal request types
export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: 'pix' | 'bank' | 'crypto';
  accountInfo: {
    pixKey?: string;
    bankAccount?: {
      bank: string;
      agency: string;
      account: string;
      accountType: 'checking' | 'savings';
    };
    cryptoWallet?: {
      address: string;
      network: string;
    };
  };
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

// User verification types
export interface UserVerification {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  // Informações de identidade submetidas pelo usuário
  identityInfo?: {
    governmentIdNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string (YYYY-MM-DD)
    address?: string;
    state?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    submittedAt: Date;
  };
  documents: {
  type: 'cpf' | 'bi' | 'rg' | 'passport' | 'selfie' | 'address_proof' | 'id_front' | 'id_back'; // Adicionando tipos de documentos (BI preferido)
    url: string;
    publicId: string; // Adicionado para exclusão no Cloudinary
    uploadedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
  }[];
  // Motivos de rejeição por campo de identidade (opcional)
  identityRejectionReasons?: { [field: string]: string };
  overallStatus: 'pending' | 'approved' | 'rejected' | 'incomplete';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
}

// Device policy types
export interface DevicePolicy {
  enforceLimit: boolean;
  maxUidsPerDevice: number;
  monitorOnly?: boolean;
  alertThreshold?: number;
  updatedAt?: Date;
}

export interface DeviceLinkReportItem {
  deviceId: string;
  uids: string[];
  uidsCount: number;
  createdAt?: Date;
  lastSeenAt?: Date;
}

// Admin statistics types
export interface AdminStatistics {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    verified: number;
    unverified: number;
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  finances: {
    totalDeposits: number;
    totalWithdrawals: number;
    pendingWithdrawals: number;
    platformFees: number;
    totalBalance: number;
  };
  activities: {
    newUsersToday: number;
    newJobsToday: number;
    withdrawalsToday: number;
    transactionsToday: number;
    pendingReports: number; // Added pending reports count
  };
}

// User action types
export interface UserAction {
  id: string;
  userId: string;
  adminId: string;
  adminName: string;
  action: 'suspend' | 'ban' | 'unban' | 'verify' | 'unverify' | 'warning';
  reason: string;
  duration?: number; // em dias, para suspensões temporárias
  createdAt: Date;
  expiresAt?: Date;
}

// Enhanced user type for admin view
export interface AdminUserView extends User {
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'incomplete';
  accountStatus: 'active' | 'suspended' | 'banned';
  suspensionReason?: string;
  suspensionExpiresAt?: Date;
  lastActivity: Date;
  totalTransactions: number;
  successfulWithdrawals: number;
  pendingWithdrawals: number;
  riskScore: number; // 0-100, calculado baseado em atividades
}

export type { Report }; // Export Report type for use in admin hooks