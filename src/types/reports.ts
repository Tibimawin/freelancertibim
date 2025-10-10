export interface Report {
  id: string;
  reporterId: string;
  reporterEmail: string;
  reportedUserId: string;
  reportedUserEmail: string;
  reason: string;
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
  jobId?: string;
  applicationId?: string;
  evidence?: string[]; // URLs para evidências
}

export interface ReportFormData {
  reportedUserEmail: string;
  reason: string;
  description: string;
}