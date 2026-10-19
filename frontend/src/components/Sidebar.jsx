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
  History
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          NAVIGATION
        </span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>{t('nav.dashboard', 'Dashboard')}</span>
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Package size={18} />
          <span>{t('nav.inventory', 'Inventory & Stock')}</span>
        </NavLink>

        <NavLink to="/requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ArrowRightLeft size={18} />
          <span>{t('nav.stockRequests', 'Requests & Transfers')}</span>
        </NavLink>

        <NavLink to="/beneficiaries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>{t('nav.beneficiaries', 'Beneficiaries')}</span>
        </NavLink>

        <NavLink to="/distribution" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Send size={18} />
          <span>{t('nav.distribution', 'Distribution & Receipts')}</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>{t('nav.reports', 'Reports & Analytics')}</span>
        </NavLink>

        <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Bell size={18} />
          <span>{t('nav.alerts', 'Alerts & Warnings')}</span>
        </NavLink>

        {user && user.role === 'admin' && (
          <>
            <div style={{ margin: '1rem 0.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              ADMINISTRATION
            </div>

            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} />
              <span>{t('nav.settings', 'Admin Console')}</span>
            </NavLink>

            <NavLink to="/audit-logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <History size={18} />
              <span>{t('nav.auditLog', 'Audit Logs')}</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};
