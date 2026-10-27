import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Filter
} from 'lucide-react';

export const InventoryPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [inventory, setInventory] = useState([]);
  const [goodsList, setGoodsList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGood, setSelectedGood] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form states
  const [receiveForm, setReceiveForm] = useState({
    locationId: '',
    goodsId: '',
    batchNumber: '',
    quantity: '',
    expiryDate: ''
  });
  const [adjustForm, setAdjustForm] = useState({
    newQuantity: '',
    reason: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedGood) params.goodsId = selectedGood;
      if (selectedLocation) params.locationId = selectedLocation;

      const [invRes, goodsRes, locRes] = await Promise.all([
        api.get('/inventory', { params }),
        api.get('/goods'),
        api.get('/locations')
      ]);

      if (invRes.data.success) setInventory(invRes.data.data);
      if (goodsRes.data.success) setGoodsList(goodsRes.data.data);
      if (locRes.data.success) setLocations(locRes.data.data);
    } catch (err) {
      setErrorMsg('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedGood, selectedLocation]);

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const locId = receiveForm.locationId || (user.location?._id || user.locationId);
      const res = await api.post('/inventory/receive', {
        ...receiveForm,
        locationId: locId,
        quantity: Number(receiveForm.quantity)
      });

      if (res.data.success) {
        setSuccessMsg(`Successfully received batch ${receiveForm.batchNumber}`);
        setShowReceiveModal(false);
        setReceiveForm({ locationId: '', goodsId: '', batchNumber: '', quantity: '', expiryDate: '' });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record received stock');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/inventory/adjust', {
        locationId: selectedBatch.locationId._id || selectedBatch.locationId,
        goodsId: selectedBatch.goodsId._id || selectedBatch.goodsId,
        batchNumber: selectedBatch.batchNumber,
        newQuantity: Number(adjustForm.newQuantity),
        reason: adjustForm.reason
      });

      if (res.data.success) {
        setSuccessMsg(`Batch ${selectedBatch.batchNumber} adjusted successfully`);
        setShowAdjustModal(false);
        setSelectedBatch(null);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const handleWriteOff = async (item) => {
    const reason = window.prompt(`Enter reason to write off batch ${item.batchNumber}:`, 'Expired stock write-off');
    if (!reason) return;

    try {
      await api.post('/inventory/write-off', {
        locationId: item.locationId._id,
        goodsId: item.goodsId._id,
        batchNumber: item.batchNumber,
        reason
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to write off batch');
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const canManageStock = user?.role === 'admin' || user?.role === 'store_manager';

  return (
    <div>
      <div className="page-header-banner">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.inventory', 'Inventory & Stock Management')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            FEFO batch tracking, expiry monitoring, and stock balances
          </p>
        </div>

        {canManageStock && (
          <button
            onClick={() => setShowReceiveModal(true)}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            {t('inventory.receiveGoods', 'Receive Supplier Shipment')}
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '180px' }}
          value={selectedGood}
          onChange={(e) => setSelectedGood(e.target.value)}
        >
          <option value="">All Commodities</option>
          {goodsList.map(g => (
            <option key={g._id} value={g._id}>{g.name} {g.nameAm ? `(${g.nameAm})` : ''}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '220px' }}
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">All Offices</option>
          {locations.map(loc => (
            <option key={loc._id} value={loc._id}>
              {loc.type.toUpperCase()}: {loc.name}
            </option>
          ))}
        </select>

        {(selectedGood || selectedLocation) && (
          <button
            onClick={() => { setSelectedGood(''); setSelectedLocation(''); }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Office Store</th>
              <th>Commodity</th>
              <th>Batch Number</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
              <th>Expiry Status</th>
              <th>Batch Status</th>
              {canManageStock && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading stock data...
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No inventory batches found matching the selected criteria.
                </td>
              </tr>
            ) : (
              inventory.map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
                const isExpired = daysLeft <= 0;

                return (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.locationId?.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.locationId?.code}</div>
                    </td>
                    <td>
                      <strong>{item.goodsId?.name}</strong>
                      {item.goodsId?.nameAm && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.goodsId?.nameAm}</div>
                      )}
                    </td>
                    <td><code>{item.batchNumber}</code></td>
                    <td>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {item.quantity.toLocaleString()}
                      </span>{' '}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.goodsId?.unit}</span>
                    </td>
                    <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">Expired ({Math.abs(daysLeft)}d ago)</span>
                      ) : isExpiringSoon ? (
                        <span className="badge badge-warning">Expiring in {daysLeft}d</span>
                      ) : (
                        <span className="badge badge-success">{daysLeft} days remaining</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'available' ? 'badge-info' : 'badge-danger'}`}>
                        {item.status?.toUpperCase()}
                      </span>
                    </td>
                    {canManageStock && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setSelectedBatch(item);
                              setAdjustForm({ newQuantity: item.quantity, reason: '' });
                              setShowAdjustModal(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Adjust batch count"
                          >
                            Adjust
                          </button>
                          {item.quantity > 0 && (
                            <button
                              onClick={() => handleWriteOff(item)}
                              className="btn btn-danger btn-sm"
                              title="Write off expired batch"
                            >
                              Write Off
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Receive Supplier Stock */}
      {showReceiveModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="page-header-banner">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Record Supplier Shipment</h3>
              <button onClick={() => setShowReceiveModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleReceiveStock}>
              <div className="form-group">
                <label>Receiving Office</label>
                <select
                  className="form-control"
                  value={receiveForm.locationId}
                  onChange={(e) => setReceiveForm({ ...receiveForm, locationId: e.target.value })}
                  required
                >
                  <option value="">Select Office Store</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.type.toUpperCase()}: {loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Commodity</label>
                <select
                  className="form-control"
                  value={receiveForm.goodsId}
                  onChange={(e) => setReceiveForm({ ...receiveForm, goodsId: e.target.value })}
                  required
                >
                  <option value="">Select Good</option>
                  {goodsList.map(g => (
                    <option key={g._id} value={g._id}>{g.name} ({g.unit})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Batch Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. SUG-2026-B3"
                  value={receiveForm.batchNumber}
                  onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity Received</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={receiveForm.expiryDate}
                  onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowReceiveModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stock Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock */}
      {showAdjustModal && selectedBatch && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Adjust Stock — {selectedBatch.batchNumber}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Current recorded balance: <strong>{selectedBatch.quantity} {selectedBatch.goodsId?.unit}</strong>
            </p>

            <form onSubmit={handleAdjustStock}>
              <div className="form-group">
                <label>New Corrected Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={adjustForm.newQuantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, newQuantity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mandatory Audit Reason (BR-06)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="State reason for discrepancy (e.g. physical count reconciliation, spoilage, shrinkage)..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
