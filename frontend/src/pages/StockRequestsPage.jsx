import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import {
  ArrowRightLeft,
  PlusCircle,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  X,
  FileCheck
} from 'lucide-react';

export const StockRequestsPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'transfers'
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [goodsList, setGoodsList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateReqModal, setShowCreateReqModal] = useState(false);
  const [showDecideModal, setShowDecideModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Forms
  const [reqItems, setReqItems] = useState([{ goodsId: '', quantityRequested: '' }]);
  const [reqOffice, setReqOffice] = useState('');

  const [decisionType, setDecisionType] = useState('approve');
  const [decisionNote, setDecisionNote] = useState('');
  const [approvedQuantities, setApprovedQuantities] = useState({});

  const [dispatchItems, setDispatchItems] = useState([]);
  const [receivedInputs, setReceivedInputs] = useState({});
  const [discrepancyNote, setDiscrepancyNote] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, trfRes, gRes, locRes] = await Promise.all([
        api.get('/stock-requests'),
        api.get('/transfers'),
        api.get('/goods'),
        api.get('/locations')
      ]);

      if (reqRes.data.success) setRequests(reqRes.data.data);
      if (trfRes.data.success) setTransfers(trfRes.data.data);
      if (gRes.data.success) setGoodsList(gRes.data.data);
      if (locRes.data.success) setLocations(locRes.data.data);
    } catch (err) {
      setErrorMsg('Failed to load request/transfer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const officeId = reqOffice || user.location?._id || user.locationId;
      const validItems = reqItems.filter(i => i.goodsId && Number(i.quantityRequested) > 0);

      if (validItems.length === 0) {
        setErrorMsg('Please select at least one commodity and valid quantity');
        return;
      }

      const res = await api.post('/stock-requests', {
        fromLocationId: officeId,
        items: validItems
      });

      if (res.data.success) {
        setSuccessMsg(`Stock request ${res.data.data.requestNo} submitted successfully`);
        setShowCreateReqModal(false);
        setReqItems([{ goodsId: '', quantityRequested: '' }]);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit stock request');
    }
  };

  const handleDecideRequest = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const itemsApproved = Object.keys(approvedQuantities).map(gId => ({
        goodsId: gId,
        quantityApproved: Number(approvedQuantities[gId])
      }));

      const res = await api.post(`/stock-requests/${selectedRequest._id}/decide`, {
        decision: decisionType,
        itemsApproved: decisionType === 'approve' ? itemsApproved : [],
        decisionNote
      });

      if (res.data.success) {
        setSuccessMsg(`Stock request ${decisionType}d successfully`);
        setShowDecideModal(false);
        setSelectedRequest(null);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to decide stock request');
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pending stock request?')) return;
    try {
      await api.post(`/stock-requests/${id}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/transfers/dispatch', {
        requestId: selectedRequest?._id || null,
        fromLocationId: selectedRequest.toLocationId._id || selectedRequest.toLocationId,
        toLocationId: selectedRequest.fromLocationId._id || selectedRequest.fromLocationId,
        items: dispatchItems.map(i => ({ goodsId: i.goodsId, quantitySent: Number(i.quantitySent) }))
      });

      if (res.data.success) {
        setSuccessMsg(`Transfer ${res.data.data.transferNo} dispatched successfully via FEFO`);
        setShowDispatchModal(false);
        setSelectedRequest(null);
        setActiveTab('transfers');
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to dispatch transfer');
    }
  };

  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const receivedItems = selectedTransfer.items.map(item => ({
        goodsId: item.goodsId._id || item.goodsId,
        batchNumber: item.batchNumber,
        quantityReceived: Number(receivedInputs[`${item.goodsId._id || item.goodsId}_${item.batchNumber}`] ?? item.quantitySent)
      }));

      const res = await api.post(`/transfers/${selectedTransfer._id}/receive`, {
        receivedItems,
        discrepancyNote
      });

      if (res.data.success) {
        setSuccessMsg(`Transfer ${selectedTransfer.transferNo} receipt confirmed.`);
        setShowReceiveModal(false);
        setSelectedTransfer(null);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge badge-warning">Pending Review</span>;
      case 'approved': return <span className="badge badge-info">Approved</span>;
      case 'dispatched': return <span className="badge badge-warning">Dispatched</span>;
      case 'in_transit': return <span className="badge badge-warning">In-Transit</span>;
      case 'received': return <span className="badge badge-success">Received (Verified)</span>;
      case 'received_with_discrepancy': return <span className="badge badge-danger">Discrepancy</span>;
      case 'rejected': return <span className="badge badge-danger">Rejected</span>;
      case 'cancelled': return <span className="badge badge-default">Cancelled</span>;
      default: return <span className="badge badge-default">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {t('nav.stockRequests', 'Stock Requests & Supply Transfers')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Multi-level requisition workflow: Kebele ➔ Woreda ➔ Zone
          </p>
        </div>

        <button
          onClick={() => setShowCreateReqModal(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          {t('stockRequests.createRequest', 'Submit Stock Request')}
        </button>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileCheck size={16} />
          Stock Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`btn ${activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Truck size={16} />
          Shipment Transfers ({transfers.length})
        </button>
      </div>

      {/* Tab 1: Requests Table */}
      {activeTab === 'requests' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Request No</th>
                <th>From (Requester)</th>
                <th>To (Supplier)</th>
                <th>Commodities Requested</th>
                <th>Status</th>
                <th>Requested Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No stock requests recorded yet.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id}>
                    <td><code>{req.requestNo}</code></td>
                    <td><strong>{req.fromLocationId?.name}</strong></td>
                    <td><strong>{req.toLocationId?.name}</strong></td>
                    <td>
                      {req.items?.map((i, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          • {i.goodsId?.name}: <strong>{i.quantityRequested} {i.goodsId?.unit}</strong>
                          {i.quantityApproved > 0 && <span style={{ color: 'var(--success)', marginLeft: '4px' }}>(Appr: {i.quantityApproved})</span>}
                        </div>
                      ))}
                    </td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                const initial = {};
                                req.items.forEach(it => {
                                  initial[it.goodsId._id] = it.quantityRequested;
                                });
                                setApprovedQuantities(initial);
                                setDecisionType('approve');
                                setShowDecideModal(true);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => handleCancelRequest(req._id)}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {req.status === 'approved' && (user.role === 'admin' || user.role === 'store_manager') && (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setDispatchItems(req.items.map(it => ({
                                goodsId: it.goodsId._id,
                                name: it.goodsId.name,
                                unit: it.goodsId.unit,
                                quantitySent: it.quantityApproved || it.quantityRequested
                              })));
                              setShowDispatchModal(true);
                            }}
                            className="btn btn-success btn-sm"
                          >
                            <Truck size={14} /> Dispatch
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
      )}

      {/* Tab 2: Transfers Table */}
      {activeTab === 'transfers' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Transfer No</th>
                <th>Origin Store</th>
                <th>Destination Store</th>
                <th>Commodities Sent (FEFO Batches)</th>
                <th>Status</th>
                <th>Dispatched Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading transfers...</td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No transfers in transit or completed yet.</td></tr>
              ) : (
                transfers.map((trf) => (
                  <tr key={trf._id}>
                    <td><code>{trf.transferNo}</code></td>
                    <td><strong>{trf.fromLocationId?.name}</strong></td>
                    <td><strong>{trf.toLocationId?.name}</strong></td>
                    <td>
                      {trf.items?.map((i, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          • {i.goodsId?.name} (Batch: <code>{i.batchNumber}</code>): <strong>{i.quantitySent} {i.goodsId?.unit}</strong>
                          {trf.status !== 'in_transit' && (
                            <span style={{ color: i.quantityReceived !== i.quantitySent ? 'var(--danger)' : 'var(--success)', marginLeft: '4px' }}>
                              [Recv: {i.quantityReceived}]
                            </span>
                          )}
                        </div>
                      ))}
                      {trf.discrepancyNote && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>
                          Note: {trf.discrepancyNote}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(trf.status)}</td>
                    <td>{new Date(trf.dispatchedAt).toLocaleDateString()}</td>
                    <td>
                      {trf.status === 'in_transit' && (
                        <button
                          onClick={() => {
                            setSelectedTransfer(trf);
                            const inputs = {};
                            trf.items.forEach(i => {
                              inputs[`${i.goodsId._id || i.goodsId}_${i.batchNumber}`] = i.quantitySent;
                            });
                            setReceivedInputs(inputs);
                            setDiscrepancyNote('');
                            setShowReceiveModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Confirm Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Stock Request */}
      {showCreateReqModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Submit Stock Request</h3>
              <button onClick={() => setShowCreateReqModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Requesting Office</label>
                <select
                  className="form-control"
                  value={reqOffice}
                  onChange={(e) => setReqOffice(e.target.value)}
                >
                  <option value="">Default to current user office</option>
                  {locations.filter(l => l.type !== 'zone').map(loc => (
                    <option key={loc._id} value={loc._id}>{loc.type.toUpperCase()}: {loc.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Requested Commodities & Quantities</label>
                {reqItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      value={item.goodsId}
                      onChange={(e) => {
                        const copy = [...reqItems];
                        copy[idx].goodsId = e.target.value;
                        setReqItems(copy);
                      }}
                      required
                    >
                      <option value="">Select Good</option>
                      {goodsList.map(g => (
                        <option key={g._id} value={g._id}>{g.name} ({g.unit})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      className="form-control"
                      value={item.quantityRequested}
                      onChange={(e) => {
                        const copy = [...reqItems];
                        copy[idx].quantityRequested = e.target.value;
                        setReqItems(copy);
                      }}
                      required
                    />

                    {reqItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setReqItems(reqItems.filter((_, i) => i !== idx))}
                        className="btn btn-danger btn-sm"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setReqItems([...reqItems, { goodsId: '', quantityRequested: '' }])}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowCreateReqModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Decide (Approve/Reject) Request */}
      {showDecideModal && selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Review Stock Request — {selectedRequest.requestNo}
              </h3>
              <button onClick={() => setShowDecideModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <form onSubmit={handleDecideRequest}>
              <div className="form-group">
                <label>Decision</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={decisionType === 'approve'}
                      onChange={() => setDecisionType('approve')}
                    />
                    Approve (Full or Partial)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={decisionType === 'reject'}
                      onChange={() => setDecisionType('reject')}
                    />
                    Reject Request
                  </label>
                </div>
              </div>

              {decisionType === 'approve' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Approve Quantities (BR-02)</label>
                  {selectedRequest.items.map((item, idx) => (
                    <div key={idx} style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                        {item.goodsId.name} (Requested: {item.quantityRequested} {item.goodsId.unit})
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={item.quantityRequested}
                        className="form-control"
                        value={approvedQuantities[item.goodsId._id] || ''}
                        onChange={(e) => setApprovedQuantities({
                          ...approvedQuantities,
                          [item.goodsId._id]: e.target.value
                        })}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label>Decision Notes / Justification</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="e.g. Approved based on current central warehouse stock availability..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowDecideModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className={`btn ${decisionType === 'approve' ? 'btn-primary' : 'btn-danger'}`}>
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispatch Transfer */}
      {showDispatchModal && selectedRequest && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Dispatch Transfer — {selectedRequest.requestNo}
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Stock will be deducted from <strong>{selectedRequest.toLocationId.name}</strong> warehouse using First-Expiry-First-Out (FEFO) batches.
            </p>

            <form onSubmit={handleDispatch}>
              {dispatchItems.map((item, idx) => (
                <div key={idx} className="form-group">
                  <label>{item.name} Quantity to Dispatch ({item.unit})</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={item.quantitySent}
                    onChange={(e) => {
                      const copy = [...dispatchItems];
                      copy[idx].quantitySent = e.target.value;
                      setDispatchItems(copy);
                    }}
                    required
                  />
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowDispatchModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Receipt */}
      {showReceiveModal && selectedTransfer && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Confirm Receipt — {selectedTransfer.transferNo}
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="btn btn-secondary btn-sm"><X size={16} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Verify physical goods received at <strong>{selectedTransfer.toLocationId?.name}</strong>. If received quantity does not match sent quantity, discrepancy will be flagged and reported.
            </p>

            <form onSubmit={handleConfirmReceipt}>
              {selectedTransfer.items.map((item, idx) => {
                const key = `${item.goodsId._id || item.goodsId}_${item.batchNumber}`;
                return (
                  <div key={idx} className="form-group">
                    <label>
                      {item.goodsId.name} (Batch: {item.batchNumber}) — Sent: {item.quantitySent} {item.goodsId.unit}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={receivedInputs[key] ?? item.quantitySent}
                      onChange={(e) => setReceivedInputs({
                        ...receivedInputs,
                        [key]: e.target.value
                      })}
                      required
                    />
                  </div>
                );
              })}

              <div className="form-group">
                <label>Discrepancy Notes (if received quantity differs from dispatch)</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  placeholder="e.g. 2 bags damaged in transit..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowReceiveModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm and Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
