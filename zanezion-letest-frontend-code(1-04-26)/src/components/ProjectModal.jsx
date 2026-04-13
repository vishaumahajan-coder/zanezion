import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Calendar, User, MapPin, Briefcase, Hash } from 'lucide-react';
import { useData } from '../context/GlobalDataContext';
import CustomDatePicker from './CustomDatePicker';

const ProjectModal = ({ isOpen, onClose, onSave }) => {
  const { clients, fetchClients } = useData();
  const [formData, setFormData] = useState({
    projectId: 'PRJ-' + Math.floor(100 + Math.random() * 900),
    projectName: '',
    client: '',
    clientId: '',
    startDate: new Date().toISOString().split('T')[0],
    location: '',
    status: 'Pending',
    deliveryType: 'Road'
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      setFormData({
        projectId: 'PRJ-' + Math.floor(100 + Math.random() * 900),
        projectName: '',
        client: '',
        clientId: '',
        startDate: new Date().toISOString().split('T')[0],
        location: '',
        status: 'Pending',
        deliveryType: 'Road'
      });
    }
  }, [isOpen, fetchClients]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Project ID</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                value={formData.projectId}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent outline-none"
                disabled
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Project Name</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g. Island Setup"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Client</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <select
                value={formData.clientId}
                onChange={(e) => {
                  const selectedClient = clients.find(c => String(c.id) === e.target.value);
                  setFormData({ 
                    ...formData, 
                    clientId: e.target.value, 
                    client: selectedClient ? selectedClient.companyName || selectedClient.name : '' 
                  });
                }}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent outline-none"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.companyName || client.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <CustomDatePicker
              label="Start Date"
              selectedDate={formData.startDate}
              onChange={(date) => setFormData({ ...formData, startDate: date })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Port Hercule"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:border-accent outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest text-accent">Logistics Deployment Protocol</label>
            <div className="flex gap-2">
              {['Road', 'Sea', 'Air'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: mode })}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${formData.deliveryType === mode
                    ? 'bg-accent/20 border-accent text-accent shadow-lg shadow-accent/5'
                    : 'bg-white/5 border-white/10 text-muted hover:border-white/30'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t border-border/50">
          <button type="button" onClick={onClose} className="btn-secondary h-11 px-8 rounded-xl font-bold">Cancel</button>
          <button type="submit" className="btn-primary h-11 px-8 rounded-xl font-bold">Save Project</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
