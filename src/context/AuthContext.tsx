import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';

// Define types
interface User {
  _id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  adminKey: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, adminSecret: string) => Promise<void>;
  logout: () => void;
  setAdminKey: (key: string) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [adminKey, setAdminKey] = useState<string | null>(localStorage.getItem('adminKey'));
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      const { token, admin } = response.data;

      // Save to state
      setToken(token);
      setUser(admin);

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(admin));

      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string, adminSecret: string) => {
    try {
      setLoading(true);
      await authService.register(email, password, adminSecret);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Set admin key
  const handleSetAdminKey = (key: string) => {
    setAdminKey(key);
    localStorage.setItem('adminKey', key);
  };

  // Compute isAuthenticated
  const isAuthenticated = !!user && !!token;

  // Context value
  const value = {
    user,
    token,
    adminKey,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    setAdminKey: handleSetAdminKey
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 