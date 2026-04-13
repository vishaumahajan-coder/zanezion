import React, { useState } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import Table from '../../components/Table';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import RequestModal from '../../components/RequestModal';
import {
  BarChart3, ShoppingBag, Store, FileText, ClipboardCheck,
  TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle,
  Eye, Edit2, Trash2, Plus, ArrowUpRight, TrendingDown
} from 'lucide-react';
import { useData } from '../../context/GlobalDataContext';
import { Link } from 'react-router-dom';
import CustomDatePicker from '../../components/CustomDatePicker';

const ProcurementDashboard = () => {
  const { purchaseRequests, addPurchaseRequest, updatePurchaseRequest, vendors, quotes, fetchProcurement, fetchVendors } = useData();

  React.useEffect(() => {
    fetchProcurement();
    fetchVendors();
  }, [fetchProcurement, fetchVendors]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState('add');

  // Calculate dynamic KPIs
  const pendingRequests = (purchaseRequests || []).filter(r => r.status === 'Pending').length;
  const totalVendors = (vendors || []).length;
  const monthSpend = "$245K"; // Shared state or calculation
  const winRate = "76%";

  const handleAction = (type, req) => {
    setSelectedRequest(req);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSaveRequest = (formData) => {
    if (modalType === 'add') {
      addPurchaseRequest({
        ...formData,
        item: formData.itemName || formData.item,
        requester: formData.requester || "Super Admin",
        priority: formData.priority || 'Medium',
        status: formData.status || 'Pending'
      });
    } else {
      updatePurchaseRequest({ ...selectedRequest, ...formData });
    }
    setIsModalOpen(false);
  };

  const vendorPerformance = [
    { name: 'Island Fresh', rating: 92, delivery: 98, trend: 'up' },
    { name: 'Island Supply', rating: 88, delivery: 85, trend: 'down' },
    { name: 'Universal Goods', rating: 95, delivery: 94, trend: 'up' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Procurement Center</h1>
          <p className="text-secondary mt-1">Sourcing, vendor selection, and purchase audit headquarters.</p>
        </div>
        <div className="flex gap-3">
          <button
            className="btn-secondary text-xs px-6"
            onClick={() => swalInfo('Audit', 'Analyzing Purchase History & Vendor Compliance...')}
          >
            Run Audit
          </button>
          <button
            className="btn-primary text-xs px-6"
            onClick={() => setIsModalOpen(true)}
          >
            New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Pending Orders" value={pendingRequests.toString()} change="+3" type="increase" icon={ShoppingBag} />
        <KpiCard label="Managed Vendors" value={totalVendors.toString()} change="+2" type="increase" icon={Store} />
        <KpiCard label="Month Spend" value={monthSpend} change="-5%" type="decrease" icon={DollarSign} />
        <KpiCard label="Quote Win Rate" value={winRate} change="+4%" type="increase" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-white">
        {/* Priority Requests */}
        <div className="xl:col-span-2 glass-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Priority Purchase Requests</h3>
            <Link to="/dashboard/purchase-requests" className="text-xs text-accent font-bold hover:underline">Full Inventory</Link>
          </div>
          <div className="space-y-4">
            {(purchaseRequests || []).map((req, idx) => (
              <div key={idx} className="group bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-accent/30 hover:bg-white/[0.04] transition-all duration-300 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 bg-background border border-white/10 rounded-xl flex items-center justify-center transition-colors shadow-inner ${req.status === 'Approved' ? 'text-success' : 'text-warning'}`}>
                      <CheckCircle size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm sm:text-base group-hover:text-accent transition-colors truncate">
                        {req.item}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{req.id}</span>
                        <span className="text-muted/30">•</span>
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{req.department}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-0.5">Priority</p>
                      <p className={`text-[10px] font-bold uppercase ${req.priority === 'Urgent' ? 'text-danger' : 'text-accent'}`}>{req.priority}</p>
                    </div>
                    <StatusBadge status={req.status} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction('view', req)}
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-accent hover:text-black transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleAction('edit', req)}
                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="glass-card p-6 sm:p-8">
          <h3 className="text-xl font-bold mb-8">Partner Protocol</h3>
          <div className="space-y-8">
            {vendorPerformance.map((vendor, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{vendor.name}</span>
                    {vendor.trend === 'up' ? <ArrowUpRight size={14} className="text-success" /> : <TrendingDown size={14} className="text-danger" />}
                  </div>
                  <span className="text-xs font-bold text-accent">{vendor.rating}% Score</span>
                </div>
                <div className="h-1.5 bg-white/5 border border-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${vendor.rating > 90 ? 'bg-accent shadow-[0_0_15px_rgba(200,169,106,0.3)]' : 'bg-secondary'}`}
                    style={{ width: `${vendor.rating}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Efficiency: {vendor.delivery}%</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 bg-white/5 border border-border text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
            Audit Ledger Report
          </button>
        </div>
      </div>

      {/* Quote Comparison */}
      <div className="glass-card p-6 sm:p-8">
        <h3 className="text-xl font-bold mb-6">Live Quote Market</h3>
        <Table
          columns={[
            { header: "Vendor Partner", accessor: "vendorId", render: (row) => { const v = vendors?.find(x => x.id === `VND-00${row.vendorId}`) || vendors?.find(x => x.name.includes('Vendor')); return v ? v.name : 'Monaco Global'; } },
            { header: "Item Sourced", accessor: "items", render: (row) => row.items?.[0]?.name || 'Institutional Asset' },
            {
              header: "Price Quoted",
              accessor: "total",
              render: (row) => <span className="text-accent font-bold">${parseFloat(row.total || 0).toLocaleString()}</span>
            }
          ]}
          data={(quotes || []).slice(0, 5)}
          actions={true}
          customAction={(row) => (
            <Link
              to="/dashboard/quotes"
              className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/5 px-3 py-2 rounded-lg border border-accent/20 hover:bg-accent hover:text-black transition-all"
            >
              Review Quote
            </Link>
          )}
        />
      </div>

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRequest}
        selectedRequest={selectedRequest}
        modalType={modalType}
      />
    </div>
  );
};

export default ProcurementDashboard;
