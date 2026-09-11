import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types';
import { getApiBaseUrl } from '@/utils/apiConfig';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
}

const AUTH_TOKEN_KEY = 'neuroute_auth_token';
const AUTH_USER_KEY = 'neuroute_user';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage or sessionStorage on initial load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
    } finally {
      setIsLoading(false);
    }
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
        throw new Error('Authentication server is unavailable.');
      }

      if (!response.ok) {
        let errorMessage = 'Authentication failed';
        if (response.status === 404) {
          errorMessage = `Authentication endpoint not found (${endpoint}). Please verify backend server configuration.`;
        } else if (response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (response.status === 403) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || 'Access denied for selected role.';
          } catch {
            errorMessage = 'Access denied for selected role.';
          }
        } else if (response.status >= 500) {
          errorMessage = 'Authentication server is unavailable.';
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
  }, []);

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
