import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle, ArrowRight, Globe, ShieldCheck, Building2, ShieldAlert } from 'lucide-react';

export const LoginPage = () => {
  const { login, logout, currentLanguage, changeLanguage } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mode: 'ops' (Civil Service Operations) | 'admin' (System Administration)
  const [loginMode, setLoginMode] = useState('ops');
  const [username, setUsername] = useState('kebele_officer');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleModeSwitch = (mode) => {
    setLoginMode(mode);
    setError('');
    if (mode === 'admin') {
      setUsername('admin');
      setPassword('Admin@123456');
    } else {
      setUsername('kebele_officer');
      setPassword('Admin@123456');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      const isAdmin = user.role === 'SYSTEM_ADMIN' || user.role === 'admin';

      // 1. Gated validation for System Admin tab
      if (loginMode === 'admin') {
        if (!isAdmin) {
          // Operational officer trying to penetrate admin gate
          logout();
          setError(
            currentLanguage === 'am'
              ? '⛔ መግባት ተከልክሏል፡ ይህ መግቢያ ለስርዓት አስተዳዳሪዎች (IT Admins) ብቻ የተፈቀደ ነው። እባክዎ "የመንግስት ስራ አስፈፃሚዎች" የሚለውን ትር ይጠቀሙ።'
              : '⛔ Access Denied: This gate is strictly reserved for IT & System Administrators. Operational staff must sign in using the Civil Service Operations tab.'
          );
          setLoading(false);
          return;
        }
        // Valid admin -> Route to dedicated Admin Console
        navigate('/admin');
        return;
      }

      // 2. Civil Service Operations tab
      if (isAdmin) {
        // Administrator logged in through ops tab -> Route safely to Admin Console
        navigate('/admin');
        return;
      }

      // Route operational roles to their respective workstations
      if (user.role === 'ZONE_EXPERT' || user.role === 'zone_officer') {
        navigate('/zone');
      } else if (user.role === 'WOREDA_OFFICER' || user.role === 'woreda_officer') {
        navigate('/woreda');
      } else if (user.role === 'KEBELE_OFFICER' || user.role === 'kebele_officer') {
        navigate('/kebele');
      } else if (user.role === 'STOREKEEPER' || user.role === 'store_manager') {
        navigate('/store');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname) => {
    setUsername(uname);
    setPassword('Admin@123456');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '1.5rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 15px 35px -5px rgba(0,0,0,0.12)',
          padding: '2rem',
          border: loginMode === 'admin' ? '2px solid #0f172a' : '1px solid var(--border)',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Top Header: Region badge & Language Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span className="badge badge-info" style={{ fontWeight: 700, fontSize: '0.72rem' }}>
            ETHIOPIA • AMHARA REGION
          </span>

          <button
            onClick={() => changeLanguage(currentLanguage === 'en' ? 'am' : 'en')}
            className="btn btn-secondary btn-sm"
            type="button"
          >
            <Globe size={14} />
            {currentLanguage === 'en' ? 'አማርኛ' : 'English'}
          </button>
        </div>

        {/* Brand & System Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              background: loginMode === 'admin' ? '#0f172a' : '#1e3a8a',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto 0.65rem',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: loginMode === 'admin' ? '0 4px 12px rgba(15,23,42,0.3)' : '0 4px 12px rgba(30,58,138,0.25)',
              transition: 'all 0.25s ease'
            }}
          >
            {loginMode === 'admin' ? <ShieldCheck size={24} /> : 'NS'}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            {currentLanguage === 'am' ? 'የመሰረታዊ ሸቀጦች ስርጭትና አስተዳደር ስርዓት' : 'Essential Goods Distribution System'}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
            <strong>{currentLanguage === 'am' ? 'የሰሜን ሸዋ ዞን አስተዳደር' : 'North Shewa Zone Administration'}</strong>
          </p>
        </div>

        {/* ========================================================
            DUAL-MODE GATE SWITCHER (Approach 2: Role-Gated Portal)
            ======================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            gap: '4px',
            marginBottom: '1.25rem'
          }}
        >
          <button
            type="button"
            onClick={() => handleModeSwitch('ops')}
            style={{
              padding: '0.6rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: loginMode === 'ops' ? '#ffffff' : 'transparent',
              color: loginMode === 'ops' ? '#1e3a8a' : '#64748b',
              boxShadow: loginMode === 'ops' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Building2 size={15} />
            <span>{currentLanguage === 'am' ? 'የመንግስት ስራ አስፈፃሚዎች' : 'Civil Service'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch('admin')}
            style={{
              padding: '0.6rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: loginMode === 'admin' ? '#0f172a' : 'transparent',
              color: loginMode === 'admin' ? '#f8fafc' : '#64748b',
              boxShadow: loginMode === 'admin' ? '0 2px 6px rgba(15,23,42,0.2)' : 'none'
            }}
          >
            <ShieldCheck size={15} color={loginMode === 'admin' ? '#38bdf8' : undefined} />
            <span>{currentLanguage === 'am' ? 'የስርዓት አስተዳዳሪ (IT)' : 'System Admin'}</span>
          </button>
        </div>

        {/* Portal Context Banner */}
        {loginMode === 'ops' ? (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.78rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Building2 size={16} style={{ flexShrink: 0 }} />
            <span>
              {currentLanguage === 'am'
                ? 'የዞን፣ ወረዳ፣ ቀበሌ እና መጋዘን ሰራተኞች የስራ መግቢያ'
                : 'Operational portal for Zone, Woreda, Kebele & Storekeepers.'}
            </span>
          </div>
        ) : (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '0.75rem 0.85rem',
              marginBottom: '1.25rem',
              fontSize: '0.76rem',
              color: '#e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}
          >
            <ShieldAlert size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                {currentLanguage === 'am' ? 'የተፈቀደላቸው የIT አስተዳዳሪዎች ብቻ' : 'Authorized Personnel Only'}
              </div>
              <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                {currentLanguage === 'am'
                  ? 'የተጠቃሚዎች ምደባ፣ የኮታ ፖሊሲ እና የኦዲት መዝገብ አስተዳደር ኮንሶል'
                  : 'Tamper-proof audited gateway for user management, quota rules, and system configuration.'}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '0.9rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              {loginMode === 'admin'
                ? currentLanguage === 'am' ? 'የአስተዳዳሪ መለያ ስም (Admin Username)' : 'Admin Username'
                : t('login.username', 'Username')}
            </label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder={loginMode === 'admin' ? 'admin' : 'e.g. kebele_officer or zone_expert'}
              style={{
                borderColor: loginMode === 'admin' ? '#0f172a' : undefined
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              {t('login.password', 'Password')}
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                borderColor: loginMode === 'admin' ? '#0f172a' : undefined
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              fontWeight: 700,
              background: loginMode === 'admin' ? '#0f172a' : 'var(--primary)',
              borderColor: loginMode === 'admin' ? '#0f172a' : 'var(--primary)'
            }}
          >
            {loading ? t('login.signingIn', 'Signing In...') : loginMode === 'admin' ? 'Access System Admin Console' : t('login.submit', 'Sign In')}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
            {loginMode === 'admin' ? 'Admin Quick Demo Credentials:' : 'Civil Service Demo Roles (Password: Admin@123456):'}
          </div>

          {loginMode === 'admin' ? (
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#f8fafc' }}
            >
              <ShieldCheck size={15} color="#0284c7" />
              <span>ICT System Administrator (Root Admin)</span>
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button type="button" onClick={() => handleQuickLogin('zone_expert')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem' }}>
                1. Zone Expert
              </button>
              <button type="button" onClick={() => handleQuickLogin('woreda_officer')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem' }}>
                2. Woreda Officer
              </button>
              <button type="button" onClick={() => handleQuickLogin('kebele_officer')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem' }}>
                3. Kebele Officer
              </button>
              <button type="button" onClick={() => handleQuickLogin('storekeeper')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem' }}>
                4. Storekeeper POS
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
