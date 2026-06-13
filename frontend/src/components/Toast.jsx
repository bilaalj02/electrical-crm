import { useState, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

let toastListeners = [];

export function showToast(message, type = 'info', duration = 4000) {
  const id = Date.now() + Math.random();
  toastListeners.forEach(fn => fn({ id, message, type, duration }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== handler);
    };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: 'white',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: `1px solid ${toast.type === 'success' ? '#d4af37' : toast.type === 'error' ? '#ef4444' : '#d4af37'}`,
            borderLeft: `4px solid ${toast.type === 'success' ? '#d4af37' : toast.type === 'error' ? '#ef4444' : '#3b82f6'}`,
            minWidth: '280px',
            maxWidth: '360px',
            animation: 'toastSlideIn 0.3s ease-out',
            pointerEvents: 'all'
          }}
        >
          <span style={{ flexShrink: 0, marginTop: '1px' }}>
            {toast.type === 'success' && <FiCheckCircle size={18} color="#d4af37" />}
            {toast.type === 'error' && <FiAlertCircle size={18} color="#ef4444" />}
            {toast.type === 'info' && <FiInfo size={18} color="#3b82f6" />}
          </span>
          <span style={{ flex: 1, fontSize: '14px', color: '#1f2937', lineHeight: '1.4' }}>
            {toast.message}
          </span>
          <button
            onClick={() => dismiss(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '0',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FiX size={14} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
