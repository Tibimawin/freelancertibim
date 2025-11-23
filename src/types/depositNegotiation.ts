export interface DepositNegotiation {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: 'pending' | 'negotiating' | 'awaiting_payment' | 'awaiting_proof' | 'approved' | 'rejected' | 'cancelled';
  requestedAmount: number;
  agreedAmount?: number;
  agreedMethod?: 'express' | 'iban' | 'custom';
  agreedFee?: number;
  agreedDetails?: string;
  proofUrl?: string;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  adminId?: string;
  adminName?: string;
  rejectionReason?: string;
  metadata?: {
    chatId: string;
    negotiationNotes: string[];
  };
}

export interface NegotiationTimeline {
  timestamp: any;
  action: string;
  by: 'user' | 'admin';
  details?: string;
}
