import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, UserRole } from '@/types';
import { getApiBaseUrl } from '@/utils/apiConfig';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  directDemoLogin: (role?: UserRole) => Promise<User>;
  logout: () => void;
}

const AUTH_TOKEN_KEY = 'neuroute_auth_token';
const AUTH_USER_KEY = 'neuroute_user';

const DEFAULT_ADMIN_USER: User = {
  id: 'demo-admin-001',
  name: 'System Admin (Command HQ)',
  email: 'admin@neuroute.in',
  role: 'ADMIN',
  department: 'NER Logistics HQ',
  hubLocation: 'Guwahati Command HQ',
};
const DEFAULT_ADMIN_TOKEN = 'auto_demo_admin_token_2026';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_ADMIN_USER);
  const [token, setToken] = useState<string | null>(DEFAULT_ADMIN_TOKEN);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage or sessionStorage on initial load, or default to ADMIN
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(DEFAULT_ADMIN_TOKEN);
        setUser(DEFAULT_ADMIN_USER);
        localStorage.setItem(AUTH_TOKEN_KEY, DEFAULT_ADMIN_TOKEN);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(DEFAULT_ADMIN_USER));
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      setToken(DEFAULT_ADMIN_TOKEN);
      setUser(DEFAULT_ADMIN_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const directDemoLogin = useCallback(async (role: UserRole = 'ADMIN'): Promise<User> => {
    setIsLoading(true);
    const demoUser: User = {
      id: `demo-${role.toLowerCase()}-001`,
      name:
        role === 'ADMIN'
          ? 'System Admin (Command HQ)'
          : role === 'FIELD_OFFICER'
          ? 'Field Officer (Ground Control)'
          : role === 'DRIVER'
          ? 'Convoy Driver (Vehicle Ops)'
          : 'Logistics Planner (AI Hub)',
      email: `${role.toLowerCase()}@neuroute.in`,
      role: role,
      department: 'NER Logistics HQ',
      hubLocation: 'Guwahati Command HQ',
    };
    const demoToken = `demo_token_${Date.now()}`;

    setToken(demoToken);
    setUser(demoUser);

    localStorage.setItem(AUTH_TOKEN_KEY, demoToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(demoUser));
    setIsLoading(false);
    return demoUser;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const endpoint = `${baseUrl}/auth/login`;

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
      } catch (networkErr: unknown) {
        console.warn('Backend authentication server unreachable. Operating in Direct Demo Mode.');
        return await directDemoLogin(credentials.role || 'ADMIN');
      }

      if (!response.ok) {
        if (response.status === 404 || response.status >= 500) {
          console.warn('Backend server returned error/unavailable. Falling back to Direct Demo Mode.');
          return await directDemoLogin(credentials.role || 'ADMIN');
        }

        let errorMessage = 'Authentication failed';
        if (response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (response.status === 403) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || 'Access denied for selected role.';
          } catch {
            errorMessage = 'Access denied for selected role.';
          }
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {
            // Ignore json parse error
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const authToken = data.access_token || data.token;
      const authUser: User = data.user || {
        id: String(data.user_id),
        name: data.full_name || data.username || credentials.email,
        email: credentials.email,
        role: data.role,
      };

      setToken(authToken);
      setUser(authUser);

      if (credentials.rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, authToken);
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      }
      return authUser;
    } finally {
      setIsLoading(false);
    }
  }, [directDemoLogin]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        directDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};

