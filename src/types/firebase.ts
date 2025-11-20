interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  responseTime?: string; // tempo de resposta estimado do vendedor
  phone?: string;
  location?: string;
  skills?: string[];
  currentMode: 'tester' | 'poster';
  rating: number;
  ratingCount?: number;
  blockedUsers?: string[];
  accountStatus?: 'active' | 'suspended' | 'banned';
  deviceId?: string;
  testerWallet: {
    availableBalance: number;
    pendingBalance: number;
    totalEarnings: number;
  };
  posterWallet: {
    balance: number;
    pendingBalance: number;
    totalDeposits: number;
    bonusBalance?: number;
    bonusIssuedAt?: Date;
    bonusExpiresAt?: Date;
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
  // Aceite de Termos e Privacidade
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  termsVersion?: string;
  privacyAccepted?: boolean;
  privacyAcceptedAt?: Date;
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
  // Onboarding flags
  showOnboardingTips?: boolean;
  socialAccounts?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
  };
  messageTemplates?: {
    directMessageInitial?: string;
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
  // Classificação funcional por domínio
  category?: 'Mobile' | 'Web' | 'Social';
  subcategory?: string;
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
  // Classificação do MicroJob
  rating?: number;
  ratingCount?: number;
  // Estatísticas do empregador no momento da criação
  posterApprovalRate?: number;
  posterRating?: number;
  posterRatingCount?: number;
  youtube?: JobYouTubeSettings;
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
  // Avaliação feita pelo freelancer ao contratante
  contractorFeedback?: {
    rating: number;
    comment?: string;
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
  content: string; // texto ou URL
  fileUrl?: string; // URL do arquivo (Cloudinary)
  filePublicId?: string; // Public ID do arquivo (Cloudinary)
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
    // Mercado: vínculo com pedido/anúncio/vendedor
    orderId?: string;
    listingId?: string;
    sellerId?: string;
    // Rastreamento de uso de bônus
    bonusUsed?: number;
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
    // Transferência Express: apenas número de telefone autenticado no Multicaixa Express
    phoneNumber?: string;
    // Transferência IBAN
    iban?: string;
    accountHolder?: string;
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
  type: 'task_approved' | 'task_rejected' | 'task_submitted' | 'withdrawal_approved' | 'withdrawal_rejected' | 'new_task' | 'login_alert' | 'report_submitted' | 'report_reviewed' | 'message_received' | 'comment_submitted' | 'support_message' | 'market_order_delivered' | 'service_order_delivered' | 'service_order_dispute_opened' | 'service_order_dispute_resolved';
  title: string;
  message: string;
  read: boolean;
  metadata?: {
    jobId?: string;
    applicationId?: string;
    withdrawalId?: string;
    reportId?: string;
    chatUserId?: string;
    // Mercado
    orderId?: string;
    listingId?: string;
    downloadTokenId?: string;
    receiptId?: string;
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

// Mensagens de aplicação (chat entre contratante e freelancer)
export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  attachments?: string[];
  createdAt: Date;
}

// Comentários públicos de job (moderados)
export interface JobComment {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  parentId?: string;
}

// Chat direto entre usuários
export interface DirectThread {
  id: string;
  participants: string[]; // [userA, userB]
  createdAt: Date;
  lastMessageAt?: Date;
  // Realtime typing indicators per user
  typing?: { [userId: string]: boolean };
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  createdAt: Date;
  // Read receipt timestamp (set by recipient)
  readAt?: Date;
}

// Marketplace types
export interface MarketListing {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  images?: string[]; // up to 5 images for gallery
  tags: string[]; // e.g., 'Marketing Digital', 'Backlinks'
  sellerId: string;
  sellerName: string;
  price: number;
  currency: string; // e.g., 'KZ'
  category?: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  condition?: 'new' | 'used' | 'refurbished';
  sku?: string;
  stock?: number;
  warranty?: string;
  deliveryInfo?: string;
  returnPolicy?: string;
  details?: string; // additional specifications
  // Digital product support
  productType?: 'digital' | 'physical' | 'service';
  digitalCategory?: 'ebook' | 'video_course' | 'app' | 'other';
  downloadUrl?: string; // protected link to deliver after purchase
  autoDeliver?: boolean; // if true, allow immediate download after purchase
  rating?: number;
  ratingCount?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Serviços (seção separada do Mercado)
export interface ServiceListing {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  images?: string[];
   imageCaptions?: string[]; // legenda opcional para cada imagem (alinhado às imagens)
  tags?: string[];
  sellerId: string;
  sellerName: string;
  price: number;
  currency: string; // ex.: 'KZ'
  // Classificação e status
  rating?: number;
  ratingCount?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  // Metadados adicionais do serviço
  category?: string;
  subcategory?: string;
  deliveryTime?: string; // prazo de entrega
  includedItems?: string[]; // o que está incluído
  excludedItems?: string[]; // o que não está incluído
  clientRequirements?: string[]; // requisitos do cliente para iniciar
  revisionsIncluded?: number; // quantidade de revisões
  terms?: string; // termos e condições
  portfolioUrl?: string; // link para portfólio ou exemplos
  availability?: string; // disponibilidade/horários e tempo de resposta
  faqs?: { question: string; answer: string }[]; // perguntas frequentes por serviço
}

export interface MarketOrder {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
  // Avaliação pós-compra
  rating?: number; // 1..5
  review?: string;
  ratedAt?: Date;
  // Afiliados
  affiliateId?: string; // usuário que indicou/compartilhou o link
  affiliateCommissionRate?: number; // ex.: 0.05 para 5%
  affiliateCommissionAmount?: number; // valor pago ao afiliado
  affiliateCommissionStatus?: 'pending' | 'paid';
  affiliatePaidAt?: Date;
}

// Pedidos para Serviços (sem fluxo de afiliados)
export interface ServiceOrder {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
  // Avaliação pós-entrega
  rating?: number;
  review?: string;
  ratedAt?: Date;
  // Confirmação de entrega pelo comprador (para liberação por admin)
  buyerConfirmedDelivery?: boolean;
  buyerConfirmedAt?: Date;
  // Disputa
  disputeStatus?: 'open' | 'in_review' | 'resolved' | 'closed';
  disputeReason?: string;
  disputeDescription?: string;
  disputeEvidenceUrls?: string[];
  disputeOpenedBy?: string; // userId
  disputeOpenedAt?: Date;
  disputeResolution?: {
    decision: 'refund_buyer' | 'pay_seller' | 'partial_refund';
    amount?: number;
    reason: string;
    resolvedBy: string; // adminId
    resolvedAt: Date;
  };
}

// Token temporário para download seguro de produtos digitais
export interface MarketDownloadToken {
  id: string;
  listingId: string;
  buyerId: string;
  downloadUrl: string;
  expiresAt: Date; // será persistido como Firestore Timestamp
  consumed?: boolean; // se já foi usado
  createdAt: Date;
}
export interface JobYouTubeSettings {
  actionType: 'watch' | 'subscribe';
  videoTitle: string;
  videoUrl: string;
  viewTimeSeconds: number;
  dailyMaxViews: number;
  guarantee: 'none' | 'basic' | 'premium';
  extras?: {
    requireLogin?: boolean;
    avoidRepeat?: boolean;
    openInIframe?: boolean;
  };
}