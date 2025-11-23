import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import CreateJob from "./pages/CreateJob";
import JobDetails from "./pages/JobDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
import TaskHistory from "./pages/TaskHistory";
import ManageApplications from "./pages/ManageApplications";
import Referral from "./pages/Referral";
import NotFound from "./pages/NotFound";
import MarketPage from "./pages/Market";
import MarketDetailsPage from "./pages/MarketDetails";
import MarketOrdersPage from "./pages/MarketOrders";
import DownloadPage from "./pages/Download";
import ServicesPage from "./pages/Services";
import ServiceDetailsPage from "./pages/ServiceDetails";
import ServiceOrdersPage from "./pages/ServiceOrders";
import SellerServiceOrdersPage from "./pages/SellerServiceOrders";
import AdminServiceOrdersPage from "./pages/AdminServiceOrders";
import AdminServiceDisputesPage from "./pages/AdminServiceDisputes";
import CreateServicePage from "./pages/CreateService";
import EditServicePage from "./pages/EditService";
import SupportLauncher from "@/components/SupportLauncher";
import TransactionsPage from "./pages/Transactions";
import AppLayout from "@/components/AppLayout";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import SobreNos from "./pages/SobreNos";
import LoginPage from "./pages/Login";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    const msg = typeof error === 'object' && error && error.message ? String(error.message) : String(error);
    this.setState({ message: msg });
    try { console.error('App crashed:', error); } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="p-6 rounded-lg border bg-card">
            <div className="text-lg font-semibold">Ocorreu um erro</div>
            <div className="mt-2 text-sm text-muted-foreground">Tente recarregar a página.</div>
            {this.state.message && (
              <div className="mt-2 text-xs text-muted-foreground">{this.state.message}</div>
            )}
            <button className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground" onClick={() => location.reload()}>Recarregar</button>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

function GlobalOverlay() {
  const isFetching = useIsFetching();
  if (!(isFetching > 0)) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-background/30 backdrop-blur-[2px] flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <SupportLauncher />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ErrorBoundary>
            <GlobalOverlay />
            <MaintenanceGuard>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/sobre-nos" element={<SobreNos />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:uid" element={<Profile />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create-job" element={<CreateJob />} />
                  <Route path="/job/:id" element={<JobDetails />} />
                  <Route path="/task-history" element={<TaskHistory />} />
                  <Route path="/manage-applications" element={<ManageApplications />} />
                  <Route path="/admin-setup" element={<AdminSetup />} />
                  <Route path="/referral" element={<Referral />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/market" element={<MarketPage />} />
                  <Route path="/market/:id" element={<MarketDetailsPage />} />
                  <Route path="/market/compras" element={<MarketOrdersPage />} />
                  {/* Serviços - seção independente do Mercado */}
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/services/create" element={<CreateServicePage />} />
                  <Route path="/services/:id/edit" element={<EditServicePage />} />
                  <Route path="/services/:id" element={<ServiceDetailsPage />} />
                  <Route path="/services/pedidos" element={<ServiceOrdersPage />} />
                  <Route path="/services/vendas" element={<SellerServiceOrdersPage />} />
                  <Route path="/download/:token" element={<DownloadPage />} />
                </Route>

              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/services/orders" element={<AdminServiceOrdersPage />} />
              <Route path="/admin/services/disputes" element={<AdminServiceDisputesPage />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;