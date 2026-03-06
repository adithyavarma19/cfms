import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/auth";

interface AuthState {
  user: any;
  role: "admin" | "student" | null;
  student: any | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  student: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    student: null,
    loading: true,
  });

  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState({ user: null, role: null, student: null, loading: false });
      return;
    }
    try {
      const user = await api.getMe();
      if (user) {
        setState({ 
          user: { id: user.id, login_id: user.login_id }, 
          role: user.role, 
          student: user.role === 'student' ? user : null, 
          loading: false 
        });
      } else {
        setState({ user: null, role: null, student: null, loading: false });
      }
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, role: null, student: null, loading: false });
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const refresh = async () => {
    await loadUserData();
  };

  return (
    <AuthContext.Provider value={{ ...state, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
