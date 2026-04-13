import React, { useState } from 'react';
import { swalSuccess, swalError, swalWarning, swalInfo, swalConfirm, swalCredentials, swalCopied } from '../../utils/swal';
import KpiCard from '../../components/KpiCard';
import ProgressBar from '../../components/ProgressBar';
import StatusBadge from '../../components/StatusBadge';
import StockModal from '../../components/StockModal';
import {
  Package, AlertTriangle, Plus, History,
  Warehouse, Truck, BarChart3, ClipboardList,
  ArrowRight, Box
} from 'lucide-react';

import { useData } from '../../context/GlobalDataContext';

const InventoryDashboardRole = () => {
  const { inventory, addInventory, updateInventory, deleteInventory, fetchInventory, inventoryAlerts, fetchInventoryAlerts } = useData();
  
  React.useEffect(() => {
    fetchInventory();
    fetchInventoryAlerts();
  }, [fetchInventory, fetchInventoryAlerts]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveStock = (formData) => {
    addInventory({
      name: formData.productName,
      qty: "100 Units",
      location: formData.location || "Warehouse A",
      category: "Stock Entry",
      status: formData.status
    });
    setIsModalOpen(false);
  };

  const lowStockAlerts = (inventoryAlerts || []).map(alert => ({
    item: alert.name,
    count: alert.qty,
    unit: 'Units',
    type: alert.status === 'Critical' ? 'danger' : 'warning'
  })).slice(0, 3);

  const warehouseActivity = [
    { action: 'Stock Added', item: 'Beluga Caviar', time: '10m ago', icon: Plus, color: 'text-success' },
    { action: 'Stock Moved', item: 'Crystal Glassware', time: '1h ago', icon: Warehouse, color: 'text-info' },
    { action: 'Stock Delivered', item: 'Champagne Case', time: '3h ago', icon: Truck, color: 'text-accent' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Inventory Hub</h1>
          <p className="text-secondary text-xs md:text-sm mt-1">Warehouse management and precision stock distribution control.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] sm:text-xs py-3 px-6"
            onClick={() => swalInfo('Stock Audit', 'Scanners active. Verification in progress.')}
          >
            <ClipboardList size={16} /> Run Audit
          </button>
          <button
            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 text-[10px] sm:text-xs py-3 px-6"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} /> New Stock Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total SKU" value="1,280" change="+12" type="increase" icon={Box} />
        <KpiCard label="Low Stock Items" value="8" change="-2" type="decrease" icon={AlertTriangle} />
        <KpiCard label="Warehouse Space" value="85%" change="Stable" type="neutral" icon={Warehouse} />
        <KpiCard label="Movement (24h)" value="142" change="+15%" type="increase" icon={History} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold mb-6">Strategic Stock Levels</h3>
          <div className="space-y-8">
            {inventory.slice(0, 4).map((item, idx) => {
              const stockPercentage = parseInt(item.qty) || 75; // Fallback or parsed value
              return (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className={`text-xs font-bold ${item.status === 'Critical' ? 'text-danger' : 'text-accent'}`}>{item.qty}</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${item.status === 'Critical' ? 'bg-danger' : 'bg-accent'}`}
                      style={{ width: `${stockPercentage > 100 ? 100 : stockPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-10 btn-secondary py-3 text-xs flex items-center justify-center gap-2">
            View Expanded Inventory <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6 border-danger/10">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="text-danger" size={20} /> Low Stock Alerts
            </h3>
            <div className="space-y-4">
              {lowStockAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-border rounded-xl">
                  <div>
                    <p className="text-sm font-bold">{alert.item}</p>
                    <p className="text-xs text-secondary mt-0.5">{alert.count} {alert.unit}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${alert.type === 'danger' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                    {alert.type === 'danger' ? 'Critical' : 'Warning'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 bg-accent/[0.02]">
            <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6">Recent Arrivals</h3>
            <div className="space-y-3">
              <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold">Imported Cheese Batch</p>
                  <p className="text-[10px] text-muted uppercase">Pending Quality Check</p>
                </div>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold">Luxury Candles (Gold)</p>
                  <p className="text-[10px] text-muted uppercase">Ready for Storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <History className="text-accent" size={20} /> Warehouse Activity Log
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouseActivity.map((activity, idx) => (
            <div key={idx} className="p-5 bg-white/[0.02] border border-border rounded-2xl hover:border-accent/20 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 bg-white/5 rounded-xl ${activity.color} group-hover:scale-110 transition-transform`}>
                  <activity.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">{activity.action}</p>
                  <p className="text-sm font-bold text-white">{activity.item}</p>
                </div>
              </div>
              <p className="text-[10px] text-secondary font-medium">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>

      <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStock}
      />
    </div>
  );
};

export default InventoryDashboardRole;
