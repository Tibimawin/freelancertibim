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

export const useAdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async (opts?: { year?: number }) => {
    const year = opts?.year || new Date().getFullYear();
    try {
      setLoading(true);
      // Lazy import services to avoid circular deps
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const months = Array.from({ length: 12 }, (_, i) => i); // 0-11

      const ordersSnap = await getDocs(query(collection(db, 'service_orders'), orderBy('createdAt', 'desc')));
      const transactionsSnap = await getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')));
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));

      const sumByMonth = (items: any[], dateGetter: (x: any) => Date, valueGetter?: (x: any) => number) => {
        const arr = months.map((m) => ({ month: m, value: 0 }));
        for (const d of items) {
          const dtRaw = dateGetter(d);
          const dt = (dtRaw as any)?.toDate ? (dtRaw as any).toDate() : (dtRaw instanceof Date ? dtRaw : new Date(dtRaw));
          if (!dt || dt.getFullYear() !== year) continue;
          const idx = dt.getMonth();
          arr[idx].value += valueGetter ? Number(valueGetter(d) || 0) : 1;
        }
        return arr;
      };

      const orders = ordersSnap.docs.map((doc) => doc.data());
      const transactions = transactionsSnap.docs.map((doc) => doc.data());
      const users = usersSnap.docs.map((doc) => doc.data());

      const salesDynamics = sumByMonth(orders, (o) => o.createdAt || new Date(), () => 1).map((row, i) => ({
        name: new Date(year, i, 1).toLocaleString('pt-BR', { month: 'short' }),
        orders: row.value,
      }));

      const revenueMonthly = sumByMonth(transactions.filter(t => t.type === 'deposit' && t.status === 'completed'), (t) => t.createdAt || new Date(), (t) => t.amount).map((row, i) => ({
        name: new Date(year, i, 1).toLocaleString('pt-BR', { month: 'short' }),
        revenue: row.value,
      }));

      const userActivityMonthly = sumByMonth(transactions, (t) => t.createdAt || new Date(), () => 1).map((row, i) => ({
        name: new Date(year, i, 1).toLocaleString('pt-BR', { month: 'short' }),
        activity: row.value,
      }));

      const ordersCount = orders.length;
      const approvedCount = orders.filter((o: any) => o.status === 'delivered' || o.buyerConfirmedDelivery).length;
      const usersCount = users.length;
      const subscriptionsCount = users.filter((u: any) => u.verificationStatus === 'approved').length;

      const paidInvoices = transactions.filter((t: any) => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0);
      const fundsReceived = transactions.filter((t: any) => t.type === 'payout' && t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0);

      setData({
        kpis: {
          orders: ordersCount,
          approved: approvedCount,
          users: usersCount,
          subscriptions: subscriptionsCount,
          monthTotal: salesDynamics.reduce((s, r) => s + r.orders, 0),
          revenue: revenueMonthly.reduce((s, r) => s + r.revenue, 0),
        },
        charts: {
          salesDynamics,
          userActivityMonthly,
          revenueMonthly,
          pies: {
            users: [
              { name: 'Verificados', value: subscriptionsCount },
              { name: 'Não verificados', value: Math.max(0, usersCount - subscriptionsCount) },
            ],
            subscriptions: [
              { name: 'Pago', value: paidInvoices },
              { name: 'Payout', value: fundsReceived },
            ],
          },
        },
        finances: {
          paidInvoices,
          fundsReceived,
        },
        table: {
          customerOrders: orders.slice(0, 6).map((o: any) => ({
            profile: o.buyerName || o.buyerId,
            address: o.buyerCity || o.buyerAddress || '—',
            date: ((o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt) || new Date()).toLocaleDateString('pt-BR'),
            status: o.status || 'pending',
            price: Number(o.amount || 0),
          })),
        },
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      setError('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return { data, loading, error, refetch: fetchAnalytics };
};