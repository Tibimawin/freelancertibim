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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/task-history" element={<TaskHistory />} />
            <Route path="/manage-applications" element={<ManageApplications />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/referral" element={<Referral />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;