import React, { useState } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import OrderModal from '../../components/OrderModal';
import { useData } from '../../context/GlobalDataContext';
import { Store, Star, Phone, Mail, Plus, ShieldCheck } from 'lucide-react';
import { normalizeRole } from '../../utils/authUtils';

const Vendors = () => {
  const { vendors, addVendor, updateVendor, deleteVendor, addOrder, fetchVendors, hasMenuPermission, currentUser } = useData();
  const isSuperAdminUser = normalizeRole(currentUser?.role) === 'superadmin';

  React.useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({ name: '', rating: 0, delivery: 0, category: 'Premium Supplier' });

  // States for Direct Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalType, setOrderModalType] = useState('add');
  const [initialOrderData, setInitialOrderData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(v.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (type, vendor) => {
    setSelectedVendor(vendor);
    setModalType(type);
    setFormData(vendor.id ? {
      ...vendor,
      contact: vendor.contact ?? vendor.contact_name ?? vendor.contactPerson ?? '',
    } : { name: '', rating: 90, delivery: 90, category: 'General', contact: '', address: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const vendorSaveErrorMessage = (error) => {
    const d = error?.response?.data;
    if (typeof d?.message === 'string') return d.message;
    if (d?.message && typeof d.message === 'object') return JSON.stringify(d.message);
    if (Array.isArray(d?.errors)) return d.errors.map((e) => (typeof e === 'string' ? e : e?.msg || JSON.stringify(e))).join(' ');
    return error?.message || 'Failed to save vendor.';
  };

  const handleSave = async () => {
    if (modalType === 'add') {
      if (!String(formData.name || '').trim()) {
        window.alert('Please enter a vendor name.');
        return;
      }
      try {
        await addVendor(formData);
        setIsModalOpen(false);
      } catch (e) {
        window.alert(vendorSaveErrorMessage(e));
      }
      return;
    }
    if (modalType === 'edit') {
      try {
        await updateVendor({ ...selectedVendor, ...formData });
        setIsModalOpen(false);
      } catch (e) {
        window.alert(vendorSaveErrorMessage(e));
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVendor(selectedVendor.id);
      setIsModalOpen(false);
    } catch (e) {
      window.alert(vendorSaveErrorMessage(e));
    }
  };

  const handleDirectOrder = (vendorName) => {
    setInitialOrderData({
      product: `${vendorName} Supply Request`,
      client: 'Select Client...',
      qty: '10 Units',
    });
    setOrderModalType('add');
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = (formData) => {
    addOrder(formData);
    setIsOrderModalOpen(false);
  };

  const columns = [
    { header: "Vendor Name", accessor: "name" },
    { header: "Contact Person", accessor: "contact" },
    { header: "Phone Number", accessor: "phone" },
    { header: "Email", accessor: "email" },
    {
      header: "Rating",
      accessor: "rating",
      render: (row) => (
        <div className="flex items-center gap-1 text-accent">
          <Star size={14} fill="currentColor" />
          <span className="font-bold">{row.rating}%</span>
        </div>
      )
    },
    {
      header: "Delivery Performance",
      accessor: "delivery",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-success" style={{ width: `${row.delivery}%` }} />
          </div>
          <span className="text-xs font-bold">{row.delivery}%</span>
        </div>
      )
    },
    { header: "Category", accessor: "category", render: (row) => row.category || "Premium Supplier" },
    {
      header: "Directory status",
      accessor: "status",
      render: (row) => {
        const st = String(row.status || 'active').toLowerCase();
        if (st === 'inactive') return <span className="text-[10px] font-black uppercase text-warning">Pending HQ approval</span>;
        if (st === 'blacklisted') return <span className="text-[10px] font-black uppercase text-danger">Blocked</span>;
        return <span className="text-[10px] font-black uppercase text-success">Active</span>;
      }
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approved Vendors</h1>
          <p className="text-secondary mt-1">Manage precision supply chain partners and procurement channels.</p>
          {!isSuperAdminUser && (
            <p className="text-[10px] font-bold text-warning mt-2 uppercase tracking-widest">New vendors you add stay inactive until Super Admin approves them.</p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search vendors..."
              className="bg-white/5 border border-border rounded-xl py-2 px-10 text-sm focus:outline-none focus:border-accent w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          </div>
          {(hasMenuPermission('Vendors', 'can_add') || normalizeRole(currentUser?.role) === 'procurement') && (
            <button className="btn-primary flex items-center gap-2" onClick={() => handleAction('add', {})}>
              <Plus size={16} /> Add Vendor
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <Table
          columns={columns}
          data={filteredVendors}
          actions={true}
          onView={(item) => handleAction('view', item)}
          onEdit={(item) => handleAction('edit', item)}
          onDelete={(item) => handleAction('delete', item)}
          canEdit={hasMenuPermission('Vendors', 'can_edit')}
          canDelete={hasMenuPermission('Vendors', 'can_delete')}
          customAction={(row) => (
            isSuperAdminUser && String(row.status || '').toLowerCase() === 'inactive' ? (
              <button
                type="button"
                className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-success/15 text-success border border-success/30 hover:bg-success hover:text-black"
                title="Activate vendor for procurement"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await updateVendor({ ...row, status: 'active' });
                  } catch (err) {
                    window.alert(err?.message || 'Approve failed');
                  }
                }}
              >
                Approve
              </button>
            ) : null
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 bg-accent/[0.02]">
          <h3 className="text-lg font-bold mb-4">Vendor of the Month</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
              <Store size={32} className="text-accent" />
            </div>
            <div>
              <h4 className="text-xl font-bold font-heading italic">{vendors[0]?.name || 'No Vendors Available'}</h4>
              <div className="flex items-center gap-1 text-accent">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= (vendors[0]?.rating / 20) ? "currentColor" : "none"} />)}
              </div>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-secondary" />
              <span>{vendors[0]?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-secondary" />
              <span>{vendors[0]?.email || 'N/A'}</span>
            </div>
          </div>
          <button
            className="w-full mt-6 btn-primary"
            onClick={() => handleDirectOrder(vendors[0]?.name || 'N/A')}
            disabled={!vendors[0]}
          >
            Place Direct Order
          </button>
        </div>

        <div className="glass-card p-6 border-accent/10">
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6">Performance Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.02] border border-border rounded-xl">
              <p className="text-xs text-secondary mb-1">On-Time Delivery Rate (Avg)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${vendors.length > 0 ? (vendors.reduce((a, b) => a + (b.delivery || 0), 0) / vendors.length).toFixed(0) : 0}%` }} />
                </div>
                <span className="text-xs font-bold">{vendors.length > 0 ? (vendors.reduce((a, b) => a + (b.delivery || 0), 0) / vendors.length).toFixed(0) : 0}%</span>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-border rounded-xl">
              <p className="text-xs text-secondary mb-1">Quality Satisfaction (Avg)</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${vendors.length > 0 ? (vendors.reduce((a, b) => a + (b.rating || 0), 0) / vendors.length).toFixed(0) : 0}%` }} />
                </div>
                <span className="text-xs font-bold">{vendors.length > 0 ? (vendors.reduce((a, b) => a + (b.rating || 0), 0) / vendors.length).toFixed(0) : 0}%</span>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-border rounded-xl">
              <p className="text-xs text-secondary mb-1">Compliance Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-info" style={{ width: '100%' }} />
                </div>
                <span className="text-xs font-bold">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'view' ? 'Vendor Profile' :
            modalType === 'edit' ? 'Edit Vendor' :
              modalType === 'delete' ? 'Remove Vendor' : 'Add New Vendor'
        }
      >
        <div className="space-y-6">
          {modalType === 'delete' ? (
            <div className="space-y-4">
              <p className="text-secondary">Are you sure you want to remove <span className="text-primary font-bold">{selectedVendor?.name}</span> from the approved vendor list?</p>
              <div className="flex gap-3 justify-end pt-4">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDelete} className="px-6 py-2 bg-danger text-white rounded-lg font-bold">Remove Vendor</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted uppercase">Vendor Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  />
                </div>
                {modalType !== 'add' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Vendor ID</label>
                  <input
                    type="text"
                    value={formData.id ?? ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view' || modalType === 'edit'}
                    placeholder="Database ID"
                  />
                </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  >
                    <option>Pharmacy</option>
                    <option>Jewelry</option>
                    <option>Grocery</option>
                    <option>Maintenance</option>
                    <option>Stationary Supplies</option>
                    <option>Automotive</option>
                    <option>General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                    placeholder="Name of contact person"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                    placeholder="+377 ..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Business Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                    placeholder="orders@vendor.mc"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                    placeholder="Full business address"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Rating (%)</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Delivery Performance (%)</label>
                  <input
                    type="number"
                    value={formData.delivery}
                    onChange={(e) => setFormData({ ...formData, delivery: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>

                {modalType === 'view' && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-border space-y-4 col-span-1 sm:col-span-2">
                    <div className="flex items-center gap-3 text-sm">
                      <ShieldCheck size={16} className="text-success" />
                      <span className="text-secondary">Verification Status:</span>
                      <span className="font-bold text-success">Verified Partner</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-accent" />
                      <span className="text-secondary">Contact:</span>
                      <span className="font-bold">{selectedVendor?.contact || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-accent" />
                      <span className="text-secondary">Address:</span>
                      <span className="font-bold">{selectedVendor?.address || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">{modalType === 'view' ? 'Close' : 'Cancel'}</button>
                {modalType !== 'view' && <button type="button" onClick={handleSave} className="btn-primary">Save Changes</button>}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        modalType={orderModalType}
        initialData={initialOrderData}
        onSave={handleSaveOrder}
        onDelete={() => { }}
      />
    </div>
  );
};

export default Vendors;
