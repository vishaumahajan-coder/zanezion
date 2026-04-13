import React, { useState, useEffect } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import {
    Car, Calendar, Clock, MapPin, Navigation,
    Plus, X, CheckCircle, Info, ArrowRight,
    Luggage, Clock4, Search, Filter, Edit2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/GlobalDataContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';

const Chauffeur = () => {
    const {
        chauffeurRequests,
        addChauffeurRequest,
        updateChauffeurRequest,
        deleteChauffeurRequest,
        fetchChauffeurRequests,
        currentUser,
        users,
        clients,
        fetchStaff,
        fetchClients,
        hasMenuPermission
    } = useData();

    useEffect(() => {
        fetchChauffeurRequests();
        fetchStaff();
        fetchClients();
    }, [fetchChauffeurRequests, fetchStaff, fetchClients]);
    
    const [showModal, setShowModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [modalType, setModalType] = useState('create'); // create, edit, view
    const [serviceType, setServiceType] = useState('One Way');
    const [hasLuggage, setHasLuggage] = useState(false);
    const [hasStops, setHasStops] = useState(false);
    const [amenities, setAmenities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const userRole = (currentUser?.role || '').toLowerCase().replace(/\s+/g, '_');
    const isAdmin = ['superadmin', 'super_admin', 'concierge', 'operations', 'admin', 'client'].includes(userRole);
    const isCustomer = ['customer', 'saas_client'].includes(userRole);

    const filteredRequests = chauffeurRequests.filter(req => {
        const matchesSearch =
            String(req.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase());

        if (isAdmin) return matchesSearch;

        // Customer/Client: backend already filters by company_id, so show all returned data
        // Just apply search filter
        return matchesSearch;
    });

    const toggleAmenity = (item) => {
        setAmenities(prev =>
            prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // For admin: resolve selected client from dropdown
        const selectedClientId = isAdmin ? formData.get('assignClient') : null;
        const selectedClient = isAdmin && selectedClientId ? (clients || []).find(c => String(c.id) === selectedClientId) : null;

        const request = {
            clientId: isAdmin ? (selectedClientId || currentUser?.company_id || 'CLT-GUEST') : (currentUser?.clientId || currentUser?.company_id || 'CLT-GUEST'),
            clientName: isAdmin ? (selectedClient?.name || selectedClient?.business_name || currentUser?.name) : (currentUser?.name || 'Guest Client'),
            serviceType,
            requestDate: editingRequest ? editingRequest.requestDate : new Date().toISOString().split('T')[0],
            dueDate: formData.get('dueDate'),
            pickupTime: formData.get('pickupTime'),
            pickupLocation: formData.get('pickupLocation'),
            dropLocation: formData.get('dropLocation'),
            returnDate: serviceType === 'Round Trip' ? formData.get('returnDate') : null,
            returnTime: serviceType === 'Round Trip' ? formData.get('returnTime') : null,
            numberOfDays: serviceType === 'Daily Service' ? formData.get('numberOfDays') : null,
            numberOfPassengers: formData.get('numberOfPassengers') || 1,
            luggage: hasLuggage ? 'Yes' : 'No',
            bags: hasLuggage ? (parseInt(formData.get('bags'), 10) || 0) : 0,
            stops: hasStops ? 'Yes' : 'No',
            stopLocations: hasStops ? (formData.get('stopLocations') || '').trim() || null : null,
            amenities: amenities,
            driverName: isAdmin ? (formData.get('driverName') || null) : null,
            plateNumber: isAdmin ? (formData.get('plateNumber') || null) : null,
            status: isAdmin ? (formData.get('driverName') ? 'assigned' : 'pending') : (editingRequest?.status || 'Pending')
        };

        if (editingRequest) {
            updateChauffeurRequest({ ...editingRequest, ...request });
        } else {
            addChauffeurRequest(request);
        }

        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingRequest(null);
        setServiceType('One Way');
        setHasLuggage(false);
        setHasStops(false);
        setAmenities([]);
        setModalType('create');
    };

    const openModal = (type, req = null) => {
        setModalType(type);
        if (req) {
            setEditingRequest(req);
            setServiceType(req.serviceType);
            setHasLuggage(req.luggage === 'Yes');
            setHasStops(req.stops === 'Yes');
            setAmenities(req.amenities || []);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleCancel = async (id) => {
        if ((await swalConfirm('Cancel Booking', 'Are you sure?')).isConfirmed) {
            const request = chauffeurRequests.find(r => r.id === id);
            updateChauffeurRequest({ ...request, status: 'Cancelled' });
        }
    };

    const columns = [
        { header: "ID", accessor: "id" },
        { header: "Client", accessor: "clientName" },
        { header: "Type", accessor: "serviceType" },
        { header: "Date", accessor: "dueDate" },
        { header: "Time", accessor: "pickupTime" },
        { header: "Pickup", accessor: "pickupLocation" },
        {
            header: "Assigned Driver",
            accessor: "driverName",
            render: (row) => row.driverName
                ? <span className="text-xs font-bold text-white">{row.driverName}</span>
                : <span className="text-[10px] font-black text-warning/70 uppercase tracking-widest">Unassigned</span>
        },
        {
            header: "Status",
            accessor: "status",
            render: (row) => <StatusBadge status={row.status} />
        }
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white italic uppercase">Chauffeur Protocol</h1>
                    <p className="text-secondary text-xs mt-1 font-black uppercase tracking-[0.2em] opacity-70 italic">
                        {isAdmin ? 'Elite Fleet Management & Logistic Control' : 'Elite transport & chauffeur protocol'}
                    </p>
                </div>
                {(isAdmin || isCustomer || hasMenuPermission('Chauffeur', 'can_add')) && (
                    <button
                        onClick={() => openModal('create')}
                        className="btn-primary group flex items-center gap-3 px-8 shadow-xl shadow-accent/20"
                    >
                        <Car size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                        <span>Book Chauffeur</span>
                    </button>
                )}
            </div>

            {/* Stats/Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-l-4 border-l-accent flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0 shadow-2xl">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Protocol Status</h3>
                        <p className="text-secondary text-xs font-medium opacity-80 uppercase tracking-widest mt-1">
                            {isAdmin ? 'System Active' : 'Elite Access Granted'}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <>
                        <div className="glass-card p-6 border-l-4 border-l-info flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center text-info shrink-0 shadow-2xl">
                                <Car size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Active Fleet</h3>
                                <p className="text-secondary text-xs font-medium opacity-80 uppercase tracking-widest mt-1">
                                    {chauffeurRequests.filter(r => r.status === 'In Transit').length} Operations
                                </p>
                            </div>
                        </div>
                        <div className="glass-card p-6 border-l-4 border-l-warning flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning shrink-0 shadow-2xl">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Pending Dispatch</h3>
                                <p className="text-secondary text-xs font-medium opacity-80 uppercase tracking-widest mt-1">
                                    {chauffeurRequests.filter(r => r.status === 'Pending').length} Manifests
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* List/Table Section */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">
                        {isAdmin ? 'Fleet Manifest Intelligence' : 'Booking History'}
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search manifest ID..." 
                            className="w-full bg-background border border-border rounded-xl py-2 pl-12 pr-4 text-xs focus:outline-none focus:border-accent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isAdmin ? (
                    <Table
                        columns={columns}
                        data={filteredRequests}
                        actions={true}
                        onView={(row) => openModal('view', row)}
                        onEdit={(row) => openModal('edit', row)}
                        onDelete={(row) => deleteChauffeurRequest(row.id)}
                        canEdit={hasMenuPermission('Chauffeur', 'can_edit')}
                        canDelete={hasMenuPermission('Chauffeur', 'can_delete')}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRequests.length === 0 ? (
                            <div className="col-span-2 glass-card p-12 text-center border-dashed border-2 border-white/5">
                                <Car size={48} className="text-muted mx-auto mb-4 opacity-20" />
                                <p className="text-secondary font-bold uppercase tracking-widest text-xs italic">No active bookings detected</p>
                            </div>
                        ) : (
                            filteredRequests.map((req, i) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card p-6 border-border hover:border-accent/30 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        <StatusBadge status={req.status} />
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                                            <Navigation size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">{req.id}</p>
                                            <p className="text-sm font-black text-white italic uppercase tracking-tight">{req.serviceType}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <MapPin size={14} className="text-accent shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black text-muted uppercase">Pickup Location</p>
                                                <p className="text-xs font-bold text-secondary truncate">{req.pickupLocation}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Clock size={14} className="text-muted shrink-0" />
                                            <div>
                                                <p className="text-[8px] font-black text-muted uppercase">Pickup Time</p>
                                                <p className="text-xs font-bold text-secondary">{req.dueDate || req.pickupDate} @ {req.pickupTime}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                            <button onClick={() => openModal('edit', req)} disabled={req.status === 'Cancelled' || req.status === 'Completed'} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${req.status === 'Cancelled' || req.status === 'Completed' ? 'bg-white/5 text-muted cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                                Edit/Reschedule
                                            </button>
                                            <button onClick={() => handleCancel(req.id)} disabled={req.status === 'Cancelled' || req.status === 'Completed'} className={`py-2 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${req.status === 'Cancelled' || req.status === 'Completed' ? 'bg-white/5 text-muted cursor-not-allowed' : 'bg-danger/20 text-danger hover:bg-danger/30'}`}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => setShowModal(false)}
                        />
                        <div className="relative z-10 flex min-h-[100dvh] items-start justify-center p-4 pt-6 pb-10 sm:items-center sm:py-8">
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 16 }}
                            className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-sidebar border border-border rounded-[3rem] shadow-2xl flex flex-col overflow-hidden my-auto"
                        >
                            <div className="p-8 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                        {modalType === 'view' ? 'Manifest Details' : editingRequest ? 'Modify Transport Protocol' : 'Initialize Transport Protocol'}
                                    </h3>
                                    <p className="text-xs text-secondary italic mt-1 font-black tracking-widest uppercase opacity-70">
                                        {modalType === 'view' ? 'Institutional Verification' : 'Define transport manifest'}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} className="p-3 bg-white/5 border border-border rounded-full text-muted hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                {modalType === 'view' ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
                                                    <Car size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-white">{editingRequest?.id}</h4>
                                                    <p className="text-xs text-secondary uppercase font-black tracking-widest">{editingRequest?.serviceType}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={editingRequest?.status} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-xl border border-border">
                                                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Entity / Client</p>
                                                <p className="text-sm font-bold text-white">{editingRequest?.clientName}</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-border">
                                                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Execution Date</p>
                                                <p className="text-sm font-bold text-white">{editingRequest?.dueDate} @ {editingRequest?.pickupTime}</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-border col-span-2">
                                                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Pickup Vector</p>
                                                <p className="text-sm font-bold text-white italic">{editingRequest?.pickupLocation}</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-border col-span-2">
                                                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Destination Vector</p>
                                                <p className="text-sm font-bold text-white italic">{editingRequest?.dropLocation}</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-border">
                                                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Luggage</p>
                                                <p className="text-sm font-bold text-white">
                                                    {editingRequest?.luggage === 'Yes'
                                                        ? `Yes — ${editingRequest?.bags ?? 0} bag(s)`
                                                        : (editingRequest?.luggage || 'No')}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-border">
                                                <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Extra stops</p>
                                                <p className="text-sm font-bold text-white">
                                                    {editingRequest?.stops === 'Yes'
                                                        ? (editingRequest?.stopLocations || 'Yes (no addresses listed)')
                                                        : (editingRequest?.stops || 'No')}
                                                </p>
                                            </div>
                                            {(editingRequest?.amenities?.length > 0) && (
                                                <div className="p-4 bg-white/5 rounded-xl border border-border col-span-2">
                                                    <p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">Amenities</p>
                                                    <p className="text-sm font-bold text-white">{editingRequest.amenities.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {isAdmin && (
                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                <label className="text-[10px] font-black text-accent uppercase tracking-widest">Chauffeur Assignment & Status</label>

                                                {/* Current Assignment Display */}
                                                {editingRequest?.driverName && (
                                                    <div className="p-4 bg-success/5 border border-success/20 rounded-2xl flex items-center gap-3">
                                                        <Car size={18} className="text-success" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-success uppercase tracking-widest">Currently Assigned</p>
                                                            <p className="text-sm font-bold text-white">{editingRequest.driverName} {editingRequest.plateNumber ? `• ${editingRequest.plateNumber}` : ''}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Assign from Staff dropdown */}
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest">Assign Chauffeur (Staff)</label>
                                                        <select
                                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-accent"
                                                            defaultValue=""
                                                            onChange={(e) => {
                                                                const selected = users.find(u => String(u.id) === e.target.value);
                                                                if (selected) {
                                                                    updateChauffeurRequest({ ...editingRequest, driverName: selected.name, status: editingRequest?.status || 'assigned' });
                                                                }
                                                            }}
                                                        >
                                                            <option value="" disabled>Select from staff...</option>
                                                            {users.filter(u => ['staff', 'logistics', 'concierge', 'operation'].includes((u.role || '').toLowerCase())).map(u => (
                                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Or type manually */}
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest">Or Enter Manually</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Driver name"
                                                                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-accent"
                                                                id="manualDriverName"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const name = document.getElementById('manualDriverName').value.trim();
                                                                    if (name) {
                                                                        updateChauffeurRequest({ ...editingRequest, driverName: name, status: editingRequest?.status || 'assigned' });
                                                                        document.getElementById('manualDriverName').value = '';
                                                                    }
                                                                }}
                                                                className="px-4 py-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-[10px] font-black uppercase hover:bg-accent hover:text-black transition-all"
                                                            >
                                                                Assign
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vehicle / Plate Number */}
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-muted uppercase tracking-widest">Vehicle / Plate Number</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. ABC-1234"
                                                            defaultValue={editingRequest?.plateNumber || ''}
                                                            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-accent"
                                                            id="vehiclePlate"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const plate = document.getElementById('vehiclePlate').value.trim();
                                                                if (plate) {
                                                                    updateChauffeurRequest({ ...editingRequest, plateNumber: plate });
                                                                }
                                                            }}
                                                            className="px-4 py-3 bg-white/5 border border-border rounded-xl text-secondary text-[10px] font-black uppercase hover:bg-white/10 hover:text-white transition-all"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Update Status */}
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-muted uppercase tracking-widest">Update Status</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['pending', 'assigned', 'en_route', 'completed', 'cancelled'].map(s => (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => updateChauffeurRequest({ ...editingRequest, status: s })}
                                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                                    (editingRequest?.status || '').toLowerCase().replace(/\s+/g, '_') === s
                                                                        ? 'bg-accent text-black border-accent'
                                                                        : 'bg-white/5 text-muted border-border hover:text-white hover:border-white/20'
                                                                }`}
                                                            >
                                                                {s.replace(/_/g, ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Service Type Selection */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-1">Select Service Protocol</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['One Way', 'Round Trip', 'Daily Service'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setServiceType(type)}
                                                        className={`py-4 px-2 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-tight flex flex-col items-center gap-2 ${serviceType === type
                                                            ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5'
                                                            : 'bg-white/[0.02] border-border text-muted hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${serviceType === type ? 'bg-accent/20' : 'bg-white/5'}`}>
                                                            {type === 'One Way' ? <ArrowRight size={16} /> : type === 'Round Trip' ? <Navigation size={16} /> : <Calendar size={16} />}
                                                        </div>
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Request Date</label>
                                                <input type="text" value={editingRequest ? editingRequest.requestDate : new Date().toISOString().split('T')[0]} disabled className="w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-sm text-muted focus:outline-none font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Due Date (Pickup)</label>
                                                <input type="date" name="dueDate" defaultValue={editingRequest?.dueDate} required className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Pickup Time</label>
                                                <input type="time" name="pickupTime" defaultValue={editingRequest?.pickupTime} required className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Passengers</label>
                                                <input type="number" name="numberOfPassengers" min="1" max="10" defaultValue={editingRequest?.numberOfPassengers || 1} required placeholder="1" className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-1 text-accent">Pickup Location</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" size={18} />
                                                <input
                                                    type="text"
                                                    name="pickupLocation"
                                                    defaultValue={editingRequest?.pickupLocation}
                                                    required
                                                    placeholder="Street, Hotel Name, or Airport Terminal..."
                                                    className="w-full bg-background border border-border rounded-2xl py-4 pl-14 pr-5 text-sm text-white focus:outline-none focus:border-accent font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-1">Drop Location</label>
                                            <div className="relative">
                                                <Navigation className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                                <input
                                                    type="text"
                                                    name="dropLocation"
                                                    defaultValue={editingRequest?.dropLocation}
                                                    required
                                                    placeholder="Destination address..."
                                                    className="w-full bg-background border border-border rounded-2xl py-4 pl-14 pr-5 text-sm text-white focus:outline-none focus:border-accent font-bold"
                                                />
                                            </div>
                                        </div>

                                        {serviceType === 'Round Trip' && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-accent/5 p-6 rounded-3xl border border-accent/20">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1 italic">Return Date</label>
                                                        <input type="date" name="returnDate" defaultValue={editingRequest?.returnDate} required className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1 italic">Return Time</label>
                                                        <input type="time" name="returnTime" defaultValue={editingRequest?.returnTime} required className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {serviceType === 'Daily Service' && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 bg-accent/5 p-4 rounded-3xl border border-accent/20">
                                                <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1 italic">Requested Duration (Days)</label>
                                                <input type="number" name="numberOfDays" min="1" defaultValue={editingRequest?.numberOfDays} required placeholder="e.g. 5" className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold" />
                                            </motion.div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setHasLuggage(!hasLuggage)}
                                                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${hasLuggage ? 'bg-accent/10 border-accent/40' : 'bg-white/5 border-border'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Luggage size={16} className={hasLuggage ? 'text-accent' : 'text-muted'} />
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${hasLuggage ? 'text-white' : 'text-muted'}`}>Luggage</span>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setHasStops(!hasStops)}
                                                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${hasStops ? 'bg-accent/10 border-accent/40' : 'bg-white/5 border-border'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock4 size={16} className={hasStops ? 'text-accent' : 'text-muted'} />
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${hasStops ? 'text-white' : 'text-muted'}`}>Extra Stops</span>
                                                </div>
                                            </button>
                                        </div>

                                        {hasLuggage && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Number of bags</label>
                                                <input
                                                    type="number"
                                                    name="bags"
                                                    min="1"
                                                    max="99"
                                                    defaultValue={editingRequest?.bags ?? 1}
                                                    required
                                                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold"
                                                />
                                            </div>
                                        )}

                                        {hasStops && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Stop locations</label>
                                                <textarea
                                                    name="stopLocations"
                                                    rows={3}
                                                    defaultValue={editingRequest?.stopLocations || ''}
                                                    required
                                                    placeholder="List each stop (address or landmark), one per line..."
                                                    className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold resize-y min-h-[88px]"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-1">Extra Amenities Protocol</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Baby Car Seat', 'WiFi', 'Refreshments'].map(item => (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => toggleAmenity(item)}
                                                        className={`px-4 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${amenities.includes(item) ? 'bg-accent/20 border-accent text-accent' : 'bg-white/[0.02] border-white/5 text-muted'}`}
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Admin: Client Selection + Driver Assignment */}
                                        {isAdmin && (
                                            <div className="space-y-6 pt-6 mt-6 border-t border-accent/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                                                        <Car size={16} />
                                                    </div>
                                                    <label className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Admin — Assignment Panel</label>
                                                </div>

                                                {/* Select Client */}
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Book For Client</label>
                                                    <select name="assignClient" defaultValue={editingRequest?.clientId || ''} className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold appearance-none cursor-pointer">
                                                        <option value="">Current User ({currentUser?.name})</option>
                                                        {(clients || []).map(c => (
                                                            <option key={c.id} value={c.id}>{c.name || c.business_name} {c.email ? `(${c.email})` : ''}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Assign Driver */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Assign Chauffeur</label>
                                                        <select
                                                            name="driverNameSelect"
                                                            defaultValue=""
                                                            onChange={(e) => {
                                                                const input = e.target.form?.querySelector('input[name="driverName"]');
                                                                if (input && e.target.value) input.value = e.target.value;
                                                            }}
                                                            className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold appearance-none cursor-pointer"
                                                        >
                                                            <option value="">Select from staff...</option>
                                                            {users.filter(u => ['staff', 'logistics', 'concierge', 'operation'].includes((u.role || '').toLowerCase())).map(u => (
                                                                <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Manual driver name */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Or Type Driver Name</label>
                                                        <input
                                                            type="text"
                                                            name="driverName"
                                                            defaultValue={editingRequest?.driverName || ''}
                                                            placeholder="Driver name..."
                                                            className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Vehicle */}
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">Vehicle / Plate Number</label>
                                                    <input
                                                        type="text"
                                                        name="plateNumber"
                                                        defaultValue={editingRequest?.plateNumber || ''}
                                                        placeholder="e.g. ABC-1234 or Mercedes S-Class"
                                                        className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-accent font-bold"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="pt-10 flex items-center justify-end gap-4 pb-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="text-muted text-[10px] font-black uppercase tracking-widest hover:text-white transition-all px-4">Abort</button>
                                    {modalType !== 'view' && (
                                        <button type="submit" className="btn-primary flex items-center gap-3 px-12 py-5 shadow-2xl shadow-accent/20">
                                            <CheckCircle size={20} />
                                            <span>{editingRequest ? 'Update Protocol' : 'Confirm Protocol'}</span>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chauffeur;
