import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import mesLogo from '../assets/mes-logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    preferredContact: 'email',
  });

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      const response = await axios.get(`${API_URL}/invitations/verify/${token}`);
      setInvitation(response.data);
      setFormData(prev => ({ ...prev, email: response.data.email }));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired invitation');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setValidating(true);
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        preferredContact: formData.preferredContact,
        token,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
      setValidating(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#111827',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    color: '#374151',
    fontWeight: '500',
    fontSize: '13px',
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <img src={mesLogo} alt="MES Logo" className="auth-logo" />
          <p style={{ color: '#6b7280' }}>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <img src={mesLogo} alt="MES Logo" className="auth-logo" />
          <div className="error-message">{error || 'Invalid invitation'}</div>
          <p className="auth-footer">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={mesLogo} alt="MES Logo" className="auth-logo" />
        <h1>Create Your Account</h1>
        <p className="signup-subtitle">
          You've been invited to join as {invitation.role === 'employee' ? 'an employee' : 'a team member'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Two-column layout for name + phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
                disabled={validating}
                placeholder="John Smith"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={validating}
                placeholder="(555) 000-0000"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              disabled
              style={{ ...inputStyle, background: '#f5f5f5', color: '#6b7280', cursor: 'not-allowed' }}
            />
            <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#9ca3af' }}>
              This email is from your invitation
            </small>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Preferred Contact Method</label>
            <select
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
              disabled={validating}
              style={inputStyle}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text / SMS</option>
            </select>
          </div>

          {/* Two-column for passwords */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '6px' }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={validating}
                placeholder="Min 6 characters"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                disabled={validating}
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={validating}
          >
            {validating ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/">Sign in</a>
        </p>
      </div>
    </div>
  );
}
