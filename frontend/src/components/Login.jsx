import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import mesLogo from '../assets/mes-logo.png';

function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) setError(result.error);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: '20px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        padding: '48px 44px 40px',
        width: '100%',
        maxWidth: '460px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img
            src={mesLogo}
            alt="MES Logo"
            style={{ width: '110px', height: 'auto', display: 'block', margin: '0 auto 16px' }}
          />
          <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontWeight: '500', fontSize: '13px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: '#555', fontSize: '15px'
              }} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                style={{
                  width: '100%', padding: '12px 14px 12px 40px',
                  background: '#1a1a1a', border: '1.5px solid #2a2a2a',
                  borderRadius: '10px', fontSize: '14px', color: '#fff',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#d4af37'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontWeight: '500', fontSize: '13px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: '#555', fontSize: '15px'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                minLength="6"
                style={{
                  width: '100%', padding: '12px 42px 12px 40px',
                  background: '#1a1a1a', border: '1.5px solid #2a2a2a',
                  borderRadius: '10px', fontSize: '14px', color: '#fff',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#d4af37'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#555', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#6b5a1a' : 'linear-gradient(135deg, #d4af37, #b8960c)',
              color: '#000', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', color: '#444', fontSize: '12px' }}>
          © 2025 MES Electrical Services. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
