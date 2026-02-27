import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiMail, FiTrash2, FiUserPlus, FiX, FiRefreshCw, FiSettings as FiSettingsIcon } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchEmployees();
      fetchInvitations();
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
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

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
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;

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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="settings-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

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
      </div>

      <div className="settings-content">
        {activeTab === 'employees' && (
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

        {activeTab === 'invitations' && (
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
    </div>
  );
}
