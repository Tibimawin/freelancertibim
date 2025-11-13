import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import SupportLauncher from "@/components/SupportLauncher";
import TransactionsPage from "./pages/Transactions";
import KYCPage from "./pages/KYC";
import AppLayout from "@/components/AppLayout";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import SobreNos from "./pages/SobreNos";

const queryClient = new QueryClient();

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
          <Routes>
            {/* Rotas com Header global */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
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
              <Route path="/kyc" element={<KYCPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/market/:id" element={<MarketDetailsPage />} />
              <Route path="/market/compras" element={<MarketOrdersPage />} />
              <Route path="/download/:token" element={<DownloadPage />} />
            </Route>

            {/* Rotas específicas (sem Header global) */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;