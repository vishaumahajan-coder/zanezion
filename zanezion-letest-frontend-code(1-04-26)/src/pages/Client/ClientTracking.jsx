import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Box, Clock, ChevronRight, Globe, CheckCircle2, Package, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/GlobalDataContext';
import Modal from '../../components/Modal';

const ClientTracking = () => {
    const { deliveries, orders, currentUser, clients, confirmDeliveryReceipt, fetchDeliveries, fetchOrders, fetchClients } = useData();
    const [manifestModal, setManifestModal] = useState({ isOpen: false, delivery: null });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, deliveryId: null, name: '' });

    useEffect(() => {
        fetchDeliveries();
        fetchOrders();
        fetchClients();
    }, [fetchDeliveries, fetchOrders, fetchClients]);

    // Identify client record for correct order attribution
    const userRole = (currentUser?.role || '').toLowerCase().replace(/\s+/g, '_');
    const isCustomerRole = userRole === 'customer';
    const tenantId = currentUser?.clientId || currentUser?.companyId || currentUser?.company_id;
    const myClient = (clients || []).find(c => c.id === tenantId) ||
        (clients || []).find(c =>
            (currentUser?.email && c.email?.toLowerCase() === currentUser?.email?.toLowerCase()) ||
            (currentUser?.name && c.name?.toLowerCase() === currentUser?.name?.toLowerCase())
        );

    // For customer role: backend already filters by company_id, show all returned deliveries
    // For other roles: match by client record
    const myOrderIds = (orders || [])
        .filter(o => isCustomerRole || (myClient && (o.companyId === myClient.id || o.company_id === myClient.id || o.clientId === myClient.id)))
        .map(o => o.id);

    const myDeliveries = isCustomerRole
        ? (deliveries || [])
        : (deliveries || []).filter(d =>
            myClient && (
                myOrderIds.includes(d.orderId) ||
                myOrderIds.includes(d.order_id) ||
                d.clientId === myClient.id ||
                d.client === myClient.name
            )
        );

    const handleConfirmSubmit = () => {
        if (confirmModal.name.trim()) {
            confirmDeliveryReceipt(confirmModal.deliveryId, confirmModal.name);
            setConfirmModal({ isOpen: false, deliveryId: null, name: '' });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Real-Time Logistics</h1>
                <p className="text-secondary mt-1">Institutional transit monitoring for active global shipments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {myDeliveries.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Truck size={48} className="text-muted mx-auto mb-4" />
                            <p className="text-secondary font-bold">No active deliveries found.</p>
                            <p className="text-muted text-sm mt-1">Place an order to track your shipments here.</p>
                        </div>
                    ) : myDeliveries.map((delivery) => (
                        <div key={delivery.id} className="glass-card p-6 overflow-hidden relative group">

                            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent border border-accent/20">
                                        <Truck size={28} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{delivery.id}</span>
                                        <h3 className="text-xl font-bold text-white leading-tight">{delivery.item || 'Bespoke Order'}</h3>
                                        <p className="text-sm text-secondary">In Transit to {delivery.location || 'Destination'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted font-bold uppercase mb-1">Status / Arrival</p>
                                    <p className={`text-lg font-bold ${delivery.status === 'Delivered' || delivery.status === 'Completed' ? 'text-success' : 'text-primary'}`}>
                                        {delivery.status === 'Delivered' || delivery.status === 'Completed' ? 'Delivered' : (delivery.eta || 'TBD')}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Stepper with 4 steps */}
                            <div className="relative pt-4 pb-8">
                                <div className="absolute top-5 left-0 w-full h-0.5 bg-border transition-all" />
                                <div
                                    className="absolute top-5 left-0 h-0.5 bg-accent shadow-[0_0_10px_rgba(200,169,106,0.3)] transition-all duration-700"
                                    style={{
                                        width: delivery.clientConfirmed
                                            ? '100%'
                                            : (delivery.status === 'Delivered' || delivery.status === 'Completed')
                                                ? '75%'
                                                : delivery.status === 'In Transit' ? '40%' : '10%'
                                    }}
                                />

                                <div className="relative flex justify-between">
                                    {[
                                        { label: 'Dispatched', icon: Box, active: true },
                                        { label: 'In Transit', icon: Globe, active: delivery.status !== 'Pending' },
                                        {
                                            label: delivery.isAbroad ? 'Customs Clear' : 'Dispatch Verified',
                                            icon: Clock,
                                            active: delivery.status === 'Delivered' || delivery.status === 'Completed'
                                        },
                                        { label: 'Client Acknowledged', icon: MapPin, active: delivery.clientConfirmed }
                                    ].map((step, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${step.active ? 'bg-background border-accent text-accent' : 'bg-background border-border text-muted'
                                                }`}>
                                                <step.icon size={18} />
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase mt-3 tracking-tighter ${step.active ? 'text-white' : 'text-muted'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-success uppercase">Encryption Protocol Active</span>
                                </div>

                                {delivery.clientConfirmed ? (
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-success/10 border border-success/30 rounded-full">
                                        <div className="w-2 h-2 bg-success rounded-full" />
                                        <span className="text-[10px] font-bold text-success uppercase tracking-widest">Receipt Verified & Finalized</span>
                                    </div>
                                ) : (delivery.status === 'Delivered' || delivery.status === 'Completed' || delivery.status === 'In Transit') ? (
                                    <div className="flex items-center gap-4">
                                        <button
                                            className="text-[10px] font-black text-accent uppercase hover:underline flex items-center gap-1 group"
                                            onClick={() => setManifestModal({ isOpen: true, delivery })}
                                        >
                                            View Manifest <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            className="btn-primary flex items-center gap-2 text-[10px] py-1.5 px-4"
                                            onClick={() => {
                                                setConfirmModal({ isOpen: true, deliveryId: delivery.id, name: currentUser?.name || '' });
                                            }}
                                        >
                                            <CheckCircle2 size={12} /> Confirm Secure Receipt
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="flex items-center gap-1 text-[10px] font-black text-accent uppercase hover:underline"
                                        onClick={() => setManifestModal({ isOpen: true, delivery })}
                                    >
                                        View Full Manifest <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 bg-accent/[0.03] border-accent/20">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                            <MapPin size={18} className="text-accent" /> Network Status
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-border">
                                <p className="text-[10px] text-muted uppercase font-bold mb-1">Elite Air Traffic</p>
                                <div className="flex justify-between items-center text-sm font-bold text-white">
                                    <span>Optimal</span>
                                    <span className="text-success">98% Flow</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-border">
                                <p className="text-[10px] text-muted uppercase font-bold mb-1">Port Latency</p>
                                <div className="flex justify-between items-center text-sm font-bold text-white">
                                    <span>Stable</span>
                                    <span>Low</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border-accent/10">
                        <h3 className="font-bold text-white mb-4">Logistics Inquiries</h3>
                        <p className="text-xs text-secondary mb-4 leading-relaxed">
                            For priority rerouting or urgent handling of sensitive shipments, please contact your account officer.
                        </p>
                        <button className="btn-primary w-full text-xs py-3 font-black uppercase tracking-widest">Contact Transit Desk</button>
                    </div>
                </div>
            </div>

            {/* Manifest Modal */}
            <Modal
                isOpen={manifestModal.isOpen}
                onClose={() => setManifestModal({ isOpen: false, delivery: null })}
                title="Bespoke Asset Manifest"
            >
                {manifestModal.delivery && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Mission ID</p>
                                <p className="text-lg font-black text-accent italic">{manifestModal.delivery.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Protocol</p>
                                <p className="text-sm font-bold text-white uppercase italic">{manifestModal.delivery.mode || 'Surface Transit'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Institutional Requisition Items</p>
                                <Package size={14} className="text-muted" />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {(manifestModal.delivery.items || [{ name: manifestModal.delivery.item, qty: 1 }]).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white/[0.03] border border-border rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-white italic">{item.name}</p>
                                            <p className="text-[10px] text-muted uppercase font-black">Securely Packaged Asset</p>
                                        </div>
                                        <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-xs font-black text-accent">
                                            QTY: {item.qty || 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-info/5 border border-info/20 rounded-2xl flex items-start gap-3">
                            <ShieldCheck className="text-info shrink-0" size={18} />
                            <div>
                                <p className="text-[10px] font-black text-info uppercase tracking-widest">Chain of Custody</p>
                                <p className="text-xs text-secondary leading-relaxed mt-1">
                                    All items have been verified against the institutional ledger. Continuous GPS signal is maintained throughout transit.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/5">
                            <button
                                onClick={() => setManifestModal({ isOpen: false, delivery: null })}
                                className="btn-secondary px-8 text-[10px] font-black uppercase"
                            >
                                Close Manifest
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Premium Confirmation Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title="Secure Dispatch Acknowledgment"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl">
                        <p className="text-xs text-secondary leading-relaxed italic">
                            By confirming, you acknowledge the institutional receipt of all items in the manifest. This action will finalize the delivery mission and update the ledger.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Full Recipient Name (Signature)</label>
                        <input
                            type="text"
                            value={confirmModal.name}
                            onChange={(e) => setConfirmModal({ ...confirmModal, name: e.target.value })}
                            className="w-full bg-background border border-accent/30 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-bold text-white italic"
                            placeholder="Type your name to sign..."
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            className="btn-secondary px-6 text-[10px] uppercase font-black"
                        >
                            Abort
                        </button>
                        <button
                            onClick={handleConfirmSubmit}
                            disabled={!confirmModal.name.trim()}
                            className="btn-primary px-8 text-[10px] uppercase font-black shadow-lg shadow-accent/20 flex items-center gap-2"
                        >
                            <CheckCircle2 size={14} /> Finalize Receipt
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ClientTracking;
