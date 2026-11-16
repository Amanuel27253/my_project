import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  Building2,
  Users,
  Layers,
  FileText,
  ArrowRightLeft,
  Printer,
  CheckCircle,
  AlertTriangle,
  Plus,
  Calendar,
  DollarSign,
  UserPlus,
  Key,
  Lock,
  ShieldCheck,
  X
} from 'lucide-react';
import { PasswordRequirements } from '../components/PasswordRequirements';

export const WoredaOfficerPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'kebeles' | 'allocation' | 'letter' | 'transfers' | 'staff'
  const [woredaData, setWoredaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delegated Staff Provisioning State
  const [staffList, setStaffList] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    role: 'KEBELE_OFFICER',
    locationId: ''
  });

  // Option A: Add Kebele & Officer State
  const [showKebeleModal, setShowKebeleModal] = useState(false);
  const [submittingKebele, setSubmittingKebele] = useState(false);
  const [kebeleForm, setKebeleForm] = useState({
    name: '',
    nameAm: '',
    code: '',
    population: '',
    householdCount: '',
    gotsString: 'Got 01 (መሀል ሰፈር), Got 02 (አባይ ማዶ), Got 03 (ወይራ ሰፈር)',
    officerFullName: '',
    officerUsername: '',
    officerPassword: '',
    officerPhone: '',
    officerEmail: ''
  });

  // Option A: Add Distributor & Storekeeper State
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [submittingDistributor, setSubmittingDistributor] = useState(false);
  const [distributorForm, setDistributorForm] = useState({
    kebeleId: '',
    name: '',
    nameAm: '',
    code: '',
    contactPhone: '',
    address: '',
    storekeeperFullName: '',
    storekeeperUsername: '',
    storekeeperPassword: '',
    storekeeperPhone: '',
    storekeeperEmail: ''
  });

  const handleOpenAddKebele = async () => {
    try {
      const codeRes = await api.get('/locations/next-code?type=kebele');
      const suggestedCode = codeRes.data?.data?.nextCode || '';
      setKebeleForm({
        name: '',
        nameAm: '',
        code: suggestedCode,
        population: '',
        householdCount: '',
        gotsString: 'Got 01 (መሀል ሰፈር), Got 02 (አባይ ማዶ), Got 03 (ወይራ ሰፈር)',
        officerFullName: '',
        officerUsername: '',
        officerPassword: '',
        officerPhone: '',
        officerEmail: ''
      });
      setShowKebeleModal(true);
    } catch {
      setShowKebeleModal(true);
    }
  };

  const handleSubmitKebele = async (e) => {
    e.preventDefault();
    setSubmittingKebele(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const gots = kebeleForm.gotsString
        ? kebeleForm.gotsString.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const payload = {
        name: kebeleForm.name,
        nameAm: kebeleForm.nameAm,
        code: kebeleForm.code,
        population: Number(kebeleForm.population) || 0,
        householdCount: Number(kebeleForm.householdCount) || 0,
        gots,
        officer: {
          fullName: kebeleForm.officerFullName,
          username: kebeleForm.officerUsername,
          password: kebeleForm.officerPassword,
          phone: kebeleForm.officerPhone,
          email: kebeleForm.officerEmail
        }
      };
      const res = await api.post('/locations/kebele-with-officer', payload);
      if (res.data.success) {
        setSuccessMsg(
          `Kebele '${res.data.data.kebele.name}' (${res.data.data.kebele.code}) created! Kebele Officer '${res.data.data.officer.username}' can now log in.`
        );
        setShowKebeleModal(false);
        await loadWoredaData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create Kebele and Officer');
    } finally {
      setSubmittingKebele(false);
    }
  };

  const handleOpenAddDistributor = (presetKebeleId = null) => {
    const targetKebeleId = presetKebeleId || woredaData?.kebeleStats?.[0]?._id || '';
    let suggestedCode = '';
    let kebeleName = '';
    if (targetKebeleId) {
      const targetK = woredaData?.kebeleStats?.find(k => k._id === targetKebeleId);
      if (targetK) {
        kebeleName = targetK.name;
        suggestedCode = `DIST-${targetK.code}`;
      }
    }
    setDistributorForm({
      kebeleId: targetKebeleId,
      name: kebeleName ? `${kebeleName} Consumer Cooperative Store` : '',
      nameAm: '',
      code: suggestedCode,
      contactPhone: '',
      address: '',
      storekeeperFullName: '',
      storekeeperUsername: '',
      storekeeperPassword: '',
      storekeeperPhone: '',
      storekeeperEmail: ''
    });
    setShowDistributorModal(true);
  };

  const handleKebeleChangeForDistributor = (kId) => {
    const targetK = woredaData?.kebeleStats?.find(k => k._id === kId);
    let suggestedCode = '';
    let kebeleName = '';
    if (targetK) {
      kebeleName = targetK.name;
      suggestedCode = `DIST-${targetK.code}`;
    }
    setDistributorForm(prev => ({
      ...prev,
      kebeleId: kId,
      name: kebeleName ? `${kebeleName} Consumer Cooperative Store` : prev.name,
      code: suggestedCode
    }));
  };

  const handleSubmitDistributor = async (e) => {
    e.preventDefault();
    setSubmittingDistributor(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: distributorForm.name,
        nameAm: distributorForm.nameAm,
        code: distributorForm.code,
        kebeleId: distributorForm.kebeleId,
        contactPhone: distributorForm.contactPhone,
        address: distributorForm.address,
        storekeeper: {
          fullName: distributorForm.storekeeperFullName,
          username: distributorForm.storekeeperUsername,
          password: distributorForm.storekeeperPassword,
          phone: distributorForm.storekeeperPhone,
          email: distributorForm.storekeeperEmail
        }
      };
      const res = await api.post('/locations/distributor-with-storekeeper', payload);
      if (res.data.success) {
        setSuccessMsg(
          `Distributor '${res.data.data.distributor.name}' (${res.data.data.distributor.code}) registered! Storekeeper '${res.data.data.storekeeper.username}' can now log in.`
        );
        setShowDistributorModal(false);
        await loadWoredaData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register Distributor and Storekeeper');
    } finally {
      setSubmittingDistributor(false);
    }
  };

  // Allocation Form
  const [selectedKebeleId, setSelectedKebeleId] = useState('');
  const [allocationItems, setAllocationItems] = useState([
    {
      goodsId: '',
      goodsName: 'Edible Cooking Oil',
      allocatedQuantity: 5000,
      quotaPerPerson: 2,
      maxPerHousehold: 10,
      unitPrice: 130
    },
    {
      goodsId: '',
      goodsName: 'Sugar',
      allocatedQuantity: 4000,
      quotaPerPerson: 2,
      maxPerHousehold: 8,
      unitPrice: 75
    }
  ]);

  // Allocation Letter State
  const [letterData, setLetterData] = useState(null);
  const [loadingLetter, setLoadingLetter] = useState(false);

  // Transfers
  const [transfers, setTransfers] = useState([]);

  const loadWoredaData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/distribution-management/woreda/dashboard');
      if (res.data.success) {
        setWoredaData(res.data.data);
        if (res.data.data.kebeleStats && res.data.data.kebeleStats.length > 0) {
          const baso = res.data.data.kebeleStats.find(k => k.code === 'NSZ-W01-K04') || res.data.data.kebeleStats[0];
          setSelectedKebeleId(baso._id);
        }
      }

      // Fetch transfer requests
      const benRes = await api.get('/beneficiaries?status=transferred');
      if (benRes.data.success) {
        setTransfers(benRes.data.data);
      }

      // Fetch delegated staff in this woreda
      await loadStaffUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load Woreda data');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setStaffList(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load staff list:', err.message);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...staffForm,
        mustChangePassword: true
      };
      const res = await api.post('/users', payload);
      if (res.data.success) {
        setSuccessMsg(
          currentLang === 'am'
            ? `የሰራተኛ አካውንት '${staffForm.username}' በተሳካ ሁኔታ ተመዝግቧል። የመጀመሪያ መግቢያ የይለፍ ቃል መቀየር ግዴታ ነው።`
            : `Staff account '${staffForm.username}' provisioned successfully with temporary password (forced reset on first login).`
        );
        setShowStaffModal(false);
        setStaffForm({
          fullName: '',
          username: '',
          password: '',
          phone: '',
          email: '',
          role: 'KEBELE_OFFICER',
          locationId: ''
        });
        loadStaffUsers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to provision staff account');
    }
  };

  const handleResetStaffPassword = async (e) => {
    e.preventDefault();
    if (!selectedStaffUser || !resetPasswordValue) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/users/${selectedStaffUser._id}/reset-password`, {
        newPassword: resetPasswordValue,
        mustChangePassword: true
      });
      if (res.data.success) {
        setSuccessMsg(
          currentLang === 'am'
            ? `የ'${selectedStaffUser.username}' የይለፍ ቃል ተቀይሯል። በሚቀጥለው መግቢያ ላይ መቀየር ግዴታ ነው።`
            : `Password for '${selectedStaffUser.username}' reset successfully (forced reset on next login).`
        );
        setShowResetModal(false);
        setResetPasswordValue('');
        setSelectedStaffUser(null);
        loadStaffUsers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password');
    }
  };

  useEffect(() => {
    loadWoredaData();
  }, []);

  const loadLetter = async (kebeleId) => {
    if (!woredaData?.activeCycle?._id || !kebeleId) return;
    try {
      setLoadingLetter(true);
      const res = await api.get(`/distribution-management/woreda/allocation-letter/${woredaData.activeCycle._id}/${kebeleId}`);
      if (res.data.success) {
        setLetterData(res.data.data);
      }
    } catch (err) {
      console.warn('Letter not ready:', err.response?.data?.message);
    } finally {
      setLoadingLetter(false);
    }
  };

  useEffect(() => {
    if (selectedKebeleId && woredaData?.activeCycle) {
      loadLetter(selectedKebeleId);
    }
  }, [selectedKebeleId, woredaData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-body">
      {/* Scope Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-info" style={{ fontWeight: 700 }}>
            WOREDA_OFFICER MODULE
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {woredaData?.woreda?.name
              ? `${woredaData.woreda.name} Trade Office${woredaData.woreda.nameAm ? ` (${woredaData.woreda.nameAm})` : ''}`
              : 'Woreda Administration Trade Office'}
          </span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
          {currentLang === 'am'
            ? (woredaData?.woreda?.nameAm ? `የ${woredaData.woreda.nameAm} ንግድና ገበያ ልማት ጽ/ቤት` : 'የወረዳው ንግድና ገበያ ልማት ጽ/ቤት')
            : (woredaData?.woreda?.name ? `${woredaData.woreda.name} Trade & Market Administration` : 'Woreda Trade & Market Administration')}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          {currentLang === 'am'
            ? 'የቀበሌዎችና የሸማቾች ማህበራት ክትትል፣ የቀበሌ ድልድል እና ይፋዊ የድልድል ደብዳቤ ማመንጫ'
            : 'Kebele cooperative store oversight, census-based quota allocation, and official allocation letters'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Building2 size={16} />
          <span>1. {currentLang === 'am' ? 'የከተማው ዳሽቦርድ' : 'Woreda Dashboard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('kebeles')}
          className={`btn btn-sm ${activeTab === 'kebeles' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={16} />
          <span>2. {currentLang === 'am' ? 'ቀበሌዎችና ህብረት ስራ ማህበራት' : 'Kebeles & Cooperatives'}</span>
        </button>

        <button
          onClick={() => setActiveTab('allocation')}
          className={`btn btn-sm ${activeTab === 'allocation' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={16} />
          <span>3. {currentLang === 'am' ? 'የቀበሌ ስቶክ ድልድል' : 'Kebele Stock Allocation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('letter')}
          className={`btn btn-sm ${activeTab === 'letter' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={16} />
          <span>4. {currentLang === 'am' ? 'ይፋዊ የድልድል ደብዳቤ' : 'Allocation Letter (ደብዳቤ)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`btn btn-sm ${activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ArrowRightLeft size={16} />
          <span>5. {currentLang === 'am' ? 'የነዋሪዎች ዝውውር' : 'Resident Transfers'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('staff');
            loadStaffUsers();
          }}
          className={`btn btn-sm ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <UserPlus size={16} />
          <span>6. {currentLang === 'am' ? 'የሰራተኞች ምዝገባ (Staff)' : 'Delegated Staff Provisioning'}</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {successMsg}
        </div>
      )}

      {/* Module 1: Woreda Dashboard */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="grid-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <span className="card-label">{currentLang === 'am' ? 'ወረዳ / ከተማ አስተዳደር' : 'Woreda / City Administration'}</span>
              <div className="card-value" style={{ color: '#1e3a8a' }}>
                {currentLang === 'am' ? (woredaData?.woreda?.nameAm || woredaData?.woreda?.name || 'Woreda') : (woredaData?.woreda?.name || 'Woreda')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Woreda Code: {woredaData?.woreda?.code || 'NSZ-W01'}</span>
            </div>

            <div className="card">
              <span className="card-label">Total City Population</span>
              <div className="card-value" style={{ color: '#16a34a' }}>
                {woredaData?.woreda?.population?.toLocaleString() || '175,000'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Census Population</span>
            </div>

            <div className="card">
              <span className="card-label">Total Households</span>
              <div className="card-value" style={{ color: '#d97706' }}>
                {woredaData?.woreda?.householdCount?.toLocaleString() || '42,000'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Across all city Kebeles</span>
            </div>

            <div className="card">
              <span className="card-label">Case Study Kebele</span>
              <div className="card-value" style={{ color: '#2563eb' }}>
                Baso Kebele
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: NSZ-W01-K04</span>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Live Kebele Demographics Breakdown
            </h3>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kebele Code</th>
                    <th>Kebele Name</th>
                    <th>Cooperative Store</th>
                    <th>Registered Households</th>
                    <th>Live Population</th>
                    <th>Village Blocks (Got)</th>
                  </tr>
                </thead>
                <tbody>
                  {woredaData?.kebeleStats?.map((k) => (
                    <tr
                      key={k._id}
                      style={{ background: k.code === 'NSZ-W01-K04' ? '#f0fdf4' : 'inherit' }}
                    >
                      <td>
                        <span className="badge badge-info">{k.code}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {k.name} ({k.nameAm})
                        {k.code === 'NSZ-W01-K04' && (
                          <span className="badge badge-success" style={{ marginLeft: '0.4rem' }}>
                            Case Study
                          </span>
                        )}
                      </td>
                      <td>{k.store?.name || 'Consumer Cooperative Store'}</td>
                      <td>{k.householdCount?.toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{k.population?.toLocaleString()}</td>
                      <td>{k.gots?.length || 4} Gots</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Kebeles & Cooperatives */}
      {activeTab === 'kebeles' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e3a8a' }}>
                {currentLang === 'am' ? 'የወረዳው ቀበሌዎችና የሸማቾች ኅብረት ሥራ ማህበራት' : 'Woreda Kebeles & Consumer Cooperative Stores'} ({woredaData?.kebeleStats?.length || 0})
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {currentLang === 'am'
                  ? 'እያንዳንዱ ቀበሌ የራሱ ልዩ መለያ (Unique ID)፣ የተመደበ ኃላፊ እና የተመደበ አከፋፋይ መደብር አለው'
                  : 'Option A: Each Kebele has a unique ID, provisioned officer, and dedicated cooperative distributor store'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleOpenAddKebele}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Plus size={15} />
                <span>{currentLang === 'am' ? 'አዲስ ቀበሌ እና ኃላፊ መዝግብ' : 'Add Kebele & Officer'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddDistributor()}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, background: '#059669', color: '#fff', border: 'none' }}
              >
                <Plus size={15} />
                <span>{currentLang === 'am' ? 'አከፋፋይ መደብር መዝግብ' : 'Add Distributor Store'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {woredaData?.kebeleStats?.map((k) => (
              <div
                key={k._id}
                style={{
                  padding: '1.25rem',
                  border: k.code === 'NSZ-W01-K04' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  background: '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-info" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
                      {k.code}
                    </span>
                    {k.code === 'NSZ-W01-K04' && <span className="badge badge-success">CASE STUDY</span>}
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                    {k.name} {k.nameAm ? `(${k.nameAm})` : ''}
                  </h4>

                  <div style={{
                    background: k.store ? '#f0fdf4' : '#fffbeb',
                    border: k.store ? '1px solid #bbf7d0' : '1px solid #fef3c7',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.6rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: k.store ? '#166534' : '#92400e', marginBottom: '0.15rem' }}>
                      {currentLang === 'am' ? 'የተመደበ አከፋፋይ መደብር' : 'Assigned Distributor Store'}:
                    </div>
                    {k.store ? (
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                          {k.store.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Code: <strong>{k.store.code || `DIST-${k.code}`}</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#b45309' }}>
                          {currentLang === 'am' ? 'አከፋፋይ አልተመደበም' : 'No store assigned yet'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenAddDistributor(k._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '2px 8px', height: 'auto', background: '#059669', color: '#fff', border: 'none' }}
                        >
                          + {currentLang === 'am' ? 'መደብር መዝግብ' : 'Assign Store'}
                        </button>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0' }}>
                    <strong>Census:</strong> {k.householdCount?.toLocaleString() || 0} households • {k.population?.toLocaleString() || 0} residents
                  </p>
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', display: 'block', marginBottom: '0.3rem' }}>
                    Active Village Blocks (Got):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {k.gots?.map((g, idx) => (
                      <span key={idx} style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module 3: Kebele Stock Allocation */}
      {activeTab === 'allocation' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Census-Based Proportional Stock Allocation to Kebeles
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            {currentLang === 'am'
              ? `ከ${woredaData?.woreda?.nameAm || woredaData?.woreda?.name || 'ወረዳው'} ወደ ቀበሌ ህብረት ስራ ማህበራት ሱቆች ድልድል ማስተላለፊያ እና የቤተሰብ መጠን ኮታ ደንቦች`
              : `Allocates incoming quota from ${woredaData?.woreda?.name || 'Woreda'} to Kebele cooperative stores and establishes family quota rules.`}
          </p>

          <div style={{ maxWidth: '600px' }}>
            <div className="form-group">
              <label>Select Target Kebele</label>
              <select
                className="form-control"
                value={selectedKebeleId}
                onChange={(e) => setSelectedKebeleId(e.target.value)}
              >
                {woredaData?.kebeleStats?.map((k) => (
                  <option key={k._id} value={k._id}>
                    {k.name} ({k.code}) - {k.householdCount} Households
                  </option>
                ))}
              </select>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e3a8a' }}>
                Commodity 1: Edible Cooking Oil (Liters)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Total Allocated Quantity (Liters)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[0].allocatedQuantity}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[0].allocatedQuantity = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Subsidized Unit Price (ETB)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[0].unitPrice}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[0].unitPrice = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Quota per Person (Liters)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[0].quotaPerPerson}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[0].quotaPerPerson = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Max Cap per Household (Liters)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[0].maxPerHousehold}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[0].maxPerHousehold = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e3a8a' }}>
                Commodity 2: Sugar (Kg)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Total Allocated Quantity (Kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[1].allocatedQuantity}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[1].allocatedQuantity = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Subsidized Unit Price (ETB)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[1].unitPrice}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[1].unitPrice = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Quota per Person (Kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[1].quotaPerPerson}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[1].quotaPerPerson = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem' }}>Max Cap per Household (Kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={allocationItems[1].maxPerHousehold}
                    onChange={(e) => {
                      const updated = [...allocationItems];
                      updated[1].maxPerHousehold = e.target.value;
                      setAllocationItems(updated);
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessMsg('Kebele stock allocation dispatched and Allocation Letter issued!');
                setActiveTab('letter');
              }}
              className="btn btn-primary"
            >
              <CheckCircle size={16} />
              <span>Confirm Kebele Allocation & Issue Letter</span>
            </button>
          </div>
        </div>
      )}

      {/* Module 4: Official Allocation Letter (የድልድል ደብዳቤ) */}
      {activeTab === 'letter' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }} className="no-print">
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {currentLang === 'am' ? 'ይፋዊ የስርጭት ድልድል ደብዳቤ' : 'Official Distribution Allocation Letter'}
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Case Study: Baso Kebele (NSZ-W01-K04)
              </span>
            </div>

            <button onClick={handlePrint} className="btn btn-primary">
              <Printer size={16} />
              <span>{currentLang === 'am' ? 'ይፋዊ ደብዳቤ አትም (Print Letter)' : 'Print Official Letter'}</span>
            </button>
          </div>

          {/* Printable Document Paper */}
          <div
            className="printable-document receipt-paper"
            style={{
              background: '#ffffff',
              padding: '2.5rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              maxWidth: '800px',
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              fontFamily: "'Times New Roman', serif",
              lineHeight: 1.6
            }}
          >
            {/* Letterhead */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                የሰሜን ሸዋ ዞን አስተዳደር
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                {woredaData?.woreda?.nameAm
                  ? `የ${woredaData.woreda.nameAm} ንግድና ገበያ ልማት ጽህፈት ቤት`
                  : 'የደብረ ብርሃን ከተማ አስተዳደር ንግድና ገበያ ልማት ጽህፈት ቤት'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                {woredaData?.woreda?.name
                  ? `${woredaData.woreda.name} Trade & Market Development Office`
                  : 'Debre Berhan City Administration Trade & Market Development Office'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem' }}>
                <span><strong>ቁጥር (Ref No):</strong> {letterData?.letterNumber || 'AL-NSZ-W01-2026-004'}</span>
                <span><strong>ቀን (Date):</strong> {new Date().toLocaleDateString('am-ET')}</span>
              </div>
            </div>

            {/* Recipient */}
            <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              <strong>ለ፡ </strong> {letterData?.storeNameAm || 'የባሶ ቀበሌ ሸማቾች ኅብረት ሥራ ማኅበር መደብር'}<br />
              <strong>ደብረ ብርሃን</strong>
            </div>

            {/* Subject */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 800, textDecoration: 'underline', fontSize: '1.05rem' }}>
              ጉዳዩ፡- የህዳር 2017 ወር የድጎማ መሰረታዊ ሸቀጦች ድልድል ማስተላለፍን ይመለከታል
            </div>

            {/* Body Text */}
            <p style={{ textIndent: '2rem', marginBottom: '1rem', textAlign: 'justify' }}>
              የደብረ ብርሃን ከተማ አስተዳደር ንግድና ገበያ ልማት ጽ/ቤት በሰሜን ሸዋ ዞን ንግድ መምሪያ የተመደበለትን የድጎማ የምግብ ዘይት፣ ስኳር እና ሌሎች መሰረታዊ ሸቀጦች በከተማው ስር ላሉ ቀበሌዎች በህዝብ ቁጥር ድርሻ መሰረት መድቧል።
            </p>
            <p style={{ textIndent: '2rem', marginBottom: '1.5rem', textAlign: 'justify' }}>
              በዚህም መሰረት ባሶ ቀበሌ ባለው {letterData?.totalHouseholds || '4,204'} የተመዘገቡ አባወራዎች እና {letterData?.totalPopulation || '18,510'} የህዝብ ቁጥር ድርሻ መሰረት ከዚህ በታች የተዘረዘሩት ሸቀጦች ተመድበው የተላኩ መሆኑን እያሳወቅን፣ በይፋዊው የድጎማ ጣሪያ ዋጋ መሰረት ለህብረተሰቡ በሸማቾች መታወቂያ ደብተር አማካኝነት እንድታከፋፍሉ እናሳስባለን።
            </p>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #94a3b8', padding: '0.5rem' }}>ተ.ቁ</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '0.5rem' }}>የሸቀጡ አይነት</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '0.5rem' }}>የተመደበ መጠን</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '0.5rem' }}>ለአንድ ሰው ኮታ</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '0.5rem' }}>ለአንድ ቤተሰብ ጣሪያ</th>
                  <th style={{ border: '1px solid #94a3b8', padding: '0.5rem' }}>የድጎማ ጣሪያ ዋጋ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', fontWeight: 700 }}>የምግብ ዘይት (Edible Oil)</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center', fontWeight: 800 }}>5,000 ሊትር</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>2 ሊትር</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>10 ሊትር</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>130 ብር / ሊትር</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>2</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', fontWeight: 700 }}>ስኳር (Sugar)</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center', fontWeight: 800 }}>4,000 ኪ.ግ</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>2 ኪ.ግ</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>8 ኪ.ግ</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>75 ብር / ኪ.ግ</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>3</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', fontWeight: 700 }}>የስንዴ ዱቄት (Wheat Flour)</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center', fontWeight: 800 }}>10,000 ኪ.ግ</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>10 ኪ.ግ</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center' }}>50 ኪ.ግ</td>
                  <td style={{ border: '1px solid #94a3b8', padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>65 ብር / ኪ.ግ</td>
                </tr>
              </tbody>
            </table>

            {/* Signature Area */}
            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p><strong>ያዘጋጀው፡</strong> አልማዝ በላይ (የንግድ ባለሙያ)</p>
                <p>ፊርማ፡ ___________________</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', border: '2px dashed #94a3b8', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                  ይፋዊ ማህተም (Official Stamp)
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <p><strong>ያፀደቀው፡</strong> የከተማው ንግድ ጽ/ቤት ኃላፊ</p>
                <p>ፊርማ፡ ___________________</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module 5: Resident Transfers */}
      {activeTab === 'transfers' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Inter-Kebele Resident Relocations & Ration ID Transfers
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            When a household relocates from one Kebele to another, the Woreda Officer reviews and approves the transfer, re-issuing a new Unique Ration ID for the destination Kebele.
          </p>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Household Head</th>
                  <th>Current Kebele</th>
                  <th>Destination Kebele</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Tadesse Assefa</td>
                  <td>Kebele 01 (Tegbared)</td>
                  <td>Baso Kebele (NSZ-W01-K04)</td>
                  <td>Residential relocation to Got 02</td>
                  <td>
                    <span className="badge badge-warning">Pending Approval</span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSuccessMsg('Transfer approved! New Ration ID NSZ-W01-K04-000129 assigned.')}
                      className="btn btn-primary btn-sm"
                    >
                      Approve Transfer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Module 6: Delegated Staff Provisioning */}
      {activeTab === 'staff' && (
        <div className="card" style={{ padding: '1.5rem', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e3a8a' }}>
                {currentLang === 'am' ? 'የቀበሌ እና የሸማቾች ማህበር ሰራተኞች ምዝገባ' : 'Delegated Kebele & Store Staff Provisioning'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {currentLang === 'am'
                  ? 'በወረዳው ስር ላሉ ቀበሌዎች መዝጋቢ ኦፊሰሮችንና የህብረት ስራ ማህበር ሱቅ ኃላፊዎችን ማስተዳደር'
                  : `Directly provision Kebele Record Officers and Cooperative Storekeepers strictly within ${woredaData?.woreda?.name || 'Woreda'} boundary`}
              </p>
            </div>

            <button
              onClick={() => {
                const firstKebele = woredaData?.kebeleStats?.[0]?._id || '';
                setStaffForm({
                  fullName: '',
                  username: '',
                  password: '',
                  phone: '',
                  email: '',
                  role: 'KEBELE_OFFICER',
                  locationId: firstKebele
                });
                setShowStaffModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserPlus size={16} />
              <span>{currentLang === 'am' ? '+ አዲስ ሰራተኛ መዝግብ' : '+ Provision Staff Account'}</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{currentLang === 'am' ? 'ሙሉ ስም' : 'Full Name'}</th>
                  <th>{currentLang === 'am' ? 'የመጠቃሚያ ስም' : 'Username'}</th>
                  <th>{currentLang === 'am' ? 'የስራ ድርሻ' : 'Role'}</th>
                  <th>{currentLang === 'am' ? 'የተመደበበት ቀበሌ / መደብር' : 'Assigned Kebele / Store'}</th>
                  <th>{currentLang === 'am' ? 'ሁኔታ' : 'Status'}</th>
                  <th>{currentLang === 'am' ? 'የይለፍ ቃል ሁኔታ' : 'Password Reset'}</th>
                  <th>{currentLang === 'am' ? 'እርምጃ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {staffList
                  .filter(u => ['KEBELE_OFFICER', 'STOREKEEPER', 'kebele_officer', 'store_manager'].includes(u.role))
                  .map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                      <td><code>{s.username}</code></td>
                      <td>
                        <span className={`badge ${s.role.includes('KEBELE') || s.role.includes('kebele') ? 'badge-info' : 'badge-primary'}`}>
                          {s.role.includes('KEBELE') || s.role.includes('kebele')
                            ? (currentLang === 'am' ? 'የቀበሌ መዝጋቢ' : 'Kebele Officer')
                            : (currentLang === 'am' ? 'የመደብር ኃላፊ' : 'Storekeeper')}
                        </span>
                      </td>
                      <td>{s.locationId?.name || (currentLang === 'am' ? 'ባሶ ቀበሌ' : 'Baso Kebele')}</td>
                      <td>
                        <span className="badge badge-success">
                          {s.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        {s.mustChangePassword ? (
                          <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                            {currentLang === 'am' ? 'ጊዚያዊ የይለፍ ቃል' : 'Temporary (Must Reset)'}
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d' }}>
                            {currentLang === 'am' ? 'ተረጋግጧል' : 'Personal Active'}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedStaffUser(s);
                            setResetPasswordValue('');
                            setShowResetModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                        >
                          <Key size={13} />
                          <span>{currentLang === 'am' ? 'ቀይር' : 'Reset'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Provision Staff Account */}
      {showStaffModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} color="#1e3a8a" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {currentLang === 'am' ? 'አዲስ የቀበሌ / የመደብር ሰራተኛ መመዝገቢያ' : 'Provision Kebele or Store Staff Account'}
                </h3>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {currentLang === 'am' ? 'ሙሉ ስም (Full Name)' : 'Staff Full Name'} *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Solomon Tadesse"
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentLang === 'am' ? 'የመጠቃሚያ ስም (Username)' : 'Username'} *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. baso_store_solomon"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentLang === 'am' ? 'ስልክ ቁጥር (Phone)' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0911..."
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentLang === 'am' ? 'የስራ ሃላፊነት (Role)' : 'Assigned Role'} *
                  </label>
                  <select
                    className="form-control"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    required
                  >
                    <option value="KEBELE_OFFICER">
                      {currentLang === 'am' ? 'የቀበሌ መዝጋቢ (Kebele Record Officer)' : 'Kebele Record Officer'}
                    </option>
                    <option value="STOREKEEPER">
                      {currentLang === 'am' ? 'የህብረት ስራ ማህበር ሱቅ ኃላፊ (Storekeeper)' : 'Cooperative Storekeeper'}
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentLang === 'am' ? 'ቀበሌ (Assigned Kebele)' : 'Assigned Kebele'} *
                  </label>
                  <select
                    className="form-control"
                    value={staffForm.locationId}
                    onChange={(e) => setStaffForm({ ...staffForm, locationId: e.target.value })}
                    required
                  >
                    {woredaData?.kebeleStats?.map(k => (
                      <option key={k._id} value={k._id}>
                        {k.code} - {k.name} ({k.nameAm})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {currentLang === 'am' ? 'ጊዚያዊ የይለፍ ቃል (Temporary Password)' : 'Temporary Password'} *
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Min. 8 chars, Upper, Lower, Number, Symbol"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  required
                />
              </div>

              <PasswordRequirements password={staffForm.password} username={staffForm.username} />

              <div style={{ background: '#fef3c7', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', color: '#92400e', marginBottom: '1rem', border: '1px solid #fde68a' }}>
                <strong>Mandatory Policy:</strong> Account is provisioned with <code>mustChangePassword: true</code>. The officer must choose a personal password upon first login.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {currentLang === 'am' ? 'አካውንት ፍጠር' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Staff Temporary Password */}
      {showResetModal && selectedStaffUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} color="#d97706" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Reset Staff Temporary Password
                </h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetStaffPassword}>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                Resetting password for <strong>{selectedStaffUser.fullName}</strong> (<code>{selectedStaffUser.username}</code>).
              </p>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>New Temporary Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Min 8 chars, Aa1!..."
                  required
                />
              </div>

              <PasswordRequirements password={resetPasswordValue} username={selectedStaffUser.username} />

              <div style={{ background: '#fef3c7', padding: '0.65rem', borderRadius: '6px', fontSize: '0.78rem', color: '#92400e', marginBottom: '1rem' }}>
                This staff member will be forced to change their password on next sign-in.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Option A: Provision Kebele & Officer Modal */}
      {showKebeleModal && (
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
                  {currentLang === 'am' ? 'አዲስ ቀበሌ እና ኃላፊ መመዝገቢያ' : 'Provision Kebele & Record Officer'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Option A: Simultaneous Registration of Kebele Division & Record Officer Account
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKebeleModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitKebele} style={{ padding: '1.5rem' }}>
              {/* Section 1: Kebele Details */}
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
                  <Building2 size={15} />
                  1. {currentLang === 'am' ? 'የቀበሌው መረጃ (Kebele Division)' : 'Kebele Details'}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የቀበሌ ስም (English)' : 'Kebele Name (English)'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Kebele 05"
                      value={kebeleForm.name}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የአማርኛ መጠሪያ' : 'Amharic Name'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ምሳሌ፡ ቀበሌ 05"
                      value={kebeleForm.nameAm}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, nameAm: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ልዩ የቀበሌ ኮድ (Unique Code)' : 'Unique Kebele Code'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                      value={kebeleForm.code}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, code: e.target.value.toUpperCase() })}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Format: {woredaData?.woreda?.code || 'NSZ-W01'}-K01 to K99
                    </small>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'አባወራዎች' : 'Estimated Households'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 3500"
                      value={kebeleForm.householdCount}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, householdCount: e.target.value })}
                    />
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
                      placeholder="e.g. 15000"
                      value={kebeleForm.population}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, population: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'መንደሮች / ጎጦች (በነጠላ ሰረዝ)' : 'Village Blocks (Gots - Comma Separated)'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Got 01, Got 02, Got 03"
                      value={kebeleForm.gotsString}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, gotsString: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Kebele Officer Login Credentials */}
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
                  2. {currentLang === 'am' ? 'የቀበሌ ኃላፊ መለያ (Officer Login Account)' : 'Assigned Kebele Officer Account'}
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
                      placeholder="e.g. Fatuma Mohammed"
                      value={kebeleForm.officerFullName}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, officerFullName: e.target.value })}
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
                      placeholder="e.g. kebele05_admin"
                      value={kebeleForm.officerUsername}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, officerUsername: e.target.value.toLowerCase().trim() })}
                    />
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
                      placeholder="e.g. +251 911 334455"
                      value={kebeleForm.officerPhone}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, officerPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ኢሜል (Email)' : 'Email'}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. kebele05@woreda.gov.et"
                      value={kebeleForm.officerEmail}
                      onChange={(e) => setKebeleForm({ ...kebeleForm, officerEmail: e.target.value })}
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
                    value={kebeleForm.officerPassword}
                    onChange={(e) => setKebeleForm({ ...kebeleForm, officerPassword: e.target.value })}
                  />
                  <PasswordRequirements
                    password={kebeleForm.officerPassword}
                    username={kebeleForm.officerUsername}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowKebeleModal(false)}
                  disabled={submittingKebele}
                >
                  {currentLang === 'am' ? 'ይቅር' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingKebele}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <ShieldCheck size={16} />
                  <span>
                    {submittingKebele
                      ? (currentLang === 'am' ? 'በመመዝገብ ላይ...' : 'Provisioning...')
                      : (currentLang === 'am' ? 'ቀበሌ እና ኃላፊ መዝግብ' : 'Create Kebele & Officer')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option A: Register Distributor & Storekeeper Modal */}
      {showDistributorModal && (
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
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                  {currentLang === 'am' ? 'አከፋፋይ የህብረት ስራ መደብር እና መጋዘንተኛ መመዝገቢያ' : 'Register Distributor Store & Storekeeper'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Option A: Set up Primary Kebele Consumer Cooperative Distributor & Storekeeper Account
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDistributorModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDistributor} style={{ padding: '1.5rem' }}>
              {/* Section 1: Store / Distributor Unit */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#059669',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.35rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <Building2 size={15} />
                  1. {currentLang === 'am' ? 'የአከፋፋይ መደብሩ መረጃ' : 'Distributor Store Information'}
                </span>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentLang === 'am' ? 'የሚመደብበት ቀበሌ' : 'Assigned Kebele'} *
                  </label>
                  <select
                    className="form-control"
                    required
                    value={distributorForm.kebeleId}
                    onChange={(e) => handleKebeleChangeForDistributor(e.target.value)}
                  >
                    <option value="">-- {currentLang === 'am' ? 'ቀበሌ ይምረጡ' : 'Select Kebele'} --</option>
                    {woredaData?.kebeleStats?.map(k => (
                      <option key={k._id} value={k._id}>
                        {k.name} ({k.code}) {k.store ? `[Store: ${k.store.code || k.store.name}]` : '[No Store]'}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የመደብሩ ስም (English)' : 'Store Name (English)'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Baso Consumer Cooperative Store"
                      value={distributorForm.name}
                      onChange={(e) => setDistributorForm({ ...distributorForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'የአማርኛ ስም' : 'Amharic Name'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ምሳሌ፡ የባሶ ቀበሌ ሸማቾች ህብረት ስራ ማህበር"
                      value={distributorForm.nameAm}
                      onChange={(e) => setDistributorForm({ ...distributorForm, nameAm: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ልዩ የአከፋፋይ ኮድ (Unique Code)' : 'Unique Distributor Code'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
                      value={distributorForm.code}
                      onChange={(e) => setDistributorForm({ ...distributorForm, code: e.target.value.toUpperCase() })}
                    />
                    <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Format: DIST-{'{KebeleCode}'} (Unique indexed)
                    </small>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'አድራሻ / የመደብሩ ቦታ' : 'Physical Address / Location'}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Near Kebele Administration Office"
                      value={distributorForm.address}
                      onChange={(e) => setDistributorForm({ ...distributorForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Storekeeper Login Credentials */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#059669',
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
                  2. {currentLang === 'am' ? 'የመጋዘንተኛው መለያ (Storekeeper Login Account)' : 'Assigned Storekeeper Account'}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ሙሉ ስም' : 'Storekeeper Full Name'} *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Solomon Bekele"
                      value={distributorForm.storekeeperFullName}
                      onChange={(e) => setDistributorForm({ ...distributorForm, storekeeperFullName: e.target.value })}
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
                      placeholder="e.g. baso_storekeeper"
                      value={distributorForm.storekeeperUsername}
                      onChange={(e) => setDistributorForm({ ...distributorForm, storekeeperUsername: e.target.value.toLowerCase().trim() })}
                    />
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
                      placeholder="e.g. +251 911 445566"
                      value={distributorForm.storekeeperPhone}
                      onChange={(e) => setDistributorForm({ ...distributorForm, storekeeperPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {currentLang === 'am' ? 'ኢሜል (Email)' : 'Email'}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. store@cooperative.et"
                      value={distributorForm.storekeeperEmail}
                      onChange={(e) => setDistributorForm({ ...distributorForm, storekeeperEmail: e.target.value })}
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
                    value={distributorForm.storekeeperPassword}
                    onChange={(e) => setDistributorForm({ ...distributorForm, storekeeperPassword: e.target.value })}
                  />
                  <PasswordRequirements
                    password={distributorForm.storekeeperPassword}
                    username={distributorForm.storekeeperUsername}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDistributorModal(false)}
                  disabled={submittingDistributor}
                >
                  {currentLang === 'am' ? 'ይቅር' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submittingDistributor}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, background: '#059669', borderColor: '#059669' }}
                >
                  <ShieldCheck size={16} />
                  <span>
                    {submittingDistributor
                      ? (currentLang === 'am' ? 'በመመዝገብ ላይ...' : 'Registering...')
                      : (currentLang === 'am' ? 'አከፋፋይ እና መጋዘንተኛ መዝግብ' : 'Register Distributor & Storekeeper')}
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
