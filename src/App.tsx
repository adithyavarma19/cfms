import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import StudentDashboard from "./pages/student/StudentDashboard";
import FeedbackForm from "./pages/student/FeedbackForm";
import StudentProfile from "./pages/student/StudentProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateForms from "./pages/admin/CreateForms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/feedback/:formId" element={<ProtectedRoute requiredRole="student"><FeedbackForm /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/forms/create" element={<ProtectedRoute requiredRole="admin"><CreateForms /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
