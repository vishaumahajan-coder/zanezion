import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Calendar, User, Package, ClipboardList, Plus, Trash2, Tag, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import { useData } from '../context/GlobalDataContext';

const RequestModal = ({ isOpen, onClose, onSave, selectedRequest, modalType = 'add' }) => {
  const { currentUser } = useData();
  const userRole = (currentUser?.role || '').toLowerCase().replace(/\s+/g, '_');
  const isAdmin = ['admin', 'super_admin', 'procurement'].includes(userRole);

  const [formData, setFormData] = useState({
    requestId: 'REQ-' + Math.floor(100 + Math.random() * 900),
    items: [{ name: '', qty: 1, price: 0 }],
    requester: '',
    requestDate: new Date().toISOString().split('T')[0],
    todayDate: new Date().toISOString().split('T')[0],
    timestamp: new Date().toLocaleTimeString(),
    status: 'Pending',
    department: 'Operations',
    connectedEntity: '',
    requestType: 'Individual' // 'Individual' or 'Company'
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedRequest && (modalType === 'edit' || modalType === 'view')) {
        let normalizedItems = [];
        if (selectedRequest.items && Array.isArray(selectedRequest.items)) {
          normalizedItems = [...selectedRequest.items];
        } else if (selectedRequest.item) {
          normalizedItems = [{ name: selectedRequest.item, qty: selectedRequest.qty || 1, price: selectedRequest.price || 0 }];
        } else {
          normalizedItems = [{ name: '', qty: 1, price: 0 }];
        }

        setFormData({
          requestId: selectedRequest.id || ('REQ-' + Math.floor(100 + Math.random() * 900)),
          items: normalizedItems,
          requester: selectedRequest.requester || '',
          requestDate: selectedRequest.date || new Date().toISOString().split('T')[0],
          todayDate: selectedRequest.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          timestamp: selectedRequest.createdAt?.split('T')[1]?.split('.')[0] || new Date().toLocaleTimeString(),
          status: selectedRequest.status || 'Pending',
          department: selectedRequest.department || 'Operations',
          connectedEntity: selectedRequest.connectedEntity || '',
          requestType: selectedRequest.requestType || 'Individual'
        });
      } else {
        setFormData({
          requestId: 'REQ-' + Math.floor(100 + Math.random() * 900),
          items: [{ name: '', qty: 1, price: 0 }],
          requester: '',
          requestDate: new Date().toISOString().split('T')[0],
          todayDate: new Date().toISOString().split('T')[0],
          timestamp: new Date().toLocaleTimeString(),
          status: 'Pending',
          department: 'Operations',
          connectedEntity: '',
          requestType: 'Individual'
        });
      }
    }
  }, [isOpen, selectedRequest, modalType]);

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { name: '', qty: 1, price: 0 }] });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ name: '', qty: 1, price: 0 }] });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'name' ? value : parseFloat(value) || 0;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => acc + (item.price * item.qty), 0).toFixed(2);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSave({ ...formData, total: parseFloat(calculateTotal()) });
  };

  const handleStatusChange = (newStatus) => {
    const updatedData = { ...formData, status: newStatus, total: parseFloat(calculateTotal()) };
    onSave(updatedData);
  };

  const isView = modalType === 'view';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalType === 'add' ? "New Purchase Request" : modalType === 'edit' ? `Edit Request: ${formData.requestId}` : `Purchase Request Transcript: ${formData.requestId}`}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {isView && (
          <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl flex items-center gap-3">
            <ClipboardList className="text-accent" size={18} />
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Read-Only Audit View: Secure Protocol Active</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Requester Profile</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                value={formData.requester}
                onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                placeholder="Name or Department ID"
                className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:border-accent outline-none font-bold disabled:opacity-50"
                disabled={isView}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Asset Manifest</label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                value={formData.items.length === 1 ? formData.items[0].name : `${formData.items.length} Multiple Assets`}
                readOnly
                placeholder="Items specified below"
                className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:border-accent outline-none font-bold opacity-70"
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted uppercase">Line Item Specifications</label>
              {!isView && (
                <button type="button" onClick={handleAddItem} className="text-accent hover:text-accent/80 text-xs font-bold flex items-center gap-1">
                  <Plus size={14} /> Add Item
                </button>
              )}
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end bg-white/5 p-3 rounded-lg border border-border/50">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-muted uppercase">Item Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:border-accent outline-none"
                      disabled={isView}
                      required
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[9px] text-muted uppercase">Qty</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:border-accent outline-none"
                      disabled={isView}
                      required
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <label className="text-[9px] text-muted uppercase">Est. Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" size={12} />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg pl-6 pr-3 py-1.5 text-xs focus:border-accent outline-none"
                        disabled={isView}
                      />
                    </div>
                  </div>
                  {!isView && (
                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end p-2">
              <p className="text-sm font-bold">Total Estimated: <span className="text-accent">${calculateTotal()}</span></p>
            </div>
          </div>

          <div className="space-y-1">
            <CustomDatePicker
              label="Request Date"
              selectedDate={formData.requestDate}
              onChange={(date) => setFormData({ ...formData, requestDate: date })}
              disabled={isView}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-primary disabled:opacity-50"
              disabled={isView}
            >
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Ordered</option>
              <option>Quotes Received</option>
              <option>Partial Receipt</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="space-y-1 text-white">
            <label className="text-[10px] font-bold text-muted uppercase">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold disabled:opacity-50"
              disabled={isView}
            >
              <option>Operations</option>
              <option>Catering</option>
              <option>Housekeeping</option>
              <option>Maintenance</option>
              <option>Guest Services</option>
              <option>Beverage</option>
              <option>Events</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Connected Entity / Company</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  checked={formData.requestType === 'Individual'}
                  onChange={() => setFormData({ ...formData, requestType: 'Individual' })}
                  className="text-accent focus:ring-accent"
                  disabled={isView}
                />
                <span className="text-xs">Individual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="requestType"
                  checked={formData.requestType === 'Company'}
                  onChange={() => setFormData({ ...formData, requestType: 'Company' })}
                  className="text-accent focus:ring-accent"
                  disabled={isView}
                />
                <span className="text-xs">Company</span>
              </label>
            </div>
            <input
              type="text"
              value={formData.connectedEntity}
              onChange={(e) => setFormData({ ...formData, connectedEntity: e.target.value })}
              placeholder={formData.requestType === 'Company' ? "Enter Company Name" : "Optional Reference"}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold disabled:opacity-50"
              disabled={isView}
            />
          </div>
          <div className="col-span-1 md:col-span-2 p-3 bg-white/5 rounded-lg border border-border/50 text-center">
            <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Submission Timestamp (Institutional Log)</p>
            <p className="text-xs font-mono text-accent">{formData.todayDate} @ {formData.timestamp}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-border/50">
          <button type="button" onClick={onClose} className="btn-secondary h-11 px-8 rounded-xl font-bold uppercase text-xs">
            {isView ? 'Close Review' : 'Cancel'}
          </button>
          
          {isView && isAdmin && formData.status === 'Pending' && (
            <>
              <button 
                type="button" 
                onClick={() => handleStatusChange('Rejected')} 
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 h-11 px-6 rounded-xl font-bold uppercase text-xs flex items-center gap-2 border border-red-500/30"
              >
                <XCircle size={16} /> Reject Request
              </button>
              <button 
                type="button" 
                onClick={() => handleStatusChange('Approved')} 
                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 h-11 px-6 rounded-xl font-bold uppercase text-xs flex items-center gap-2 border border-green-500/30"
              >
                <CheckCircle size={16} /> Approve Request
              </button>
            </>
          )}

          {!isView && (
            <button type="submit" className="btn-primary h-11 px-8 rounded-xl font-bold uppercase text-xs">
              {modalType === 'add' ? 'Submit Request' : 'Update Strategic Request'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default RequestModal;
