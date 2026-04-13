import React, { useState } from 'react';
import Table from '../../components/Table';
import { Search, Plus } from 'lucide-react';
import { useData } from '../../context/GlobalDataContext';
import RequestModal from '../../components/RequestModal';
import Pagination from '../../components/Common/Pagination';

const PurchaseRequests = () => {
  const { purchaseRequests, addPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest, fetchProcurement, hasMenuPermission } = useData();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    fetchProcurement();
  }, [fetchProcurement]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = purchaseRequests.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return String(r.id).toLowerCase().includes(term) ||
      r.requester?.toLowerCase().includes(term) ||
      r.item_name?.toLowerCase().includes(term) ||
      (r.items && JSON.stringify(r.items).toLowerCase().includes(term));
  });
  const itemsPerPage = 10;
  const currentRequests = filteredRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handleAction = (type, req) => {
    setSelectedRequest(req);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSave = (formData) => {
    if (modalType === 'add') {
      addPurchaseRequest(formData);
    } else if (modalType === 'edit') {
      updatePurchaseRequest({ ...selectedRequest, ...formData });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deletePurchaseRequest(id);
    setIsModalOpen(false);
  };

  const columns = [
    { header: "Request ID", accessor: "id" },
    {
      header: "Items",
      accessor: "items",
      render: (item) => {
        if (!item.items || item.items.length === 0) return item.item || "No Items";
        if (item.items.length === 1) return item.items[0].name;
        return `${item.items[0].name} (+${item.items.length - 1} more)`;
      }
    },
    { header: "Requester", accessor: "requester" },
    {
      header: "Total Est.",
      accessor: "total",
      render: (item) => {
        const total = item.total || (item.items ? item.items.reduce((acc, i) => acc + (i.price * i.qty), 0) : 0);
        return `$${parseFloat(total).toLocaleString()}`;
      }
    },
    { header: "Department", accessor: "department" },
    { header: "Status", accessor: "status" },
    { header: "Date", accessor: "date", render: (item) => item.date || item.createdAt?.split('T')[0] || "2024-05-28" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Requests</h1>
          <p className="text-secondary mt-1">Review and approve procurement requests from departments.</p>
        </div>
        {hasMenuPermission('Purchase Requests', 'can_add') && (
          <button className="btn-primary flex items-center gap-2" onClick={() => handleAction('add', {})}>
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by ID, Requester or Item..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={currentRequests}
          actions={true}
          onView={(item) => handleAction('view', item)}
          onEdit={(item) => handleAction('edit', item)}
          onDelete={(item) => handleDelete(item.id)}
          canEdit={hasMenuPermission('Purchase Requests', 'can_edit')}
          canDelete={hasMenuPermission('Purchase Requests', 'can_delete')}
        />
        {filteredRequests.length > itemsPerPage && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredRequests.length}
            />
          </div>
        )}
      </div>

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        selectedRequest={selectedRequest}
        modalType={modalType}
      />
    </div>
  );
};

export default PurchaseRequests;
