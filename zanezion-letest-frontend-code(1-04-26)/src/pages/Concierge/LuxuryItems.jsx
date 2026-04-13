import React, { useState } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { Shield, Plus, Search, DollarSign, User, Anchor, Lock, RefreshCw } from 'lucide-react';
import { useData } from '../../context/GlobalDataContext';

const LuxuryItems = () => {
    const { luxuryItems, addLuxuryItem, updateLuxuryItem, deleteLuxuryItem, fetchLuxuryItems, hasMenuPermission } = useData();
    
    React.useEffect(() => {
        fetchLuxuryItems();
    }, [fetchLuxuryItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ item: '', owner: '', vault: 'Vault Alpha', status: 'Stored', value: '' });

    const filteredItems = luxuryItems.filter(itm =>
        itm.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itm.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(itm.id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = (type, itm) => {
        setSelectedItem(itm);
        setModalType(type);
        setFormData(itm.id ? { ...itm } : { item: '', owner: '', vault: 'Vault Alpha', status: 'Stored', value: '' });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (modalType === 'add') {
            addLuxuryItem(formData);
        } else if (modalType === 'edit') {
            updateLuxuryItem({ ...selectedItem, ...formData });
        }
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        deleteLuxuryItem(selectedItem.id);
        setIsModalOpen(false);
    };

    const columns = [
        { header: "Asset ID", accessor: "id" },
        { header: "Description", accessor: "item" },
        { header: "Beneficiary", accessor: "owner" },
        { header: "Storage Unit", accessor: "vault" },
        { header: "Estimated Value", accessor: "value" },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${row.status === 'Stored' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Luxury Asset Vault</h1>
                    <p className="text-secondary mt-1">Institutional custody and secure storage for high-value client assets.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search assets..."
                            className="bg-white/5 border border-border rounded-xl py-2 px-10 text-sm focus:outline-none focus:border-accent w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    </div>
                    {hasMenuPermission('Luxury Items', 'can_add') && (
                        <button className="btn-primary flex items-center gap-2" onClick={() => handleAction('add', {})}>
                            <Lock size={16} /> New Entry
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 bg-accent/[0.03] border-accent/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-accent/20 rounded-2xl text-accent">
                            <Shield size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-success uppercase bg-success/10 px-2 py-1 rounded">Secured</span>
                    </div>
                    <p className="text-xs text-secondary uppercase font-bold mb-1">Total Assets Under Custody</p>
                    <p className="text-3xl font-bold font-heading italic">$8.4M</p>
                </div>
                <div className="glass-card p-6 border-accent/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-secondary">
                            <Anchor size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-secondary uppercase font-bold mb-1">Active Transfers</p>
                    <p className="text-3xl font-bold">3 Items</p>
                </div>
                <div className="glass-card p-6 border-accent/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/5 rounded-2xl text-secondary">
                            <RefreshCw size={24} />
                        </div>
                    </div>
                    <p className="text-xs text-secondary uppercase font-bold mb-1">Insurance Sync</p>
                    <p className="text-3xl font-bold text-success">Active</p>
                </div>
            </div>

            <div className="glass-card p-6">
                <Table
                    columns={columns}
                    data={filteredItems}
                    actions={true}
                    onView={(item) => handleAction('view', item)}
                    onEdit={(item) => handleAction('edit', item)}
                    onDelete={(item) => handleAction('delete', item)}
                    canEdit={hasMenuPermission('Luxury Items', 'can_edit')}
                    canDelete={hasMenuPermission('Luxury Items', 'can_delete')}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    modalType === 'view' ? 'Asset Appraisal' :
                        modalType === 'edit' ? 'Modify Registry' :
                            modalType === 'delete' ? 'De-register Asset' : 'New Custody Entry'
                }
            >
                <div className="space-y-6">
                    {modalType === 'delete' ? (
                        <div className="space-y-4">
                            <p className="text-secondary">Are you sure you want to remove <span className="text-primary font-bold">{selectedItem?.item}</span> from the vault registry?</p>
                            <div className="flex gap-3 justify-end pt-4">
                                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Keep in Vault</button>
                                <button onClick={handleDelete} className="px-6 py-2 bg-danger text-white rounded-lg font-bold">De-register</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Asset Description</label>
                                    <input
                                        type="text"
                                        value={formData.item}
                                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                        disabled={modalType === 'view'}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Beneficiary Name</label>
                                    <input
                                        type="text"
                                        value={formData.owner}
                                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                        disabled={modalType === 'view'}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Value Estimate</label>
                                    <input
                                        type="text"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                        disabled={modalType === 'view'}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Storage Vault</label>
                                    <select
                                        value={formData.vault}
                                        onChange={(e) => setFormData({ ...formData, vault: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                        disabled={modalType === 'view'}
                                    >
                                        <option>Vault Alpha</option>
                                        <option>Vault Bravo (Cold)</option>
                                        <option>External Safe</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Custody Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                        disabled={modalType === 'view'}
                                    >
                                        <option>Stored</option>
                                        <option>In Use</option>
                                        <option>Transferred</option>
                                        <option>Returned</option>
                                    </select>
                                </div>
                            </div>

                            {modalType === 'view' && (
                                <div className="p-4 border border-dashed border-border rounded-xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <User size={16} className="text-secondary" />
                                        <span className="text-xs text-secondary">Verified Owner:</span>
                                        <span className="text-xs font-bold text-primary">{formData.owner}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <DollarSign size={16} className="text-success" />
                                        <span className="text-xs text-secondary">Insured Value:</span>
                                        <span className="text-xs font-bold text-success">{formData.value || '$0'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => setIsModalOpen(false)} className="btn-secondary">{modalType === 'view' ? 'Close' : 'Cancel'}</button>
                                {modalType !== 'view' && <button onClick={handleSave} className="btn-primary">Finalize Protocol</button>}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default LuxuryItems;
