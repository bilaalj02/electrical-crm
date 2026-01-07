import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

/**
 * Reusable Notification Modal Component
 * Replaces JavaScript alert(), confirm(), and prompt() with a proper React modal
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {string} type - 'success', 'error', 'warning', 'info', 'confirm'
 * @param {string} title - Modal title
 * @param {string} message - Modal message content
 * @param {function} onConfirm - Callback for confirm dialogs (optional)
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 */
function NotificationModal({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel'
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle size={48} style={{ color: '#d4af37' }} />;
      case 'error':
        return <FiAlertCircle size={48} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <FiAlertCircle size={48} style={{ color: '#f59e0b' }} />;
      case 'confirm':
        return <FiAlertCircle size={48} style={{ color: '#d4af37' }} />;
      default:
        return <FiInfo size={48} style={{ color: '#d4af37' }} />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success':
        return '#d4af37';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#d4af37';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={type === 'confirm' ? undefined : onClose}
      style={{
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '450px',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
      >
        <div
          className="modal-header"
          style={{
            background: `linear-gradient(135deg, ${getHeaderColor()}15 0%, ${getHeaderColor()}25 100%)`,
            borderBottom: `2px solid ${getHeaderColor()}`,
            padding: '20px 24px'
          }}
        >
          <h2 style={{
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'confirm' ? 'Confirm' : 'Information')}
          </h2>
          {type !== 'confirm' && (
            <button
              className="icon-btn"
              onClick={onClose}
              style={{
                fontSize: '24px',
                color: '#6b7280',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <FiX />
            </button>
          )}
        </div>

        <div
          className="modal-body"
          style={{
            padding: '32px 24px',
            textAlign: 'center'
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            {getIcon()}
          </div>
          <p style={{
            fontSize: '15px',
            color: '#1f2937',
            lineHeight: '1.6',
            margin: 0,
            whiteSpace: 'pre-line',
            fontWeight: '500'
          }}>
            {message}
          </p>
        </div>

        <div
          className="modal-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '12px',
            justifyContent: type === 'confirm' ? 'space-between' : 'flex-end'
          }}
        >
          {type === 'confirm' ? (
            <>
              <button
                onClick={handleCancel}
                style={{
                  padding: '10px 24px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#4b5563',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#d4af37';
                  e.currentTarget.style.background = '#fef9e7';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '10px 24px',
                  background: '#d4af37',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#c5a028';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#d4af37';
                }}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: '10px 32px',
                background: '#d4af37',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#c5a028';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#d4af37';
              }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;
