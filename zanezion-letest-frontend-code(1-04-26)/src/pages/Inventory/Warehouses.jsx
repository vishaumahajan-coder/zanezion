import React, { useState } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { Warehouse as WarehouseIcon, MapPin, Plus, Package, Store } from 'lucide-react';
import { useData } from '../../context/GlobalDataContext';

const Warehouses = () => {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse, fetchWarehouses, hasMenuPermission, users, fetchStaff } = useData();

  React.useEffect(() => {
    fetchWarehouses();
    fetchStaff();
  }, [fetchWarehouses, fetchStaff]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', location: '', capacity: 0, manager_id: '', status: 'active' });

  const managerName = (wid) => {
    if (wid == null || wid === '') return null;
    const u = users?.find(x => String(x.id) === String(wid));
    return u?.name || null;
  };

  const filteredWarehouses = warehouses.filter(wh =>
    wh.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wh.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(wh.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (type, wh) => {
    setSelectedWarehouse(wh);
    setModalType(type);
    setFormData(wh.id ? {
      ...wh,
      manager_id: wh.manager_id != null && wh.manager_id !== '' ? String(wh.manager_id) : ''
    } : { name: '', location: '', capacity: 0, manager_id: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (modalType === 'add') {
      addWarehouse(formData);
    } else if (modalType === 'edit') {
      updateWarehouse({ ...selectedWarehouse, ...formData });
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    deleteWarehouse(selectedWarehouse.id);
    setIsModalOpen(false);
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Warehouse Name", accessor: "name" },
    { header: "Location", accessor: "location" },
    { header: "Capacity", accessor: "capacity" },
    { header: "Status", accessor: "status" },
    {
      header: "Manager",
      accessor: "manager_id",
      render: (row) => row.manager_name || managerName(row.manager_id) || '—'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Network</h1>
          <p className="text-secondary mt-1">Manage precision storage facilities and distribution centers.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search facilities..."
              className="bg-white/5 border border-border rounded-xl py-2 px-10 text-sm focus:outline-none focus:border-accent w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          </div>
          {hasMenuPermission('Warehouses', 'can_add') && (
            <button className="btn-primary flex items-center gap-2" onClick={() => handleAction('add', {})}>
              <Plus size={16} /> Add Facility
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <Table
          columns={columns}
          data={filteredWarehouses}
          actions={true}
          onView={(item) => handleAction('view', item)}
          onEdit={(item) => handleAction('edit', item)}
          onDelete={(item) => handleAction('delete', item)}
          canEdit={hasMenuPermission('Warehouses', 'can_edit')}
          canDelete={hasMenuPermission('Warehouses', 'can_delete')}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'view' ? 'Facility Details' :
            modalType === 'edit' ? 'Edit Facility' :
              modalType === 'delete' ? 'Remove Facility' : 'Add New Facility'
        }
      >
        <div className="space-y-6">
          {modalType === 'delete' ? (
            <div className="space-y-4">
              <p className="text-secondary">Are you sure you want to remove <span className="text-primary font-bold">{selectedWarehouse?.name}</span>? This cannot be undone.</p>
              <div className="flex gap-3 justify-end pt-4">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDelete} className="px-6 py-2 bg-danger text-white rounded-lg font-bold">Remove Facility</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Facility Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Manager (user)</label>
                  <select
                    value={formData.manager_id || ''}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  >
                    <option value="">Select facility manager…</option>
                    {(users || []).filter(u => u?.name).map(u => (
                      <option key={u.id} value={String(u.id)}>{u.name}{u.role ? ` (${u.role})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Capacity (%)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-border rounded-xl">
                <p className="text-[10px] font-bold text-accent uppercase mb-2">Facility Status</p>
                <div className="flex items-center gap-2 text-success">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-bold uppercase">{formData.status} Operation</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">{modalType === 'view' ? 'Close' : 'Cancel'}</button>
                {modalType !== 'view' && <button onClick={handleSave} className="btn-primary">Save Facility</button>}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Warehouses;
