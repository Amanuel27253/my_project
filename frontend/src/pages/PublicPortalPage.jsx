import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  ShieldCheck,
  Package,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Globe,
  ArrowLeft,
  Info,
  DollarSign
} from 'lucide-react';
import { NORTH_SHEWA_WOREDAS, INITIAL_KEBELES } from '../constants/northShewaWoredas';

export const PublicPortalPage = () => {
  const { t, i18n } = useTranslation();
  const [selectedWoredaCode, setSelectedWoredaCode] = useState('NSZ-W01');
  const [selectedKebeleCode, setSelectedKebeleCode] = useState('NSZ-W01-K04');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchRationId, setSearchRationId] = useState('');
  const [rationStatus, setRationStatus] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const currentLang = i18n.language || 'am';

  const toggleLang = () => {
    const nextLang = currentLang === 'am' ? 'en' : 'am';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
  };

  const fetchPortalData = async (kebeleCode) => {
    try {
      setLoading(true);
      const res = await api.get(`/distribution-management/public/portal?kebeleCode=${kebeleCode}`);
      if (res.data.success) {
        setPortalData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load public portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData(selectedKebeleCode);
  }, [selectedKebeleCode]);

  const handleCheckRation = async (e) => {
    e.preventDefault();
    if (!searchRationId.trim()) return;

    setSearching(true);
    setSearchError('');
    setRationStatus(null);

    try {
      const res = await api.get(
        `/distribution-management/public/ration-check?rationCardId=${encodeURIComponent(searchRationId.trim())}`
      );
      if (res.data.success) {
        setRationStatus(res.data.data);
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Verification failed. Please check the ID.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Top Header */}
      <header
        style={{
          background: '#1e3a8a',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderBottom: '3px solid #d97706',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                background: '#d97706',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#fff'
              }}
            >
              NS
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {currentLang === 'am'
                  ? 'የሰሜን ሸዋ ዞን የድጎማ ሸቀጦች ህዝባዊ ግልፅነት ፖርታል'
                  : 'North Shewa Zone Subsidized Goods Public Transparency Portal'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#bfdbfe' }}>
                {currentLang === 'am'
                  ? 'የጥናት ምሳሌ፡ ባሶ ቀበሌ፣ ደብረ ብርሃን ከተማ አስተዳደር • ዜሮ-መግቢያ ነፃ አገልግሎት'
                  : 'Case Study: Baso Kebele, Debre Berhan City Administration • Zero-Login Public Service'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={toggleLang}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Globe size={15} />
              <span>{currentLang === 'am' ? 'English' : 'አማርኛ'}</span>
            </button>

            <Link
              to="/login"
              className="btn btn-sm"
              style={{
                background: '#ffffff',
                color: '#1e3a8a',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <ArrowLeft size={14} />
              <span>{currentLang === 'am' ? 'የሰራተኞች መግቢያ' : 'Staff Sign In'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1rem' }}>
        {/* Kebele Selector & Notification Bar */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <MapPin size={18} color="#1e3a8a" />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e3a8a' }}>
                  {currentLang === 'am' ? 'ወረዳ እና የቀበሌ መደብር ይምረጡ' : 'Select Woreda & Kebele Store'}:
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {currentLang === 'am'
                  ? 'በሰሜን ሸዋ ዞን ስር ያሉ 28 ወረዳዎችና የቀበሌ መደብሮችን ወቅታዊ ክምችትና የጎጥ ስርጭት ይመልከቱ'
                  : 'View live inventory & village Got distribution schedule across all 28 Woredas in North Shewa Zone'}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
              {/* Woreda Selector (28 Woredas) */}
              <select
                className="form-control"
                value={selectedWoredaCode}
                onChange={(e) => {
                  const newWoreda = e.target.value;
                  setSelectedWoredaCode(newWoreda);
                  if (newWoreda === 'NSZ-W01') {
                    setSelectedKebeleCode('NSZ-W01-K04');
                  } else {
                    const matchedKebele = portalData?.availableKebeles?.find(k => k.parentId?.code === newWoreda || k.code.startsWith(newWoreda));
                    if (matchedKebele) setSelectedKebeleCode(matchedKebele.code);
                  }
                }}
                style={{ minWidth: '240px', fontWeight: 600, fontSize: '0.9rem' }}
              >
                <optgroup label={currentLang === 'am' ? '🏢 የከተማ አስተዳደሮች (6)' : '🏢 City/Town Administrations (6)'}>
                  {NORTH_SHEWA_WOREDAS.filter(w => w.type === 'CITY_ADMIN').map(w => (
                    <option key={w.woredaCode} value={w.woredaCode}>
                      {w.woredaCode} - {currentLang === 'am' ? w.nameAm : w.nameEn}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={currentLang === 'am' ? '🌾 የገጠር ወረዳዎች (22)' : '🌾 Rural Woredas (22)'}>
                  {NORTH_SHEWA_WOREDAS.filter(w => w.type === 'RURAL_WOREDA').map(w => (
                    <option key={w.woredaCode} value={w.woredaCode}>
                      {w.woredaCode} - {currentLang === 'am' ? w.nameAm : w.nameEn}
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Kebele Selector */}
              <select
                className="form-control"
                value={selectedKebeleCode}
                onChange={(e) => setSelectedKebeleCode(e.target.value)}
                style={{ minWidth: '230px', fontWeight: 600, fontSize: '0.9rem' }}
              >
                {(portalData?.availableKebeles && portalData.availableKebeles.length > 0
                  ? portalData.availableKebeles
                  : [
                      { code: 'NSZ-W01-K04', name: 'Baso Kebele', nameAm: 'ባሶ ቀበሌ', parentId: { code: 'NSZ-W01', name: 'Debre Berhan' } }
                    ]
                )
                  .filter(k => !selectedWoredaCode || k.parentId?.code === selectedWoredaCode || k.code.startsWith(selectedWoredaCode))
                  .map((k) => (
                    <option key={k.code} value={k.code}>
                      {k.code}: {currentLang === 'am' ? k.nameAm || k.name : k.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Pillar 1: Live Stock Balance Counter */}
          <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Package size={20} color="#16a34a" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {currentLang === 'am' ? 'ወቅታዊ የመደብር ክምችት' : 'Live Store Stock Balances'}
              </h2>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              <strong style={{ color: '#1e3a8a' }}>
                {currentLang === 'am'
                  ? portalData?.store?.nameAm || portalData?.store?.name || 'የባሶ ቀበሌ ሸማቾች ኅብረት ሥራ ማኅበር መደብር'
                  : portalData?.store?.name || 'Baso Kebele Consumer Cooperative Store'}
              </strong>
              <br />
              {portalData?.store?.address && (
                <span>📍 {portalData.store.address}</span>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
                {currentLang === 'am' ? 'ክምችት በመጫን ላይ...' : 'Loading stock balances...'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {portalData?.store?.stocks?.map((stk, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: stk.totalStock > 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${stk.totalStock > 0 ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        {currentLang === 'am' ? stk.goodsNameAm || stk.goodsName : stk.goodsName}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {currentLang === 'am' ? 'የመለኪያ አሃድ' : 'Unit'}: {stk.unit}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: stk.totalStock > 0 ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {stk.totalStock.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.25rem' }}>
                        {stk.unit}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: stk.totalStock > 0 ? '#16a34a' : '#dc2626' }}>
                        {stk.totalStock > 0 ? '● In Stock / አለ' : '○ Out of Stock / አልቋል'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pillar 2: Official Subsidized Price Ceilings */}
          <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <DollarSign size={20} color="#d97706" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {currentLang === 'am' ? 'የመንግስት የድጎማ ጣሪያ ዋጋዎች' : 'Official Subsidized Price Ceilings'}
              </h2>
            </div>

            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#92400e',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.4rem',
                alignItems: 'flex-start'
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                {currentLang === 'am'
                  ? 'በዞኑ ንግድ መምሪያ የተቆረጠ የድጎማ ጣሪያ ዋጋ። ከዚህ ዋጋ በላይ ማስከፈል በጥብቅ የተከለከለ ነው!'
                  : 'Zone-mandated price ceiling. Cooperatives are strictly prohibited from charging above these official rates.'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {portalData?.commodities?.map((c) => (
                <div
                  key={c._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {currentLang === 'am' ? c.nameAm || c.name : c.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                      {c.unit}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                      {c.priceCeiling || 0} ETB
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                      / {c.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 3: Active Got Schedule */}
          <div className="card" style={{ padding: '1.5rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calendar size={20} color="#2563eb" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {currentLang === 'am' ? 'የመንደር (ጎጥ) የስርጭት ሰሌዳ' : "Village (Got) Distribution Schedule"}
              </h2>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              {currentLang === 'am'
                ? 'መጨናነቅን ለማስቀረት እባክዎ በተመደበልዎ የጎጥ ቀን ብቻ ኦሪጅናል የሸማቾች ደብተርዎን ይዘው ይቅረቡ።'
                : 'To prevent overcrowding, please arrive only on your designated village Got day with your booklet.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {portalData?.schedules && portalData.schedules.length > 0 ? (
                portalData.schedules.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: s.status === 'active_today' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                      background: s.status === 'active_today' ? '#f0fdf4' : '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                        {s.got}
                      </span>
                      <span
                        className={`badge ${s.status === 'active_today' ? 'badge-success' : 'badge-info'}`}
                      >
                        {s.status === 'active_today'
                          ? currentLang === 'am' ? 'ዛሬ ክፍት ነው' : 'ACTIVE TODAY'
                          : currentLang === 'am' ? 'የተያዘ ቀጠሮ' : 'Scheduled'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
                      <Clock size={13} />
                      <span>{s.timeSlot || '08:30 AM - 12:30 PM'}</span>
                      <span>•</span>
                      <span>{new Date(s.distributionDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {currentLang === 'am'
                    ? 'ለዚህ ቀበሌ የተመዘገበ የጎጥ ሰሌዳ አልተገኘም'
                    : 'No specific Got schedules posted yet.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citizen Ration ID Check Form */}
        <section
          className="card"
          style={{
            padding: '2rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.05)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                background: '#eff6ff',
                color: '#2563eb',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}
            >
              <Search size={24} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.4rem' }}>
              {currentLang === 'am'
                ? 'የሸማቾች ደብተር መለያ ቁጥር ማረጋገጫ'
                : 'Citizen Ration Booklet ID Verification'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
              {currentLang === 'am'
                ? 'የደብተር መለያ ቁጥርዎን (ለምሳሌ፡ NSZ-W01-K04-000125) ወይም ባለ 12 ዲጂት ፋይዳ መታወቂያዎን በማስገባት የስርጭት ሁኔታዎን ያረጋግጡ።'
                : 'Enter your Unique Ration ID (e.g. NSZ-W01-K04-000125) or 12-digit Fayda ID to verify quota status.'}
            </p>

            <form onSubmit={handleCheckRation} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. NSZ-W01-K04-000125 or 123456789012"
                value={searchRationId}
                onChange={(e) => setSearchRationId(e.target.value)}
                style={{ fontSize: '1rem', padding: '0.75rem 1rem', textTransform: 'uppercase' }}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={searching}
                style={{ padding: '0 1.5rem', whiteSpace: 'nowrap', fontWeight: 700 }}
              >
                {searching
                  ? currentLang === 'am' ? 'በማረጋገጥ ላይ...' : 'Checking...'
                  : currentLang === 'am' ? 'አረጋግጥ' : 'Verify'}
              </button>
            </form>

            {searchError && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  textAlign: 'left'
                }}
              >
                <AlertCircle size={18} />
                <span>{searchError}</span>
              </div>
            )}

            {rationStatus && (
              <div
                style={{
                  background: rationStatus.found ? '#f0fdf4' : '#fff7ed',
                  border: `1px solid ${rationStatus.found ? '#86efac' : '#fdba74'}`,
                  borderRadius: '10px',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginTop: '1rem'
                }}
              >
                {rationStatus.found ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <CheckCircle size={20} color="#16a34a" />
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#166534' }}>
                        {currentLang === 'am' ? 'ትክክለኛ የተረጋገጠ የሸማች ደብተር' : 'Valid Verified Household Booklet'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Ration ID</span>
                        <strong>{rationStatus.rationCardId}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Household Head</span>
                        <strong>{rationStatus.headNameMasked}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Kebele & Got</span>
                        <strong>{rationStatus.kebeleName} ({rationStatus.got})</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Family Size</span>
                        <strong>{rationStatus.familySize} Members</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: rationStatus.collectedInCurrentCycle ? '#fee2e2' : '#dcfce7',
                        borderRadius: '6px',
                        border: `1px solid ${rationStatus.collectedInCurrentCycle ? '#f87171' : '#4ade80'}`
                      }}
                    >
                      <strong style={{ color: rationStatus.collectedInCurrentCycle ? '#991b1b' : '#14532d' }}>
                        {rationStatus.collectedInCurrentCycle
                          ? currentLang === 'am'
                            ? `የዚህ ዙር ድርሻ ተወስዷል (በ${new Date(rationStatus.collectionDate).toLocaleDateString()})`
                            : `Cycle Quota COLLECTED on ${new Date(rationStatus.collectionDate).toLocaleDateString()}`
                          : currentLang === 'am'
                            ? `የዚህ ዙር ድርሻዎን አልወሰዱም - በመደብሩ መውሰድ ይችላሉ!`
                            : `Current Cycle Quota: NOT COLLECTED - Eligible for Handover!`}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c' }}>
                    <AlertCircle size={20} />
                    <span>{rationStatus.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748b',
          background: '#ffffff'
        }}
      >
        <p style={{ margin: 0 }}>
          {currentLang === 'am'
            ? 'የሰሜን ሸዋ ዞን አስተዳደር • የንግድና ገበያ ልማት መምሪያ • የደብረ ብርሃን ከተማ አስተዳደር'
            : 'North Shewa Zone Administration • Trade & Market Development Department • Debre Berhan City Administration'}
        </p>
      </footer>
    </div>
  );
};
