import React, { useState } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import {
  Plus, Search, Briefcase, Calendar,
  MapPin, Users, Target, Info, Clock, Rocket
} from 'lucide-react';
import CustomDatePicker from '../../components/CustomDatePicker';
import Pagination from '../../components/Common/Pagination';

import { useData } from '../../context/GlobalDataContext';

const Projects = () => {
  const { projects, addProject, updateProject, deleteProject, fetchProjects, clients, fetchClients, convertProjectToMission, hasMenuPermission } = useData();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ name: '', client: '', clientId: '', start: '', location: '', status: 'Pending', deliveryType: 'Road' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  React.useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [fetchProjects, fetchClients]);

  // All filtering done on frontend for consistency
  const filteredProjects = projects.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      (p.name || '').toLowerCase().includes(term) ||
      (p.client || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      String(p.id).includes(term);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const itemsPerPage = 10;
  const currentProjects = filteredProjects.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handleAction = (type, prj) => {
    setSelectedProject(prj);
    setModalType(type);
    setFormData(prj.id ? { ...prj, deliveryType: prj.deliveryType || 'Road' } : { name: '', client: '', clientId: '', start: '', location: '', status: 'Pending', deliveryType: 'Road' });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name?.trim()) return swalWarning('Required', 'Project name is required.');
    if (modalType === 'add') {
      addProject(formData);
    } else if (modalType === 'edit') {
      updateProject({ ...selectedProject, ...formData });
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    deleteProject(selectedProject.id);
    setIsModalOpen(false);
  };

  const handleLaunchMission = async (prj) => {
    const confirm = await swalConfirm('Launch Mission', `Are you sure you want to initialize a logistics mission for ${prj.name}?`);
    if (confirm) {
      const missionData = {
        mission_type: 'Delivery',
        destination_type: prj.location || 'Client Site',
        notes: `Logistics deployment for Project ID: ${prj.id}`
      };
      await convertProjectToMission(prj.id, missionData);
      swalSuccess('Mission Launched', 'Project has been routed to Logistics/Missions protocol.');
    }
  };

  const columns = [
    { header: "Project ID", accessor: "id" },
    { header: "Project Name", accessor: "name" },
    { header: "Client", accessor: "client" },
    { header: "Start Date", accessor: "start" },
    { header: "Location", accessor: "location" },
    { header: "Status", accessor: "status" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="text-secondary mt-1">Coordinate high-end hospitality projects and events.</p>
        </div>
        {hasMenuPermission('Projects', 'can_add') && (
          <button className="btn-primary flex items-center gap-2" onClick={() => handleAction('add', {})}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-1 gap-4 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <select
              className="bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={currentProjects}
          actions={true}
          onView={(item) => handleAction('view', item)}
          onEdit={(item) => handleAction('edit', item)}
          onDelete={(item) => handleAction('delete', item)}
          canEdit={hasMenuPermission('Projects', 'can_edit')}
          canDelete={hasMenuPermission('Projects', 'can_delete')}
          customAction={(item) => (
            <button 
              onClick={(e) => { e.stopPropagation(); handleLaunchMission(item); }}
              className="p-2 hover:bg-accent/10 text-accent rounded-lg transition-colors group relative"
              title="Launch Mission"
            >
              <Rocket size={16} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                Route to Logistics
              </span>
            </button>
          )}
        />
        {filteredProjects.length > itemsPerPage && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredProjects.length}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'view' ? 'Project Details' :
            modalType === 'edit' ? 'Edit Project' :
              modalType === 'delete' ? 'Archive Project' : 'Create New Project'
        }
      >
        {selectedProject && (
          <div className="space-y-6">
            {modalType === 'delete' ? (
              <div className="space-y-4">
                <p className="text-secondary">Are you sure you want to archive <span className="text-primary font-bold">{selectedProject.name}</span>?</p>
                <div className="flex gap-3 justify-end pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleDelete} className="px-6 py-2 bg-danger text-white rounded-lg font-bold">Archive Project</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Project ID</label>
                    <input type="text" defaultValue={selectedProject.id} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none" disabled={modalType === 'view' || modalType === 'edit'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Project Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none" disabled={modalType === 'view'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Client</label>
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
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none" 
                      disabled={modalType === 'view'}
                    >
                      <option value="">Select Client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <CustomDatePicker
                      label="Start Date"
                      selectedDate={modalType === 'add' ? formData.start : selectedProject.start}
                      onChange={(date) => {
                        if (modalType === 'add') setFormData({ ...formData, start: date });
                        else setSelectedProject({ ...selectedProject, start: date });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none" disabled={modalType === 'view'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Status</label>
                    <select className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} disabled={modalType === 'view'}>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Register Logistics Deployment</label>
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
                          disabled={modalType === 'view'}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {modalType === 'view' && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-border space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin size={16} className="text-accent" />
                      <span className="text-secondary">Location:</span>
                      <span className="font-bold">{selectedProject.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Target size={16} className="text-accent" />
                      <span className="text-secondary">Objective:</span>
                      <span className="font-bold">Full VIP Concierge Setup</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-6">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">{modalType === 'view' ? 'Close' : 'Cancel'}</button>
                  {modalType !== 'view' && <button onClick={handleSave} className="btn-primary">Save Project</button>}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Projects;
