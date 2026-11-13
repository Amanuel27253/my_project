import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  ArrowRightLeft,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDismissAlert = async (id) => {
    try {
      await api.patch(`/alerts/${id}/dismiss`);
      fetchSummary();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard data...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--danger)' }}>{error}</div>;
  }

  const metrics = summary?.metrics;

  return (
    <div>
      {/* Header Banner */}
      <div className="page-header-banner" style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {t('dashboard.welcome', 'Welcome back')}, {user?.fullName}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {t('dashboard.office', 'Office')}: <strong>{summary?.userOffice}</strong> • {t('dashboard.role', 'Role')}: <strong>{user?.role?.toUpperCase()}</strong> • Period: <strong>{summary?.currentPeriod}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/public" className="btn btn-secondary btn-sm" style={{ borderColor: '#059669', color: '#059669', fontWeight: 600 }}>
            Public Citizen Portal
          </Link>
          {(user?.role === 'admin' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'kebele_officer' || user?.role === 'KEBELE_OFFICER') && (
            <Link to="/kebele" className="btn btn-primary btn-sm">
              <Users size={15} />
              Kebele Officer
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'store_manager' || user?.role === 'STOREKEEPER') && (
            <Link to="/store" className="btn btn-primary btn-sm" style={{ background: '#9333ea' }}>
              <Send size={15} />
              Counter POS
            </Link>
          )}
        </div>
      </div>

      {/* Enterprise Governance Quick Access Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/zone" className="card" style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', textDecoration: 'none' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>1. Zone Expert</span>
          <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.95rem' }}>Zone Oversight & Quotas</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Woreda shares & price ceilings</span>
        </Link>

        <Link to="/woreda" className="card" style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #fde68a', textDecoration: 'none' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>2. Woreda Officer</span>
          <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>Debre Berhan Trade Office</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Kebele allocations & letters</span>
        </Link>

        <Link to="/kebele" className="card" style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', textDecoration: 'none' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>3. Kebele Officer</span>
          <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem' }}>Baso Kebele Census</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Anti-duplicate & booklet slips</span>
        </Link>

        <Link to="/store" className="card" style={{ padding: '1rem', background: '#faf5ff', border: '1px solid #e9d5ff', textDecoration: 'none' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>4. Cooperative Store</span>
          <div style={{ fontWeight: 700, color: '#6b21a8', fontSize: '0.95rem' }}>Counter POS & Stock</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Atomic handover & SMS alerts</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid-cards">
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('dashboard.beneficiaries', 'Beneficiaries')}</span>
            <Users size={16} color="var(--primary-light)" />
          </div>
          <div className="card-value">{metrics?.totalBeneficiaries || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.35rem' }}>
            {metrics?.verifiedBeneficiaries || 0} Verified Households
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('dashboard.pendingRequests', 'Pending Requests')}</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div className="card-value">{metrics?.pendingRequestsCount || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Awaiting administrative review
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('dashboard.inTransit', 'In-Transit Transfers')}</span>
            <ArrowRightLeft size={16} color="var(--primary-light)" />
          </div>
          <div className="card-value">{metrics?.inTransitTransfersCount || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            En route to receiving offices
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('dashboard.monthlyDistributions', 'Month Distributions')}</span>
            <CheckCircle size={16} color="var(--success)" />
          </div>
          <div className="card-value">{metrics?.monthlyDistributionsCount || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Completed this month
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('dashboard.activeAlerts', 'Active Alerts')}</span>
            <AlertTriangle size={16} color="var(--danger)" />
          </div>
          <div className="card-value" style={{ color: metrics?.activeAlertsCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
            {metrics?.activeAlertsCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Thresholds & Warnings
          </div>
        </div>
      </div>

      {/* Stock by Commodity Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
          {t('dashboard.stockLevels', 'Available Stock in Office Store')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {metrics?.totalStockByGoods && metrics.totalStockByGoods.length > 0 ? (
            metrics.totalStockByGoods.map((g, idx) => (
              <div key={idx} className="card" style={{ borderLeft: '4px solid var(--primary-light)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{g.name}</div>
                {g.nameAm && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.nameAm}</div>}
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.5rem' }}>
                  {g.quantity.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{g.unit}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active stock currently registered for this office.
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts Section */}
      {summary?.recentAlerts && summary.recentAlerts.length > 0 && (
        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={16} />
              {t('alerts.title', 'Attention Needed — Active Alerts')}
            </h4>
            <Link to="/alerts" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Office</th>
                <th>Alert Message</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentAlerts.map(a => (
                <tr key={a._id}>
                  <td>
                    <span className="badge badge-danger">{a.type?.toUpperCase()}</span>
                  </td>
                  <td>{a.locationId?.name || 'System-Wide'}</td>
                  <td>{a.message}</td>
                  <td>{new Date(a.alertDate || a.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleDismissAlert(a._id)} className="btn btn-secondary btn-sm">
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
