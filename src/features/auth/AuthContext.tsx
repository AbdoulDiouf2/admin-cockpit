import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/api';
import type { User, AuthState, LoginCredentials } from '@/types';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    isAuthenticated: false,
    isLoading: true,
  });

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await authApi.me();
        const user = response.data;
        const isSuperAdmin = user.userRoles?.some(
          (ur: any) => ur.role?.name === 'superadmin'
        );
        if (!isSuperAdmin) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
          return;
        }
        setState({ user, accessToken: token, isAuthenticated: true, isLoading: false });
      } catch {
        // Token invalid - clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    const { accessToken, refreshToken } = response.data;

    // Stocker provisoirement pour permettre l'appel authApi.me()
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Récupérer le profil complet avec les rôles
    let user: User;
    try {
      const meResponse = await authApi.me();
      user = meResponse.data;
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('AUTH_FAILED');
    }

    const isSuperAdmin = user.userRoles?.some(
      (ur: any) => ur.role?.name === 'superadmin'
    );
    if (!isSuperAdmin) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('FORBIDDEN_NOT_SUPERADMIN');
    }

    setState({ user, accessToken, isAuthenticated: true, isLoading: false });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string }) => {
    const response = await authApi.updateMe(data);
    setState(prev => ({
      ...prev,
      user: response.data,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
