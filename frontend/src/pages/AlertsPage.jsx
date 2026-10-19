import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  Bell,
  AlertTriangle,
  RefreshCw,
  Check,
  CheckCircle,
  Clock,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const AlertsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [alerts, setAlerts] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [showDismissed, setShowDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType) params.type = filterType;
      params.isDismissed = showDismissed;

      const res = await api.get('/alerts', { params });
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch {
      setMessage('Failed to load system alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterType, showDismissed]);

  const handleDismiss = async (id) => {
    try {
      await api.patch(`/alerts/${id}/dismiss`);
      fetchAlerts();
    } catch {
      alert('Failed to dismiss alert');
    }
  };

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await api.post('/alerts/scan');
      if (res.data.success) {
        setMessage(`Scan completed. ${res.data.data.newAlertsGenerated} new rule alert(s) generated.`);
        fetchAlerts();
      }
    } catch {
      setMessage('Failed to run system alert scan');
    } finally {
      setScanning(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock': return <Layers size={18} color="var(--danger)" />;
      case 'expiring': return <Clock size={18} color="var(--warning)" />;
      case 'transfer_overdue': return <AlertTriangle size={18} color="var(--danger)" />;
      case 'discrepancy': return <ShieldAlert size={18} color="var(--danger)" />;
      case 'quota_blocked': return <ShieldAlert size={18} color="var(--warning)" />;
      default: return <Bell size={18} color="var(--primary)" />;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.alerts', 'Rule-Based System Alerts & Risk Warnings')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Automated monitoring for expiry, stock depletion, transfer overdue, and quota breaches
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'zone_officer') && (
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="btn btn-primary"
          >
            <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Running System Scan...' : 'Trigger Rule Scan Now'}
          </button>
        )}
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Alert Categories</option>
          <option value="low_stock">Low Stock Threshold</option>
          <option value="expiring">Expiring Batches (30 Days)</option>
          <option value="transfer_overdue">Overdue Transfers (&gt;3 Days)</option>
          <option value="discrepancy">Transfer Discrepancies</option>
          <option value="quota_blocked">Quota Over-Limit Blocked</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
          />
          Show Dismissed Alerts
        </label>
      </div>

      {/* Alerts Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Category</th>
              <th>Office</th>
              <th>Description / Details</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading alerts...</td></tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  No active warnings! All stocks, transfers, and quotas are within healthy operational thresholds.
                </td>
              </tr>
            ) : (
              alerts.map(a => (
                <tr key={a._id}>
                  <td>{getAlertIcon(a.type)}</td>
                  <td>
                    <span className="badge badge-danger">
                      {a.type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td><strong>{a.locationId?.name || 'System-Wide'}</strong></td>
                  <td style={{ maxWidth: '450px' }}>{a.message}</td>
                  <td>{new Date(a.alertDate || a.createdAt).toLocaleDateString()}</td>
                  <td>
                    {!a.isDismissed && (
                      <button
                        onClick={() => handleDismiss(a._id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Dismiss
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
