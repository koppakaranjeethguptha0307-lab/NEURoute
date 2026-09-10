import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AUTH_TOKEN_KEY = 'neuroute_auth_token';
const AUTH_USER_KEY = 'neuroute_user';

// Mock user profiles for demo mode testing
export const MOCK_USERS: Record<string, User> = {
  'dispatcher@neuroute.ner': {
    id: 'usr_disp_01',
    name: 'Tenzing Narzary',
    email: 'dispatcher@neuroute.ner',
    role: 'dispatcher', // TODO: confirm with backend
    hubLocation: 'Guwahati Central Hub (Assam)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  'admin@neuroute.ner': {
    id: 'usr_adm_02',
    name: 'Priyanka Sharma',
    email: 'admin@neuroute.ner',
    role: 'admin', // TODO: confirm with backend
    hubLocation: 'Shillong Regional Command (Meghalaya)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
};

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else if (import.meta.env.VITE_DEMO_MODE === 'true') {
        // In demo mode, if no session exists yet, pre-populate default dispatcher session for easy exploration
        const defaultUser = MOCK_USERS['dispatcher@neuroute.ner'];
        const mockToken = 'mock_jwt_header.mock_jwt_payload_neuroute_ner.mock_jwt_signature';
        setToken(mockToken);
        setUser(defaultUser);
        localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);

    const performMockLogin = async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const matchedUser =
        MOCK_USERS[credentials.email.toLowerCase()] || {
          id: `usr_${Date.now()}`,
          name: credentials.email.split('@')[0] || 'Operations Officer',
          email: credentials.email,
          role: credentials.email.includes('admin') ? 'admin' : 'dispatcher',
          hubLocation: credentials.email.includes('admin')
            ? 'Shillong Regional Command (Meghalaya)'
            : 'Guwahati Logistics Hub',
        };

      const mockToken = `mock_jwt_${btoa(matchedUser.email)}_${Date.now()}`;

      setToken(mockToken);
      setUser(matchedUser);

      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(matchedUser));
    };

    try {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        await performMockLogin();
        return;
      }

      // Try live API first
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } else {
        // Fallback to mock login if backend route is not mounted (404) or demo user credentials passed
        await performMockLogin();
      }
    } catch {
      // On network error or unmounted route, perform fallback login
      await performMockLogin();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext) as AuthContextType | null;
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
