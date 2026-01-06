import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import mesLogo from '../assets/mes-logo.png';

function Login() {
  const { login, setupAdmin } = useAuth();
  const [isSetup, setIsSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSetup) {
        result = await setupAdmin(formData.name, formData.email, formData.password);
      } else {
        result = await login(formData.email, formData.password);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={mesLogo} alt="MES Logo" className="login-logo" />
          <p className="login-subtitle">{isSetup ? 'Create Admin Account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {isSetup && (
            <div className="form-group">
              <label htmlFor="name">
                <FiUser /> Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <FiMail /> Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FiLock /> Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {isSetup && <small>Password must be at least 6 characters</small>}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSetup ? 'Create Admin Account' : 'Sign In'}
          </button>

          <button
            type="button"
            className="setup-toggle"
            onClick={() => {
              setIsSetup(!isSetup);
              setError('');
            }}
          >
            {isSetup ? '← Back to Login' : 'First time? Setup Admin Account →'}
          </button>
        </form>
      </div>

      <div className="login-footer">
        <p>© 2025 MES Electrical Services. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Login;
