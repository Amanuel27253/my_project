import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle, ArrowRight, Globe, ShieldCheck } from 'lucide-react';

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
      const user = await login(username, password);
      // Route dynamically to role dashboard
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
      <div style={{ width: '100%', maxWidth: '460px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '2rem', border: '1px solid var(--border)' }}>
        
        {/* Language switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span className="badge badge-info" style={{ fontWeight: 700 }}>
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

        {/* Brand & Titles */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#1e3a8a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 0.75rem', fontWeight: 700, fontSize: '1.25rem' }}>
            NS
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {currentLanguage === 'am' ? 'የመሰረታዊ ሸቀጦች ስርጭትና አስተዳደር ስርዓት' : 'Essential Goods Distribution System'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
            <strong>{currentLanguage === 'am' ? 'የሰሜን ሸዋ ዞን አስተዳደር' : 'North Shewa Zone Administration'}</strong>
            <br />
            {currentLanguage === 'am' ? 'የጥናት ምሳሌ፡ ባሶ ቀበሌ፣ ደብረ ብርሃን ከተማ አስተዳደር' : 'Case Study: Baso Kebele, Debre Berhan City Administration'}
          </p>
        </div>

        {/* Zero-Login Public Citizen Portal Callout */}
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#065f46', marginBottom: '0.4rem', fontWeight: 600 }}>
            {currentLanguage === 'am' ? 'ዜጎች መግባት ሳያስፈልጋቸው ክምችትና ዋጋ ማረጋገጥ ይችላሉ፡' : 'Citizens can check live stock & prices without logging in:'}
          </div>
          <Link
            to="/public"
            className="btn btn-sm"
            style={{
              background: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <Globe size={15} />
            <span>{currentLanguage === 'am' ? 'ህዝባዊ ግልፅነት ፖርታል (Zero-Login Public Portal)' : 'Public Transparency Portal (Zero Login)'}</span>
          </Link>
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
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. admin or zone_expert"
            />
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
            style={{ width: '100%', marginTop: '0.5rem', fontWeight: 700 }}
          >
            {loading ? t('login.signingIn', 'Signing In...') : t('login.submit', 'Sign In')}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Enterprise Roles Quick Login */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Enterprise Staff Demo Accounts (Password: Admin@123456):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            <button type="button" onClick={() => handleQuickLogin('admin')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              1. ICT Admin
            </button>
            <button type="button" onClick={() => handleQuickLogin('zone_expert')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              2. Zone Expert
            </button>
            <button type="button" onClick={() => handleQuickLogin('woreda_officer')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              3. Woreda Officer
            </button>
            <button type="button" onClick={() => handleQuickLogin('kebele_officer')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              4. Kebele Officer
            </button>
            <button type="button" onClick={() => handleQuickLogin('storekeeper')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', gridColumn: 'span 2' }}>
              5. Cooperative Storekeeper (Baso Store)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
