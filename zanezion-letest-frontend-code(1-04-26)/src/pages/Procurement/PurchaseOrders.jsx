import React, { useState } from 'react';
import {
    FileText, Plus, Search, ChevronRight,
    Truck, CheckCircle, Clock, AlertCircle, TrendingUp,
    Download, Eye, ArrowLeft, Package, Trash2, X, Printer, Edit2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/GlobalDataContext';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Common/Pagination';

const PurchaseOrders = () => {
    const { purchaseOrders, vendors, addPurchaseOrder, updatePurchaseOrder, receiveGoodsAgainstPO, fetchPurchaseOrders, fetchVendors, currentUser } = useData();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        fetchPurchaseOrders({ search: searchTerm });
        fetchVendors();
    }, [fetchPurchaseOrders, fetchVendors, searchTerm]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [poItems, setPoItems] = useState([{ id: Date.now(), name: '', quantity: 1, price: 0, category: '' }]);

    const addLineItem = () => setPoItems([...poItems, { id: Date.now() + Math.random(), name: '', quantity: 1, price: 0, category: '' }]);
    const removeLineItem = (id) => setPoItems(poItems.filter(item => item.id !== id));
    const updateLineItem = (id, field, value) => {
        setPoItems(poItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // Stats
    const totalPOs = purchaseOrders.length;
    const completedPOs = purchaseOrders.filter(p => p.status === 'Completed').length;
    const pendingPOs = purchaseOrders.filter(p => p.status === 'Pending').length;
    const partiallyReceivedPOs = purchaseOrders.filter(p => p.status === 'Partially Received').length;

    const filteredPOs = purchaseOrders.filter(po => 
        String(po.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const itemsPerPage = 10;
    const currentPOs = filteredPOs.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);

    const exportCSV = () => {
        if (!filteredPOs.length) return;
        const headers = ['PO ID', 'Vendor', 'Date', 'Total', 'Status', 'Payment Terms', 'Items'];
        const rows = filteredPOs.map(po => [
            po.id,
            po.vendorName,
            po.date,
            po.total,
            po.status,
            po.paymentTerms || '',
            (po.items || []).map(i => `${i.name} x${i.orderedQty}`).join('; ')
        ]);
        const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const HandleCreatePO = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const vendorId = formData.get('vendorId');
        const vendor = vendors.find(v => v.id === vendorId);

        const items = poItems.map(item => ({
            id: item.id,
            name: formData.get(`name_${item.id}`),
            orderedQty: Number(formData.get(`quantity_${item.id}`)),
            price: Number(formData.get(`price_${item.id}`)),
            category: formData.get(`category_${item.id}`) || 'General'
        }));

        const total = items.reduce((acc, item) => acc + (item.orderedQty * item.price), 0);

        addPurchaseOrder({
            vendorId,
            vendorName: vendor?.name || 'Unknown',
            total,
            items,
            paymentTerms: formData.get('paymentTerms')
        });
        setShowCreateModal(false);
        setPoItems([{ id: Date.now(), name: '', quantity: 1, price: 0, category: '' }]);
    };

    const HandleEditPO = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const items = poItems.map(item => ({
            id: item.id,
            name: formData.get(`name_${item.id}`),
            orderedQty: Number(formData.get(`quantity_${item.id}`)),
            price: Number(formData.get(`price_${item.id}`)),
            category: formData.get(`category_${item.id}`) || 'General',
            receivedQty: item.receivedQty || 0,
            pendingQty: Math.max(0, Number(formData.get(`quantity_${item.id}`)) - (item.receivedQty || 0))
        }));

        const total = items.reduce((acc, item) => acc + (item.orderedQty * item.price), 0);

        updatePurchaseOrder({
            ...selectedPO,
            paymentTerms: formData.get('paymentTerms'),
            items,
            total
        });
        setShowEditModal(false);
        setSelectedPO(null);
    };

    const HandleReceiveGoods = (e) => {
        e.preventDefault();
        const receivedData = selectedPO.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category,
            receivedNow: Number(e.target[`received_${item.id}`].value)
        }));

        receiveGoodsAgainstPO(selectedPO.id, receivedData);
        setShowReceiveModal(false);
        setSelectedPO(null);
    };

    const handlePrint = (po) => {
        setSelectedPO(po);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="no-print space-y-8">
            <div className="no-print-logic flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white italic uppercase">Purchase Orders (PO)</h1>
                    <p className="text-secondary text-xs mt-1 font-black uppercase tracking-[0.2em] opacity-70 italic">Sourcing management & goods receiving ledger</p>
                </div>
                <button
                    onClick={() => {
                        setPoItems([{ id: Date.now(), name: '', quantity: 1, price: 0, category: '' }]);
                        setShowCreateModal(true);
                    }}
                    className="btn-primary group flex items-center gap-3 px-8 shadow-xl shadow-accent/20"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>New Purchase Order</span>
                </button>
            </div>

            <div className="no-print-logic grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Platform POs', value: totalPOs, icon: FileText, color: 'text-accent' },
                    { label: 'Pending Goods', value: pendingPOs, icon: Clock, color: 'text-warning' },
                    { label: 'Partial Orders', value: partiallyReceivedPOs, icon: TrendingUp, color: 'text-blue-400' },
                    { label: 'Fulfilled POs', value: completedPOs, icon: CheckCircle, color: 'text-success' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 border-l-4 border-l-accent"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <stat.icon className={stat.color} size={24} />
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Protocol Stats</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-white uppercase italic">{stat.value}</p>
                        <p className="text-xs font-black text-secondary uppercase tracking-widest mt-1 opacity-60">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="no-print-logic flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-[500px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search PO ID, Vendor, or Fulfillment Status..."
                        className="w-full bg-sidebar/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all text-white font-medium"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                    <button onClick={exportCSV} className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="no-print-logic glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03] border-b border-border">
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-widest">PO Identifier</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-widest">Sourcing Vendor</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-widest">Issuance Date</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-widest">Fiscal Value</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-widest">Fulfillment</th>
                                <th className="p-6 text-[10px] font-black text-muted uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentPOs.map((po, i) => (
                                <motion.tr
                                    key={po.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="hover:bg-white/[0.01] group transition-colors"
                                >
                                    <td className="p-6">
                                        <span className="text-sm font-black text-accent">{po.id}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-black text-xs">
                                                {(po.vendor_name || po.vendorName || '?')[0]}
                                            </div>
                                            <span className="text-sm font-bold text-white uppercase">{po.vendor_name || po.vendorName || 'Unknown Vendor'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm text-secondary font-medium">{(po.created_at || po.date)?.split('T')[0] || 'N/A'}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-black text-white">${Number(po.total_amount || po.total || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="p-6">
                                        <StatusBadge status={po.status} />
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPO(po);
                                                    setShowReceiveModal(true);
                                                }}
                                                className="p-2.5 bg-accent/10 border border-accent/20 text-accent rounded-lg hover:bg-accent hover:text-black transition-all"
                                                title="Receive Goods"
                                            >
                                                <Package size={16} />
                                            </button>
                                            <button 
                                                onClick={() => { 
                                                    setSelectedPO(po); 
                                                    setPoItems(po.items.map(item => ({ ...item, quantity: item.orderedQty })));
                                                    setShowEditModal(true); 
                                                }} 
                                                className="p-2.5 bg-white/5 border border-border text-secondary rounded-lg hover:text-white hover:bg-white/10 transition-all" 
                                                title="Edit PO"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(po)}
                                                className="p-2.5 bg-white/5 border border-border text-secondary rounded-lg hover:text-white hover:bg-white/10 transition-all"
                                                title="Print PO"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            {(currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin') && po.status === 'Pending' && (
                                                <button
                                                    onClick={() => updatePurchaseOrder({ ...po, status: 'Authorized' })}
                                                    className="p-2.5 bg-success/10 border border-success/20 text-success rounded-lg hover:bg-success hover:text-black transition-all"
                                                    title="Authorize PO"
                                                >
                                                    <ShieldCheck size={16} />
                                                </button>
                                            )}
                                            {(currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin' || currentUser?.role === 'procurement') && po.status === 'Authorized' && (
                                                <button
                                                    onClick={() => updatePurchaseOrder({ ...po, status: 'Sent to Vendor' })}
                                                    className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                                    title="Send to Vendor"
                                                >
                                                    <Truck size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => { setSelectedPO(po); setShowViewModal(true); }} className="p-2.5 bg-white/5 border border-border text-secondary rounded-lg hover:text-white hover:bg-white/10 transition-all" title="View Details">
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredPOs.length > itemsPerPage && (
                    <div className="mt-6 border-t border-white/5 pt-6 px-6 pb-6">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={filteredPOs.length}
                        />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {(showCreateModal || showEditModal) && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-sidebar border border-border rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 pb-0 border-b border-border/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic">{showEditModal ? 'Revise' : 'Issue'} Purchase Order</h3>
                                        <p className="text-xs text-secondary italic mt-1 font-black tracking-widest uppercase opacity-70">{showEditModal ? `Adjusting Protocol: ${selectedPO.id}` : 'Initialize institutional sourcing protocol'}</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="p-3 bg-white/5 border border-border rounded-2xl text-muted hover:text-white transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={showEditModal ? HandleEditPO : HandleCreatePO} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Target Vendor</label>
                                        <select 
                                            name="vendorId" 
                                            className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none font-bold italic uppercase tracking-wider cursor-pointer" 
                                            defaultValue={selectedPO?.vendorId}
                                            disabled={showEditModal}
                                            required
                                        >
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Payment Terms</label>
                                        <select 
                                            name="paymentTerms" 
                                            className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent appearance-none font-bold italic uppercase tracking-wider cursor-pointer"
                                            defaultValue={selectedPO?.paymentTerms || 'Net 30'}
                                            required
                                        >
                                            <option>Net 5</option>
                                            <option>Net 10</option>
                                            <option>Net 15</option>
                                            <option>Net 30</option>
                                            <option>Net 45</option>
                                            <option>Net 60</option>
                                            <option>Net 90</option>
                                            <option>COD (Cash on Delivery)</option>
                                            <option>Prepaid</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Line Items</h4>
                                        <button type="button" onClick={addLineItem} className="text-[10px] font-black text-accent uppercase flex items-center gap-1 hover:text-white transition-colors">
                                            <Plus size={12} /> Add Item
                                        </button>
                                    </div>
                                    {poItems.map((item, index) => (
                                        <div key={item.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 relative group">
                                            {poItems.length > 1 && (
                                                <button type="button" onClick={() => removeLineItem(item.id)} className="absolute top-2 right-2 p-1.5 text-danger opacity-50 hover:opacity-100 hover:bg-danger/20 rounded-lg transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Item Description</label>
                                                    <input type="text" name={`name_${item.id}`} placeholder="Exact asset name..." className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-bold" defaultValue={item.name} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Category</label>
                                                    <input type="text" name={`category_${item.id}`} placeholder="e.g. Utility" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-bold" value={item.category || ''} onChange={(e) => updateLineItem(item.id, 'category', e.target.value)} required />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Quantity</label>
                                                        <input type="number" name={`quantity_${item.id}`} min="1" placeholder="0" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-bold" defaultValue={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Unit Price ($)</label>
                                                        <input type="number" name={`price_${item.id}`} min="0" step="0.01" placeholder="0.00" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-bold" defaultValue={item.price} onChange={(e) => updateLineItem(item.id, 'price', e.target.value)} required />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2 flex justify-end">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Line Total</p>
                                                        <p className="text-sm font-black text-accent italic">${((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-border mt-8 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="px-8 py-4 text-secondary text-[10px] font-black uppercase tracking-widest hover:text-white transition-all italic">Abort Protocol</button>
                                    <button type="submit" className="btn-primary flex items-center gap-3 px-10 shadow-xl shadow-accent/20">
                                        <CheckCircle size={18} />
                                        <span>{showEditModal ? 'Commit Revision' : 'Issue Official PO'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showReceiveModal && selectedPO && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowReceiveModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-3xl bg-sidebar border border-border rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 pb-0 border-b border-border/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic">Goods Receiving Terminal</h3>
                                        <p className="text-xs text-secondary italic mt-1 font-black tracking-widest uppercase opacity-70">Registering shipment against {selectedPO.id}</p>
                                    </div>
                                    <button onClick={() => setShowReceiveModal(false)} className="p-3 bg-white/5 border border-border rounded-2xl text-muted hover:text-white transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={HandleReceiveGoods} className="p-8">
                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                                    {selectedPO.items.map((item) => {
                                        const progress = (item.receivedQty / item.orderedQty) * 100;
                                        return (
                                            <div key={item.id} className="p-4 md:p-6 bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl group hover:border-accent/40 transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex-1 w-full">
                                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                                            <p className="text-[10px] font-black text-accent uppercase tracking-widest italic">Asset Description</p>
                                                            {item.pendingQty === 0 && <span className="px-2 py-0.5 bg-success/20 text-success text-[8px] font-black uppercase rounded">Fully Received</span>}
                                                            {item.pendingQty > 0 && <span className="px-2 py-0.5 bg-warning/10 text-warning text-[8px] font-black uppercase rounded italic">{item.pendingQty} Units Pending</span>}
                                                        </div>
                                                        <p className="text-lg md:text-xl font-black text-white italic uppercase truncate w-full">{item.name}</p>

                                                        <div className="mt-4 space-y-2">
                                                            <div className="flex justify-between items-end">
                                                                <div className="flex items-center gap-4 md:gap-6">
                                                                    <div>
                                                                        <p className="text-[8px] md:text-[9px] font-black text-muted uppercase tracking-widest mb-1">Ordered</p>
                                                                        <p className="text-xs md:text-sm font-black text-white italic">{item.orderedQty}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] md:text-[9px] font-black text-muted uppercase tracking-widest mb-1">Received</p>
                                                                        <p className="text-xs md:text-sm font-black text-success italic">{item.receivedQty}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[9px] md:text-[10px] font-black text-accent italic">{Math.round(progress)}% Complete</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    className={`h-full ${progress === 100 ? 'bg-success' : 'bg-accent'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="w-full md:w-48 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block pl-1 italic">Register Reception</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                name={`received_${item.id}`}
                                                                defaultValue={item.pendingQty}
                                                                max={item.pendingQty}
                                                                min="0"
                                                                disabled={item.pendingQty === 0}
                                                                className={`w-full bg-background border border-border rounded-2xl px-5 py-3 md:py-4 text-center text-sm text-white focus:outline-none focus:border-accent font-black ${item.pendingQty === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted italic">Units</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-8 border-t border-border flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowReceiveModal(false)} className="px-8 py-4 text-secondary text-[10px] font-black uppercase tracking-widest hover:text-white transition-all italic">Cancel Reception</button>
                                    <button type="submit" className="btn-primary flex items-center gap-3 px-10 shadow-xl shadow-accent/20">
                                        <CheckCircle size={18} />
                                        <span>Confirm Receipt</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showViewModal && selectedPO && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowViewModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-4xl bg-sidebar border border-border rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 pb-0 border-b border-border/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic">Purchase Order Details</h3>
                                        <p className="text-xs text-secondary italic mt-1 font-black tracking-widest uppercase opacity-70">Reviewing PO: {selectedPO.id}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handlePrint(selectedPO)}
                                            className="p-3 bg-accent text-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <Printer size={18} />
                                            <span>Print PO</span>
                                        </button>
                                        <button onClick={() => setShowViewModal(false)} className="p-3 bg-white/5 border border-border rounded-2xl text-muted hover:text-white transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Vendor</p>
                                        <p className="text-sm font-black text-white">{selectedPO.vendorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Issue Date</p>
                                        <p className="text-sm font-black text-white">{selectedPO.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Payment Terms</p>
                                        <p className="text-sm font-black text-accent">{selectedPO.paymentTerms || 'Net 30'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Value</p>
                                        <p className="text-sm font-black text-white">${Number(selectedPO.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Status</p>
                                        <div className="mt-1"><StatusBadge status={selectedPO.status} /></div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Line Items List</h4>
                                    <div className="space-y-4">
                                        {selectedPO.items.map((item, index) => (
                                            <div key={index} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-accent uppercase tracking-widest italic">{item.category || 'General'}</p>
                                                        <p className="text-sm font-black text-white uppercase">{item.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-6 md:text-right">
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Price</p>
                                                            <p className="text-xs font-bold text-white">${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Ordered Qty</p>
                                                            <p className="text-xs font-bold text-white">{item.orderedQty}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Line Total</p>
                                                            <p className="text-xs font-black text-accent">${(Number(item.price) * Number(item.orderedQty)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6">
                                                    <div>
                                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest mr-2">Received:</span>
                                                        <span className="text-[10px] font-black text-success">{item.receivedQty}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest mr-2">Pending:</span>
                                                        <span className="text-[10px] font-black text-warning">{item.pendingQty}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-border flex justify-end">
                                <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">Close Viewer</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            </div>

            {/* Premium Institutional PO Print Template */}
            <div className="hidden print-po-container bg-white text-black font-sans">
                {selectedPO && (
                    <div className="w-full flex-1 flex flex-col">
                        {/* Sovereign Header */}
                        <div className="flex justify-between items-start border-b-[3px] border-black pb-4 mb-4 print-section">
                            <div className="flex items-center gap-5">
                                {/* Logo removed per user request - watermark used instead */}
                                <div>
                                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">ZANEZION</h1>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 opacity-80">Sovereign Logistics & Strategic Sourcing</p>
                                    <div className="mt-1.5 text-[7px] font-bold uppercase text-gray-400 tracking-widest leading-none">
                                        Nassau, Bahamas | Sovereign HQ | Procurement Division
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-black text-black tracking-tighter italic border-b border-black inline-block mb-1 uppercase">Purchase Order</h2>
                                <p className="text-[9px] font-black text-gray-400 mt-0.5">PROTOCOL ID: {selectedPO.id}</p>
                                <p className="text-[7px] font-black uppercase tracking-widest leading-none">ISSUED. {selectedPO.date}</p>
                            </div>
                        </div>

                        {/* Counterparty & Status Section */}
                        <div className="grid grid-cols-2 gap-8 mb-6 px-1 print-section">
                            <div className="border-l-2 border-black pl-4">
                                <p className="text-[6px] font-black uppercase tracking-widest opacity-40 mb-0.5 underline italic">Sourcing Vendor:</p>
                                <p className="text-base font-black italic tracking-tight uppercase leading-tight">{selectedPO.vendorName}</p>
                                <p className="text-[8px] text-gray-500 mt-0.5 font-medium leading-tight italic">Approved Institutional Supplier</p>
                                <p className="text-[7px] font-black mt-1 text-gray-400 uppercase tracking-widest">Registry ID: {selectedPO.vendorId || 'ZN-VND-EXT'}</p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block bg-black text-white px-3 py-1 rounded-sm transform -skew-x-12">
                                    <p className="text-[8px] font-black uppercase tracking-widest skew-x-12 leading-none">Status: {selectedPO.status}</p>
                                </div>
                                <div className="mt-2">
                                    <p className="text-[6px] font-black uppercase tracking-widest opacity-40 mb-0.5 leading-none">Payment Protocol:</p>
                                    <p className="text-sm font-black italic uppercase leading-none">{selectedPO.paymentTerms || 'Net 30 Protocol'}</p>
                                </div>
                            </div>
                        </div>

                        {/* High-Resolution Itemized Ledger */}
                        <div className="mb-6 print-section">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-y border-black">
                                        <th className="text-left py-2 px-2 text-[8px] font-black uppercase tracking-widest">Asset Description & Category</th>
                                        <th className="text-center py-2 px-2 text-[8px] font-black uppercase tracking-widest w-16">Qty</th>
                                        <th className="text-right py-2 px-2 text-[8px] font-black uppercase tracking-widest w-32">Valuation (USD)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPO.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-3 px-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-black text-sm italic tracking-tight uppercase leading-tight">{item.name}</p>
                                                    <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest italic leading-none">{item.category || 'General Procurement'}</p>
                                                </div>
                                            </td>
                                            <td className="text-center py-3 px-2 font-black italic text-xs opacity-40 leading-none">{item.orderedQty.toString().padStart(2, '0')}</td>
                                            <td className="text-right py-3 px-2">
                                                <span className="text-sm font-black tracking-tighter">${(item.orderedQty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Totals & Verification */}
                        <div className="flex justify-end mb-6 pr-2 print-section">
                            <div className="w-64">
                                <div className="flex justify-between items-center py-1.5 border-t border-black mb-1.5">
                                    <p className="text-[8px] font-black uppercase tracking-tighter opacity-100 italic">Institutional PO Subtotal</p>
                                    <span className="text-sm font-bold italic">${parseFloat(selectedPO.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black text-white rounded-none">
                                    <div className="flex flex-col">
                                        <p className="text-[6px] font-black uppercase tracking-widest opacity-60">Total Commitment Value</p>
                                        <p className="text-[7px] font-bold leading-none mt-0.5 uppercase italic">Fiscal Reserve Auth</p>
                                    </div>
                                    <h3 className="text-xl font-black italic tracking-tighter">${parseFloat(selectedPO.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</h3>
                                </div>
                            </div>
                        </div>

                        {/* Legal & Sovereign Terms */}
                        <div className="p-4 bg-gray-50 border-l-[6px] border-black italic print-section mb-6">
                            <h4 className="text-[8px] font-black uppercase tracking-[0.05em] mb-2 text-black underline leading-none italic">Legal Procurement & Sourcing Terms</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-[6px] text-gray-400 leading-normal uppercase font-bold text-justify">
                                    1. <strong>Binding Commitment:</strong> This Purchase Order constitutes a legally binding agreement. Acceptance implies full adherence to ZaneZion quality standards.
                                    2. <strong>Quality Control:</strong> All assets are subject to institutional audit upon arrival. Discrepancies result in protocol rejection.
                                </div>
                                <div className="text-[6px] text-gray-400 leading-normal uppercase font-bold text-justify">
                                    3. <strong>Jurisdiction:</strong> Governance is restricted to the sovereign laws of the Commonwealth of the Bahamas.
                                    4. <strong>Delivery:</strong> Time is a critical protocol parameter. Failure to deliver may result in fiscal penalties.
                                </div>
                            </div>
                        </div>

                        {/* Footer Authenticator */}
                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end print-section">
                            <div>
                                <p className="text-[6px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5 italic">Procurement Officer Signature</p>
                                <div className="relative">
                                    <div className="w-48 h-[1px] bg-black/20" />
                                    <p className="absolute -top-3 left-1 font-black italic text-gray-300 text-[10px] opacity-20 select-none uppercase tracking-tighter leading-none">Director of Sourcing</p>
                                </div>
                                <p className="text-[7px] font-black mt-1.5 uppercase tracking-widest leading-none">Supply Chain Registry | ZANEZION LOGISTICS</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[6px] font-black uppercase tracking-[0.3em] opacity-30 mb-0.5">AUTH HASH: ZZ-PO-{Date.now().toString(16).toUpperCase()}</p>
                                <p className="text-[8px] font-black tracking-tighter italic leading-none">STRATEGIC SOURCING v4.0 // NASSAU HQ</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseOrders;
