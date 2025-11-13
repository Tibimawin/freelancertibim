import { useState, useEffect } from 'react';
import { AdminService } from '@/services/admin';
import { AdminWithdrawalService } from '@/services/adminWithdrawals';
import { AdminVerificationService } from '@/services/adminVerification';
import { ReportService } from '@/services/reportService'; // Import ReportService
import { 
  AdminUserView, 
  WithdrawalRequest, 
  UserVerification, 
  AdminStatistics,
  Report // Import Report type
} from '@/types/admin';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (options?: {
    status?: 'active' | 'suspended' | 'banned';
    verified?: boolean;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      const fetchedUsers = await AdminService.getAllUsers(options);
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId: string, reason: string, duration?: number) => {
    try {
      await AdminService.suspendUser(userId, reason, duration);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error suspending user:', err);
      throw err;
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      await AdminService.banUser(userId, reason);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error banning user:', err);
      throw err;
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await AdminService.unbanUser(userId);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error unbanning user:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    suspendUser,
    banUser,
    unbanUser
  };
};

export const useAdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = async (options?: { status?: string; limit?: number }) => {
    try {
      setLoading(true);
      const fetchedWithdrawals = await AdminWithdrawalService.getWithdrawalRequests(options);
      setWithdrawals(fetchedWithdrawals);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar solicitações de saque');
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (
    requestId: string, 
    adminId: string, 
    adminName: string,
    notes?: string
  ) => {
    try {
      await AdminWithdrawalService.approveWithdrawal(requestId, adminId, adminName, notes);
      await fetchWithdrawals(); // Refresh the list
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      throw err;
    }
  };

  const rejectWithdrawal = async (
    requestId: string, 
    adminId: string, 
    adminName: string,
    reason: string,
    notes?: string
  ) => {
    try {
      await AdminWithdrawalService.rejectWithdrawal(requestId, adminId, adminName, reason, notes);
      await fetchWithdrawals(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  return {
    withdrawals,
    loading,
    error,
    fetchWithdrawals,
    approveWithdrawal,
    rejectWithdrawal
  };
};

export const useAdminVerifications = () => {
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = async (options?: { status?: string; limit?: number }) => {
    try {
      setLoading(true);
      const fetchedVerifications = await AdminVerificationService.getAllVerifications(options);
      setVerifications(fetchedVerifications);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar verificações');
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveVerification = async (
    verificationId: string,
    adminId: string,
    adminName: string,
    notes?: string
  ) => {
    try {
      await AdminVerificationService.approveVerification(verificationId, adminId, adminName, notes);
      await fetchVerifications(); // Refresh the list
    } catch (err) {
      console.error('Error approving verification:', err);
      throw err;
    }
  };

  const rejectVerification = async (
    verificationId: string,
    adminId: string,
    adminName: string,
    rejectionReasons: { [documentType: string]: string },
    notes?: string,
    identityReasons?: { [field: string]: string }
  ) => {
    try {
      await AdminVerificationService.rejectVerification(
        verificationId, 
        adminId, 
        adminName, 
        rejectionReasons, 
        notes,
        identityReasons
      );
      await fetchVerifications(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting verification:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  return {
    verifications,
    loading,
    error,
    fetchVerifications,
    approveVerification,
    rejectVerification
  };
};

export const useAdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (options?: { status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'all'; limit?: number }) => {
    try {
      setLoading(true);
      const fetchedReports = await ReportService.getReports(options);
      setReports(fetchedReports);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar denúncias');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const reviewReport = async (
    reportId: string,
    decision: 'approved' | 'rejected',
    reviewerId: string,
    reviewerName: string,
    adminNotes?: string,
    resolution?: string
  ) => {
    try {
      await ReportService.reviewReport(reportId, decision, reviewerId, reviewerName, adminNotes, resolution);
      await fetchReports(); // Refresh the list
    } catch (err) {
      console.error('Error reviewing report:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReports,
    reviewReport
  };
};

export const useAdminStatistics = () => {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const stats = await AdminService.getStatistics();
      setStatistics(stats);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};