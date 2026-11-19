import React from 'react';
import { NavLink, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Users,
  MapPin,
  Package,
  Layers,
  History,
  Lock,
  X,
  Activity,
  ArrowLeft
} from 'lucide-react';

export const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'users';

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const isTabActive = (tabName) => {
    return window.location.pathname === '/admin' && currentTab === tabName;
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="admin-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="admin-logo-badge">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
              ADMIN CONSOLE
            </div>
            <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
              IT & System Governance
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm mobile-close-btn"
          onClick={onClose}
          aria-label="Close navigation"
          title="Close"
          style={{ background: '#334155', color: '#fff', border: 'none' }}
        >
          <X size={16} />
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {/* Core Administrative Tools */}
        <div className="admin-section-label">
          IDENTITY & ACCESS
        </div>

        <Link
          to="/admin?tab=users"
          className={`admin-nav-link ${isTabActive('users') ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Users size={17} />
          <span>User Accounts & RBAC</span>
        </Link>

        <div className="admin-section-label">
          SYSTEM CONFIGURATION
        </div>

        <Link
          to="/admin?tab=offices"
          className={`admin-nav-link ${isTabActive('offices') ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <MapPin size={17} />
          <span>Administrative Hierarchy</span>
        </Link>

        <Link
          to="/admin?tab=goods"
          className={`admin-nav-link ${isTabActive('goods') ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Package size={17} />
          <span>Goods & Price Catalog</span>
        </Link>

        <Link
          to="/admin?tab=quotas"
          className={`admin-nav-link ${isTabActive('quotas') ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Layers size={17} />
          <span>Quota Policy Formulas</span>
        </Link>

        <div className="admin-section-label">
          SECURITY & COMPLIANCE
        </div>

        <Link
          to="/admin?tab=security"
          className={`admin-nav-link ${isTabActive('security') ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Lock size={17} />
          <span>Security & Backups</span>
        </Link>

        <NavLink
          to="/admin/audit-logs"
          className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <History size={17} />
          <span>Immutable Audit Logs</span>
        </NavLink>

        <div className="admin-section-label">
          CROSS-SYSTEM NAVIGATION
        </div>

        <Link
          to="/"
          className="admin-nav-link"
          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd' }}
        >
          <ArrowLeft size={17} />
          <span>Civil Service Workspace</span>
        </Link>
      </nav>

      {/* Admin Status Footer */}
      <div className="admin-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>SYSTEM OPERATIONAL</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
          North Shewa Zone IT Division
        </div>
      </div>
    </aside>
  );
};
