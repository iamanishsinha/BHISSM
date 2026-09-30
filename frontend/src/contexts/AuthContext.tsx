import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../lib/api';

interface AuthUser {
  id: string;
  username: string;
  role: 'hospital' | 'state' | 'national';
  facility_id: string | null;
  state_id: string | null;
  full_name: string;
  facility_name?: string;
  state_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('bhissm_user');
    const token = localStorage.getItem('bhissm_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await API.post('/auth/login', { username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('bhissm_token', token);
    localStorage.setItem('bhissm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    API.post('/auth/logout').catch(() => {});
    localStorage.removeItem('bhissm_token');
    localStorage.removeItem('bhissm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
