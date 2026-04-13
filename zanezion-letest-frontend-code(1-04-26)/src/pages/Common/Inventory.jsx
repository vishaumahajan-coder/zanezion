import React, { useState } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import Table from '../../components/Table';
import KpiCard from '../../components/KpiCard';
import Modal from '../../components/Modal';
import { useData } from '../../context/GlobalDataContext';
import { Package, AlertTriangle, ArrowUp, Plus, MapPin, Box, Warehouse, ClipboardCheck, History, DollarSign, Calendar, ClipboardList } from 'lucide-react';
import CustomDatePicker from '../../components/CustomDatePicker';
import StatusBadge from '../../components/StatusBadge';

const Inventory = () => {
  const { inventory, addInventory, updateInventory, deleteInventory, users, currentUser, vendors, stockMovements, addStockEntry, issueStock, projects, purchaseRequests, addPurchaseRequest, updateProject, recordLoss, clients, fetchInventory, fetchClients, fetchVendors, hasMenuPermission } = useData();

  React.useEffect(() => {
    fetchInventory();
    fetchClients();
    fetchVendors();
  }, [fetchInventory, fetchClients, fetchVendors]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view'); // view, entry, issue, loss
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    item: '',
    qty: 0,
    price: 0,
    warehouse: 'Warehouse A',
    category: '',
    vendor: '',
    client: '',
    issuedBy: currentUser?.name || '',
    reason: '',
    inventoryType: 'Marketplace',
    clientId: ''
  });
  const userRoleNorm = (currentUser?.role || '').toLowerCase().replace(/[\s_]+/g, '');
  const [activeTab, setActiveTab] = useState(['superadmin', 'admin', 'inventory', 'inventorymanager', 'procurement', 'operations'].includes(userRoleNorm) ? 'Marketplace' : 'Client');

  const isAdmin = ['superadmin', 'admin', 'client', 'inventory', 'inventorymanager', 'procurement', 'operations', 'concierge', 'conciergemanager'].includes(userRoleNorm);

  const isCustomer = ['customer'].includes(userRoleNorm);

  const myClient = isCustomer ? (clients || []).find(c =>
    String(c.id) === String(currentUser?.clientId) ||
    String(c.id).replace('CLT-', '') === String(currentUser?.clientId).replace('CLT-', '') ||
    c.email === currentUser?.email ||
    c.name === currentUser?.name
  ) : null;

  const displayedInventory = inventory.filter(i => {
    if (isCustomer) {
      // Customer sees only their own Client inventory
      return i.inventoryType === 'Client' && (
        (myClient && (String(i.clientId) === String(myClient.id))) ||
        i.issuedTo === currentUser?.name
      );
    }
    const typeMatch = (i.inventoryType || 'Marketplace') === activeTab;
    return typeMatch;
  });

  const totalStockValue = displayedInventory.reduce((acc, i) => acc + (parseFloat(i.price || 0) * parseInt(i.qty || 0)), 0);
  const lowStockItems = displayedInventory.filter(i => i.status === 'Critical' || i.status === 'Warning');

  const inboundAssets = purchaseRequests.filter(pr => pr.status === 'Approved' || pr.status === 'Ordered');

  const handleAction = (type, item, projectContext = null, prContext = null) => {
    if (!isAdmin && type !== 'view') return;
    setSelectedItem(item);
    setModalType(type);
    if (type === 'entry') {
      if (prContext) {
        setFormData({
          item: prContext.item || (prContext.items && prContext.items[0]?.name) || '',
          qty: prContext.qty || (prContext.items && prContext.items[0]?.qty) || '',
          price: prContext.price || (prContext.items && prContext.items[0]?.price) || '',
          warehouse: 'Warehouse A',
          category: prContext.category || 'General',
          vendor: prContext.vendor || '',
          issuedBy: currentUser?.name || '',
          prRef: prContext.id,
          inventoryType: 'Marketplace',
          clientId: ''
        });
      } else {
        setFormData({ item: '', qty: '', price: '', warehouse: 'Warehouse A', category: 'General', vendor: '', issuedBy: currentUser?.name || '', inventoryType: 'Marketplace', clientId: '' });
      }
    } else if (type === 'issue') {
      setFormData({
        item: item?.name || '',
        qty: item?.qty || '',
        client: item?.client || '',
        warehouse: item?.location || 'Warehouse A',
        issuedBy: currentUser?.name || '',
        projectRef: projectContext?.id || null
      });
    } else if (type === 'loss') {
      setFormData({
        item: item?.name || '',
        qty: '',
        warehouse: item?.location || 'Warehouse A',
        reason: '',
        issuedBy: currentUser?.name || ''
      });
    }
    else {
      setFormData(item);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    try {
      if (modalType === 'entry') {
        addStockEntry(formData);
      } else if (modalType === 'issue') {
        issueStock(formData);
        if (formData.projectRef) {
          const targetProject = projects.find(p => p.id === formData.projectRef);
          if (targetProject) {
            updateProject({ ...targetProject, fulfilled: true, status: 'Fulfilled' });
          }
        }
      } else if (modalType === 'loss') {
        recordLoss(formData);
      } else if (modalType === 'edit') {
        updateInventory(formData);
      } else if (modalType === 'delete') {
        deleteInventory(selectedItem.id);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error during handleSave:', err);
      swalError('Error', 'Verification failed.');
    }
  };

  const columns = [
    { header: "Product Name", accessor: "name" },
    { header: "Category", accessor: "category" },
    { header: "Qty", accessor: "qty" },
    {
      header: "Unit Price",
      accessor: "price",
      render: (item) => `$${parseFloat(item.price || 0).toLocaleString()}`
    },
    {
      header: "Value",
      accessor: "stockValue",
      render: (item) => `$${(parseFloat(item.price || 0) * parseInt(item.qty || 0)).toLocaleString()}`
    },
    { header: "Warehouse", accessor: "location" },
    ...(isAdmin && activeTab === 'Client' ? [{
      header: "Client",
      accessor: "clientName",
      render: (item) => item.clientName || '—'
    }] : []),
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Inventory Intelligence
          </h1>
          <p className="text-secondary mt-1 font-medium">Precision stock orchestration and institutional supply chain visibility.</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button className="btn-secondary flex items-center gap-2 border-danger/20 text-danger hover:bg-danger/10" onClick={() => handleAction('loss', {})}>
                <AlertTriangle size={16} /> Record Loss
              </button>
              <button className="btn-secondary flex items-center gap-2 border-accent/20 text-accent" onClick={() => handleAction('issue', {})}>
                <Box size={16} /> Stock Issue
              </button>
              {hasMenuPermission('Inventory', 'can_add') && (
                <button className="btn-primary flex items-center gap-2 shadow-xl shadow-accent/10" onClick={() => handleAction('entry', {})}>
                  <Plus size={16} /> Stock Entry
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Institutional Value" value={`$${(totalStockValue / 1000).toFixed(1)}K`} change="+5.2%" type="increase" icon={DollarSign} />
        <KpiCard label="Critical Thresholds" value={lowStockItems.length.toString()} change={`+${lowStockItems.length === 0 ? '0' : '2'}`} type="decrease" icon={AlertTriangle} />
        <KpiCard
          label="Utilization Rate"
          value={`${Math.min(98, (inventory.length / 50 * 100)).toFixed(0)}%`}
          change="Optimal"
          type="increase"
          icon={History}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Warehouse Ledger</h3>
              {isAdmin && (
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 w-full sm:w-auto overflow-x-auto whitespace-nowrap hide-scrollbar">
                  {['Marketplace', 'Client'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                        ? 'bg-accent text-black shadow-lg shadow-accent/20'
                        : 'text-muted hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {tab} Inventory
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Table
              columns={columns}
              data={displayedInventory}
              actions={true}
              onView={(item) => handleAction('view', item)}
              onEdit={(item) => handleAction('edit', item)}
              onDelete={(item) => handleAction('delete', item)}
              canEdit={hasMenuPermission('Inventory', 'can_edit')}
              canDelete={hasMenuPermission('Inventory', 'can_delete')}
              customAction={(item) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAction('issue', item)}
                    className="p-2 hover:bg-accent/10 text-accent rounded-lg transition-colors"
                    title="Issue this item"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => handleAction('loss', item)}
                    className="p-2 hover:bg-danger/10 text-danger rounded-lg transition-colors"
                    title="Record Loss"
                  >
                    <AlertTriangle size={16} />
                  </button>
                </div>
              )}
            />
          </div>

          <div className="glass-card p-6 border-accent/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <ClipboardCheck className="text-accent" size={20} /> Stock Movement / Issue Log
            </h3>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-[10px] uppercase font-bold text-muted tracking-widest px-2">Protocol</th>
                    <th className="pb-4 text-[10px] uppercase font-bold text-muted tracking-widest">Type</th>
                    <th className="pb-4 text-[10px] uppercase font-bold text-muted tracking-widest">Asset</th>
                    <th className="pb-4 text-[10px] uppercase font-bold text-muted tracking-widest">Entity</th>
                    <th className="pb-4 text-[10px] uppercase font-bold text-muted tracking-widest text-center">Qty</th>
                    <th className="pb-4 text-[10px] uppercase font-bold text-muted tracking-widest text-right">Date/Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {stockMovements.map((log) => (
                    <tr key={log.id} className="text-xs group hover:bg-white/[0.01]">
                      <td className="py-4 font-mono font-bold text-accent px-2">{log.id}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${log.type === 'Entry' ? 'bg-success/10 text-success' :
                          log.type === 'Loss' ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'
                          }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-white italic">{log.item}</td>
                      <td className="py-4 text-secondary font-medium">{log.client || log.vendor || 'Internal'}</td>
                      <td className="py-4 font-bold text-center">{log.qty}</td>
                      <td className="py-4 text-right">
                        <div className="font-bold text-white">{log.date}</div>
                        <div className="text-[10px] text-muted uppercase">{log.time}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View for Stock Movements */}
            <div className="sm:hidden space-y-4">
              {stockMovements.map((log) => (
                <div key={log.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-accent">{log.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${log.type === 'Entry' ? 'bg-success/10 text-success' :
                      log.type === 'Loss' ? 'bg-danger/10 text-danger' : 'bg-info/10 text-info'
                      }`}>
                      {log.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-black text-white italic">{log.item}</h4>
                      <p className="text-[10px] text-secondary mt-0.5">{log.client || log.vendor || 'Internal'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">Qty: {log.qty}</p>
                      <p className="text-[9px] text-muted uppercase tracking-widest mt-0.5">{log.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
          {currentUser?.role === 'Super Admin' && (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 border-t border-white/5 pt-6">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black text-muted uppercase block mb-2 tracking-widest">Assign Inventory Auditor</label>
                <select className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-accent outline-none font-bold text-white">
                  <option>Select Auditor...</option>
                  {users?.filter(u => u && u.id).map(u => (
                    <option key={u.id}>{u.name} ({u.role || 'Unassigned'})</option>
                  ))}
                </select>
              </div>
              <button className="w-full sm:w-auto btn-secondary py-3 px-8 text-xs flex items-center justify-center gap-2 whitespace-nowrap self-end border-accent/20 text-accent">
                <History size={14} /> Schedule System Audit
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {inboundAssets.length > 0 && (
            <div className="glass-card p-6 border-success/30 bg-success/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
                <ArrowUp size={120} />
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <ArrowUp className="text-success" size={18} />
                </div>
                Inbound Logistics Protocol
              </h3>

              <div className="space-y-4 relative z-10">
                {inboundAssets.map((pr, idx) => (
                  <div key={idx} className="p-4 bg-black/40 border border-success/20 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">{pr.item || (pr.items && pr.items[0]?.name)}</h4>
                        <p className="text-[9px] text-success font-black mt-1 uppercase tracking-widest">{pr.id} • Approved</p>
                      </div>
                      <button
                        onClick={() => handleAction('entry', {}, null, pr)}
                        className="p-2 bg-success text-black rounded-lg hover:bg-success/80 transition-all font-black"
                        title="Process Receipt"
                      >
                        <ClipboardCheck size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted">
                      <span>Expected Qty: {pr.qty || (pr.items && pr.items[0]?.qty)}</span>
                      <span>{pr.department}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-6 border-accent/30 bg-accent/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
              <ClipboardList size={120} />
            </div>

            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <ClipboardList className="text-accent" size={18} />
              </div>
              Mission Fulfillment Control
            </h3>

            <div className="space-y-6 relative z-10">
              {projects.filter(p => !p.fulfilled).length > 0 ? projects.filter(p => !p.fulfilled).map((prj, idx) => (
                <div key={idx} className="glass-card bg-black/40 p-4 border-white/5 space-y-4 hover:border-accent/50 transition-all group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors">{prj.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={10} className="text-muted" />
                        <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{prj.client}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-accent/10 rounded border border-accent/20">
                      <span className="text-[9px] text-accent font-black uppercase tracking-tighter">Mission Active</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-3 text-center">Protocol Decision Tree</p>
                    {prj.items?.map((item, iidx) => {
                      const stockItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
                      const hasStock = stockItem && stockItem.qty >= item.qty;

                      return (
                        <div key={iidx} className="space-y-2 last:mb-0 mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Box size={14} className={hasStock ? "text-success" : "text-danger"} />
                              <span className="text-xs font-black text-white">{item.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-muted">Req: {item.qty}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={!hasStock}
                              onClick={() => handleAction('issue', { ...stockItem, name: item.name, qty: item.qty, client: prj.client }, prj)}
                              className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${hasStock
                                ? "bg-success/20 text-success border border-success/30 hover:bg-success/30"
                                : "bg-white/5 text-muted border border-white/5 cursor-not-allowed opacity-50"
                                }`}
                            >
                              YES (Stock)
                            </button>
                            <button
                              onClick={() => {
                                addPurchaseRequest({
                                  items: [item],
                                  requester: currentUser?.name || 'System Auditor',
                                  priority: 'High',
                                  status: 'Pending',
                                  orderRef: prj.orderRef
                                });
                                swalSuccess('PR Generated', `PR for ${item.name}. Procurement team notified.`);
                              }}
                              className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${!hasStock
                                ? "bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 shadow-lg shadow-danger/10"
                                : "bg-white/5 text-muted border border-white/5 hover:bg-white/10"
                                }`}
                            >
                              NO (Procure)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                  <Package size={32} className="mx-auto text-muted mb-3 opacity-20" />
                  <p className="text-xs text-secondary italic">All mission logistics synchronized.</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 border-warning/20">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="text-warning" size={20} /> Threshold Alerts
            </h3>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? lowStockItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-sm font-bold text-white mb-1">{item.name}</p>
                  <div className="flex justify-between text-[10px] text-secondary uppercase font-black">
                    <span>Current: {item.qty}</span>
                    <span className="text-warning">{item.status}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-secondary italic">All institutional assets stable.</p>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Capacity Utilization</h3>
            <div className="space-y-4">
              {[
                { name: "Warehouse A", capacity: Math.min(100, (inventory.filter(i => i.location === 'Warehouse A').length / 20) * 100) },
                { name: "Warehouse B", capacity: Math.min(100, (inventory.filter(i => i.location === 'Warehouse B').length / 20) * 100) },
                { name: "Cold Storage", capacity: Math.min(100, (inventory.filter(i => i.location === 'Cold Storage').length / 20) * 100) },
              ].map((wh, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-2">
                    <span>{wh.name}</span>
                    <span className="text-white">{wh.capacity.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${wh.capacity > 80 ? 'bg-danger' : wh.capacity > 60 ? 'bg-warning' : 'bg-accent'}`}
                      style={{ width: `${wh.capacity}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'entry' ? 'Inbound Logistics (Stock Entry)' :
            modalType === 'issue' ? 'Outbound Logistics (Stock Issue)' :
              modalType === 'loss' ? 'Strategic Loss Assessment' :
                modalType === 'view' ? 'Asset Intelligence' :
                  modalType === 'delete' ? 'Decommission Asset' : 'Modify Asset'
        }
      >
        <div className="space-y-6">
          {modalType === 'delete' ? (
            <div className="space-y-6">
              <div className="p-6 bg-danger/5 border-2 border-dashed border-danger/20 rounded-2xl text-center">
                <AlertTriangle size={48} className="mx-auto text-danger mb-4 opacity-50" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Confirm Asset Decommissioning</h3>
                <p className="text-sm text-secondary">
                  Are you sure you want to remove <span className="text-white font-bold">{selectedItem?.name}</span> from the institutional ledger?
                  This action will archive the asset across all warehouse hubs.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-muted uppercase mb-1">Asset ID</p>
                  <p className="text-sm font-bold text-white">{selectedItem?.id}</p>
                </div>
                <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black text-muted uppercase mb-1">Current Qty</p>
                  <p className="text-sm font-bold text-white">{selectedItem?.qty}</p>
                </div>
              </div>
            </div>
          ) : modalType === 'entry' ? (
            // ... truncated entry content (assuming tool handles keep)
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Inventory Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="inventoryType"
                      value="Marketplace"
                      checked={formData.inventoryType === 'Marketplace'}
                      onChange={(e) => setFormData({ ...formData, inventoryType: 'Marketplace', clientId: '' })}
                      className="accent-accent"
                    />
                    Marketplace Inventory
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="radio"
                      name="inventoryType"
                      value="Client"
                      checked={formData.inventoryType === 'Client'}
                      onChange={(e) => setFormData({ ...formData, inventoryType: 'Client' })}
                      className="accent-accent"
                    />
                    Client Inventory
                  </label>
                </div>
              </div>

              {formData.inventoryType === 'Client' && (
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest text-accent">Select Client Owner</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-background border border-accent/20 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white shadow-lg shadow-accent/5"
                  >
                    <option value="">Select Client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Item Name</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                  placeholder="e.g. Dom Perignon"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                >
                  <option>General</option>
                  <option>Beverage</option>
                  <option>Marine Supply</option>
                  <option>Provisions</option>
                  <option>Housekeeping</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Quantity</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Unit Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Stock Entry Date</label>
                <input
                  type="date"
                  value={formData.stockDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, stockDate: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest text-accent font-black">Stock Valuation (Auto)</label>
                <div className="w-full bg-accent/5 border border-accent/20 rounded-lg px-4 py-2 text-sm font-black text-accent italic">
                  ${(parseFloat(formData.qty || 0) * parseFloat(formData.price || 0)).toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Warehouse</label>
                <select
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                >
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Cold Storage</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Vendor source</label>
                <select
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
            </div>
          ) : modalType === 'issue' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Client Name</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                  placeholder="Recipient Entity"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Item Issued</label>
                <select
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                >
                  <option value="">Select Asset...</option>
                  {inventory.map(i => <option key={i.id} value={i.name}>{i.name} (In Stock: {i.qty})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Quantity</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Warehouse Source</label>
                <select
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                >
                  <option>Warehouse A</option>
                  <option>Warehouse B</option>
                  <option>Cold Storage</option>
                </select>
              </div>
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Issued By (Officer)</label>
                <input
                  type="text"
                  value={formData.issuedBy}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-secondary italic"
                />
              </div>
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Issued To (Recipient Name/Signature)</label>
                <input
                  type="text"
                  value={formData.issuedTo || ''}
                  onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                  placeholder="Who is taking this item?"
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                />
              </div>
            </div>
          ) : modalType === 'loss' ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Asset Lost</label>
                <select
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                >
                  <option value="">Select Asset...</option>
                  {inventory.map(i => <option key={i.id} value={i.name}>{i.name} (Available: {i.qty})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Quantity of Loss</label>
                <input
                  type="number"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest">Reason for Loss</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-accent outline-none font-bold text-white resize-none"
                  placeholder="Theft, Damage, Expiry, etc..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            // Existing 'view' or 'edit' modal content
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Asset Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Inventory Type</label>
                  <select
                    value={formData.inventoryType || 'Marketplace'}
                    onChange={(e) => setFormData({ ...formData, inventoryType: e.target.value, clientId: e.target.value === 'Marketplace' ? '' : formData.clientId })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  >
                    <option value="Marketplace">Marketplace</option>
                    <option value="Client">Client</option>
                  </select>
                </div>
                {formData.inventoryType === 'Client' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted uppercase">Client Owner</label>
                    <select
                      value={formData.clientId || ''}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                      disabled={modalType === 'view'}
                    >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">On-Hand Quantity</label>
                  <input
                    type="number"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Unit Price (USD)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                    step="0.01"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Warehouse Bin</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  >
                    <option>Warehouse A</option>
                    <option>Warehouse B</option>
                    <option>Cold Storage 1</option>
                    <option>Silo 4</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Supply Partner (Vendor)</label>
                  <select
                    value={formData.vendorName || ''}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-muted uppercase">Measurement Unit</label>
                  <select
                    value={formData.unit || 'Unit'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  >
                    <option>Unit</option>
                    <option>Case</option>
                    <option>LB</option>
                    <option>KG</option>
                    <option>Gallon</option>
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Product Image URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/product.jpg"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Inventory Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none font-bold"
                    disabled={modalType === 'view'}
                  >
                    <option>In Stock</option>
                    <option>Low Stock</option>
                    <option>Out of Stock</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Stock Entry Date</label>
                  <input
                    type="date"
                    value={formData.stockDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, stockDate: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Issued By (Officer)</label>
                  <input
                    type="text"
                    value={formData.issuedBy || ''}
                    onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                    placeholder="Officer name"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Issued To (Signature/Name)</label>
                  <input
                    type="text"
                    value={formData.issuedTo || ''}
                    onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                    placeholder="Who is taking this item?"
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none"
                    disabled={modalType === 'view'}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">Issued At (Protocol Timestamp)</label>
                  <input
                    type="text"
                    value={formData.lastIssuedDate || new Date().toLocaleString()}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:border-accent outline-none text-muted font-mono"
                    disabled={true}
                  />
                </div>
              </div>

              {modalType === 'view' && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      <Calendar size={16} className="text-accent" /> Entry Date
                    </div>
                    <span className="font-bold">{selectedItem?.stockDate || '2024-06-01'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      <DollarSign size={16} className="text-accent" /> Valuation
                    </div>
                    <span className="font-bold text-accent">${(parseFloat(formData.qty) * parseFloat(formData.price)).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary border-accent/20 text-accent">Close</button>
            {modalType !== 'view' && (
              <button
                onClick={handleSave}
                className={`btn-primary ${modalType === 'delete' ? 'bg-danger hover:bg-danger/80 border-danger' : ''}`}
              >
                {modalType === 'entry' ? 'Verify & Inbound' :
                  modalType === 'issue' ? 'Verify & Dispatch' :
                    modalType === 'loss' ? 'Record Asset Loss' :
                      modalType === 'delete' ? 'Confirm Decommission' : 'Commit Stock Data'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
