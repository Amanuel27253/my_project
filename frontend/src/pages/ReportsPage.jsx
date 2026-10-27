import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { FileText, Printer, Filter, CheckCircle } from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [reportType, setReportType] = useState('inventory'); // 'inventory', 'distribution', 'beneficiaries'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      let url = '/reports/inventory';
      if (reportType === 'distribution') url = '/reports/distribution';
      if (reportType === 'beneficiaries') url = '/reports/beneficiaries';

      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch {
      setErrorMsg('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  return (
    <div>
      <div className="page-header-banner">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.reports', 'Administrative Reports & Transparency Analytics')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Official reporting for North Shewa Zone, Woredas, and Kebeles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => window.print()} className="btn btn-secondary">
            <Printer size={16} /> Print / Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }} className="no-print">
        <button
          onClick={() => setReportType('inventory')}
          className={`btn ${reportType === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Inventory & Warehouse Report
        </button>
        <button
          onClick={() => setReportType('distribution')}
          className={`btn ${reportType === 'distribution' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Distribution Volume Report
        </button>
        <button
          onClick={() => setReportType('beneficiaries')}
          className={`btn ${reportType === 'beneficiaries' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Beneficiaries Demographics Report
        </button>
      </div>

      {/* Print Header */}
      <div style={{ display: 'none' }} className="print-header">
        <h2 style={{ textAlign: 'center' }}>North Shewa Zone Administration — Official Report</h2>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>Generated on {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Generating report...</div>
      ) : (
        <div>
          {/* Inventory Report Table */}
          {reportType === 'inventory' && Array.isArray(data) && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Office</th>
                    <th>Office Type</th>
                    <th>Commodity</th>
                    <th>Batch</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No inventory records.</td></tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row._id}>
                        <td><strong>{row.locationId?.name}</strong></td>
                        <td><span className="badge badge-info">{row.locationId?.type?.toUpperCase()}</span></td>
                        <td>{row.goodsId?.name} {row.goodsId?.nameAm ? `(${row.goodsId?.nameAm})` : ''}</td>
                        <td><code>{row.batchNumber}</code></td>
                        <td><strong>{row.quantity.toLocaleString()} {row.goodsId?.unit}</strong></td>
                        <td>{new Date(row.expiryDate).toLocaleDateString()}</td>
                        <td><span className="badge badge-success">{row.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Distribution Report */}
          {reportType === 'distribution' && data && (
            <div>
              {/* Aggregated Totals Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="card">
                  <div className="card-title">Total Distributions</div>
                  <div className="card-value">{data.totalDistributions}</div>
                </div>
                {data.totalsByGoods?.map((g, idx) => (
                  <div key={idx} className="card">
                    <div className="card-title">{g.goodsName} Distributed</div>
                    <div className="card-value" style={{ color: 'var(--primary)' }}>
                      {g.totalQuantity.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>{g.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Household Head</th>
                      <th>Kebele Office</th>
                      <th>Period</th>
                      <th>Items Distributed</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.distributions?.map((d) => (
                      <tr key={d._id}>
                        <td><code>{d.receiptNo}</code></td>
                        <td><strong>{d.beneficiaryId?.headName}</strong></td>
                        <td>{d.kebeleId?.name}</td>
                        <td>{d.periodKey}</td>
                        <td>
                          {d.items?.map((item, idx) => (
                            <span key={idx} style={{ display: 'inline-block', marginRight: '8px' }}>
                              {item.goodsId?.name}: <strong>{item.quantity} {item.goodsId?.unit}</strong>
                            </span>
                          ))}
                        </td>
                        <td>{new Date(d.distributedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Beneficiaries Demographics Report */}
          {reportType === 'beneficiaries' && data && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="card">
                  <div className="card-title">Total Registered Households</div>
                  <div className="card-value">{data.summary?.totalHouseholds}</div>
                </div>
                <div className="card">
                  <div className="card-title">Total Citizens Served</div>
                  <div className="card-value" style={{ color: 'var(--primary)' }}>{data.summary?.totalIndividualsServed}</div>
                </div>
                <div className="card">
                  <div className="card-title">Verified Eligible</div>
                  <div className="card-value" style={{ color: 'var(--success)' }}>{data.summary?.byStatus?.verified}</div>
                </div>
                <div className="card">
                  <div className="card-title">Pending Verification</div>
                  <div className="card-value" style={{ color: 'var(--warning)' }}>{data.summary?.byStatus?.registered}</div>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Household Head</th>
                      <th>ID Number</th>
                      <th>Kebele</th>
                      <th>Woreda</th>
                      <th>Family Size</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.beneficiaries?.map((b) => (
                      <tr key={b._id}>
                        <td><strong>{b.headName}</strong></td>
                        <td><code>{b.idNumber}</code></td>
                        <td>{b.kebeleId?.name}</td>
                        <td>{b.woredaId?.name}</td>
                        <td><strong>{b.familySize}</strong> people</td>
                        <td><span className={`badge ${b.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
