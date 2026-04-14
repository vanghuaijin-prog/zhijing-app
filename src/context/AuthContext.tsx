import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import type { AuthResponse, Membership, User } from '../types/app';

type AuthContextValue = {
  token: string | null;
  user: User | null;
  membership: Membership | null;
  loading: boolean;
  login: (input: { account: string; password: string }) => Promise<void>;
  register: (input: {
    username: string;
    phone: string;
    email?: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
    agreementAccepted: boolean;
    verificationCode: string;
  }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setSessionFromAuthResponse: (result: AuthResponse) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const setSessionFromAuthResponse = (result: AuthResponse) => {
    setStoredToken(result.token);
    setToken(result.token);
    setUser(result.user);
    setMembership(result.membership);
  };

  const refreshSession = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await api.getSession();
      setToken(currentToken);
      setUser(result.user);
      setMembership(result.membership);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const login = async (input: { account: string; password: string }) => {
    const result = await api.login(input);
    setSessionFromAuthResponse(result);
  };

  const register = async (input: {
    username: string;
    phone: string;
    email?: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
    agreementAccepted: boolean;
    verificationCode: string;
  }) => {
    const result = await api.register(input);
    setSessionFromAuthResponse(result);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setMembership(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      membership,
      loading,
      login,
      register,
      logout,
      refreshSession,
      setSessionFromAuthResponse,
    }),
    [loading, membership, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth 必须在 AuthProvider 中使用。');
  }
  return value;
};
