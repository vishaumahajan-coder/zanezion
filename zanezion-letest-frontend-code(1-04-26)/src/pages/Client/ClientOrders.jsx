import React, { useState } from 'react';
import Table from '../../components/Table';
import { ShoppingBag, Search, Filter, Download, Clock, CheckCircle2, FileCheck, Plus, ChevronRight, Zap } from 'lucide-react';
import { useData } from '../../context/GlobalDataContext';
import { motion, AnimatePresence } from 'framer-motion';

import OrderModal from '../../components/OrderModal';
import StatusBadge from '../../components/StatusBadge';

const ClientOrders = () => {
    const { orders, currentUser, clients, confirmDeliveryReceipt, addOrder, fetchOrders, fetchClients } = useData();
    const userRole = localStorage.getItem('userRole') || 'client';

    React.useEffect(() => {
        fetchOrders();
        fetchClients();
    }, [fetchOrders, fetchClients]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Find client/customer record matching current user
    const myClient = clients.find(c => {
        const cId = String(c.id).replace('CLT-', '');
        const uId = String(currentUser?.clientId).replace('CLT-', '');
        return (currentUser?.clientId && cId === uId) ||
            (currentUser?.email && c.email?.toLowerCase() === currentUser?.email?.toLowerCase()) ||
            (currentUser?.name && c.name?.toLowerCase() === currentUser?.name?.toLowerCase());
    });

    const clientOrders = (orders || []).filter(order => {
        // Match by customer_id, created_by, client name, or email
        const isMyOrder = myClient ? (
            String(order.clientId) === String(myClient.id) ||
            String(order.customer_id) === String(myClient.id) ||
            order.client?.toLowerCase() === myClient.name?.toLowerCase() ||
            String(order.created_by) === String(currentUser?.id)
        ) : (
            String(order.created_by) === String(currentUser?.id) ||
            String(order.clientId) === String(currentUser?.id) ||
            String(order.customer_id) === String(currentUser?.id)
        );

        const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []);
        const matchesSearch = String(order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            orderItems.some(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'All' ? true :
            statusFilter === 'Active' ? order.status !== 'Delivered' :
                statusFilter === 'Closed' ? order.status === 'Delivered' : true;
        return isMyOrder && matchesSearch && matchesStatus;
    });

    const columns = [
        { header: "Order ID", accessor: "id", render: (order) => <span className="font-black text-white italic tracking-tighter">{order.id}</span> },
        {
            header: "Category",
            accessor: "type",
            render: (order) => (
                <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-accent italic">
                    {order.type || "Custom Order"}
                </span>
            )
        },
        {
            header: "Items",
            accessor: "items",
            render: (order) => {
                const rawItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                const items = (Array.isArray(rawItems) && rawItems.length > 0) ? rawItems : [{ name: order.product || 'General Item', qty: order.qty || 1 }];
                if (items.length === 1) return <span className="font-bold text-white">{items[0].name}</span>;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{items[0].name}</span>
                        <span className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-black text-muted uppercase">+{items.length - 1} More</span>
                    </div>
                );
            }
        },
        {
            header: "Total Value",
            accessor: "total",
            render: (order) => <span className="font-black text-white italic tracking-tighter">${parseFloat(order.total || 0).toLocaleString()}</span>
        },
        {
            header: "Request Date",
            accessor: "requestDate",
            render: (order) => <span className="text-secondary font-black italic">{order.requestDate || order.createdAt?.split('T')[0] || '2024-06-01'}</span>
        },
        {
            header: "Due Date",
            accessor: "dueDate",
            render: (order) => <span className="text-white font-black italic">{order.dueDate || order.date || '2024-06-01'}</span>
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.status === 'Delivered' ? 'bg-success/20 text-success border border-success/30' :
                    row.status === 'Pending' ? 'bg-warning/20 text-warning border border-warning/30' :
                        'bg-accent/20 text-accent border border-accent/30'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Delivered' ? 'bg-success' :
                        row.status === 'Pending' ? 'bg-warning animate-pulse' :
                            'bg-accent animate-pulse'
                        }`}></span>
                    {row.status}
                </div>
            )
        },
    ];

    const handleView = (order) => {
        setSelectedOrder(order);
        setModalType('view');
        setIsModalOpen(true);
    };

    const handleSaveOrder = (orderData) => {
        addOrder({
            ...orderData,
            clientId: myClient?.id || currentUser?.id,
            client: myClient?.name || currentUser?.name,
            email: myClient?.email || currentUser?.email,
            status: 'Pending',
            createdAt: new Date().toISOString()
        });
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            <div className="no-print space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white italic uppercase">My Orders</h1>
                    <p className="text-secondary text-[10px] md:text-xs mt-1 font-black uppercase tracking-[0.2em] opacity-70">Institutional procurement history and luxury asset deployment logs.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="bg-[#141417] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-muted/40 focus:outline-none focus:border-accent/40 w-full sm:w-48 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" size={14} />
                    </div>
                    <button
                        onClick={() => { setSelectedOrder(null); setModalType('add'); setIsModalOpen(true); }}
                        className="btn-primary text-[10px] px-6 flex items-center gap-2"
                    >
                        <Plus size={14} /> Create Order
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {['All', 'Active', 'Closed'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === filter
                            ? 'bg-accent text-black shadow-lg shadow-accent/10'
                            : 'bg-white/5 text-muted hover:text-white'
                            }`}
                    >
                        {filter} History
                    </button>
                ))}
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-1">Total Procurement</p>
                    <p className="text-2xl font-black text-white italic font-heading tracking-tighter">
                        ${clientOrders.reduce((acc, o) => acc + (parseFloat(o.total || 0)), 0).toLocaleString()}
                    </p>
                </div>

                <div className="glass-card p-6">
                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">Active Deployments</p>
                    <p className="text-2xl font-black text-white italic font-heading tracking-tighter">
                        {clientOrders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'In Transit').length.toString().padStart(2, '0')}
                    </p>
                </div>

                <div className="glass-card p-6">
                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">Logistics Efficiency</p>
                    <p className="text-2xl font-black text-success italic text-glow font-heading tracking-tighter">4.2 Hours Avg.</p>
                </div>
            </div>

            {/* Mobile Card View for Orders */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
                {clientOrders.map((order) => (
                    <div key={order.id} className="glass-card p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Mission ID</p>
                                <p className="text-sm font-black text-white italic tracking-tighter">{order.id}</p>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-0.5">Deployment Date</p>
                                <p className="text-xs font-black text-secondary italic tracking-tighter">{order.date || order.createdAt?.split('T')[0] || '2024-06-01'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-0.5">Fiscal Value</p>
                                <p className="text-xs font-black text-white italic tracking-tighter">${parseFloat(order.total || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={14} className="text-muted" />
                                <span className="text-xs text-muted font-bold">
                                    {order.items ? order.items.length : 1} Item{order.items?.length !== 1 && 's'}
                                </span>
                            </div>
                            <button
                                onClick={() => handleView(order)}
                                className="text-accent hover:text-accent-light transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                                View Details <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Container */}
            <div className="glass-card p-6 sm:p-8 hidden lg:block"> {/* Hide table on small screens */}
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Operational Manifest</h3>
                    <button className="text-muted hover:text-white transition-colors">
                        <Download size={18} />
                    </button>
                </div>
                <Table
                    columns={columns}
                    data={clientOrders}
                    actions={true}
                    onView={(order) => handleView(order)}
                />
            </div>

            {/* Validation Protocol Note */}
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                        <FileCheck size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold">Validation Protocol</h4>
                        <p className="text-xs text-secondary">Proof of delivery available 15m post-completion.</p>
                    </div>
                </div>
                <button className="btn-secondary text-xs">Audit Global Network</button>
            </div>
            </div>

            {/* Order Management Modal */}
            <OrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                modalType={modalType}
                selectedOrder={selectedOrder}
                onSave={handleSaveOrder}
                onDelete={null}
                role={userRole}
            />
        </div>
    );
};

export default ClientOrders;
