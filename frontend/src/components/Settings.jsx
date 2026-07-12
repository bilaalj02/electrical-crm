import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiMail, FiTrash2, FiUserPlus, FiX, FiRefreshCw, FiSettings as FiSettingsIcon, FiUser, FiSave, FiPhone, FiPlayCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import NotificationModal from './NotificationModal';
import { showToast } from './Toast';
const resetOnboarding = (userId) => localStorage.removeItem(`onboarding_complete_${userId}`);
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('profile');
  const [employees, setEmployees] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Profile edit state
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', preferredContact: 'email' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        preferredContact: user.preferredContact || 'email',
      });
    }
    if (isAdmin) {
      fetchEmployees();
      fetchInvitations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitations(response.data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/invitations`,
        { email: inviteEmail, role: inviteRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Invitation sent successfully!' });
      setInviteEmail('');
      setInviteRole('employee');
      setShowInviteModal(false);
      fetchInvitations();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to send invitation'
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteInvitation = async (invitationId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Invitation',
      message: 'Are you sure you want to revoke this invitation?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/invitations/${invitationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessage({ type: 'success', text: 'Invitation revoked successfully' });
          fetchInvitations();
        } catch (error) {
          setMessage({
            type: 'error',
            text: error.response?.data?.error || 'Failed to revoke invitation'
          });
        }
      }
    });
  };

  const handleDeleteEmployee = async (employeeId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Employee',
      message: 'Are you sure you want to delete this employee? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/auth/users/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessage({ type: 'success', text: 'Employee deleted successfully' });
          fetchEmployees();
        } catch (error) {
          setMessage({
            type: 'error',
            text: error.response?.data?.error || 'Failed to delete employee'
          });
        }
      }
    });
  };

  const handleUpdateEmployeeStatus = async (employeeId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/auth/users/${employeeId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Employee status updated' });
      fetchEmployees();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update employee status'
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const result = await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        preferredContact: profileForm.preferredContact,
      });
      if (result.success) {
        showToast('Profile updated!', 'success');
      } else {
        showToast(result.error || 'Failed to update profile', 'error');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1><FiSettingsIcon /> Settings</h1>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          <FiUser /> My Profile
        </button>
        {isAdmin && (
          <>
            <button
              className={activeTab === 'employees' ? 'active' : ''}
              onClick={() => setActiveTab('employees')}
            >
              <FiUsers /> Employees ({employees.length})
            </button>
            <button
              className={activeTab === 'invitations' ? 'active' : ''}
              onClick={() => setActiveTab('invitations')}
            >
              <FiMail /> Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
            </button>
          </>
        )}
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>My Profile</h2>
            </div>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '120px' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #b8941f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>

              {/* Edit form */}
              <form onSubmit={handleSaveProfile} style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Preferred Contact Method</label>
                  <select
                    value={profileForm.preferredContact}
                    onChange={(e) => setProfileForm({ ...profileForm, preferredContact: e.target.value })}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="text">Text / SMS</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '4px' }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    style={{ background: '#f5f5f5', color: '#9ca3af', cursor: 'not-allowed' }}
                  />
                </div>
                <small style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '20px' }}>
                  Email cannot be changed. Contact admin if needed.
                </small>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary" disabled={savingProfile} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiSave /> {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetOnboarding(user?._id || user?.id);
                      window.location.reload();
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'transparent', border: '1px solid #374151',
                      borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                      color: '#9ca3af', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.color = '#d4af37'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9ca3af'; }}
                  >
                    <FiPlayCircle /> Restart Tour
                  </button>
                </div>
              </form>

              {/* Read-only info */}
              <div style={{ minWidth: '180px' }}>
                <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', fontSize: '13px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Member since</div>
                    <div style={{ color: '#374151', fontWeight: '500' }}>{user?.createdAt ? formatDate(user.createdAt) : '—'}</div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Last login</div>
                    <div style={{ color: '#374151', fontWeight: '500' }}>{user?.lastLogin ? formatDate(user.lastLogin) : '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Account status</div>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: '#d1fae5', color: '#065f46' }}>
                      {user?.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin: all employee profiles */}
            {isAdmin && employees.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  <FiUsers style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                  All Employee Profiles
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {employees.map(emp => (
                    <div key={emp._id} style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: emp._id === user._id ? 'linear-gradient(135deg, #d4af37, #b8941f)' : 'linear-gradient(135deg, #6b7280, #4b5563)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{emp.name}</div>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '1px 8px', borderRadius: '10px', background: '#dbeafe', color: '#1e40af' }}>{emp.role}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><FiMail style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />{emp.email}</div>
                        {emp.phone && <div><FiPhone style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />{emp.phone}</div>}
                        {emp.preferredContact && (
                          <div style={{ marginTop: '4px', color: '#374151' }}>
                            <strong>Preferred:</strong> {emp.preferredContact}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'employees' && isAdmin && (
          <div className="employees-section">
            <div className="section-header">
              <h2>Team Members</h2>
              <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
                <FiUserPlus /> Invite Employee
              </button>
            </div>

            <div className="employees-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee._id}>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>
                        <span className={`role-badge role-${employee.role}`}>
                          {employee.role}
                        </span>
                      </td>
                      <td>
                        <select
                          value={employee.status}
                          onChange={(e) => handleUpdateEmployeeStatus(employee._id, e.target.value)}
                          className={`status-select status-${employee.status}`}
                          disabled={employee._id === user._id}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td>{formatDate(employee.createdAt)}</td>
                      <td>
                        {employee._id !== user._id && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteEmployee(employee._id)}
                            title="Delete employee"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && isAdmin && (
          <div className="invitations-section">
            <div className="section-header">
              <h2>Pending Invitations</h2>
              <button className="btn-secondary" onClick={fetchInvitations}>
                <FiRefreshCw /> Refresh
              </button>
            </div>

            {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
              <div className="empty-state">
                <FiMail size={48} />
                <p>No pending invitations</p>
                <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
                  <FiUserPlus /> Send an Invitation
                </button>
              </div>
            ) : (
              <div className="invitations-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Sent By</th>
                      <th>Sent On</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations
                      .filter(inv => inv.status === 'pending')
                      .map(invitation => (
                        <tr key={invitation._id}>
                          <td>{invitation.email}</td>
                          <td>
                            <span className={`role-badge role-${invitation.role}`}>
                              {invitation.role}
                            </span>
                          </td>
                          <td>{invitation.invitedBy?.name || 'Unknown'}</td>
                          <td>{formatDate(invitation.createdAt)}</td>
                          <td>
                            {new Date(invitation.expiresAt) < new Date() ? (
                              <span className="expired-badge">Expired</span>
                            ) : (
                              formatDate(invitation.expiresAt)
                            )}
                          </td>
                          <td>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteInvitation(invitation._id)}
                              title="Revoke invitation"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiUserPlus /> Invite Employee</h2>
              <button className="btn-close" onClick={() => setShowInviteModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSendInvite}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="employee@example.com"
                  disabled={sending}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={sending}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="technician">Technician</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-info">
                <p>An invitation email will be sent to this address with a signup link that expires in 7 days.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NotificationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="confirm"
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
}
