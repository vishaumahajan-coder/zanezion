import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Calendar, User, Package, ClipboardList, Plus, Trash2, Tag, DollarSign } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';

const RequestModal = ({ isOpen, onClose, onSave, selectedRequest, modalType = 'add' }) => {
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
        // Normalize items: handle cases where it might be a single item or an array
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
    e.preventDefault();
    onSave({ ...formData, total: parseFloat(calculateTotal()) });
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Request ID</label>
            <div className="relative">
              <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                value={formData.requestId}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent outline-none"
                disabled
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Requester</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                value={formData.requester}
                onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                placeholder="Enter requester name"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent outline-none font-bold text-primary disabled:opacity-50"
                required
                disabled={isView}
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted uppercase">Items Requested</label>
              {!isView && (
                <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-[10px] font-bold text-accent hover:text-white transition-colors">
                  <Plus size={12} /> Add Line Item
                </button>
              )}
            </div>

            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start w-full">
                  <div className="w-full sm:flex-[3] lg:flex-[4] min-w-[150px] sm:min-w-[200px] space-y-1">
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={12} />
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Item Name"
                        className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:border-accent outline-none disabled:opacity-50 text-white font-bold"
                        required
                        disabled={isView}
                      />
                    </div>
                  </div>
                  <div className="w-20 space-y-1">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      placeholder="Qty"
                      className="w-full bg-background border border-border rounded-lg px-2 py-2 text-xs focus:border-accent outline-none disabled:opacity-50 text-white font-bold text-center"
                      min="1"
                      required
                      disabled={isView}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" size={12} />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-full bg-background border border-border rounded-lg pl-6 pr-2 py-2 text-xs focus:border-accent outline-none disabled:opacity-50 text-accent font-bold"
                        step="0.01"
                        required
                        disabled={isView}
                      />
                    </div>
                  </div>
                  {formData.items.length > 1 && !isView && (
                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted uppercase">Estimated Total</p>
                <p className="text-lg font-bold text-accent">${calculateTotal()}</p>
              </div>
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

        <div className="flex gap-3 justify-end pt-6 border-t border-border/50">
          <button type="button" onClick={onClose} className="btn-secondary h-11 px-8 rounded-xl font-bold uppercase text-xs">
            {isView ? 'Close Review' : 'Cancel'}
          </button>
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
