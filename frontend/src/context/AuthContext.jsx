import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// ── Persistent token storage ─────────────────────────────────────────
// We persist the JWT in BOTH localStorage AND a long-lived cookie.
// localStorage is primary; the cookie is a backup so the user stays
// signed in even if a browser clears localStorage (e.g. some private
// modes, some extensions, or aggressive cache cleaners).
const TOKEN_KEY      = 'token';
const COOKIE_NAME    = 'mes_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;   // 90 days, matches backend JWT TTL

const setCookie = (name, value, maxAgeSec) => {
  try {
    const isHttps = (typeof window !== 'undefined' && window.location.protocol === 'https:');
    const secure  = isHttps ? '; Secure' : '';
    document.cookie =
      `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure}`;
  } catch (_) { /* ignore */ }
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(c => c.startsWith(name + '='));
  if (!match) return null;
  try { return decodeURIComponent(match.split('=')[1]); }
  catch { return null; }
};

const clearCookie = (name) => {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const readPersistedToken = () => {
  // Try localStorage first; if missing, fall back to cookie and restore.
  const ls = localStorage.getItem(TOKEN_KEY);
  if (ls) return ls;
  const ck = getCookie(COOKIE_NAME);
  if (ck) {
    localStorage.setItem(TOKEN_KEY, ck);
    return ck;
  }
  return null;
};

const persistToken = (newToken) => {
  localStorage.setItem(TOKEN_KEY, newToken);
  setCookie(COOKIE_NAME, newToken, COOKIE_MAX_AGE);
};

const wipeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  clearCookie(COOKIE_NAME);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(readPersistedToken());
  const [loading, setLoading] = useState(true);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth';

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { token: newToken, user: userData } = response.data;

      persistToken(newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = () => {
    wipeToken();
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const setupAdmin = async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/setup-admin`, { name, email, password });
      const { token: newToken, user: userData } = response.data;

      persistToken(newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Setup failed'
      };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await axios.patch(`${API_URL}/me`, updates);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post(`${API_URL}/change-password`, { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password change failed'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    setupAdmin,
    updateProfile,
    changePassword,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
