import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  ShieldCheck,
  UserPlus,
  PlusCircle,
  MapPin,
  Package,
  Layers,
  CheckCircle,
  AlertTriangle,
  X,
  Lock,
  Unlock
} from 'lucide-react';

export const AdminPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'offices', 'goods', 'quotas'
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [goods, setGoods] = useState([]);
  const [quotaRules, setQuotaRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [showGoodModal, setShowGoodModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Forms
  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'kebele_officer',
    locationId: '',
    language: 'am'
  });

  const [officeForm, setOfficeForm] = useState({
    name: '',
    nameAm: '',
    code: '',
    type: 'kebele',
    parentId: ''
  });

  const [goodForm, setGoodForm] = useState({
    name: '',
    nameAm: '',
    category: 'Food Staples',
    unit: 'kg'
  });

  const [quotaForm, setQuotaForm] = useState({
    goodsId: '',
    quantityPerPerson: 3,
    maxPerHousehold: 15
  });

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, lRes, gRes, qRes] = await Promise.all([
        api.get('/users'),
        api.get('/locations'),
        api.get('/goods'),
        api.get('/quota-rules')
      ]);

      if (uRes.data.success) setUsers(uRes.data.data);
      if (lRes.data.success) setLocations(lRes.data.data);
      if (gRes.data.success) setGoods(gRes.data.data);
      if (qRes.data.success) setQuotaRules(qRes.data.data);
    } catch {
      setErrorMsg('Failed to load administrative configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/users', userForm);
      if (res.data.success) {
        setMsg(`User '${userForm.username}' created successfully`);
        setShowUserModal(false);
        setUserForm({ fullName: '', username: '', email: '', password: '', role: 'kebele_officer', locationId: '', language: 'am' });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/users/${targetUser._id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleUnlockUser = async (targetUser) => {
    try {
      await api.patch(`/users/${targetUser._id}/status`, { unlock: true });
      fetchData();
    } catch {
      alert('Failed to unlock user');
    }
  };

  const handleCreateOffice = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/locations', officeForm);
      if (res.data.success) {
        setMsg(`Office '${officeForm.name}' created successfully`);
        setShowOfficeModal(false);
        setOfficeForm({ name: '', nameAm: '', code: '', type: 'kebele', parentId: '' });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create office');
    }
  };

  const handleCreateGood = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/goods', goodForm);
      if (res.data.success) {
        setMsg(`Good '${goodForm.name}' registered successfully`);
        setShowGoodModal(false);
        setGoodForm({ name: '', nameAm: '', category: 'Food Staples', unit: 'kg' });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register good');
    }
  };

  const handleSaveQuota = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/quota-rules', quotaForm);
      if (res.data.success) {
        setMsg('Quota rule updated successfully');
        setShowQuotaModal(false);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save quota rule');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.settings', 'System Administration Console')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Users, administrative office tiers, essential goods catalog, and family quota rules
          </p>
        </div>
      </div>

      {msg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {msg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <ShieldCheck size={16} /> Users & Roles ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('offices')}
          className={`btn ${activeTab === 'offices' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapPin size={16} /> Administrative Offices ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('goods')}
          className={`btn ${activeTab === 'goods' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Package size={16} /> Goods Catalog ({goods.length})
        </button>
        <button
          onClick={() => setActiveTab('quotas')}
          className={`btn ${activeTab === 'quotas' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={16} /> Quota Allocation Rules ({quotaRules.length})
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowUserModal(true)} className="btn btn-primary btn-sm">
              <UserPlus size={16} /> Create User Account
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Assigned Role</th>
                  <th>Assigned Office</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td><code>{u.username}</code></td>
                    <td><span className="badge badge-info">{u.role?.toUpperCase()}</span></td>
                    <td>{u.locationId?.name || 'System-Wide'}</td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status?.toUpperCase()}
                      </span>
                      {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                        <span className="badge badge-danger" style={{ marginLeft: '4px' }}>LOCKED</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                          <button
                            onClick={() => handleUnlockUser(u)}
                            className="btn btn-primary btn-sm"
                            title="Unlock account"
                          >
                            <Unlock size={14} /> Unlock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Offices */}
      {activeTab === 'offices' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowOfficeModal(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Add Office Unit
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Office Name</th>
                  <th>Amharic Name</th>
                  <th>Code</th>
                  <th>Tier Level</th>
                  <th>Parent Office</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc._id}>
                    <td><strong>{loc.name}</strong></td>
                    <td>{loc.nameAm}</td>
                    <td><code>{loc.code}</code></td>
                    <td><span className="badge badge-info">{loc.type?.toUpperCase()}</span></td>
                    <td>{loc.parentId?.name || 'Top Tier (Zone)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Goods */}
      {activeTab === 'goods' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowGoodModal(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Register New Good
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Amharic Name</th>
                  <th>Category</th>
                  <th>Unit of Measure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {goods.map(g => (
                  <tr key={g._id}>
                    <td><strong>{g.name}</strong></td>
                    <td>{g.nameAm}</td>
                    <td>{g.category}</td>
                    <td><code>{g.unit}</code></td>
                    <td><span className="badge badge-success">{g.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Quota Rules */}
      {activeTab === 'quotas' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowQuotaModal(true)} className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Define / Edit Quota Rule
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Monthly Allowance Per Person</th>
                  <th>Max Cap Per Household</th>
                  <th>Distribution Cycle</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotaRules.map(qr => (
                  <tr key={qr._id}>
                    <td><strong>{qr.goodsId?.name}</strong></td>
                    <td><strong>{qr.quantityPerPerson} {qr.goodsId?.unit}</strong> / person</td>
                    <td><strong>{qr.maxPerHousehold} {qr.goodsId?.unit}</strong> maximum</td>
                    <td>{qr.periodType}</td>
                    <td><span className="badge badge-success">ACTIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {showUserModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Create User Account</h3>
              <button onClick={() => setShowUserModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-control"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    required
                  >
                    <option value="admin">Administrator</option>
                    <option value="zone_officer">Zone Officer</option>
                    <option value="woreda_officer">Woreda Officer</option>
                    <option value="kebele_officer">Kebele Officer</option>
                    <option value="store_manager">Store Manager</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assigned Office</label>
                  <select
                    className="form-control"
                    value={userForm.locationId}
                    onChange={(e) => setUserForm({ ...userForm, locationId: e.target.value })}
                  >
                    <option value="">System-Wide (Admin)</option>
                    {locations.map(loc => (
                      <option key={loc._id} value={loc._id}>{loc.type.toUpperCase()}: {loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Office */}
      {showOfficeModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add Office Unit</h3>
              <button onClick={() => setShowOfficeModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateOffice}>
              <div className="form-group">
                <label>Office Name (English)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Basona Werana Woreda"
                  value={officeForm.name}
                  onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Office Name (Amharic)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ባሶና ወራና ወረዳ"
                  value={officeForm.nameAm}
                  onChange={(e) => setOfficeForm({ ...officeForm, nameAm: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Office Code (Unique)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. WRD-BW"
                    value={officeForm.code}
                    onChange={(e) => setOfficeForm({ ...officeForm, code: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tier Level</label>
                  <select
                    className="form-control"
                    value={officeForm.type}
                    onChange={(e) => setOfficeForm({ ...officeForm, type: e.target.value })}
                    required
                  >
                    <option value="woreda">Woreda</option>
                    <option value="kebele">Kebele</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Parent Office</label>
                <select
                  className="form-control"
                  value={officeForm.parentId}
                  onChange={(e) => setOfficeForm({ ...officeForm, parentId: e.target.value })}
                  required
                >
                  <option value="">Select Parent Office</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.type.toUpperCase()}: {loc.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowOfficeModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Office
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Good */}
      {showGoodModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Register Commodity</h3>
              <button onClick={() => setShowGoodModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateGood}>
              <div className="form-group">
                <label>Name (English)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Iodized Salt"
                  value={goodForm.name}
                  onChange={(e) => setGoodForm({ ...goodForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Name (Amharic)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. አዮዲን ጨው"
                  value={goodForm.nameAm}
                  onChange={(e) => setGoodForm({ ...goodForm, nameAm: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={goodForm.category}
                    onChange={(e) => setGoodForm({ ...goodForm, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unit of Measure</label>
                  <select
                    className="form-control"
                    value={goodForm.unit}
                    onChange={(e) => setGoodForm({ ...goodForm, unit: e.target.value })}
                    required
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="liter">liter (Liters)</option>
                    <option value="piece">piece (Units)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowGoodModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Good
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quota Rule */}
      {showQuotaModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Configure Family Quota Rule</h3>
              <button onClick={() => setShowQuotaModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Formula (BR-09): <code>allowed = min(qtyPerPerson * familySize, maxPerHousehold)</code>
            </p>

            <form onSubmit={handleSaveQuota}>
              <div className="form-group">
                <label>Select Commodity</label>
                <select
                  className="form-control"
                  value={quotaForm.goodsId}
                  onChange={(e) => setQuotaForm({ ...quotaForm, goodsId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Commodity --</option>
                  {goods.map(g => (
                    <option key={g._id} value={g._id}>{g.name} ({g.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Quantity Per Person</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-control"
                    value={quotaForm.quantityPerPerson}
                    onChange={(e) => setQuotaForm({ ...quotaForm, quantityPerPerson: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Maximum Per Household Cap</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-control"
                    value={quotaForm.maxPerHousehold}
                    onChange={(e) => setQuotaForm({ ...quotaForm, maxPerHousehold: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowQuotaModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Quota Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
