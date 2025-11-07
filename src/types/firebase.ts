interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  currentMode: 'tester' | 'poster';
  rating: number;
  testerWallet: {
    availableBalance: number;
    pendingBalance: number;
    totalEarnings: number;
  };
  posterWallet: {
    balance: number;
    pendingBalance: number;
    totalDeposits: number;
  };
  completedTests: number;
  approvalRate: number;
  createdAt: Date;
  updatedAt: Date;
  jobsPosted?: number;
  settings?: UserSettings;
  // Campos de Referência
  referralCode?: string;
  referredBy?: string;
  // Status de Verificação
  verificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  jobAlerts: boolean;
  paymentAlerts: boolean;
  marketingEmails: boolean;
  profilePublic: boolean;
  showRating: boolean;
  showEarnings: boolean;
  allowDirectMessages: boolean;
  language: string;
  soundEffects: boolean;
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;
  socialAccounts?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
  };
}

// Job types
export interface Job {
  id: string;
  title: string;
  description: string;
  posterId: string;
  posterName: string;
  bounty: number;
  platform: 'iOS' | 'Android' | 'Web';
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  requirements: string[];
  attachments: string[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  timeEstimate: string;
  location?: string;
  applicantCount: number;
  maxApplicants?: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  // Novas propriedades para instruções detalhadas
  detailedInstructions: TaskInstruction[];
  proofRequirements: ProofRequirement[];
}

// Instruções detalhadas da tarefa
export interface TaskInstruction {
  id: string;
  step: number;
  instruction: string;
  isRequired: boolean;
}

// Requisitos de prova
export interface ProofRequirement {
  id: string;
  type: 'text' | 'screenshot' | 'file' | 'url';
  label: string;
  description: string;
  isRequired: boolean;
  placeholder?: string;
}

// Application types
export interface Application {
  id: string;
  jobId: string;
  testerId: string;
  testerName: string;
  status: 'applied' | 'accepted' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  appliedAt: Date;
  proofSubmission?: {
    proofs: ProofSubmission[];
    submittedAt: Date;
  };
  feedback?: {
    rating: number;
    comment: string;
    providedAt: Date;
  };
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

// Provas submetidas pelo freelancer
export interface ProofSubmission {
  requirementId: string;
  type: 'text' | 'screenshot' | 'file' | 'url';
  content: string; // texto, URL ou caminho do arquivo
  comment?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'escrow' | 'payout' | 'fee' | 'refund' | 'referral_reward';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  provider?: 'coinbase' | 'pix' | 'bank' | 'system';
  metadata?: {
    jobId?: string;
    applicationId?: string;
    stripePaymentId?: string;
    chargeId?: string;
    originalAmount?: number;
    originalCurrency?: string;
    exchangeRate?: number;
    maxApplicants?: number;
    bountyPerTask?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Dispute types
export interface Dispute {
  id: string;
  applicationId: string;
  posterId: string;
  testerId: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  reason: string;
  description: string;
  messages: DisputeMessage[];
  resolution?: {
    decision: 'refund_poster' | 'pay_tester' | 'partial_refund';
    amount?: number;
    reason: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  attachments?: string[];
  createdAt: Date;
}

// Solicitação de saque
export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'express' | 'iban';
  accountInfo: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    iban?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

// Notificações
export interface Notification {
  id: string;
  userId: string;
  type: 'task_approved' | 'task_rejected' | 'withdrawal_approved' | 'withdrawal_rejected' | 'new_task' | 'login_alert' | 'report_submitted' | 'report_reviewed';
  title: string;
  message: string;
  read: boolean;
  metadata?: {
    jobId?: string;
    applicationId?: string;
    withdrawalId?: string;
    reportId?: string;
  };
  createdAt: Date;
}

// Report types
export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserEmail: string;
  applicationId?: string; // Optional: if the report is related to a specific application
  jobId?: string; // Optional: if the report is related to a specific job
  reason: string; // Short reason/category
  description: string; // Detailed explanation
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
  resolution?: string; // Admin's decision/action taken
}

// Referral types
export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'completed' | 'failed';
  rewardAmount: number;
  createdAt: Date;
  completedAt?: Date;
}

export { User };