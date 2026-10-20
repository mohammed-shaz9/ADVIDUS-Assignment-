import React, { createContext, useState, useEffect, useContext, useRef, useCallback, ReactNode } from 'react';
import { User, Toast, ToastType } from '../types';
import type { Socket } from 'socket.io-client';
import { authApi, ApiError } from '../services/api';
import { cache } from '../utils/cache';
import { createSocket } from '../utils/socket';
import { useVisibleInterval } from '../hooks/useVisibleInterval';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  backgroundRefreshing: boolean;
  toasts: Toast[];
  socket: Socket | null;
  theme: string;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const USER_CACHE_KEY = 'authUser';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // On first render, hydrate from cache immediately to skip the loading spinner
    const token = localStorage.getItem('token');
    if (token) {
      const cached = cache.get<Record<string, unknown>>(USER_CACHE_KEY);
      // Validate cached user has required fields before accepting
      if (cached && typeof cached._id === 'string' && typeof cached.name === 'string' && typeof cached.email === 'string') {
        return cached as unknown as User;
      }
      // Invalid cache — clear it
      cache.clear(USER_CACHE_KEY);
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => !localStorage.getItem('token'));
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${toastCounter.current++}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Background refresh: start immediately if token exists
  // Shows cached data instantly, then revalidates
  const userRef = useRef(user);
  userRef.current = user;
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setBackgroundRefreshing(true);
    authApi.getMe()
      .then((response) => {
        if (response.success && response.data) {
          setUser(response.data);
          cache.set(USER_CACHE_KEY, response.data);
        } else {
          // Token invalid — logout if no cached user is available
          if (!userRef.current) {
            localStorage.removeItem('token');
            setToken(null);
            addToast('Session expired. Please log in again.', 'error');
          }
        }
      })
      .catch(() => {
        // Network error — keep showing cached data, don't log out
      })
      .finally(() => {
        setLoading(false);
        setBackgroundRefreshing(false);
      });
  }, [token, addToast]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        const userData: User = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role as User['role'],
          status: response.data.status as User['status'],
          lastLogin: response.data.lastLogin,
          department: (response.data as any).department,
        };
        localStorage.setItem('token', response.data.token);
        cache.set(USER_CACHE_KEY, userData);
        setToken(response.data.token);
        setUser(userData);
        addToast(`Welcome back, ${response.data.name}!`, 'success');
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Network error', 'error');
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.register(name, email, password);
      if (response.success && response.data) {
        const userData: User = {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role as User['role'],
          status: response.data.status as User['status'],
          department: (response.data as any).department,
        };
        localStorage.setItem('token', response.data.token);
        cache.set(USER_CACHE_KEY, userData);
        setToken(response.data.token);
        setUser(userData);
        addToast('Registration successful!', 'success');
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Registration failed', 'error');
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    cache.clear();
    setToken(null);
    setUser(null);
    addToast('Logged out successfully.', 'info');
  }, [addToast]);

  // One shared realtime connection per session. Server only sends events that concern this user (admins get all).
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (!token) return;
    const s = createSocket(API_URL, token);
    s.on('user.status_changed', (e: { userId?: string; status?: string }) => {
      if (e?.userId === userRef.current?._id && e.status !== 'active') {
        logout();
        addToast('Your account was deactivated or removed.', 'error');
      }
    });
    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
    };
  }, [token, logout, addToast]);

  // Session guard (fallback for missed socket events): paused while the tab is hidden.
  const checkSession = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.data && res.data.status !== 'active') {
        logout();
        addToast('Account deactivated by administrator.', 'error');
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout();
        addToast('Session terminated.', 'error');
      }
      // network / 5xx: keep session
    }
  }, [logout, addToast]);
  useVisibleInterval(checkSession, 60_000, !!token);

  return (
    <AuthContext.Provider
      value={{
        user, token, loading, backgroundRefreshing, toasts, socket, theme,
        toggleTheme, login, register, logout, addToast, removeToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
