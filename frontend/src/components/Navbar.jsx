import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, Key, MapPin, X, CheckCircle, AlertTriangle, Menu } from 'lucide-react';
import api from '../api/client';
import { PasswordRequirements } from './PasswordRequirements';
import { validatePassword } from '../utils/passwordValidator';

export const Navbar = ({ onToggleSidebar = () => {} }) => {
  const { user, logout, currentLanguage, changeLanguage } = useAuth();
  const { t } = useTranslation();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'en' ? 'am' : 'en');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'zone_officer': return 'Zone Officer';
      case 'woreda_officer': return 'Woreda Officer';
      case 'kebele_officer': return 'Kebele Officer';
      case 'store_manager': return 'Store Manager';
      default: return role;
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    // Client-side rule check for immediate feedback
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
      <header className="top-header">
        <div className="header-brand">
          <button
            type="button"
            className="btn btn-secondary btn-sm mobile-menu-btn"
            onClick={onToggleSidebar}
            title="Open Navigation"
            aria-label="Toggle navigation"
          >
            <Menu size={18} />
          </button>

          <div className="header-logo-badge">
            NS
          </div>
          <div className="header-title-box">
            <h1>{t('systemTitle', 'Essential Goods Distribution System')}</h1>
            <span className="header-subtitle">
              {t('zoneName', 'North Shewa Zone')} • {t('amharaRegion', 'Amhara Region')}
            </span>
          </div>
        </div>

        <div className="header-controls">
          <button
            onClick={toggleLanguage}
            className="btn btn-secondary btn-sm lang-toggle-btn"
            title="Switch Language / ቋንቋ ይቀይሩ"
          >
            <Globe size={15} />
            <span className="lang-text">{currentLanguage === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>

          {user && (
            <div className="header-user-section">
              <div className="header-user-info">
                <div className="user-name">{user.fullName}</div>
                <div className="user-meta">
                  <span className="badge badge-info">{getRoleLabel(user.role)}</span>
                  {user.location && (
                    <span className="user-location-text">
                      • <MapPin size={11} /> {user.location.name}
                    </span>
                  )}
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
                >
                  <Key size={15} />
                </button>

                <button
                  onClick={logout}
                  className="btn btn-secondary btn-sm btn-logout"
                  title={t('nav.logout', 'Sign Out')}
                  aria-label="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Change Your Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            {statusMsg.text && (
              <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {statusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong new password"
                  required
                />
              </div>

              <PasswordRequirements password={newPassword} username={user?.username} />

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
