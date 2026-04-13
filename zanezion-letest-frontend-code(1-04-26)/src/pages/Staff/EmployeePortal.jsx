import React, { useState, useEffect } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import { useLocation } from 'react-router-dom';
import {
    Clock, CheckCircle, MapPin, DollarSign,
    Calendar, FileText, Upload, Play, Pause,
    CheckCircle2, AlertCircle, TrendingUp,
    Map as MapIcon, ClipboardList, Smartphone,
    User, Shield, Navigation, Plus,
    Camera, ImagePlus, X, ScanLine, Truck,
    Check, ToggleLeft, ToggleRight, Search
} from 'lucide-react';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/GlobalDataContext';
import StatusBadge from '../../components/StatusBadge';
import CustomDatePicker from '../../components/CustomDatePicker';

const EmployeePortal = () => {
    const {
        currentUser,
        staffAssignments, updateAssignment, fetchStaff, fetchSupportingDocs,
        payHistory, addLog, recordWorkSession, fetchPayHistory,
        leaveRequests, addLeaveRequest,
        getVacationBalance, toggleAvailability,
        deliveries, updateDelivery, fetchDeliveries,
        clockIn, clockOut
    } = useData();

    useEffect(() => {
        console.log('[StaffPortal] Loading data...', { fetchSupportingDocs, fetchDeliveries, fetchPayHistory });
        if (fetchSupportingDocs) fetchSupportingDocs();
        if (fetchDeliveries) fetchDeliveries();
        if (fetchPayHistory) fetchPayHistory();
    }, []);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get('tab') || 'dashboard';

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState({ type: 'Vacation', start: '', end: '', reason: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // Security States
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [securityModalType, setSecurityModalType] = useState('panic'); // 'panic' or 'breach'
    const [breachFormData, setBreachFormData] = useState({ type: 'Unauthorized Access', detail: '', location: currentUser?.location || '' });


    // Filter assignments for the current user
    const myAssignments = staffAssignments.filter(a => a.assigneeId === currentUser?.id?.toString() || a.assignee === currentUser?.name);

    // Add real deliveries assigned to this driver
    const myDeliveries = deliveries.filter(d => d.driver === currentUser?.name && d.status !== 'Delivered' && d.status !== 'Completed');

    const pendingAssignments = staffAssignments.filter(a => a.status === 'Pending' && !a.assigneeId);

    // Filtered assignments based on search
    const filteredMyAssignments = myAssignments.filter(asg =>
        asg.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asg.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(asg.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPendingAssignments = pendingAssignments.filter(asg =>
        asg.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asg.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(asg.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const myPayHistory = payHistory.filter(p => p.userId === currentUser?.id || p.userName === currentUser?.name);
    const totalYTD = myPayHistory.reduce((acc, p) => acc + parseFloat((p.total || "0").replace('$', '').replace(',', '') || 0), 0);
    const [shiftStatus, setShiftStatus] = useState(() => localStorage.getItem('shiftStatus') || 'Off Duty');
    const [shiftStartTime, setShiftStartTime] = useState(() => {
        const savedTime = localStorage.getItem('shiftStartTime');
        return savedTime ? new Date(savedTime) : null;
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        let timer;
        if (shiftStatus === 'On Duty') {
            timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every second
        }
        return () => clearInterval(timer);
    }, [shiftStatus]);

    useEffect(() => {
        localStorage.setItem('shiftStatus', shiftStatus);
        if (shiftStartTime) {
            localStorage.setItem('shiftStartTime', shiftStartTime.toISOString());
        } else {
            localStorage.removeItem('shiftStartTime');
        }
    }, [shiftStatus, shiftStartTime]);

    const handleClockIn = async () => {
        const now = new Date();
        const shiftId = await clockIn(currentUser?.location || 'Central Hub');
        if (shiftId) {
            setShiftStatus('On Duty');
            setShiftStartTime(now);
            setCurrentTime(now);
            addLog({ action: 'Clock In', detail: `${currentUser?.name || 'User'} started shift at ${now.toLocaleTimeString()}`, type: 'system' });
        }
    };

    const handleClockOut = async () => {
        const result = await clockOut();
        if (result) {
            setShiftStatus('Off Duty');
            setShiftStartTime(null);
            addLog({ action: 'Clock Out', detail: `${currentUser?.name || 'User'} ended shift.`, type: 'system' });
        }
    };

    const handleStatusChange = (asg, newStatus, proofData = null) => {
        const updatedAsg = { ...asg, status: newStatus, ...proofData };
        
        // If claiming a pending task, set current user as assignee
        if (asg.status === 'Pending' && !asg.assigneeId) {
            updatedAsg.assigneeId = currentUser?.id;
            updatedAsg.assignee = currentUser?.name;
        }

        updateAssignment(updatedAsg);
        addLog({
            action: `Task ${newStatus}`,
            detail: `${currentUser?.name || 'User'} updated assignment ${asg.id} to ${newStatus}.`,
            type: 'system'
        });

        // If it's a delivery completion, trigger delivery update too
        const matchingDel = deliveries.find(d => d.orderId === asg.orderId || d.id === asg.deliveryId || d.taskRef === asg.id);
        if (newStatus === 'Completed' && matchingDel) {
            updateDelivery({ ...matchingDel, status: 'Delivered', deliveredAt: new Date().toISOString() });
        }
    };

    const dashboardStats = [
        { label: "Remaining Tasks", value: myAssignments.filter(a => a.status !== 'Completed').length.toString(), icon: ClipboardList, color: "text-accent" },
        { label: "Completed Today", value: "4", icon: CheckCircle2, color: "text-success" },
        {
            label: "Shift Duration",
            value: (() => {
                if (!shiftStartTime) return '0h 0m 0s';
                const diff = Math.max(0, currentTime - shiftStartTime);
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                return `${h}h ${m}m ${s}s`;
            })(),
            subValue: shiftStartTime ? `Started at ${shiftStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Shift Inactive',
            icon: Clock,
            color: "text-warning"
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header & Clock In - Premium Responsive Pass */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex-shrink-0">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white italic uppercase flex items-center gap-3">
                        <Smartphone className="text-accent shrink-0" size={32} strokeWidth={2.5} /> Staff Terminal
                    </h1>
                    <p className="text-secondary text-[10px] md:text-xs mt-1 font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                        <User size={12} className="text-accent/50" /> {currentUser?.name || 'Authorized Officer'} 
                        <span className="opacity-30">|</span> 
                        <MapPin size={12} className="text-accent/50" /> {currentUser?.location || 'Central Command'}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 flex-1">
                    <div className="relative flex-1 group min-w-[300px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-all duration-300" size={20} />
                        <input
                            type="text"
                            placeholder="Interrogate tasks, locations, or operational IDs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm focus:outline-none focus:border-accent/50 focus:bg-white/[0.08] italic font-medium transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] p-2.5 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={handleClockIn}
                                disabled={shiftStatus === 'On Duty'}
                                className={`px-5 md:px-7 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${shiftStatus === 'On Duty' ? 'bg-success/15 text-success/50 cursor-not-allowed' : 'bg-white/5 text-secondary hover:bg-success hover:text-black hover:scale-[1.02]'}`}
                            >
                                Clock In
                            </button>
                            <button
                                onClick={handleClockOut}
                                disabled={shiftStatus === 'Off Duty'}
                                className={`px-5 md:px-7 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${shiftStatus === 'Off Duty' ? 'bg-danger/15 text-danger/50 cursor-not-allowed' : 'bg-white/5 text-secondary hover:bg-danger hover:text-white hover:scale-[1.02]'}`}
                            >
                                Clock Out
                            </button>
                        </div>

                        <div className="px-5 py-2 border-x border-white/10 hidden md:block">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 opacity-60 text-center">Protocol Status</p>
                            <div className="flex items-center justify-center gap-2.5">
                                <div className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${shiftStatus === 'On Duty' ? 'bg-success shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.4)]'}`} />
                                <p className={`text-xs font-black uppercase tracking-widest italic ${shiftStatus === 'On Duty' ? 'text-success' : 'text-danger'}`}>{shiftStatus}</p>
                            </div>
                        </div>

                        <div className="px-5 py-2 flex flex-col items-center">
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 opacity-60">Balance</p>
                            <p className="text-lg font-black text-accent italic tracking-tighter tabular-nums flex items-center gap-2">
                                <Calendar size={14} className="opacity-50" /> {currentUser?.vacationBalance || 0}<span className="text-[10px] uppercase tracking-tighter opacity-50 not-italic ml-0.5">h</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {dashboardStats.map((stat, idx) => (
                                <div key={idx} className="glass-card p-6 flex items-center gap-4 group hover:border-accent/30 transition-all">
                                    <div className={`w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-2xl font-black text-white italic font-heading tracking-tighter">{stat.value}</p>
                                        {stat.subValue && <p className="text-[9px] text-accent mt-1 font-black uppercase tracking-widest italic">{stat.subValue}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="glass-card p-6 border-accent/10">
                                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                                        <Navigation size={20} className="text-accent" /> Priority Queue
                                    </h3>
                                    <div className="space-y-4">
                                        {filteredMyAssignments.filter(a => a.status !== 'Completed').map(asg => (
                                            <TaskCard key={asg.id} asg={asg} onAction={handleStatusChange} />
                                        ))}
                                        {filteredMyAssignments.filter(a => a.status !== 'Completed').length === 0 && (
                                            <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl">
                                                <CheckCircle size={48} className="text-success mx-auto mb-4 opacity-20" />
                                                <p className="text-secondary font-bold">{searchTerm ? 'No matches found for your search.' : 'No active assignments. Check the Operational Queue.'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <Shield size={18} className="text-accent" /> Security Protocol
                                    </h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                setSecurityModalType('panic');
                                                setIsSecurityModalOpen(true);
                                            }}
                                            className="w-full py-4 bg-danger text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-danger/80 transition-all shadow-lg shadow-danger/20 flex items-center justify-center gap-2"
                                        >
                                            <AlertCircle size={18} /> Emergency Panic
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSecurityModalType('breach');
                                                setIsSecurityModalOpen(true);
                                            }}
                                            className="w-full py-4 bg-white/5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                                        >
                                            Report Security Breach
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'assignments' && (
                    <motion.div
                        key="assignments"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <ClipboardList size={20} className="text-accent" /> My Active Tasks
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredMyAssignments.filter(a => a.status !== 'Completed').map(asg => (
                                    <TaskCard key={asg.id} asg={asg} onAction={handleStatusChange} />
                                ))}
                                {filteredMyAssignments.filter(a => a.status !== 'Completed').length === 0 && (
                                    <p className="col-span-2 text-center py-6 text-secondary italic border border-dashed border-border rounded-2xl">No active operational tasks assigned.</p>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6">Assigned Vehicle Dispatches</h3>
                            <div className="space-y-4">
                                {myDeliveries.map(del => (
                                    <div key={del.id} className="p-5 bg-accent/5 border border-accent/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                                                <Truck size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white italic tracking-tighter">{del.vehicle || 'Institutional Asset'}</p>
                                                <p className="text-[10px] font-black text-accent uppercase tracking-widest italic">{del.orderId || 'MISSION-ALPHA'}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 border-l border-white/10 pl-4">
                                            <p className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1">Manifest</p>
                                            <p className="text-xs text-secondary italic">
                                                {del.items ? del.items.map(i => i.name).join(', ') : (del.item || (currentUser?.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Destination</p>
                                            <p className="text-sm font-black text-white italic tracking-tighter">{del.location || 'Client Hub'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <StatusBadge status={del.status} />
                                            {(() => {
                                                const s = String(del.status).toLowerCase().replace(/_/g, ' ');
                                                if (['accepted', 'pending'].includes(s)) {
                                                    return (
                                                        <button
                                                            onClick={() => updateDelivery({ ...del, status: 'in_transit' })}
                                                            className="btn-primary py-2 px-4 text-[10px]"
                                                        >
                                                            Start Trip
                                                        </button>
                                                    );
                                                }
                                                if (['in transit', 'en route'].includes(s)) {
                                                    return (
                                                        <button
                                                            onClick={() => updateDelivery({ ...del, status: 'delivered' })}
                                                            className="bg-success text-white py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                        >
                                                            Mark as Delivered
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                ))}
                                {myDeliveries.length === 0 && (
                                    <p className="text-center py-6 text-secondary italic border border-dashed border-border rounded-2xl">No active vehicle dispatches assigned.</p>
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6">Operational Assignment Queue</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredPendingAssignments.map(asg => (
                                    <TaskCard key={asg.id} asg={asg} onAction={handleStatusChange} />
                                ))}
                                {filteredPendingAssignments.length === 0 && (
                                    <p className="col-span-2 text-center py-6 text-secondary italic border border-dashed border-border rounded-2xl">No matching pending assignments.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'map' && (
                    <motion.div
                        key="map"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-0 overflow-hidden border-accent/20 h-[600px] relative"
                    >
                        <div className="absolute inset-0 bg-[#0c0c0c] flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <MapIcon size={64} className="text-accent/20 mx-auto animate-pulse" />
                                <p className="text-secondary font-bold uppercase tracking-widest text-xs">Initializing Satellite Navigation...</p>
                            </div>
                        </div>
                        <div className="absolute top-6 right-6 p-4 glass-card bg-black/60 backdrop-blur-md border-accent/30 w-72 space-y-4 animate-in slide-in-from-right">
                            <div className="flex items-center gap-2 border-b border-accent/20 pb-2">
                                <AlertCircle size={14} className="text-accent" />
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Dispatcher Intelligence</p>
                            </div>
                            <div className="space-y-3">
                                {myAssignments.filter(a => a.status !== 'Completed').map(a => (
                                    <div key={a.id} className="space-y-1">
                                        <p className="text-[8px] font-bold text-accent uppercase tracking-tighter">Task: {a.id}</p>
                                        <p className="text-[11px] text-white leading-relaxed">{a.dispatcherNotes || 'Maintain high vigilance. Standard protocol applies.'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'pay' && (
                    <motion.div
                        key="pay"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto space-y-6"
                    >
                        <div className="glass-card p-8 text-center bg-gradient-to-br from-white/[0.05] to-transparent">
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-2">Total Earnings YTD</p>
                            <h2 className="text-5xl font-black text-white italic tracking-tighter">${totalYTD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                            <div className="flex justify-center gap-8 mt-8">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Base Rate</p>
                                    <p className="text-xl font-black text-accent italic tracking-tighter">$20.00/hr</p>
                                </div>
                                <div className="w-[1px] h-10 bg-white/10" />
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Next Payout</p>
                                    <p className="text-xl font-black text-success italic tracking-tighter">Mar 1st</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-accent/10">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-accent">
                                <Shield size={20} /> Registered Settlement Protocol
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.03] p-6 rounded-2xl border border-border">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Financial Institution</p>
                                    <p className="text-lg font-bold text-white">{currentUser?.bankingInfo?.bank || 'Vaulted Bank'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Account Identifier</p>
                                    <p className="text-lg font-bold text-white tracking-widest">{currentUser?.bankingInfo?.account || '**** 0000'}</p>
                                </div>
                                <div className="md:col-span-2 pt-4 border-t border-white/5">
                                    <p className="text-xs text-secondary italic">Payments are processed automatically via bespoke institutional wire transfer every Friday.</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold mb-6">Payment History</h3>
                            <div className="space-y-3">
                                {myPayHistory.map(pay => (
                                    <div key={pay.id} className="p-4 bg-white/[0.02] border border-border rounded-2xl flex justify-between items-center group hover:border-accent/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-secondary">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{pay.period}</p>
                                                <p className="text-[10px] text-muted uppercase font-bold">{pay.date} • {pay.hours} Hours</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white">{pay.total}</p>
                                            <span className="text-[9px] font-black text-success uppercase tracking-widest">{pay.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'leave' && (
                    <motion.div
                        key="leave"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 max-w-4xl mx-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Leave & Absence Records</h3>
                            <button
                                onClick={() => setIsLeaveModalOpen(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={16} /> Request Absence
                            </button>
                        </div>

                        <div className="glass-card p-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted mb-6">My Request History</h4>
                            <div className="space-y-4">
                                {leaveRequests.filter(r => r.userId === currentUser?.id || r.name === currentUser?.name).map(req => (
                                    <div key={req.id} className="p-4 bg-white/[0.02] border border-border rounded-2xl flex justify-between items-center group hover:border-accent/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${req.status === 'Approved' ? 'bg-success/10 text-success' :
                                                req.status === 'Rejected' ? 'bg-danger/10 text-danger' :
                                                    'bg-accent/10 text-accent'
                                                }`}>
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-white">{req.type} Protocol</p>
                                                    {req.hours && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-accent">{req.hours}h Hourly</span>}
                                                </div>
                                                <p className="text-[10px] text-muted uppercase font-bold">{req.start} to {req.end}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] text-muted font-bold uppercase">Decision Status</p>
                                                <p className={`text-xs font-bold ${req.status === 'Approved' ? 'text-success' :
                                                    req.status === 'Rejected' ? 'text-danger' :
                                                        'text-accent'
                                                    }`}>
                                                    {req.status || 'Pending Review'}
                                                </p>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>
                                    </div>
                                ))}
                                {leaveRequests.filter(r => r.userId === currentUser.id || r.name === currentUser.name).length === 0 && (
                                    <p className="text-center py-8 text-secondary italic">No absence records found in the portal.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Modal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                title="Bespoke Absence Request"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase">Absence Category</label>
                            <select
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                value={leaveFormData.type}
                                onChange={(e) => setLeaveFormData({ ...leaveFormData, type: e.target.value })}
                            >
                                <option>Sick Leave</option>
                                <option>Personal Leave</option>
                                <option>Vacation</option>
                                <option>Bereavement</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase">Duration Protocol</label>
                            <select
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                value={leaveFormData.duration || 'Full Day'}
                                onChange={(e) => setLeaveFormData({ ...leaveFormData, duration: e.target.value, hours: e.target.value === 'Half Day' ? 4 : 8 })}
                            >
                                <option>Full Day</option>
                                <option>Half Day</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <CustomDatePicker
                                label="Commencement Date"
                                selectedDate={leaveFormData.start}
                                onChange={(date) => setLeaveFormData({ ...leaveFormData, start: date })}
                            />
                        </div>
                        <div className="space-y-1">
                            <CustomDatePicker
                                label="Conclusion Date"
                                selectedDate={leaveFormData.end}
                                onChange={(date) => setLeaveFormData({ ...leaveFormData, end: date })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button onClick={() => setIsLeaveModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button
                            onClick={() => {
                                addLeaveRequest({ ...leaveFormData, name: currentUser.name, userId: currentUser.id });
                                setIsLeaveModalOpen(false);
                            }}
                            className="btn-primary"
                        >
                            Submit Requisition
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Security Protocol Modals */}
            <Modal
                isOpen={isSecurityModalOpen}
                onClose={() => setIsSecurityModalOpen(false)}
                title={securityModalType === 'panic' ? '🚨 EMERGENCY PANIC PROTOCOL' : '🛡️ SECURITY BREACH REPORT'}
            >
                {securityModalType === 'panic' ? (
                    <div className="space-y-6 text-center py-4">
                        <div className="w-24 h-24 bg-danger/10 border-4 border-danger rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <AlertCircle size={48} className="text-danger" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Signal Sent to HQ</h3>
                            <p className="text-secondary text-sm font-medium leading-relaxed">
                                Your current GPS coordinates have been broadcast to all regional units and law enforcement. <br />
                                <span className="text-danger font-bold">Protocol: Maintain current position and await extraction.</span>
                            </p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-left">
                            <div>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-tight">Response Time</p>
                                <p className="text-lg font-black text-white italic tracking-tighter"><Clock size={14} className="inline mr-1" /> ~4.2 Minutes</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest leading-tight">Extraction Unit</p>
                                <p className="text-lg font-black text-accent italic tracking-tighter">Alpha-6</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSecurityModalOpen(false)}
                            className="w-full py-4 bg-white/5 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Acknowledge & Close
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="p-4 bg-warning/10 border border-warning/20 rounded-2xl flex items-center gap-4">
                            <Shield size={24} className="text-warning shrink-0" />
                            <p className="text-xs text-warning font-medium leading-tight">Reporting a breach initiates immediate internal audit. Please ensure accuracy in your statement.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted uppercase">Incident Type</label>
                                <select
                                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                                    value={breachFormData.type}
                                    onChange={(e) => setBreachFormData({ ...breachFormData, type: e.target.value })}
                                >
                                    <option>Unauthorized Person</option>
                                    <option>Asset Discrepancy</option>
                                    <option>Digital Intrusion</option>
                                    <option>Physical Breach</option>
                                    <option>Bespoke Incident</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted uppercase">Location Coordinates</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={16} />
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-accent outline-none"
                                        value={breachFormData.location}
                                        onChange={(e) => setBreachFormData({ ...breachFormData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted uppercase">Incident Intelligence</label>
                                <textarea
                                    rows={4}
                                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none resize-none"
                                    placeholder="Describe the breach pattern, involved parties, and current status..."
                                    value={breachFormData.detail}
                                    onChange={(e) => setBreachFormData({ ...breachFormData, detail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsSecurityModalOpen(false)}
                                className="flex-1 py-4 bg-white/5 border border-white/10 text-secondary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    addLog({ action: 'Breach Reported', detail: `${currentUser?.name || 'User'} reported a ${breachFormData.type} at ${breachFormData.location}.`, type: 'alert' });
                                    setIsSecurityModalOpen(false);
                                    swalSuccess('Report Sent', 'Transmitted to Institutional Security. Audit tracking initialized.');
                                }}
                                className="flex-1 py-4 bg-accent text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20"
                            >
                                Submit Report
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const TaskCard = ({ asg, onAction }) => {
    const [showProof, setShowProof] = React.useState(false);
    const [proofPhoto, setProofPhoto] = React.useState(null);
    const [proofNotes, setProofNotes] = React.useState('');
    const [gpsStamp] = React.useState(() => {
        const now = new Date();
        return `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setProofPhoto(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmitProof = () => {
        if (!proofPhoto) return;
        onAction(asg, 'Completed', { photo: proofPhoto, notes: proofNotes, gps: gpsStamp });
        setShowProof(false);
        setProofPhoto(null);
        setProofNotes('');
    };

    return (
        <>
            <div className="p-5 bg-white/[0.02] border border-border rounded-2xl hover:border-accent/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-3xl rounded-full -mr-12 -mt-12" />
                <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-accent/60 uppercase tracking-widest">{asg.id}</span>
                                {asg.type && (
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${asg.type === 'Pickup' ? 'bg-info/20 text-info' : 'bg-success/20 text-success'}`}>
                                        {asg.type}
                                    </span>
                                )}
                                <StatusBadge status={asg.status} />
                            </div>
                            <h4 className="font-bold text-white text-lg">{asg.task}</h4>
                        </div>
                        {asg.priority === 'Critical' && (
                            <div className="px-2 py-1 bg-danger/10 text-danger rounded text-[8px] font-black uppercase tracking-tighter animate-pulse">Critical</div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <MapPin size={14} className="text-accent" /> {asg.location}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <TrendingUp size={14} className="text-info" /> {asg.distance || 'Loading...'}
                        </span>
                    </div>

                    <div className="flex gap-2 mt-2">
                        {(() => {
                            const s = String(asg.status).toLowerCase().replace(/_/g, ' ');
                            if (s === 'pending' || s === 'dispatched' || s === 'pending pickup') {
                                return (
                                    <button
                                        onClick={() => onAction(asg, 'in_progress')}
                                        className="flex-1 py-3 bg-accent text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                                    >
                                        Accept & Start
                                    </button>
                                );
                            }
                            if (s === 'in progress') {
                                return (
                                    <button
                                        onClick={() => onAction(asg, 'en_route')}
                                        className="flex-1 py-3 bg-info text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                                    >
                                        Set En Route
                                    </button>
                                );
                            }
                            if (s === 'en route') {
                                return (
                                    <button
                                        onClick={() => setShowProof(true)}
                                        className="flex-1 py-3 bg-success text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Camera size={14} /> Complete Delivery
                                    </button>
                                );
                            }
                            if (s === 'completed') {
                                return (
                                    <div className="flex-1 py-3 bg-white/5 border border-success/20 text-success rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <CheckCircle2 size={14} /> Proof Submitted
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        <button
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(asg.location)}`, '_blank')}
                            className="p-3 bg-white/5 border border-border rounded-xl text-white hover:bg-white/10 transition-all"
                        >
                            <Navigation size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delivery Proof Modal */}
            <AnimatePresence>
                {showProof && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setShowProof(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            className="relative w-full max-w-md bg-sidebar border border-border rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ scale: 0.92, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        >
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center">
                                        <Camera size={16} className="text-success" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-sm">Delivery Proof</p>
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">{asg.id} · {asg.task}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowProof(false)}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                                >
                                    <X size={14} className="text-secondary" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* GPS Stamp */}
                                <div className="flex items-center gap-3 bg-accent/5 border border-accent/15 rounded-2xl px-4 py-3">
                                    <ScanLine size={16} className="text-accent flex-shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-black text-accent/70 uppercase tracking-widest">GPS Timestamp</p>
                                        <p className="text-xs font-bold text-white">{gpsStamp} · {asg.location}</p>
                                    </div>
                                </div>

                                {/* Photo Upload */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Proof Photo <span className="text-danger">*</span></p>
                                    <label
                                        htmlFor={`proof-upload-${asg.id}`}
                                        className="group relative flex flex-col items-center justify-center w-full h-44 rounded-2xl border-2 border-dashed border-border hover:border-accent/50 transition-all cursor-pointer overflow-hidden bg-white/[0.02] hover:bg-white/[0.04]"
                                    >
                                        {proofPhoto ? (
                                            <>
                                                <img src={proofPhoto} alt="Delivery proof" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Change Photo</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-secondary">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-accent/30 group-hover:text-accent transition-all">
                                                    <ImagePlus size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold">Tap to upload photo</p>
                                                    <p className="text-[10px] text-muted">JPG, PNG — Max 10MB</p>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            id={`proof-upload-${asg.id}`}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Delivery Notes <span className="text-muted font-normal normal-case">(optional)</span></p>
                                    <textarea
                                        rows={3}
                                        placeholder="Left with concierge, signed by guest, package condition…"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted/40 focus:border-accent outline-none resize-none transition-all"
                                        value={proofNotes}
                                        onChange={(e) => setProofNotes(e.target.value)}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => setShowProof(false)}
                                        className="flex-1 py-3 bg-white/5 border border-border text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitProof}
                                        disabled={!proofPhoto}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${proofPhoto
                                            ? 'bg-success text-white hover:scale-[1.02] shadow-lg shadow-success/20'
                                            : 'bg-white/5 text-muted cursor-not-allowed'
                                            }`}
                                    >
                                        <CheckCircle2 size={14} /> Confirm Delivery
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default EmployeePortal;
