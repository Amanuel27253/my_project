import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  Send,
  Printer,
  CheckCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Search,
  X
} from 'lucide-react';

export const DistributionPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('');
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [distQuantities, setDistQuantities] = useState({});

  // Receipt view
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchInitialData = async () => {
    try {
      const [benRes, distRes] = await Promise.all([
        api.get('/beneficiaries?status=verified'),
        api.get('/distributions')
      ]);

      if (benRes.data.success) setBeneficiaries(benRes.data.data);
      if (distRes.data.success) setDistributions(distRes.data.data);
    } catch {
      setErrorMsg('Failed to initialize distribution module');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // When a beneficiary is selected, fetch their monthly quota status
  const handleSelectBeneficiary = async (benId) => {
    setSelectedBeneficiaryId(benId);
    setDistQuantities({});
    setQuotaInfo(null);
    setErrorMsg('');

    if (!benId) return;

    try {
      setLoading(true);
      const res = await api.get(`/quota-rules/beneficiary/${benId}`);
      if (res.data.success) {
        setQuotaInfo(res.data.data);
        // Pre-fill with remaining quota as suggested max
        const initial = {};
        res.data.data.quotas.forEach(q => {
          initial[q.goods._id] = q.remaining > 0 ? q.remaining : 0;
        });
        setDistQuantities(initial);
      }
    } catch (err) {
      setErrorMsg('Failed to calculate quota status for selected beneficiary');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDistribution = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedBeneficiaryId || !quotaInfo) {
      setErrorMsg('Please select a verified beneficiary');
      return;
    }

    const itemsToDistribute = [];
    for (const q of quotaInfo.quotas) {
      const qty = Number(distQuantities[q.goods._id] || 0);
      if (qty > 0) {
        if (qty > q.remaining) {
          setErrorMsg(`Distribution quantity for ${q.goods.name} exceeds remaining quota (${q.remaining} ${q.goods.unit})`);
          return;
        }
        itemsToDistribute.push({
          goodsId: q.goods._id,
          quantity: qty
        });
      }
    }

    if (itemsToDistribute.length === 0) {
      setErrorMsg('Please specify a distribution quantity greater than zero for at least one good');
      return;
    }

    try {
      setLoading(true);
      const kebeleId = quotaInfo.beneficiary.kebeleId;
      const res = await api.post('/distributions', {
        beneficiaryId: selectedBeneficiaryId,
        kebeleId,
        items: itemsToDistribute
      });

      if (res.data.success) {
        setSuccessMsg(`Distribution recorded successfully. Receipt #${res.data.data.receiptNo} generated.`);
        // Fetch full receipt details
        const receiptRes = await api.get(`/distributions/${res.data.data._id}/receipt`);
        if (receiptRes.data.success) {
          setCurrentReceipt(receiptRes.data.data);
        }
        // Refresh history
        fetchInitialData();
        setSelectedBeneficiaryId('');
        setQuotaInfo(null);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record distribution');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (distId) => {
    try {
      const res = await api.get(`/distributions/${distId}/receipt`);
      if (res.data.success) {
        setCurrentReceipt(res.data.data);
      }
    } catch (err) {
      alert('Failed to load receipt details');
    }
  };

  return (
    <div>
      <div className="page-header-banner">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.distribution', 'Subsidy Distribution & Receipt Issuance')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Atomic quota deduction, FEFO store issuing, and receipt generation
          </p>
        </div>

        <div className="banner-actions">
          <button
            onClick={() => { setActiveTab('new'); setCurrentReceipt(null); }}
            className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Send size={16} /> New Distribution
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={16} /> Distribution History
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      {/* Tab 1: New Distribution */}
      {activeTab === 'new' && !currentReceipt && (
        <div className="distribution-layout-grid">
          
          {/* Beneficiary Selector Card */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={18} color="var(--primary)" />
              1. Select Verified Household
            </h3>

            <div className="form-group">
              <label>Household Head</label>
              <select
                className="form-control"
                value={selectedBeneficiaryId}
                onChange={(e) => handleSelectBeneficiary(e.target.value)}
              >
                <option value="">-- Choose Household --</option>
                {beneficiaries.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.headName} ({b.idNumber}) — {b.familySize} Members
                  </option>
                ))}
              </select>
            </div>

            {quotaInfo && (
              <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Household Summary:</div>
                <div style={{ marginTop: '0.25rem' }}>Head: <strong>{quotaInfo.beneficiary.headName}</strong></div>
                <div>ID: <code>{quotaInfo.beneficiary.idNumber}</code></div>
                <div>Phone: {quotaInfo.beneficiary.phone}</div>
                <div>Family Size: <strong>{quotaInfo.beneficiary.familySize} people</strong></div>
                <div>Distribution Period: <strong>{quotaInfo.periodKey}</strong></div>
              </div>
            )}
          </div>

          {/* Quota & Issuing Form */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              2. Calculated Family Quota & Commodity Issuing
            </h3>

            {!quotaInfo ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Please select a verified household from the left to calculate and verify their remaining quota for period {new Date().toISOString().slice(0, 7)}.
              </div>
            ) : (
              <form onSubmit={handleExecuteDistribution}>
                <div className="table-container" style={{ marginBottom: '1.25rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Commodity</th>
                        <th>Monthly Allowed</th>
                        <th>Already Used</th>
                        <th>Remaining Balance</th>
                        <th style={{ width: '160px' }}>Issue Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotaInfo.quotas.map((q) => (
                        <tr key={q.goods._id}>
                          <td>
                            <strong>{q.goods.name}</strong>
                            {q.goods.nameAm && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.goods.nameAm}</div>}
                          </td>
                          <td>
                            <strong>{q.allowed}</strong> {q.goods.unit}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({q.quantityPerPerson} {q.goods.unit}/person, max {q.maxPerHousehold})
                            </div>
                          </td>
                          <td>
                            <span style={{ color: q.used > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                              {q.used} {q.goods.unit}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: q.remaining > 0 ? 'var(--success)' : 'var(--danger)' }}>
                              {q.remaining} {q.goods.unit}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={q.remaining}
                              className="form-control"
                              disabled={q.remaining <= 0}
                              value={distQuantities[q.goods._id] ?? ''}
                              onChange={(e) => setDistQuantities({
                                ...distQuantities,
                                [q.goods._id]: e.target.value
                              })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <Send size={16} />
                    {loading ? 'Executing Atomic Distribution...' : 'Confirm Distribution & Issue Receipt'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}

      {/* Render Official Receipt */}
      {currentReceipt && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }} className="no-print">
            <button onClick={() => window.print()} className="btn btn-primary">
              <Printer size={16} /> Print Receipt
            </button>
            <button onClick={() => setCurrentReceipt(null)} className="btn btn-secondary">
              Back to Distribution
            </button>
          </div>

          <div className="receipt-paper">
            <div className="receipt-header">
              <h2>NORTH SHEWA ZONE ADMINISTRATION</h2>
              <h3>OFFICIAL SUBSIDY DISTRIBUTION RECEIPT</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Amhara National Regional State, Ethiopia</p>
            </div>

            <div className="receipt-row">
              <span>RECEIPT NUMBER:</span>
              <strong><code>{currentReceipt.receiptNumber}</code></strong>
            </div>
            <div className="receipt-row">
              <span>DATE & TIME:</span>
              <span>{new Date(currentReceipt.distributionDate).toLocaleString()}</span>
            </div>
            <div className="receipt-row">
              <span>DISTRIBUTION OFFICE:</span>
              <strong>{currentReceipt.office.name} ({currentReceipt.office.code})</strong>
            </div>
            <div className="receipt-row">
              <span>PERIOD KEY:</span>
              <span>{currentReceipt.period}</span>
            </div>

            <div style={{ margin: '1rem 0 0.5rem', fontWeight: 700, borderBottom: '1px solid #0f172a' }}>
              BENEFICIARY DETAILS:
            </div>
            <div className="receipt-row">
              <span>Household Head:</span>
              <strong>{currentReceipt.beneficiary.headName}</strong>
            </div>
            <div className="receipt-row">
              <span>ID Type & Number:</span>
              <span>{currentReceipt.beneficiary.idType?.toUpperCase()}: {currentReceipt.beneficiary.idNumber}</span>
            </div>
            <div className="receipt-row">
              <span>Phone:</span>
              <span>{currentReceipt.beneficiary.phone}</span>
            </div>
            <div className="receipt-row">
              <span>Family Members:</span>
              <span>{currentReceipt.beneficiary.familySize}</span>
            </div>

            <div className="receipt-items">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.5rem' }}>
                <span>COMMODITY / BATCH</span>
                <span>QUANTITY ISSUED</span>
              </div>
              {currentReceipt.items.map((it, idx) => (
                <div key={idx} className="receipt-row">
                  <span>{it.goodsName} (Batch: {it.batchNumber})</span>
                  <strong>{it.quantity} {it.unit}</strong>
                </div>
              ))}
            </div>

            <div className="receipt-row">
              <span>ISSUED BY:</span>
              <span>{currentReceipt.issuer.name} ({currentReceipt.issuer.username})</span>
            </div>
            <div className="receipt-row" style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center' }}>
              <span>{currentReceipt.verificationNote}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Distribution History */}
      {activeTab === 'history' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Beneficiary Head</th>
                <th>Kebele</th>
                <th>Period</th>
                <th>Commodities Distributed</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributions.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No distributions recorded yet.</td></tr>
              ) : (
                distributions.map(d => (
                  <tr key={d._id}>
                    <td><code>{d.receiptNo}</code></td>
                    <td>
                      <strong>{d.beneficiaryId?.headName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.beneficiaryId?.idNumber}</div>
                    </td>
                    <td>{d.kebeleId?.name}</td>
                    <td>{d.periodKey}</td>
                    <td>
                      {d.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          • {item.goodsId?.name}: <strong>{item.quantity} {item.goodsId?.unit}</strong> (Batch: <code>{item.batchNumber}</code>)
                        </div>
                      ))}
                    </td>
                    <td>{new Date(d.distributedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleViewReceipt(d._id)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Printer size={14} /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
