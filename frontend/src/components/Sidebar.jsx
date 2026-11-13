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
  X,
  TrendingUp,
  Building2,
  UserCheck,
  Store,
  Globe,
  Printer
} from 'lucide-react';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              background: 'var(--primary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}
          >
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
        {/* General Dashboard */}
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <LayoutDashboard size={18} />
          <span>{t('nav.dashboard', 'Overview Dashboard')}</span>
        </NavLink>

        {/* ========================================================
            ROLE-SPECIFIC ENTERPRISE MODULES (Section 4 Architecture)
            ======================================================== */}
        <div style={{ margin: '0.9rem 0.5rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          GOVERNANCE MODULES
        </div>

        {/* 1. Zone Expert Module */}
        {(hasRole('ZONE_EXPERT', 'zone_officer') || hasRole('SYSTEM_ADMIN', 'admin')) && (
          <NavLink to="/zone" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <TrendingUp size={18} color="#2563eb" />
            <span>{t('nav.zoneExpert', 'Zone Trade Expert')}</span>
          </NavLink>
        )}

        {/* 2. Woreda Officer Module */}
        {(hasRole('WOREDA_OFFICER', 'woreda_officer') || hasRole('ZONE_EXPERT', 'zone_officer') || hasRole('SYSTEM_ADMIN', 'admin')) && (
          <NavLink to="/woreda" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <Building2 size={18} color="#d97706" />
            <span>{t('nav.woredaOfficer', 'Woreda Trade Officer')}</span>
          </NavLink>
        )}

        {/* 3. Kebele Officer Module */}
        {(hasRole('KEBELE_OFFICER', 'kebele_officer') || hasRole('SYSTEM_ADMIN', 'admin')) && (
          <NavLink to="/kebele" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <UserCheck size={18} color="#16a34a" />
            <span>{t('nav.kebeleOfficer', 'Kebele Record Officer')}</span>
          </NavLink>
        )}

        {/* 4. Storekeeper POS Module */}
        {(hasRole('STOREKEEPER', 'store_manager') || hasRole('SYSTEM_ADMIN', 'admin')) && (
          <NavLink to="/store" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <Store size={18} color="#9333ea" />
            <span>{t('nav.storekeeper', 'Cooperative Store POS')}</span>
          </NavLink>
        )}

        {/* Core Operational Links */}
        <div style={{ margin: '0.9rem 0.5rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          OPERATIONS
        </div>

        <NavLink to="/beneficiaries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Users size={18} />
          <span>{t('nav.beneficiaries', 'Beneficiaries & Censuses')}</span>
        </NavLink>

        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Package size={18} />
          <span>{t('nav.inventory', 'Inventory & Stock')}</span>
        </NavLink>

        <NavLink to="/distribution" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Send size={18} />
          <span>{t('nav.distribution', 'Distribution & Receipts')}</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <FileText size={18} />
          <span>{t('nav.reports', 'Reports & Reconciliation')}</span>
        </NavLink>

        <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Bell size={18} />
          <span>{t('nav.alerts', 'Alerts & Warnings')}</span>
        </NavLink>

        {/* Zero-Login Public Transparency Portal Link */}
        <div style={{ margin: '0.9rem 0.5rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          CITIZEN TRANSPARENCY
        </div>

        <NavLink to="/public" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
          <Globe size={18} color="#059669" />
          <span style={{ fontWeight: 600 }}>Public Citizen Portal (Zero Login)</span>
        </NavLink>

        {/* Admin Section */}
        {hasRole('SYSTEM_ADMIN', 'admin') && (
          <>
            <div style={{ margin: '0.9rem 0.5rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
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
