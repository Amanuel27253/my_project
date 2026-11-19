import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, Key, Menu, ShieldCheck, X, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../api/client';
import { PasswordRequirements } from './PasswordRequirements';
import { validatePassword } from '../utils/passwordValidator';

export const AdminNavbar = ({ onToggleSidebar = () => {} }) => {
  const { user, logout, currentLanguage, changeLanguage } = useAuth();
  const { t } = useTranslation();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowPasswordModal(true);
    }
  }, [user]);

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'en' ? 'am' : 'en');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    const check = validatePassword(newPassword, user?.username);
    if (!check.isValid) {
      setStatusMsg({ type: 'error', text: check.message });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        setStatusMsg({ type: 'success', text: 'Password changed successfully!' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setStatusMsg({ type: '', text: '' });
          if (user?.mustChangePassword) {
            const updatedUser = { ...user, mustChangePassword: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
          }
        }, 1500);
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="admin-top-header">
        <div className="header-brand">
          <button
            type="button"
            className="btn btn-secondary btn-sm mobile-menu-btn"
            onClick={onToggleSidebar}
            title="Open Admin Navigation"
            aria-label="Toggle navigation"
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155' }}
          >
            <Menu size={18} />
          </button>

          <div className="admin-header-badge">
            <ShieldCheck size={20} />
          </div>

          <div className="header-title-box">
            <h1 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 800 }}>
              System Administration & IT Governance Console
            </h1>
            <span style={{ color: '#94a3b8', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>North Shewa Zone</span>
              <span>•</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>🔒 Tamper-Proof Audit Trail Active</span>
            </span>
          </div>
        </div>

        <div className="header-controls">
          <button
            onClick={toggleLanguage}
            className="btn btn-secondary btn-sm lang-toggle-btn"
            title="Switch Language / ቋንቋ ይቀይሩ"
            style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
          >
            <Globe size={15} />
            <span className="lang-text">{currentLanguage === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>

          {user && (
            <div className="header-user-section" style={{ borderLeft: '1px solid #334155' }}>
              <div className="header-user-info">
                <div className="user-name" style={{ color: '#f8fafc' }}>{user.fullName || user.username}</div>
                <div className="user-meta">
                  <span className="badge" style={{ background: '#0284c7', color: '#ffffff', fontWeight: 700 }}>
                    SYSTEM ADMIN
                  </span>
                </div>
              </div>

              <div className="header-action-buttons">
                <button
                  onClick={() => {
                    setShowPasswordModal(true);
                    setStatusMsg({ type: '', text: '' });
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Change Password"
                  aria-label="Change Password"
                  style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
                >
                  <Key size={15} />
                </button>

                <button
                  onClick={logout}
                  className="btn btn-secondary btn-sm"
                  title="Sign Out"
                  aria-label="Sign Out"
                  style={{ background: '#334155', color: '#f87171', border: '1px solid #475569' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Force or Self Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  {user?.mustChangePassword ? 'Mandatory Password Reset' : 'Change Admin Password'}
                </h3>
              </div>
              {!user?.mustChangePassword && (
                <button
                  className="modal-close-btn"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={submitting}
                  style={{ color: '#94a3b8' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {user?.mustChangePassword && (
                  <div style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', borderRadius: '6px', padding: '0.75rem', fontSize: '0.85rem', color: '#fef08a', display: 'flex', gap: '0.5rem' }}>
                    <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                    <span>For compliance and security, you must update your temporary system password before proceeding.</span>
                  </div>
                )}

                {statusMsg.text && (
                  <div
                    style={{
                      background: statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${statusMsg.type === 'success' ? '#22c55e' : '#ef4444'}`,
                      color: statusMsg.type === 'success' ? '#86efac' : '#fca5a5',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ color: '#cbd5e1' }}>Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={submitting}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ color: '#cbd5e1' }}>New Secure Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={submitting}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569' }}
                  />
                </div>

                <PasswordRequirements password={newPassword} username={user?.username} />

                <div className="form-group">
                  <label style={{ color: '#cbd5e1' }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={submitting}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #334155' }}>
                {!user?.mustChangePassword && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={submitting}
                    style={{ background: '#334155', color: '#e2e8f0', border: 'none' }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ background: '#0284c7', border: 'none' }}
                >
                  {submitting ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
