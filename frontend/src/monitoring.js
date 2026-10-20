// Reports page opens and crashes to /api/monitoring so we can see what Marc
// uses and what breaks on his screen. Fire-and-forget: reporting never
// throws, and never sends anything typed into the app.
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let currentPage = '';
const sent = new Set(); // one report per distinct error per page load

const authHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : null;
};

export function trackPage(page) {
  currentPage = page;
  const headers = authHeader();
  if (!headers) return;
  axios.post(`${API_URL}/monitoring/page`, { page }, { headers }).catch(() => {});
}

export function reportError(error, kind = 'script') {
  try {
    const message = String(error?.message || error || 'Unknown error').slice(0, 500);
    const key = `${kind}|${currentPage}|${message}`;
    if (sent.has(key) || sent.size > 30) return;
    sent.add(key);
    const headers = authHeader();
    if (!headers) return;
    axios.post(
      `${API_URL}/monitoring/client-error`,
      { message, stack: String(error?.stack || '').slice(0, 2000), page: currentPage, kind },
      { headers }
    ).catch(() => {});
  } catch {
    // never let error reporting cause an error
  }
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;
  window.addEventListener('error', (e) => {
    // Ignore failed <img>/<script> loads and cross-origin "Script error." noise.
    if (!e.error && (!e.message || e.message === 'Script error.')) return;
    reportError(e.error || e.message, 'script');
  });
  window.addEventListener('unhandledrejection', (e) => {
    // Failed API calls are already recorded on the server side.
    if (e.reason?.isAxiosError) return;
    reportError(e.reason, 'promise');
  });
}
