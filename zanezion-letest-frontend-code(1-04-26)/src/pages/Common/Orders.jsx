import React, { useState } from 'react';
import Table from '../../components/Table';
import { useData } from '../../context/GlobalDataContext';
import { isoDateSlice, displayOrderStatus } from '../../utils/orderWorkflow';
import { Search, Plus, PackageCheck, PackageX, FileText, CheckCircle, ShoppingCart, Truck, Warehouse, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import OrderModal from '../../components/OrderModal';
import InvoiceGenerationModal from '../../components/InvoiceGenerationModal';
import { normalizeRole, roleCanCreateInstitutionalOrder } from '../../utils/authUtils';

const Orders = () => {
  const {
    orders, addOrder, updateOrder, deleteOrder,
    deliveries, purchaseRequests, stockMovements,
    addProject, invoices, projects, generateInvoiceFromOrder,
    currentUser, launchMissionFromOrder, convertOrderToProject,
    fetchOrders, fetchVendors, fetchClients,
    assignOrderToStage,
    hasMenuPermission
  } = useData();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchOrders();
    fetchVendors();
    fetchClients();
  }, [fetchOrders, fetchVendors, fetchClients]);

  const normalizedRole = currentUser?.role?.toLowerCase().replace(/\s/g, '');
  const portalRole = normalizeRole(currentUser?.role);
  const canStaffCreateOrder = roleCanCreateInstitutionalOrder(portalRole);
  const canManageOrders = ['superadmin', 'admin', 'operations', 'client', 'procurement', 'inventory', 'logistics'].includes(normalizedRole);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

  const handleConvertToProject = async (order) => {
    const projectData = {
      name: `Project: ${order.items?.[0]?.name || 'Mission'}`,
      client: order.client || 'Unknown Client',
      items: order.items || [],
      orderRef: order.id,
      start: order.date || new Date().toISOString().split('T')[0],
      location: order.location || 'Headquarters',
      status: 'Pending',
      deliveryType: order.deliveryType || 'Road',
      managerId: currentUser?.id,
      companyId: order.company_id || order.client_id
    };
    const newProject = await convertOrderToProject(order.id, projectData);
    if (newProject) {
        alert(`System converted Order ${order.id} into a Logistics Project. Redirecting...`);
        navigate('/dashboard/projects');
    } else {
        alert('Failed to route order. Please see console for details.');
    }
  };
  
  const handleApprove = async (order, stage) => {
    if (window.confirm(`Are you sure you want to move Order #${order.id} to ${stage.toUpperCase()} stage?`)) {
      const res = await assignOrderToStage(order.id, stage);
      if (res) {
        alert(`Order #${order.id} has been successfully moved to ${stage}.`);
      }
    }
  };

  const filteredOrders = orders.filter(order =>
    String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAction = (type, order) => {
    setSelectedOrder(order);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSave = (formData) => {
    if (modalType === 'add') {
      addOrder(formData);
    } else if (modalType === 'edit') {
      updateOrder(selectedOrder.id, formData);
    }
    setIsModalOpen(false);
  };


  const handleDelete = (id) => {
    deleteOrder(id);
    setIsModalOpen(false);
  };

  const columns = [
    { header: "Order ID", accessor: "id" },
    { header: "Client", accessor: "client" },
    {
      header: "Order Type",
      accessor: "type",
      render: (row) => (
        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent">
          {row.type || "Custom Order"}
        </span>
      )
    },
    {
      header: "Items",
      accessor: "items",
      render: (item) => {
        if (!item.items || item.items.length === 0) return item.product || "No Items";
        if (item.items.length === 1) return item.items[0].name;
        return `${item.items[0].name} (+${item.items.length - 1} more)`;
      }
    },
    { header: "Vendor", accessor: "vendor", render: (item) => item.vendor || "N/A" },
    {
      header: "Total Value",
      accessor: "total",
      render: (item) => {
        const total = item.total || (item.items ? item.items.reduce((acc, i) => acc + (i.price * i.qty), 0) : 0);
        return `$${parseFloat(total).toLocaleString()}`;
      }
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className="text-xs font-semibold capitalize">{displayOrderStatus(row.status)}</span>
      )
    },
    {
      header: "Delivery",
      accessor: "id",
      render: (row) => {
        const delivery = deliveries?.find(d => d.orderId === row.id);
        return (
          <div className="flex flex-col gap-1">
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${delivery?.status === 'Completed' || delivery?.status === 'Delivered' ? 'bg-success/20 text-success' :
              delivery?.status === 'In Transit' ? 'bg-info/20 text-info' :
                delivery?.status === 'Pending' || delivery?.status === 'Pending Pickup' ? 'bg-warning/20 text-warning' : 'bg-muted/20 text-muted'
              }`}>
              {delivery ? (delivery.status === 'Pending Pickup' ? 'Awaiting Pickup' : delivery.status) : 'N/A'}
            </span>
            {(delivery?.status === 'Completed' || delivery?.status === 'Delivered') && delivery?.deliveryDate && (
              <span className="text-[9px] font-black text-muted uppercase tracking-tighter">
                {new Date(delivery.deliveryDate).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      }
    },
    { header: "Date", accessor: "date", render: (item) => item.date || item.requestDate || item.order_date || isoDateSlice(item.created_at || item.createdAt) || '-' },
  ];

  return (
    <div className="space-y-8">
      <div className="no-print space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-secondary mt-1">Track and manage multi-line supply chain requests and deliveries.</p>
          {!canStaffCreateOrder && (
            <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-wide">
              Manual order creation is limited to staff only — customers use Marketplace / staff-assisted fulfilment.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={() => navigate('/dashboard/invoices')}>
            <FileText size={16} /> Ledger / Invoices
          </button>
          {canStaffCreateOrder && hasMenuPermission('Orders', 'can_add') && (
            <button className="btn-primary flex items-center gap-2" onClick={() => handleAction('add', {})}>
              <Plus size={16} /> Create Order
            </button>
          )}
          {/* <button
            className="px-6 py-2.5 bg-info border border-info/50 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-info/80 shadow-lg shadow-info/20 flex items-center gap-2"
            onClick={() => {
              setSelectedOrderForInvoice(null);
              setIsInvoiceModalOpen(true);
            }}
          >
            <FileText size={16} /> Create Invoice
          </button> */}
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by ID, Client or Items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

          <Table
            columns={columns}
            data={filteredOrders}
            actions={true}
            onView={(item) => handleAction('view', item)}
            onEdit={(item) => handleAction('edit', item)}
            onDelete={(item) => handleDelete(item.id)}
            canEdit={hasMenuPermission('Orders', 'can_edit')}
            canDelete={hasMenuPermission('Orders', 'can_delete')}
            customAction={(item) => canManageOrders ? (
              <div className="flex items-center gap-1 flex-wrap">
                {['superadmin', 'operations', 'admin'].includes(normalizedRole) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const oid = item.id;
                      const orderRef = oid != null ? `ORD-${String(oid).padStart(3, '0')}` : '';
                      navigate('/dashboard/deliveries', {
                        state: {
                          prefillOrderId: oid,
                          orderId: orderRef,
                          items: item.items,
                          client: item.client,
                          location: item.location || item.pickupLocation
                        }
                      });
                    }}
                    className="p-2 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-all flex items-center justify-center font-bold text-[10px] gap-1 border border-white/5"
                    title="Delivery action — assign marketplace fulfilment for field staff"
                  >
                    <Truck size={14} /> Delivery
                  </button>
                )}
                {/* Admin Approval: created -> operation */}
                {['superadmin', 'client', 'admin'].includes(normalizedRole) && 
                 ['created', 'admin_review', 'pending_review'].includes(String(item.status).toLowerCase()) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleApprove(item, 'operation'); }}
                    className="p-2 rounded-lg text-secondary hover:text-success hover:bg-success/10 transition-all flex items-center justify-center font-bold text-[10px] gap-2"
                    title="Approve & Send to Operation"
                  >
                    <CheckCircle size={14} /> <span>Approve</span>
                  </button>
                )}

                {/* Operations Actions: operation -> procurement OR inventory OR logistics */}
                {['superadmin', 'operations'].includes(normalizedRole) && 
                 ['operation'].includes(String(item.status).toLowerCase()) && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleApprove(item, 'procurement'); }}
                      className="p-1 px-2 rounded-lg text-secondary hover:text-warning hover:bg-warning/10 transition-all flex items-center justify-center font-bold text-[9px] gap-1.5 border border-white/5"
                      title="Needs Procurement"
                    >
                      <ShoppingCart size={13} /> <span>Procure</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleApprove(item, 'inventory'); }}
                      className="p-1 px-2 rounded-lg text-secondary hover:text-info hover:bg-info/10 transition-all flex items-center justify-center font-bold text-[9px] gap-1.5 border border-white/5"
                      title="Move to Inventory"
                    >
                      <Warehouse size={13} /> <span>Stock</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleConvertToProject(item); }}
                      className="p-1 px-2 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-all flex items-center justify-center font-bold text-[9px] gap-1.5 border border-accent/20 bg-accent/5 shadow-lg shadow-accent/5"
                      title="Route to Project"
                    >
                      <ArrowRightCircle size={13} /> <span>Project</span>
                    </button>
                  </>
                )}

                {/* Procurement to Inventory: procurement -> inventory */}
                {['superadmin', 'procurement'].includes(normalizedRole) && 
                 ['procurement'].includes(String(item.status).toLowerCase()) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleApprove(item, 'inventory'); }}
                    className="p-2 rounded-lg text-secondary hover:text-info hover:bg-info/10 transition-all flex items-center justify-center font-bold text-[10px] gap-2"
                    title="Move to Inventory"
                  >
                    <Warehouse size={14} /> <span>Store</span>
                  </button>
                )}

                {/* Inventory to Logistics: inventory -> logistics */}
                {['superadmin', 'inventory'].includes(normalizedRole) && 
                 ['inventory'].includes(String(item.status).toLowerCase()) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleApprove(item, 'logistics'); }}
                    className="p-2 rounded-lg text-secondary hover:text-info hover:bg-info/10 transition-all flex items-center justify-center font-bold text-[10px] gap-2"
                    title="Send for Dispatch"
                  >
                    <Truck size={14} /> <span>Dispatch</span>
                  </button>
                )}

                {/* Logistics to Completed: logistics -> completed */}
                {['superadmin', 'logistics'].includes(normalizedRole) && 
                 ['logistics'].includes(String(item.status).toLowerCase()) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleApprove(item, 'completed'); }}
                    className="p-2 rounded-lg text-secondary hover:text-success hover:bg-success/10 transition-all flex items-center justify-center font-bold text-[10px] gap-2"
                    title="Mark as Delivered"
                  >
                    <PackageCheck size={14} /> <span>Deliver</span>
                  </button>
                )}
              </div>
            ) : null}
          />
        </div>
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalType={modalType}
        selectedOrder={selectedOrder}
        onSave={handleSave}
        onDelete={handleDelete}
        role={currentUser?.role}
      />
      <InvoiceGenerationModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedOrderForInvoice}
        onGenerate={(orderWithDetails) => {
          generateInvoiceFromOrder(orderWithDetails);
          navigate('/dashboard/invoices');
        }}
      />
    </div>
  );
};

export default Orders;

