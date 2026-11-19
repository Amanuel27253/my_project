import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const AdminProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#0f172a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Verifying Administrative Privileges...</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Checking Role-Based Access Control token</div>
        </div>
      </div>
    );
  }

  // Not logged in at all -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'SYSTEM_ADMIN';

  // Logged in, but NOT an admin -> Render strict 403 Access Denied Gate
  if (!isAdmin) {
    const getReturnPath = () => {
      switch (user.role) {
        case 'ZONE_EXPERT':
        case 'zone_officer':
          return '/zone';
        case 'WOREDA_OFFICER':
        case 'woreda_officer':
          return '/woreda';
        case 'KEBELE_OFFICER':
        case 'kebele_officer':
          return '/kebele';
        case 'STOREKEEPER':
        case 'store_manager':
          return '/store';
        default:
          return '/';
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1120',
        padding: '1.5rem',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '560px',
          background: '#0f172a',
          borderRadius: '14px',
          border: '1px solid #dc2626',
          boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25)',
          padding: '2.5rem',
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(220, 38, 38, 0.15)',
            border: '2px solid #ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#ef4444'
          }}>
            <ShieldAlert size={36} />
          </div>

          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
            textTransform: 'uppercase'
          }}>
            403 Forbidden • Access Denied
          </span>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            System Administration Gate
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            This console is strictly restricted to <strong>IT & System Administrators</strong>.
            In compliance with <strong>Separation of Duties (SoD)</strong> and security governance, civil service officers are not permitted to access user management, audit logs, or system configuration.
          </p>

          <div style={{
            background: '#1e293b',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.75rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Authenticated User:</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{user.fullName || user.username}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Assigned Role:</span>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{user.role}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Required Permission:</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>SYSTEM_ADMIN / admin</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(getReturnPath())}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              Return to My Operational Station
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{
                background: '#334155',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              Sign In as Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
