import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import CustomDatePicker from '../../components/CustomDatePicker';
import { useData } from '../../context/GlobalDataContext';
import { Calendar, Plus, Clock, Star, MapPin, Search, Trash2, Edit } from 'lucide-react';

const ClientEvents = () => {
    const { events, addEvent, updateEvent, deleteEvent, currentUser, clients, fetchTickets } = useData();

    useEffect(() => {
        if (fetchTickets) fetchTickets();
    }, [fetchTickets]);
    const clientName = currentUser?.name || 'Current Client';
    // Find the company record for this user so we can match events by company name
    const myCompany = (clients || []).find(c => {
        const cId = String(c.id).replace('CLT-', '');
        const uId = String(currentUser?.clientId).replace('CLT-', '');
        return (currentUser?.clientId && cId === uId) ||
            String(c.id) === String(currentUser?.company_id) ||
            (currentUser?.email && c.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    });
    const companyName = myCompany?.name;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add' or 'view'
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({ title: '', date: '', location: '', guests: 10, type: 'Private', specialRequests: '', plannerName: '', moodBoard: '' });

    const handleOpenModal = (type, evt = null) => {
        setModalType(type);
        setSelectedEvent(evt);
        if ((type === 'view' || type === 'edit') && evt) {
            const standardTypes = ['Private Residence', 'Yacht / Onboard', 'Luxury Resort', 'Secret Beach'];
            const isStandard = standardTypes.includes(evt.location);
            
            setFormData({ 
                ...evt,
                locationType: isStandard ? evt.location : (evt.location ? 'Other' : 'Private Residence'),
                guests: evt.guestCount || evt.guests || 10,
                moodBoard: evt.moodBoardUrl || evt.moodBoard || ''
            });
        } else {
            setFormData({ title: '', date: '', location: '', guests: 10, type: 'Private', specialRequests: '', plannerName: '', moodBoard: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const payload = {
            ...formData,
            title: formData.title,
            guestCount: formData.guests || formData.guestCount || 0,
            plannerName: formData.plannerName || '',
            specialRequests: formData.specialRequests || '',
            moodBoardUrl: formData.moodBoard || '',
            client: companyName || clientName,
            status: modalType === 'add' ? 'Pending Approval' : formData.status,
        };

        if (modalType === 'add') {
            addEvent({
                ...payload,
                createdAt: new Date().toISOString()
            });
        } else {
            updateEvent({
                ...selectedEvent,
                ...payload
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Event Concierge</h1>
                    <p className="text-secondary mt-1">Book and manage your bespoke events, celebrations, and gatherings.</p>
                </div>
                <button
                    onClick={() => handleOpenModal('add')}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={16} /> Request New Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(e => {
                    // Match by: user name, company name, company_id, or created_by user
                    return e.client === clientName ||
                        (companyName && e.client === companyName) ||
                        e.client_id === myCompany?.id ||
                        (currentUser?.company_id && e.company_id === currentUser.company_id) ||
                        e.manager_id === currentUser?.id ||
                        e.client === 'Current Client' || e.client === 'Operational Client';
                }).map((evt) => (
                    <div key={evt.id} className="glass-card p-6 border-accent/10 group hover:border-accent/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                <Star size={24} />
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${evt.status === 'Active' ? 'bg-success/20 text-success' :
                                evt.status === 'Planning' ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'
                                }`}>
                                {evt.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{evt.title}</h3>
                        <div className="space-y-2 mt-4 text-xs text-secondary">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-accent" />
                                <span>{evt.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-accent" />
                                <span>{evt.location}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6 transition-all">
                            <button
                                onClick={() => handleOpenModal('view', evt)}
                                className="flex-1 btn-secondary py-2 text-[10px] font-bold uppercase"
                            >
                                View
                            </button>
                            <button
                                onClick={() => handleOpenModal('edit', evt)}
                                className="px-3 py-2 bg-accent/10 border border-accent/20 text-accent rounded-lg hover:bg-accent hover:text-black transition-all"
                                title="Edit Event"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => { if (window.confirm('Delete this event?')) deleteEvent(evt.id); }}
                                className="px-3 py-2 bg-danger/10 border border-danger/20 text-danger rounded-lg hover:bg-danger hover:text-white transition-all"
                                title="Delete Event"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalType === 'view' ? 'Event Details' : 'Request Event Consultation'}
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase text-accent">Event Title / Purpose</label>
                        <input
                            type="text"
                            placeholder="e.g. Birthday Celebration on Private Yacht"
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={modalType === 'view'}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase">Requested Date</label>
                            <CustomDatePicker
                                selectedDate={formData.date}
                                onChange={(date) => setFormData({ ...formData, date })}
                                disabled={modalType === 'view'}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Expected Guest Count</label>
                            <input
                                type="number"
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-bold text-white shadow-inner"
                                value={formData.guests}
                                onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                                placeholder="Min. 10"
                                disabled={modalType === 'view'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Event Planner Name</label>
                            <input
                                type="text"
                                placeholder="Leave blank if ZaneZion handles planning"
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-bold text-white shadow-inner"
                                value={formData.plannerName}
                                onChange={(e) => setFormData({ ...formData, plannerName: e.target.value })}
                                disabled={modalType === 'view'}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest text-accent">Mood Board / Inspiration (URL)</label>
                            <input
                                type="text"
                                placeholder="Link to Pinterest/Mood Board"
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-bold text-white shadow-inner"
                                value={formData.moodBoard}
                                onChange={(e) => setFormData({ ...formData, moodBoard: e.target.value })}
                                disabled={modalType === 'view'}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase text-accent">Preferred Location Type</label>
                        <select
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                            value={formData.locationType || 'Private Residence'}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFormData({
                                    ...formData,
                                    locationType: val,
                                    location: val === 'Other' ? '' : val
                                });
                            }}
                            disabled={modalType === 'view'}
                        >
                            <option>Private Residence</option>
                            <option>Yacht / Onboard</option>
                            <option>Luxury Resort</option>
                            <option>Secret Beach</option>
                            <option>Other</option>
                        </select>
                    </div>

                    {(formData.locationType === 'Other' || modalType === 'view') && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-bold text-muted uppercase">Location Details</label>
                            <input
                                type="text"
                                placeholder="Enter bespoke location details..."
                                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                disabled={modalType === 'view'}
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted uppercase">Special Requests & Customizations</label>
                        <textarea
                            placeholder="Floral arrangements, specific catering, security needs..."
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none min-h-[80px]"
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                            disabled={modalType === 'view'}
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button onClick={() => setIsModalOpen(false)} className="btn-secondary">{modalType === 'view' ? 'Close Registry' : 'Discard'}</button>
                        {modalType === 'add' && (
                            <button
                                onClick={handleSave}
                                className="btn-primary px-8"
                            >
                                Submit Request
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ClientEvents;
