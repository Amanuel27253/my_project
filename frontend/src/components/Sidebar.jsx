import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Users,
  Send,
  FileText,
  Bell,
  ShieldCheck,
  History,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleLinkClick = () => {
    // Automatically close mobile drawer when navigating
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
            NS
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            NAVIGATION
          </span>
        </div>

        <button
          className="btn btn-secondary btn-sm mobile-close-btn"
          onClick={onClose}
          aria-label="Close navigation"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <LayoutDashboard size={18} />
          <span>{t('nav.dashboard', 'Dashboard')}</span>
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Package size={18} />
          <span>{t('nav.inventory', 'Inventory & Stock')}</span>
        </NavLink>

        <NavLink to="/requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <ArrowRightLeft size={18} />
          <span>{t('nav.stockRequests', 'Requests & Transfers')}</span>
        </NavLink>

        <NavLink to="/beneficiaries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Users size={18} />
          <span>{t('nav.beneficiaries', 'Beneficiaries')}</span>
        </NavLink>

        <NavLink to="/distribution" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Send size={18} />
          <span>{t('nav.distribution', 'Distribution & Receipts')}</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <FileText size={18} />
          <span>{t('nav.reports', 'Reports & Analytics')}</span>
        </NavLink>

        <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Bell size={18} />
          <span>{t('nav.alerts', 'Alerts & Warnings')}</span>
        </NavLink>

        {user && user.role === 'admin' && (
          <>
            <div style={{ margin: '1rem 0.5rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              ADMINISTRATION
            </div>

            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
              <ShieldCheck size={18} />
              <span>{t('nav.settings', 'Admin Console')}</span>
            </NavLink>

            <NavLink to="/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
              <History size={18} />
              <span>{t('nav.auditLog', 'Audit Logs')}</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};
