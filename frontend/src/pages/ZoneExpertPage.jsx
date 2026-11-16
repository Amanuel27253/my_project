import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  TrendingUp,
  MapPin,
  Package,
  Layers,
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle,
  FileText,
  Save,
  Search,
  Filter,
  Plus,
  X,
  Key,
  ShieldCheck
} from 'lucide-react';
import { NORTH_SHEWA_WOREDAS } from '../constants/northShewaWoredas';
import { PasswordRequirements } from '../components/PasswordRequirements';

export const ZoneExpertPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'woredas' | 'commodities' | 'allocations' | 'fraud'
  const [zoneData, setZoneData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Woreda Directory Filtering
  const [woredaFilter, setWoredaFilter] = useState('ALL'); // 'ALL' | 'CITY_ADMIN' | 'RURAL_WOREDA'
  const [woredaSearch, setWoredaSearch] = useState('');

  // Commodities Price Ceiling Editing
  const [editingCommodity, setEditingCommodity] = useState(null);
  const [newCeiling, setNewCeiling] = useState('');
  const [newQuotaPerson, setNewQuotaPerson] = useState('');
  const [newMaxHousehold, setNewMaxHousehold] = useState('');

  // Woreda Quota Allocation Form
  const [totalZoneShipment, setTotalZoneShipment] = useState({
    oil: 50000,
    sugar: 40000,
    wheat: 80000,
    teff: 30000
  });

  // Add Woreda & Officer Provisioning State (Option A)
  const [showWoredaModal, setShowWoredaModal] = useState(false);
  const [submittingWoreda, setSubmittingWoreda] = useState(false);
  const [woredaForm, setWoredaForm] = useState({
    name: '',
    nameAm: '',
    code: '',
    adminType: 'RURAL_WOREDA',
    population: '',
    householdCount: '',
    officerFullName: '',
    officerUsername: '',
    officerPassword: '',
    officerPhone: '',
    officerEmail: ''
  });

  const handleOpenAddWoreda = async () => {
    try {
      const codeRes = await api.get('/locations/next-code?type=woreda');
      const suggestedCode = codeRes.data?.data?.nextCode || 'NSZ-W29';
      setWoredaForm({
        name: '',
        nameAm: '',
        code: suggestedCode,
        adminType: 'RURAL_WOREDA',
        population: '',
        householdCount: '',
        officerFullName: '',
        officerUsername: '',
        officerPassword: '',
        officerPhone: '',
        officerEmail: ''
      });
      setShowWoredaModal(true);
    } catch {
      setShowWoredaModal(true);
    }
  };

  const handleSubmitWoreda = async (e) => {
    e.preventDefault();
    setSubmittingWoreda(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: woredaForm.name,
        nameAm: woredaForm.nameAm,
        code: woredaForm.code,
        adminType: woredaForm.adminType,
        population: Number(woredaForm.population) || 0,
        householdCount: Number(woredaForm.householdCount) || 0,
        officer: {
          fullName: woredaForm.officerFullName,
          username: woredaForm.officerUsername,
          password: woredaForm.officerPassword,
          phone: woredaForm.officerPhone,
          email: woredaForm.officerEmail
        }
      };
      const res = await api.post('/locations/woreda-with-officer', payload);
      if (res.data.success) {
        setSuccessMsg(
          `Woreda '${res.data.data.woreda.name}' (${res.data.data.woreda.code}) registered! Officer Username: '${res.data.data.officer.username}' can now log in.`
        );
        setShowWoredaModal(false);
        await loadZoneData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create Woreda and Officer');
    } finally {
      setSubmittingWoreda(false);
    }
  };

  const loadZoneData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/distribution-management/zone/overview');
      if (res.data.success) {
        setZoneData(res.data.data);
      }

      // Fetch audit / fraud logs
      const logsRes = await api.get('/audit-logs?limit=30');
      if (logsRes.data.success) {
        setAuditLogs(logsRes.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load Zone overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZoneData();
  }, []);

  const handleUpdatePriceCeiling = async (e) => {
    e.preventDefault();
    if (!editingCommodity) return;

    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await api.put(`/distribution-management/zone/price-ceiling/${editingCommodity._id}`, {
        priceCeiling: Number(newCeiling),
        defaultQuotaPerPerson: Number(newQuotaPerson),
        defaultMaxPerHousehold: Number(newMaxHousehold)
      });

      if (res.data.success) {
        setSuccessMsg(`Official price ceiling for ${editingCommodity.name} updated to ${newCeiling} ETB.`);
        setEditingCommodity(null);
        await loadZoneData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update price ceiling');
    }
  };

  const handleProportionalAllocation = async () => {
    if (!zoneData || !zoneData.commodities) return;
    try {
      setErrorMsg('');
      setSuccessMsg('');

      const month = new Date().toISOString().slice(0, 7); // '2026-11'
      const cycleCode = `CYCLE-${month}`;

      const allocationsPayload = [];
      const oilCommodity = zoneData.commodities.find(c => c.name.toLowerCase().includes('oil'));
      const sugarCommodity = zoneData.commodities.find(c => c.name.toLowerCase().includes('sugar'));

      if (oilCommodity) {
        allocationsPayload.push({
          goodsId: oilCommodity._id,
          totalZoneQuantity: Number(totalZoneShipment.oil)
        });
      }
      if (sugarCommodity) {
        allocationsPayload.push({
          goodsId: sugarCommodity._id,
          totalZoneQuantity: Number(totalZoneShipment.sugar)
        });
      }

      const res = await api.post('/distribution-management/zone/allocate-woredas', {
        cycleCode,
        month,
        title: `November 2026 Subsidized Distribution Cycle`,
        titleAm: `የህዳር 2017 የስርጭት ዙር`,
        allocations: allocationsPayload
      });

      if (res.data.success) {
        setSuccessMsg('Proportional regional quota allocated successfully across all Woredas!');
        await loadZoneData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to allocate regional quota');
    }
  };

  const fraudAuditLogs = auditLogs.filter(
    l => l.action.includes('FRAUD') || l.action.includes('DUPLICATE') || l.action.includes('PRICE')
  );

  return (
    <div className="page-body">
      {/* Title & Scope Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-info" style={{ fontWeight: 700 }}>
            ZONE_EXPERT MODULE
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            North Shewa Zone Trade & Market Development Department
          </span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
          {currentLang === 'am' ? 'የሰሜን ሸዋ ዞን ንግድና ገበያ ልማት መምሪያ' : 'North Shewa Zone Trade & Governance Portal'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          {currentLang === 'am'
            ? 'የወረዳዎች ቁጥጥር፣ የድጎማ ጣሪያ ዋጋዎች እና የክልል ድልድል ማስተባበሪያ'
            : 'Zone-wide Woreda oversight, subsidized price ceiling regulation, and proportional quota allocation'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <TrendingUp size={16} />
          <span>1. {currentLang === 'am' ? 'የዞን አጠቃላይ እይታ' : 'Zone Overview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('woredas')}
          className={`btn btn-sm ${activeTab === 'woredas' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapPin size={16} />
          <span>2. {currentLang === 'am' ? 'የወረዳዎች አስተዳደር' : 'Woreda Management'}</span>
        </button>

        <button
          onClick={() => setActiveTab('commodities')}
          className={`btn btn-sm ${activeTab === 'commodities' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <DollarSign size={16} />
          <span>3. {currentLang === 'am' ? 'ሸቀጦችና የጣሪያ ዋጋ' : 'Commodities & Price Ceilings'}</span>
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`btn btn-sm ${activeTab === 'allocations' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={16} />
          <span>4. {currentLang === 'am' ? 'የወረዳዎች ድልድል' : 'Woreda Quota Allocation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('fraud')}
          className={`btn btn-sm ${activeTab === 'fraud' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <AlertTriangle size={16} />
          <span>5. {currentLang === 'am' ? 'ማጭበርበርና ኦዲት ሎግ' : 'Fraud & Audit Logs'}</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Module 1: Zone Overview */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <span className="card-label">Total Registered Population</span>
              <div className="card-value" style={{ color: '#1e3a8a' }}>
                {zoneData?.totalPopulation?.toLocaleString() || '485,000'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Across all Woredas in North Shewa</span>
            </div>

            <div className="card">
              <span className="card-label">Verified Households</span>
              <div className="card-value" style={{ color: '#16a34a' }}>
                {zoneData?.totalHouseholds?.toLocaleString() || '112,000'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Holding Unique Ration IDs</span>
            </div>

            <div className="card">
              <span className="card-label">Active Woredas / Cities</span>
              <div className="card-value" style={{ color: '#d97706' }}>
                {zoneData?.woredaStats?.length || 4}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Debre Berhan, Basona Werana, Ankober...</span>
            </div>

            <div className="card">
              <span className="card-label">Subsidized Commodities</span>
              <div className="card-value" style={{ color: '#2563eb' }}>
                {zoneData?.commodities?.length || 4}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Edible Oil, Sugar, Flour, Teff</span>
            </div>
          </div>

          {/* Population distribution bar */}
          <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
              Proportional Population Distribution by Woreda
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {zoneData?.woredaStats?.map((w) => (
                <div key={w._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.88rem' }}>
                    <strong>{w.name} ({w.nameAm})</strong>
                    <span>
                      {w.population?.toLocaleString()} residents ({w.populationSharePercentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(w.populationSharePercentage, 5)}%`,
                        height: '100%',
                        background: '#1e3a8a',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Woreda Management */}
      {activeTab === 'woredas' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e3a8a' }}>
                {currentLang === 'am' ? 'የሰሜን ሸዋ ዞን ወረዳዎችና የከተማ አስተዳደሮች' : 'North Shewa Zone Woredas & City Administrations'} (28)
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {currentLang === 'am'
                  ? '6 የከተማ አስተዳደሮች (NSZ-W01 እስከ NSZ-W06) እና 22 የገጠር ወረዳዎች (NSZ-W07 እስከ NSZ-W28)'
                  : '6 City/Town Administrations (NSZ-W01 to NSZ-W06) & 22 Rural Woredas (NSZ-W07 to NSZ-W28)'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem', height: '36px' }}
                  placeholder={currentLang === 'am' ? 'በስም ወይም ኮድ ይፈልጉ...' : 'Search woreda or code...'}
                  value={woredaSearch}
                  onChange={(e) => setWoredaSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    background: woredaFilter === 'ALL' ? '#1e3a8a' : '#f8fafc',
                    color: woredaFilter === 'ALL' ? '#fff' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setWoredaFilter('ALL')}
                >
                  {currentLang === 'am' ? 'ሁሉም (28)' : 'All (28)'}
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    borderLeft: '1px solid #cbd5e1',
                    borderRight: '1px solid #cbd5e1',
                    background: woredaFilter === 'CITY_ADMIN' ? '#1e3a8a' : '#f8fafc',
                    color: woredaFilter === 'CITY_ADMIN' ? '#fff' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setWoredaFilter('CITY_ADMIN')}
                >
                  {currentLang === 'am' ? 'ከተሞች (6)' : 'Cities (6)'}
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    background: woredaFilter === 'RURAL_WOREDA' ? '#1e3a8a' : '#f8fafc',
                    color: woredaFilter === 'RURAL_WOREDA' ? '#fff' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setWoredaFilter('RURAL_WOREDA')}
                >
                  {currentLang === 'am' ? 'ገጠር ወረዳዎች (22)' : 'Rural (22)'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenAddWoreda}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                  height: '36px'
                }}
              >
                <Plus size={15} />
                <span>{currentLang === 'am' ? 'አዲስ ወረዳ እና ኃላፊ መዝግብ' : 'Add Woreda & Officer'}</span>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{currentLang === 'am' ? 'የወረዳ ኮድ' : 'Woreda Code'}</th>
                  <th>{currentLang === 'am' ? 'የወረዳ / ከተማ ስም' : 'Woreda / City Name'}</th>
                  <th>{currentLang === 'am' ? 'የአማርኛ መጠሪያ' : 'Amharic Name'}</th>
                  <th>{currentLang === 'am' ? 'አስተዳደራዊ ምድብ' : 'Admin Type'}</th>
                  <th>{currentLang === 'am' ? 'የህዝብ ብዛት' : 'Population'}</th>
                  <th>{currentLang === 'am' ? 'አባወራዎች' : 'Households'}</th>
                  <th>{currentLang === 'am' ? 'የህዝብ ድርሻ' : 'Zone Share'}</th>
                </tr>
              </thead>
              <tbody>
                {((zoneData?.woredaStats && zoneData.woredaStats.length > 0)
                  ? zoneData.woredaStats
                  : NORTH_SHEWA_WOREDAS.map(nw => ({
                      _id: nw.woredaCode,
                      code: nw.woredaCode,
                      name: nw.nameEn,
                      nameAm: nw.nameAm,
                      adminType: nw.type,
                      type: nw.type,
                      population: 75000,
                      householdCount: 17000,
                      populationSharePercentage: 3.5
                    }))
                )
                  .filter((w) => {
                    const type = w.adminType || w.type || (w.code <= 'NSZ-W06' ? 'CITY_ADMIN' : 'RURAL_WOREDA');
                    const matchesFilter = woredaFilter === 'ALL' || type === woredaFilter;
                    const q = woredaSearch.toLowerCase().trim();
                    const matchesSearch =
                      !q ||
                      w.code?.toLowerCase().includes(q) ||
                      w.name?.toLowerCase().includes(q) ||
                      w.nameAm?.toLowerCase().includes(q);
                    return matchesFilter && matchesSearch;
                  })
                  .map((w) => {
                    const isCity = (w.adminType || w.type || (w.code <= 'NSZ-W06' ? 'CITY_ADMIN' : 'RURAL_WOREDA')) === 'CITY_ADMIN';
                    return (
                      <tr key={w._id || w.code}>
                        <td>
                          <span className="badge badge-info">{w.code}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{w.name}</td>
                        <td style={{ fontWeight: 500 }}>{w.nameAm}</td>
                        <td>
                          <span
                            className={`badge ${isCity ? 'badge-primary' : 'badge-secondary'}`}
                            style={{
                              background: isCity ? '#dbeafe' : '#f1f5f9',
                              color: isCity ? '#1e40af' : '#475569',
                              border: `1px solid ${isCity ? '#bfdbfe' : '#cbd5e1'}`
                            }}
                          >
                            {isCity
                              ? (currentLang === 'am' ? 'የከተማ አስተዳደር' : 'City Administration')
                              : (currentLang === 'am' ? 'የገጠር ወረዳ' : 'Rural Woreda')}
                          </span>
                        </td>
                        <td>{w.population?.toLocaleString()}</td>
                        <td>{w.householdCount?.toLocaleString()}</td>
                        <td>
                          <span className="badge badge-success">{w.populationSharePercentage}%</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Module 3: Commodities & Price Ceiling */}
      {activeTab === 'commodities' && (
        <div>
          <div className="card" style={{ padding: '1.5rem', background: '#fff', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Official Subsidized Price Ceilings
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Zone-wide mandatory maximum selling prices (ETB) and default family quota caps.
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Commodity</th>
                    <th>Amharic Name</th>
                    <th>Unit</th>
                    <th>Subsidized Price Ceiling (ETB)</th>
                    <th>Quota / Person</th>
                    <th>Max Cap / Household</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneData?.commodities?.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td>{c.nameAm}</td>
                      <td>{c.unit}</td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                          {c.priceCeiling} ETB
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / {c.unit}</span>
                      </td>
                      <td>{c.defaultQuotaPerPerson} {c.unit}</td>
                      <td>{c.defaultMaxPerHousehold} {c.unit}</td>
                      <td>
                        <button
                          onClick={() => {
                            setEditingCommodity(c);
                            setNewCeiling(c.priceCeiling);
                            setNewQuotaPerson(c.defaultQuotaPerPerson);
                            setNewMaxHousehold(c.defaultMaxPerHousehold);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit Ceiling
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Modal */}
          {editingCommodity && (
            <div className="modal-backdrop">
              <div className="modal-content" style={{ maxWidth: '440px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Update Price Ceiling: {editingCommodity.name}
                </h3>
                <form onSubmit={handleUpdatePriceCeiling}>
                  <div className="form-group">
                    <label>Subsidized Price Ceiling (ETB per {editingCommodity.unit})</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={newCeiling}
                      onChange={(e) => setNewCeiling(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Default Quota per Person ({editingCommodity.unit})</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newQuotaPerson}
                      onChange={(e) => setNewQuotaPerson(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Quota Cap per Household ({editingCommodity.unit})</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newMaxHousehold}
                      onChange={(e) => setNewMaxHousehold(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setEditingCommodity(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Official Ceiling
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module 4: Woreda Quota Allocation */}
      {activeTab === 'allocations' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Proportional Regional Quota Allocation to Woredas
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Enter total incoming shipment for North Shewa Zone. The system auto-calculates each Woreda's exact share based on live census population.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Edible Cooking Oil (Liters)</label>
              <input
                type="number"
                className="form-control"
                value={totalZoneShipment.oil}
                onChange={(e) => setTotalZoneShipment({ ...totalZoneShipment, oil: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Sugar (Kg)</label>
              <input
                type="number"
                className="form-control"
                value={totalZoneShipment.sugar}
                onChange={(e) => setTotalZoneShipment({ ...totalZoneShipment, sugar: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Wheat Flour (Kg)</label>
              <input
                type="number"
                className="form-control"
                value={totalZoneShipment.wheat}
                onChange={(e) => setTotalZoneShipment({ ...totalZoneShipment, wheat: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Teff (Kg)</label>
              <input
                type="number"
                className="form-control"
                value={totalZoneShipment.teff}
                onChange={(e) => setTotalZoneShipment({ ...totalZoneShipment, teff: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={handleProportionalAllocation}
            className="btn btn-primary"
            style={{ marginBottom: '1.5rem' }}
          >
            <Layers size={16} />
            <span>Auto-Calculate & Dispatch Proportional Shares</span>
          </button>

          {/* Preview of Current Distribution Cycle Allocations */}
          {zoneData?.currentCycle && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e3a8a' }}>
                Active Cycle: {zoneData.currentCycle.cycleCode} ({zoneData.currentCycle.title})
              </h4>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Woreda</th>
                      <th>Commodity</th>
                      <th>Population Share</th>
                      <th>Allocated Share</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneData.currentCycle.zoneAllocations?.map((za, idx) => {
                      const woredaObj = zoneData.woredaStats?.find(w => w._id.toString() === za.woredaId.toString());
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{woredaObj?.name || 'Woreda'}</td>
                          <td>{za.goodsName}</td>
                          <td>{za.populationSharePercentage}%</td>
                          <td style={{ fontWeight: 700, color: '#15803d' }}>
                            {za.allocatedQuantity?.toLocaleString()} {za.unit}
                          </td>
                          <td>
                            <span className="badge badge-success">{za.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module 5: Fraud & Audit Logs */}
      {activeTab === 'fraud' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Flagged Fraud Alerts & System Audit Logs
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
            Real-time audit trail of blocked duplicate registrations, cross-woreda collision events, price changes, and quota allocations.
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Type</th>
                  <th>User / Operator</th>
                  <th>IP Address</th>
                  <th>Details & Anti-Fraud Collisions</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.action.includes('FRAUD') || log.action.includes('BLOCKED')
                            ? 'badge-danger'
                            : log.action.includes('PRICE')
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>{log.userId?.fullName || 'System Operator'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{log.ipAddress || '127.0.0.1'}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <code>{JSON.stringify(log.details)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Option A: Provision Woreda & Officer Modal */}
      {showWoredaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '1rem',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                  {currentLang === 'am' ? 'አዲስ ወረዳ እና ኃላፊ መመዝገቢያ' : 'Provision Woreda & Trade Officer'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Option A: Simultaneous Registration of Administrative Division & Staff Credentials
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWoredaModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitWoreda} style={{ padding: '1.5rem' }}>
              {/* Section 1: Location Unit */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.35rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <MapPin size={15} />
                  1. {currentLang === 'am' ? 'የወረዳው መረጃ (Territorial Division)' : 'Woreda Office Details'}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የወረዳ ስም (English)' : 'Woreda Name (English)'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Basona Werana"
                      value={woredaForm.name}
                      onChange={(e) => setWoredaForm({ ...woredaForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የአማርኛ ስም' : 'Amharic Name'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ምሳሌ፡ ባሶና ወራና"
                      value={woredaForm.nameAm}
                      onChange={(e) => setWoredaForm({ ...woredaForm, nameAm: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ልዩ የወረዳ ኮድ (Unique Code)' : 'Unique Woreda Code'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                      value={woredaForm.code}
                      onChange={(e) => setWoredaForm({ ...woredaForm, code: e.target.value.toUpperCase() })}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Format: NSZ-W01 to NSZ-W99 (Guaranteed unique index)
                    </small>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'አስተዳደራዊ ምድብ' : 'Administration Type'} *
                    </label>
                    <select
                      className="form-control"
                      value={woredaForm.adminType}
                      onChange={(e) => setWoredaForm({ ...woredaForm, adminType: e.target.value })}
                    >
                      <option value="RURAL_WOREDA">Rural Woreda (የገጠር ወረዳ)</option>
                      <option value="CITY_ADMIN">City Administration (የከተማ አስተዳደር)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የህዝብ ብዛት' : 'Estimated Population'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 85000"
                      value={woredaForm.population}
                      onChange={(e) => setWoredaForm({ ...woredaForm, population: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'አባወራዎች' : 'Estimated Households'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 20000"
                      value={woredaForm.householdCount}
                      onChange={(e) => setWoredaForm({ ...woredaForm, householdCount: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Officer Login Credentials */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.35rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <Key size={15} />
                  2. {currentLang === 'am' ? 'የወረዳ ንግድ ኃላፊ መለያ (Officer Login Account)' : 'Assigned Woreda Officer Account'}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ሙሉ ስም' : 'Officer Full Name'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Abebe Bikila"
                      value={woredaForm.officerFullName}
                      onChange={(e) => setWoredaForm({ ...woredaForm, officerFullName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የተጠቃሚ ስም (Username)' : 'Username'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. basona_officer"
                      value={woredaForm.officerUsername}
                      onChange={(e) => setWoredaForm({ ...woredaForm, officerUsername: e.target.value.toLowerCase().trim() })}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Must be unique across the entire system.
                    </small>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +251 911 223344"
                      value={woredaForm.officerPhone}
                      onChange={(e) => setWoredaForm({ ...woredaForm, officerPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ኢሜል (Email)' : 'Email'}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. officer@northshewa.gov.et"
                      value={woredaForm.officerEmail}
                      onChange={(e) => setWoredaForm({ ...woredaForm, officerEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentLang === 'am' ? 'ጊዜያዊ የይለፍ ቃል' : 'Initial Password'} *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    placeholder="••••••••"
                    value={woredaForm.officerPassword}
                    onChange={(e) => setWoredaForm({ ...woredaForm, officerPassword: e.target.value })}
                  />
                  <PasswordRequirements
                    password={woredaForm.officerPassword}
                    username={woredaForm.officerUsername}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowWoredaModal(false)}
                  disabled={submittingWoreda}
                >
                  {currentLang === 'am' ? 'ይቅር' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingWoreda}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <ShieldCheck size={16} />
                  <span>
                    {submittingWoreda
                      ? (currentLang === 'am' ? 'በመመዝገብ ላይ...' : 'Provisioning...')
                      : (currentLang === 'am' ? 'ወረዳ እና ኃላፊ መዝግብ' : 'Create Woreda & User')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
