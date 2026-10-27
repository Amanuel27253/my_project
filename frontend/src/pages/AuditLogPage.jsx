import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { History, Shield, Filter, Search } from 'lucide-react';

export const AuditLogPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;

      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div>
      <div className="page-header-banner">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.auditLog', 'Immutable System Audit Trail (FR-AUD-01)')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tamper-proof log of critical user actions, distributions, stock shifts, and authentication
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Filter size={16} color="var(--text-muted)" />
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '220px' }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Audited Actions</option>
          <option value="AUTH_LOGIN">Login Attempts</option>
          <option value="USER_CREATE">User Account Creation</option>
          <option value="BENEFICIARY_REGISTER">Beneficiary Registrations</option>
          <option value="BENEFICIARY_VERIFY">Beneficiary Verifications</option>
          <option value="STOCK_RECEIVE">Stock Receipts</option>
          <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
          <option value="STOCK_TRANSFER_DISPATCH">Transfer Dispatches</option>
          <option value="STOCK_TRANSFER_RECEIVE">Transfer Confirmations</option>
          <option value="DISTRIBUTION_EXECUTE">Distributions Executed</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action Code</th>
              <th>Entity</th>
              <th>Triggered By</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading audit records...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit log entries recorded.</td></tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log._id}>
                  <tr>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-info">{log.action}</span>
                    </td>
                    <td><strong>{log.entityType}</strong></td>
                    <td>
                      {log.userId ? (
                        <span>{log.userId.fullName} (<code>{log.userId.username}</code>)</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>System / Guest</span>
                      )}
                    </td>
                    <td><code>{log.ipAddress || '127.0.0.1'}</code></td>
                    <td>
                      <button
                        onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}
                        className="btn btn-secondary btn-sm"
                      >
                        {expandedRow === log._id ? 'Hide' : 'Inspect'}
                      </button>
                    </td>
                  </tr>

                  {expandedRow === log._id && (
                    <tr>
                      <td colSpan="6" style={{ background: '#f8fafc', padding: '1rem' }}>
                        <pre style={{ fontSize: '0.8rem', background: '#fff', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '4px', overflowX: 'auto' }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
