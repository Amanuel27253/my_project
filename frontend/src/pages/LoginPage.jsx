import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle, ArrowRight, Globe } from 'lucide-react';

export const LoginPage = () => {
  const { login, currentLanguage, changeLanguage } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
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
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '2rem', border: '1px solid var(--border)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={() => changeLanguage(currentLanguage === 'en' ? 'am' : 'en')}
            className="btn btn-secondary btn-sm"
            type="button"
          >
            <Globe size={14} />
            {currentLanguage === 'en' ? 'አማርኛ' : 'English'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#1e3a8a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 0.75rem', fontWeight: 700, fontSize: '1.25rem' }}>
            NS
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {t('systemTitle', 'Essential Goods Distribution System')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            {t('login.subtitle', 'North Shewa Zone Administration • Sign in to your office')}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.username', 'Username')}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. admin"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('login.password', 'Password')}</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? t('login.signingIn', 'Signing In...') : t('login.submit', 'Sign In')}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Roles Quick Login */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            {t('login.demoAccounts', 'Demo Accounts (Password: Admin@123456)')}:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button type="button" onClick={() => handleQuickLogin('admin')} className="btn btn-secondary btn-sm">
              Admin
            </button>
            <button type="button" onClick={() => handleQuickLogin('zone_officer')} className="btn btn-secondary btn-sm">
              Zone Officer
            </button>
            <button type="button" onClick={() => handleQuickLogin('woreda_officer')} className="btn btn-secondary btn-sm">
              Woreda Officer
            </button>
            <button type="button" onClick={() => handleQuickLogin('kebele_officer')} className="btn btn-secondary btn-sm">
              Kebele Officer
            </button>
            <button type="button" onClick={() => handleQuickLogin('store_manager')} className="btn btn-secondary btn-sm">
              Store Manager
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
