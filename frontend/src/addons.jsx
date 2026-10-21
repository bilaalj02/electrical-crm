// The MES plan: Essentials (always on) plus optional add-ons. An add-on that isn't switched on
// runs in Play mode (look around, nothing saves); the server enforces it, this file keeps the
// app in step and explains it.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { showToast } from './components/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AddonsCtx = createContext(null);

// When the server refuses a save because of Play mode, say why (once per few seconds).
let interceptorInstalled = false;
let lastToast = 0;
function installPlayModeInterceptor() {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  axios.interceptors.response.use(undefined, (error) => {
    const d = error?.response?.data;
    if (error?.response?.status === 402 && d?.code === 'PLAY_MODE') {
      if (Date.now() - lastToast > 3000) {
        lastToast = Date.now();
        showToast(d.error, 'info', 6000);
      }
      window.dispatchEvent(new CustomEvent('mes:play-mode', { detail: d.addon }));
    }
    return Promise.reject(error);
  });
}

export const money = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

export function AddonsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState(null);

  useEffect(() => { installPlayModeInterceptor(); }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await axios.get(`${API_URL}/addons`);
      setPlan(r.data);
    } catch {
      // Without the plan the app still works; the server keeps enforcing Play mode.
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refresh();
    else setPlan(null);
  }, [isAuthenticated, refresh]);

  const enable = useCallback(async (key) => {
    const r = await axios.post(`${API_URL}/addons/${key}/enable`, { acceptTerms: true, termsVersion: plan?.termsVersion });
    setPlan(r.data);
    return r.data;
  }, [plan?.termsVersion]);

  const disable = useCallback(async (key) => {
    const r = await axios.post(`${API_URL}/addons/${key}/disable`);
    setPlan(r.data);
    return r.data;
  }, []);

  const addonForPage = useCallback((page) => plan?.addons.find((a) => a.pages.includes(page)) || null, [plan]);
  // Real mode = switched on, or a developer account (never limited).
  const isReal = useCallback((key) => !!plan && (plan.bypass || !!plan.addons.find((a) => a.key === key)?.enabled), [plan]);

  return (
    <AddonsCtx.Provider value={{ plan, refresh, enable, disable, addonForPage, isReal }}>
      {children}
    </AddonsCtx.Provider>
  );
}

export const useAddons = () => useContext(AddonsCtx);
