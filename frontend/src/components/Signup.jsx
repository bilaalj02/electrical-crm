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
    confirmPassword: ''
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
        token
      });

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
      setValidating(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <img src={mesLogo} alt="MES Logo" className="auth-logo" />
          <p>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <img src={mesLogo} alt="MES Logo" className="auth-logo" />
          <div className="error-message">
            {error || 'Invalid invitation'}
          </div>
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
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoFocus
              disabled={validating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              readOnly
              disabled
              className="readonly-input"
            />
            <small className="form-hint">This email is from your invitation</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={validating}
            />
            <small className="form-hint">Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              disabled={validating}
            />
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
