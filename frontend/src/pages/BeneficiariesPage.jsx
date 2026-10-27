import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  X,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const BeneficiariesPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [kebeles, setKebeles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kebeleFilter, setKebeleFilter] = useState('');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [form, setForm] = useState({
    headName: '',
    gender: 'male',
    idType: 'fayda',
    idNumber: '',
    phone: '',
    address: '',
    kebeleId: '',
    familySize: 3
  });

  const [idChecking, setIdChecking] = useState(false);
  const [idFeedback, setIdFeedback] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (kebeleFilter) params.kebeleId = kebeleFilter;

      const [bRes, locRes] = await Promise.all([
        api.get('/beneficiaries', { params }),
        api.get('/locations?type=kebele')
      ]);

      if (bRes.data.success) setBeneficiaries(bRes.data.data);
      if (locRes.data.success) setKebeles(locRes.data.data);
    } catch (err) {
      setErrorMsg('Failed to load beneficiary registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter, kebeleFilter]);

  // Check ID availability debounce / trigger
  const handleCheckId = async (idNum) => {
    if (!idNum || idNum.trim().length < 4) {
      setIdFeedback(null);
      return;
    }
    setIdChecking(true);
    try {
      const res = await api.get(`/beneficiaries/check-id?idNumber=${encodeURIComponent(idNum.trim())}`);
      setIdFeedback(res.data.data);
    } catch {
      setIdFeedback(null);
    } finally {
      setIdChecking(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setWarningMsg('');
    setSuccessMsg('');

    try {
      const kebeleId = form.kebeleId || user.location?._id || user.locationId;
      const res = await api.post('/beneficiaries', {
        ...form,
        kebeleId,
        familySize: Number(form.familySize)
      });

      if (res.data.success) {
        setSuccessMsg(`Household '${form.headName}' registered successfully.`);
        if (res.data.data.warning) {
          setWarningMsg(res.data.data.warning);
        }
        setShowRegisterModal(false);
        setForm({
          headName: '',
          gender: 'male',
          idType: 'fayda',
          idNumber: '',
          phone: '',
          address: '',
          kebeleId: '',
          familySize: 3
        });
        setIdFeedback(null);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register beneficiary');
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`/beneficiaries/${id}/verify`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify beneficiary');
    }
  };

  const handleSuspend = async (id) => {
    const reason = window.prompt('Enter reason for beneficiary suspension:', 'Eligibility status change');
    if (!reason) return;
    try {
      await api.post(`/beneficiaries/${id}/suspend`, { reason });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend beneficiary');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified': return <span className="badge badge-success">Verified (Eligible)</span>;
      case 'registered': return <span className="badge badge-warning">Registered (Pending Verification)</span>;
      case 'suspended': return <span className="badge badge-danger">Suspended</span>;
      default: return <span className="badge badge-default">{status}</span>;
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'kebele_officer';

  return (
    <div>
      <div className="page-header-banner">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.beneficiaries', 'Beneficiary Household Registry')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Unique Fayda/Kebele ID verification, household size, and quota eligibility
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn btn-primary"
          >
            <UserPlus size={16} />
            {t('beneficiaries.register', 'Register Household')}
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {warningMsg && (
        <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          {warningMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2rem' }}
            placeholder="Search by head name, ID number, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '180px' }}
          value={kebeleFilter}
          onChange={(e) => setKebeleFilter(e.target.value)}
        >
          <option value="">All Kebeles</option>
          {kebeles.map(k => (
            <option key={k._id} value={k._id}>{k.name}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="verified">Verified Only</option>
          <option value="registered">Registered (Pending)</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Beneficiaries Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Household Head</th>
              <th>ID Type & Number</th>
              <th>Phone</th>
              <th>Kebele</th>
              <th>Family Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading households...</td></tr>
            ) : beneficiaries.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No beneficiary households found matching query.</td></tr>
            ) : (
              beneficiaries.map((b) => (
                <tr key={b._id}>
                  <td>
                    <strong>{b.headName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender: {b.gender}</div>
                  </td>
                  <td>
                    <code>{b.idNumber}</code>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.idType?.toUpperCase()}</div>
                  </td>
                  <td>{b.phone}</td>
                  <td>{b.kebeleId?.name}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{b.familySize}</span> members
                  </td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {b.status === 'registered' && (
                        <button
                          onClick={() => handleVerify(b._id)}
                          className="btn btn-success btn-sm"
                          title="Verify eligibility to receive goods"
                        >
                          <ShieldCheck size={14} /> Verify
                        </button>
                      )}
                      {b.status === 'verified' && (
                        <button
                          onClick={() => handleSuspend(b._id)}
                          className="btn btn-secondary btn-sm"
                          title="Suspend beneficiary"
                        >
                          <ShieldAlert size={14} /> Suspend
                        </button>
                      )}
                      {b.status === 'suspended' && (
                        <button
                          onClick={() => handleVerify(b._id)}
                          className="btn btn-primary btn-sm"
                          title="Reactivate beneficiary"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Register Beneficiary */}
      {showRegisterModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="page-header-banner">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Register Beneficiary Household</h3>
              <button onClick={() => setShowRegisterModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Household Head Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Abebe Tesfaye"
                  value={form.headName}
                  onChange={(e) => setForm({ ...form, headName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-control"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Family Size (Household Members)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={form.familySize}
                    onChange={(e) => setForm({ ...form, familySize: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>ID Type</label>
                  <select
                    className="form-control"
                    value={form.idType}
                    onChange={(e) => setForm({ ...form, idType: e.target.value })}
                    required
                  >
                    <option value="fayda">Fayda ID (National)</option>
                    <option value="kebele">Kebele ID</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>ID Number (Must be globally unique)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ETH-FAYDA-123456"
                    value={form.idNumber}
                    onChange={(e) => {
                      setForm({ ...form, idNumber: e.target.value });
                      handleCheckId(e.target.value);
                    }}
                    required
                  />
                  {idChecking && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Checking availability...</div>}
                  {idFeedback && (
                    <div style={{ fontSize: '0.75rem', marginTop: '2px', color: idFeedback.available ? 'var(--success)' : 'var(--danger)' }}>
                      {idFeedback.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="09..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address / House Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. House 24, Zone 1"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Kebele Office</label>
                <select
                  className="form-control"
                  value={form.kebeleId}
                  onChange={(e) => setForm({ ...form, kebeleId: e.target.value })}
                >
                  <option value="">Default to current user Kebele</option>
                  {kebeles.map(k => (
                    <option key={k._id} value={k._id}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={idFeedback && !idFeedback.available}
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
