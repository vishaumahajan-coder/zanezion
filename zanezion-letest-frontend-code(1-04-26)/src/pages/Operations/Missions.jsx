import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { useData } from '../../context/GlobalDataContext';
import { 
  Plus, Search, Shield, Truck, User, 
  Calendar, MapPin, Navigation, Package, 
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import api from '../../utils/api';

const Missions = () => {
  const { 
    missions, fetchMissions, users, fleet, fetchFleet, fetchStaff,
    addLog, updateMissionStatus, assignMissionDriver, deleteMission,
    hasMenuPermission
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedMission, setSelectedMission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [assignData, setAssignData] = useState({
    driverId: '',
    vehicleId: ''
  });

  useEffect(() => {
    fetchMissions();
    fetchFleet();
    fetchStaff();
  }, [fetchMissions, fetchFleet, fetchStaff]);

  const handleAction = (type, mission) => {
    setSelectedMission(mission);
    setModalType(type);
    if (type === 'assign') {
      setAssignData({
        driverId: mission.driverId || '',
        vehicleId: mission.vehicleId || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleAssign = async () => {
    await assignMissionDriver(selectedMission.id, assignData.driverId, assignData.vehicleId);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = async (status) => {
    await updateMissionStatus(selectedMission.id, status);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    await deleteMission(selectedMission.id);
    setIsModalOpen(false);
  };

  const filteredMissions = missions.filter(m => 
    String(m.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.orderId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "Mission ID", accessor: "id" },
    { header: "Order ID", accessor: "orderId" },
    { 
      header: "Type", 
      accessor: "missionType",
      render: (row) => (
        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent">
          {row.missionType}
        </span>
      )
    },
    { 
      header: "Driver", 
      accessor: "driverName",
      render: (row) => row.driverName || <span className="text-muted italic">Unassigned</span>
    },
    { 
      header: "Vehicle", 
      accessor: "plateNumber",
      render: (row) => row.plateNumber || <span className="text-muted italic">N/A</span>
    },
    { 
      header: "Status", 
      accessor: "status",
      render: (row) => (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
          row.status === 'completed' ? 'bg-success/20 text-success' :
          row.status === 'en_route' ? 'bg-info/20 text-info' :
          row.status === 'assigned' ? 'bg-accent/20 text-accent' : 'bg-muted/20 text-muted'
        }`}>
          {row.status}
        </span>
      )
    },
    { header: "Date", accessor: "date" },
    {
      header: "Action",
      accessor: "id",
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction('assign', row); }}
              className="px-2 py-1 bg-accent/20 text-accent hover:bg-accent hover:text-white rounded text-[9px] font-bold uppercase transition-colors"
            >
              Assign
            </button>
          )}
          {row.status === 'assigned' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setSelectedMission(row);
                await updateMissionStatus(row.id, 'en_route');
              }}
              className="px-2 py-1 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded text-[9px] font-bold uppercase transition-colors"
            >
              Dispatch
            </button>
          )}
          {row.status === 'en_route' && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setSelectedMission(row);
                await updateMissionStatus(row.id, 'completed');
              }}
              className="px-2 py-1 bg-success/20 text-success hover:bg-success hover:text-white rounded text-[9px] font-bold uppercase transition-colors"
            >
              Arrived
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-secondary mt-1">High-level tactical oversight of converted orders and active deployments.</p>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search Missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <Table 
          columns={columns} 
          data={filteredMissions}
          actions={true}
          onView={(item) => handleAction('view', item)}
          onEdit={(item) => handleAction('assign', item)}
          onDelete={(item) => handleAction('delete', item)}
          canEdit={hasMenuPermission('Missions', 'can_edit')}
          canDelete={hasMenuPermission('Missions', 'can_delete')}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'assign' ? 'Mission Asset Assignment' : 
            modalType === 'delete' ? 'Scrap Mission' : 'Mission Details'
        }
      >
        {selectedMission && modalType === 'delete' ? (
          <div className="space-y-6">
             <div className="p-6 bg-danger/5 border-2 border-dashed border-danger/20 rounded-2xl text-center">
                <Shield size={48} className="mx-auto text-danger mb-4 opacity-50" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Decommission Mission</h3>
                <p className="text-sm text-secondary">
                  Are you sure you want to scrub mission <span className="text-white font-bold">#{selectedMission.id}</span>? 
                  This will cancel all associated logistics and return items to inventory.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                 <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Close Protocol</button>
                 <button onClick={handleDelete} className="px-6 py-2 bg-danger text-white rounded-lg font-bold">Scrap Mission</button>
              </div>
          </div>
        ) : selectedMission && modalType === 'assign' ? (
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Target Mission</h4>
              <p className="text-sm font-bold text-white">Mission #{selectedMission.id} - Order #{selectedMission.orderId}</p>
              <p className="text-xs text-muted mt-1 uppercase font-black">{selectedMission.missionType} | {selectedMission.destinationType}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Tactical Pilot (Driver)</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-bold"
                  value={assignData.driverId}
                  onChange={(e) => setAssignData({ ...assignData, driverId: e.target.value })}
                >
                  <option value="">Choose Personnel...</option>
                  {users.filter(u => {
                    const r = (u.role || '').toLowerCase();
                    // Show only staff, drivers, and logistics personnel
                    return r === 'staff' || r === 'driver' || r === 'logistics' || r === 'field_staff';
                  }).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Fleet Asset (Vehicle)</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-bold"
                  value={assignData.vehicleId}
                  onChange={(e) => setAssignData({ ...assignData, vehicleId: e.target.value })}
                >
                  <option value="">Choose Vehicle...</option>
                  {fleet.map(v => (
                    <option key={v.db_id} value={v.db_id}>{v.id} - {v.model}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={handleAssign}
                className="w-full py-3 bg-accent text-primary rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] transition-transform mt-4"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        ) : selectedMission && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[8px] font-black text-muted uppercase">Status</p>
                  <p className="text-sm font-bold text-accent uppercase italic">{selectedMission.status}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[8px] font-black text-muted uppercase">Launch Date</p>
                  <p className="text-sm font-bold text-white italic">{selectedMission.date}</p>
                </div>
             </div>
             <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[8px] font-black text-muted uppercase mb-2">Tactical Intelligence</p>
                <p className="text-xs text-secondary italic">{selectedMission.notes || 'No mission logs recorded.'}</p>
             </div>
             
             <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateStatus('completed')}
                  className="flex-1 py-3 bg-success/20 text-success border border-success/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-success hover:text-white transition-all"
                >
                  Finalize Mission
                </button>
                <button 
                  onClick={() => handleUpdateStatus('failed')}
                  className="flex-1 py-3 bg-danger/20 text-danger border border-danger/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-danger hover:text-white transition-all"
                >
                  Abort Mission
                </button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Missions;
