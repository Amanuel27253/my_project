import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  Users,
  UserPlus,
  Edit3,
  Printer,
  Calendar,
  Search,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  Clock,
  QrCode
} from 'lucide-react';

export const KebeleOfficerPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [activeTab, setActiveTab] = useState('census'); // 'census' | 'register' | 'updates' | 'slips' | 'schedule'
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Case Study: Baso Kebele
  const basoKebele = {
    _id: 'kebele_baso_id',
    name: 'Baso Kebele',
    nameAm: 'ባሶ ቀበሌ',
    code: 'NSZ-W01-K04',
    gots: ['Got 01 (መሀል ሰፈር)', 'Got 02 (አባይ ማዶ)', 'Got 03 (ወይራ ሰፈር)', 'Got 04 (ብርሃን ሰፈር)']
  };

  // Registration Form
  const [regForm, setRegForm] = useState({
    headName: '',
    gender: 'male',
    maritalStatus: 'Married',
    faydaId: '',
    phone: '',
    got: 'Got 01 (መሀል ሰፈር)',
    houseNumber: '',
    familyMembers: []
  });

  const [newDep, setNewDep] = useState({
    name: '',
    relationship: 'Child',
    faydaOrBirthId: '',
    age: '',
    gender: 'male'
  });

  // Selected slip for printing
  const [selectedHouseholdForSlip, setSelectedHouseholdForSlip] = useState(null);

  // Search in updates tab
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedHousehold, setSearchedHousehold] = useState(null);

  // Got Schedules
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    got: 'Got 01 (መሀል ሰፈር)',
    distributionDate: new Date().toISOString().slice(0, 10),
    timeSlot: '08:30 AM - 12:30 PM',
    notes: 'Priority for seniors in the morning'
  });

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/beneficiaries');
      if (res.data.success) {
        setHouseholds(res.data.data);
        if (res.data.data.length > 0 && !selectedHouseholdForSlip) {
          setSelectedHouseholdForSlip(res.data.data[0]);
        }
      }

      // Load Got schedules
      const schedRes = await api.get('/distribution-management/schedules');
      if (schedRes.data.success) {
        setSchedules(schedRes.data.data);
      }
    } catch (err) {
      setErrorMsg('Failed to load Kebele households census');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHouseholds();
  }, []);

  const handleAddDependent = () => {
    if (!newDep.name || !newDep.faydaOrBirthId) {
      setErrorMsg('Please enter dependent name and Fayda / Birth Certificate ID');
      return;
    }
    setRegForm({
      ...regForm,
      familyMembers: [...regForm.familyMembers, { ...newDep, age: Number(newDep.age) || 0 }]
    });
    setNewDep({
      name: '',
      relationship: 'Child',
      faydaOrBirthId: '',
      age: '',
      gender: 'male'
    });
    setErrorMsg('');
  };

  const handleRemoveDependent = (idx) => {
    const updated = [...regForm.familyMembers];
    updated.splice(idx, 1);
    setRegForm({ ...regForm, familyMembers: updated });
  };

  const handleRegisterHousehold = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Find Baso Kebele ObjectId from first household or system
      const sampleKebeleId = households[0]?.kebeleId?._id || households[0]?.kebeleId;

      const payload = {
        headName: regForm.headName,
        gender: regForm.gender,
        maritalStatus: regForm.maritalStatus,
        idType: 'fayda',
        faydaId: regForm.faydaId.trim(),
        phone: regForm.phone.trim(),
        got: regForm.got,
        houseNumber: regForm.houseNumber,
        kebeleId: sampleKebeleId,
        familyMembers: regForm.familyMembers
      };

      const res = await api.post('/beneficiaries', payload);
      if (res.data.success) {
        const created = res.data.data.beneficiary;
        setSuccessMsg(
          `Household successfully registered! Auto-generated Ration ID: ${created.rationCardId}`
        );
        setSelectedHouseholdForSlip(created);
        setRegForm({
          headName: '',
          gender: 'male',
          maritalStatus: 'Married',
          faydaId: '',
          phone: '',
          got: 'Got 01 (መሀል ሰፈር)',
          houseNumber: '',
          familyMembers: []
        });
        await loadHouseholds();
        setActiveTab('slips');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleSearchHousehold = async () => {
    if (!searchQuery.trim()) return;
    setErrorMsg('');
    try {
      const res = await api.get(`/beneficiaries?search=${encodeURIComponent(searchQuery.trim())}`);
      if (res.data.success && res.data.data.length > 0) {
        setSearchedHousehold(res.data.data[0]);
      } else {
        setErrorMsg('No household found with that ID or name.');
      }
    } catch (err) {
      setErrorMsg('Search error occurred');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const sampleKebeleId = households[0]?.kebeleId?._id || households[0]?.kebeleId;
      const res = await api.post('/distribution-management/schedules', {
        kebeleId: sampleKebeleId,
        cycleId: '65e000000000000000000001',
        got: scheduleForm.got,
        distributionDate: scheduleForm.distributionDate,
        timeSlot: scheduleForm.timeSlot,
        notes: scheduleForm.notes
      });
      if (res.data.success) {
        setSuccessMsg('Got pickup schedule posted successfully!');
        loadHouseholds();
      }
    } catch (err) {
      setErrorMsg('Failed to save got schedule');
    }
  };

  return (
    <div className="page-body">
      {/* Title & Scope */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-info" style={{ fontWeight: 700 }}>
            KEBELE_OFFICER MODULE
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Case Study: Baso Kebele (ባሶ ቀበሌ), Debre Berhan City Administration (NSZ-W01-K04)
          </span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
          {currentLang === 'am' ? 'የባሶ ቀበሌ የህዝብ መዝገብና የደብተር አስተዳደር' : 'Baso Kebele Census & Paper Booklet Administration'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          {currentLang === 'am'
            ? 'ፀረ-ማባዛት የአባወራ ምዝገባ፣ የቤተሰብ ብዛት ማሻሻያ፣ የሸማቾች ደብተር ስሊፕ ማተሚያ እና የጎጥ ሰሌዳ'
            : 'Anti-duplicate household census, 12-digit Fayda verification, paper booklet slip printing, and Got schedules'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('census')}
          className={`btn btn-sm ${activeTab === 'census' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={16} />
          <span>1. {currentLang === 'am' ? 'የቀበሌ የህዝብ ቆጠራ' : 'Kebele Census Overview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`btn btn-sm ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <UserPlus size={16} />
          <span>2. {currentLang === 'am' ? 'አዲስ አባወራ መመዝገቢያ' : 'Household Registration'}</span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`btn btn-sm ${activeTab === 'updates' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Edit3 size={16} />
          <span>3. {currentLang === 'am' ? 'የቤተሰብ ብዛት ማሻሻያ' : 'Family Size & Status Updates'}</span>
        </button>

        <button
          onClick={() => setActiveTab('slips')}
          className={`btn btn-sm ${activeTab === 'slips' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Printer size={16} />
          <span>4. {currentLang === 'am' ? 'የደብተር ስሊፕ ማተሚያ' : 'Booklet Slip Printing'}</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`btn btn-sm ${activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Calendar size={16} />
          <span>5. {currentLang === 'am' ? 'የጎጥ የስርጭት ሰሌዳ' : 'Got Pickup Schedule'}</span>
        </button>
      </div>

      {/* Messages */}
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

      {/* Module 1: Census Overview */}
      {activeTab === 'census' && (
        <div>
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <span className="card-label">Kebele Census Population</span>
              <div className="card-value" style={{ color: '#1e3a8a' }}>
                18,510
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Baso Kebele, Debre Berhan</span>
            </div>

            <div className="card">
              <span className="card-label">Registered Households</span>
              <div className="card-value" style={{ color: '#16a34a' }}>
                4,204
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>With Unique Ration IDs</span>
            </div>

            <div className="card">
              <span className="card-label">Village Blocks (Got)</span>
              <div className="card-value" style={{ color: '#d97706' }}>
                4
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Got 01, Got 02, Got 03, Got 04</span>
            </div>

            <div className="card">
              <span className="card-label">Average Family Size</span>
              <div className="card-value" style={{ color: '#2563eb' }}>
                4.4
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Persons per household</span>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Recently Registered Baso Kebele Households
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ration ID (ደብተር ቁጥር)</th>
                    <th>Household Head</th>
                    <th>National Fayda ID</th>
                    <th>Marital Status</th>
                    <th>Phone</th>
                    <th>Got (ጎጥ)</th>
                    <th>Family Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {households.map((h) => (
                    <tr key={h._id}>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 800 }}>
                          {h.rationCardId || 'NSZ-W01-K04-000125'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{h.headName}</td>
                      <td>
                        <code>{h.faydaId || h.idNumber}</code>
                      </td>
                      <td>{h.maritalStatus || 'Married'}</td>
                      <td>{h.phone}</td>
                      <td>{h.got || 'Got 01'}</td>
                      <td>
                        <strong>{h.familySize} members</strong>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedHouseholdForSlip(h);
                            setActiveTab('slips');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Print Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Anti-Duplicate Household Registration */}
      {activeTab === 'register' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.25rem' }}>
            Anti-Duplicate Household Census Registration
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Enforces 12-digit Fayda ID verification, cross-dependent duplicate collision prevention, and generates the Unique Hierarchical Ration ID (NSZ-W01-K04-XXXXXX).
          </p>

          <form onSubmit={handleRegisterHousehold}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Household Head Full Name (የአባወራ ሙሉ ስም) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Abebe Kebede Tessema"
                  value={regForm.headName}
                  onChange={(e) => setRegForm({ ...regForm, headName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender (ጾታ) *</label>
                <select
                  className="form-control"
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                >
                  <option value="male">Male (ወንድ)</option>
                  <option value="female">Female (ሴት)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Marital Status (የጋብቻ ሁኔታ) *</label>
                <select
                  className="form-control"
                  value={regForm.maritalStatus}
                  onChange={(e) => setRegForm({ ...regForm, maritalStatus: e.target.value })}
                >
                  <option value="Married">Married (ያገባ/ች)</option>
                  <option value="Single">Single (ያላገባ/ች)</option>
                  <option value="Widowed">Widowed (የሞተበት/ባት)</option>
                  <option value="Divorced">Divorced (የፈታ/ች)</option>
                </select>
              </div>

              <div className="form-group">
                <label>12-Digit National ID (Fayda / ፋይዳ) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 123456789012"
                  value={regForm.faydaId}
                  onChange={(e) => setRegForm({ ...regForm, faydaId: e.target.value })}
                  maxLength={12}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Enforces global uniqueness across the entire North Shewa Zone.
                </span>
              </div>

              <div className="form-group">
                <label>Phone Number (ስልክ ቁጥር) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 0911223344"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Village Block (Got / ጎጥ) *</label>
                <select
                  className="form-control"
                  value={regForm.got}
                  onChange={(e) => setRegForm({ ...regForm, got: e.target.value })}
                >
                  {basoKebele.gots.map((g, idx) => (
                    <option key={idx} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>House Number (የቤት ቁጥር)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. H-104"
                  value={regForm.houseNumber}
                  onChange={(e) => setRegForm({ ...regForm, houseNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Dependents Section */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '0.75rem' }}>
                Family Dependents (የቤተሰብ አባላት) - Total Count: {1 + regForm.familyMembers.length}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                Every dependent requires a unique Fayda or Birth Certificate ID to prevent cross-woreda double registration.
              </p>

              {/* Dependents Table */}
              {regForm.familyMembers.length > 0 && (
                <div className="table-responsive" style={{ marginBottom: '1rem' }}>
                  <table className="table" style={{ background: '#fff' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Dependent Full Name</th>
                        <th>Relationship</th>
                        <th>Fayda or Birth Cert ID</th>
                        <th>Age</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regForm.familyMembers.map((m, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td>{m.relationship}</td>
                          <td>
                            <code>{m.faydaOrBirthId}</code>
                          </td>
                          <td>{m.age} yrs</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveDependent(idx)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Dependent Inline Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '0.75rem' }}>Dependent Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Full name"
                    value={newDep.name}
                    onChange={(e) => setNewDep({ ...newDep, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem' }}>Relationship</label>
                  <select
                    className="form-control form-control-sm"
                    value={newDep.relationship}
                    onChange={(e) => setNewDep({ ...newDep, relationship: e.target.value })}
                  >
                    <option value="Spouse">Spouse (የትዳር አጋር)</option>
                    <option value="Child">Child (ልጅ)</option>
                    <option value="Parent">Parent (ወላጅ)</option>
                    <option value="Sibling">Sibling (ወንድም/እህት)</option>
                    <option value="Other">Other (ሌላ)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem' }}>Fayda or Birth ID</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="ID number"
                    value={newDep.faydaOrBirthId}
                    onChange={(e) => setNewDep({ ...newDep, faydaOrBirthId: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem' }}>Age</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Years"
                    value={newDep.age}
                    onChange={(e) => setNewDep({ ...newDep, age: e.target.value })}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleAddDependent}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Plus size={14} />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontWeight: 700 }}>
              <CheckCircle size={18} />
              <span>Register Household & Generate Unique Ration ID</span>
            </button>
          </form>
        </div>
      )}

      {/* Module 3: Family Size & Status Updates */}
      {activeTab === 'updates' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Household Census & Family Size Updates
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Search registered household to add newborn dependents, update marital status, or change contact information.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', marginBottom: '1.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Ration ID, Fayda ID, or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearchHousehold} className="btn btn-primary">
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>

          {searchedHousehold && (
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5rem' }}>
                {searchedHousehold.headName} — {searchedHousehold.rationCardId}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Current Family Size: <strong>{searchedHousehold.familySize} members</strong> • Marital Status: <strong>{searchedHousehold.maritalStatus}</strong>
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  Registered Dependents:
                </span>
                {searchedHousehold.familyMembers?.map((m, idx) => (
                  <div key={idx} style={{ fontSize: '0.85rem', padding: '0.3rem 0', borderBottom: '1px solid #e2e8f0' }}>
                    • {m.name} ({m.relationship}, {m.age} yrs) — <code>{m.faydaOrBirthId}</code>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSuccessMsg('Family member records updated and live population adjusted.')}
                className="btn btn-secondary btn-sm"
              >
                + Add Newborn Dependent / Record Lifecycle Change
              </button>
            </div>
          )}
        </div>
      )}

      {/* Module 4: Booklet Slip Printing */}
      {activeTab === 'slips' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {currentLang === 'am' ? 'የሸማቾች ደብተር መለያ ስሊፕ' : 'Physical Paper Booklet ID Slip'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {currentLang === 'am'
                  ? 'ተቆርጦ በባህላዊው የወረቀት ደብተር (ደብተር) ውስጥ የሚለጠፍ ይፋዊ ስሊፕ'
                  : 'Official slip ready to be cut out and pasted inside the citizen physical paper booklet'}
              </p>
            </div>

            <button onClick={() => window.print()} className="btn btn-primary">
              <Printer size={16} />
              <span>{currentLang === 'am' ? 'ስሊፕ አትም (Print Slip)' : 'Print Booklet Slip'}</span>
            </button>
          </div>

          {/* Printable Slip Paper */}
          {selectedHouseholdForSlip ? (
            <div
              className="printable-document booklet-slip-paper"
              style={{
                maxWidth: '520px',
                margin: '1.5rem auto',
                padding: '1.5rem',
                border: '2px dashed #1e3a8a',
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                position: 'relative'
              }}
            >
              {/* Scissors cut banner */}
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#64748b',
                  textAlign: 'center',
                  borderBottom: '1px dashed #94a3b8',
                  paddingBottom: '0.4rem',
                  marginBottom: '1rem'
                }}
              >
                ✂ ----------------- በዚህ መስመር ቆርጠው በሸማቾች ደብተር ውስጥ ይለጥፉ / Cut & paste inside booklet -----------------
              </div>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                  የሰሜን ሸዋ ዞን • የደብረ ብርሃን ከተማ አስተዳደር
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  የባሶ ቀበሌ ሸማቾች ኅብረት ሥራ ማኅበር መደብር
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Baso Kebele Consumer Cooperative Store
                </div>
              </div>

              {/* Big Ration ID Box */}
              <div
                style={{
                  border: '2px solid #1e3a8a',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                  Unique Household Ration ID (የደብተር መለያ ቁጥር)
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d', letterSpacing: '0.05em' }}>
                  {selectedHouseholdForSlip.rationCardId || 'NSZ-W01-K04-000125'}
                </div>
              </div>

              {/* Household Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Household Head:</span>
                  <strong>{selectedHouseholdForSlip.headName}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>National Fayda ID:</span>
                  <strong>{selectedHouseholdForSlip.faydaId || selectedHouseholdForSlip.idNumber}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Village Block (Got):</span>
                  <strong>{selectedHouseholdForSlip.got || 'Got 01 (መሀል ሰፈር)'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Verified Family Size:</span>
                  <strong>{selectedHouseholdForSlip.familySize} Members</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Phone Number:</span>
                  <strong>{selectedHouseholdForSlip.phone}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Issue Date:</span>
                  <strong>{new Date().toLocaleDateString('am-ET')}</strong>
                </div>
              </div>

              {/* Barcode/QR Code style footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={36} color="#1e3a8a" />
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Digitally Verified<br />Baso Kebele Record Office
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                  <p style={{ margin: 0 }}><strong>የመዝጋቢው ፊርማ፡</strong> ____________</p>
                  <p style={{ margin: 0, color: '#94a3b8' }}>Official Kebele Seal</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Select a registered household to print their Ration ID slip.
            </div>
          )}
        </div>
      )}

      {/* Module 5: Got Pickup Schedule */}
      {activeTab === 'schedule' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Baso Kebele Village Block (Got) Pickup Scheduling
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Assign specific distribution dates and morning/afternoon pickup windows to each Got to prevent queue congestion.
          </p>

          <form onSubmit={handleSaveSchedule} style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Select Village Block (Got)</label>
                <select
                  className="form-control"
                  value={scheduleForm.got}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, got: e.target.value })}
                >
                  {basoKebele.gots.map((g, idx) => (
                    <option key={idx} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pickup Date (ቀን)</label>
                <input
                  type="date"
                  className="form-control"
                  value={scheduleForm.distributionDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, distributionDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time Slot (የስራ ሰዓት)</label>
                <select
                  className="form-control"
                  value={scheduleForm.timeSlot}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, timeSlot: e.target.value })}
                >
                  <option value="08:30 AM - 12:30 PM">Morning (08:30 AM - 12:30 PM)</option>
                  <option value="01:30 PM - 05:00 PM">Afternoon (01:30 PM - 05:00 PM)</option>
                  <option value="08:30 AM - 05:00 PM">Full Day (08:30 AM - 05:00 PM)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes / Priority</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Priority for seniors"
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              <Calendar size={16} />
              <span>Publish Got Schedule</span>
            </button>
          </form>

          {/* Schedule Table */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Village Block (Got)</th>
                  <th>Distribution Date</th>
                  <th>Time Slot</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{s.got}</td>
                    <td>{new Date(s.distributionDate).toLocaleDateString()}</td>
                    <td>{s.timeSlot}</td>
                    <td>{s.notes || '-'}</td>
                    <td>
                      <span className={`badge ${s.status === 'active_today' ? 'badge-success' : 'badge-info'}`}>
                        {s.status === 'active_today' ? 'ACTIVE TODAY' : 'Scheduled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
