import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, User, MapPin } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, currentLanguage, changeLanguage } = useAuth();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    changeLanguage(currentLanguage === 'en' ? 'am' : 'en');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'zone_officer': return 'Zone Officer';
      case 'woreda_officer': return 'Woreda Officer';
      case 'kebele_officer': return 'Kebele Officer';
      case 'store_manager': return 'Store Manager';
      default: return role;
    }
  };

  return (
    <header className="top-header">
      <div className="header-brand">
        <div style={{ width: '36px', height: '36px', background: '#1e3a8a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
          NS
        </div>
        <div>
          <h1>{t('systemTitle', 'Essential Goods Distribution System')}</h1>
          <span>{t('zoneName', 'North Shewa Zone')} • {t('amharaRegion', 'Amhara Region, Ethiopia')}</span>
        </div>
      </div>

      <div className="header-controls">
        <button
          onClick={toggleLanguage}
          className="btn btn-secondary btn-sm"
          title="Switch Language / ቋንቋ ይቀይሩ"
        >
          <Globe size={16} />
          {currentLanguage === 'en' ? 'አማርኛ' : 'English'}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                <span className="badge badge-info">{getRoleLabel(user.role)}</span>
                {user.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    • <MapPin size={12} /> {user.location.name}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--danger)' }}
              title={t('nav.logout', 'Sign Out')}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
