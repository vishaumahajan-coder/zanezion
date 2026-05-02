import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { normalizeRole, roleCanCreateInstitutionalOrder } from '../utils/authUtils';
import { isoDateSlice, normalizeOrderStatusForApi, displayOrderStatus } from '../utils/orderWorkflow';
import { VENDOR_PERFORMANCE, INVENTORY_ALERTS, RECENT_ORDERS, CLIENTS, ACCESS_PLANS, USERS, ORDERS, INVOICES, VENDORS, INVENTORY } from '../utils/data';

const GlobalDataContext = createContext();

/** Shallow merge: overlay keys only if value !== undefined (keeps false / 0 / ''). */
function mergeUserFields(base, ...overlays) {
    const out = { ...(base && typeof base === 'object' ? base : {}) };
    for (const o of overlays) {
        if (!o || typeof o !== 'object') continue;
        for (const [k, v] of Object.entries(o)) {
            if (v !== undefined) out[k] = v;
        }
    }
    return out;
}

function withoutPassword(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const { password, password_confirm, current_password, ...rest } = obj;
    return rest;
}

function normalizeApiUserPayload(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.user && typeof data.user === 'object') return data.user;
    if (Array.isArray(data)) return data[0] && typeof data[0] === 'object' ? data[0] : null;
    return data;
}

/** API route id: numeric or first digits from VND-123 style. */
function poNumericId(id) {
    if (id == null || id === '') return '';
    const s = String(id).trim();
    if (/^\d+$/.test(s)) return s;
    const m = s.match(/(\d+)/);
    return m ? m[1] : s;
}

function quotePathId(id) {
    return poNumericId(id);
}

/** Backend may return [] or wrap rows in { clients, items, data }. */
function normalizeClientsResponseBody(body) {
    if (body == null) return [];
    if (Array.isArray(body)) return body;
    if (typeof body !== 'object') return [];
    if (Array.isArray(body.data)) return body.data;
    for (const k of ['clients', 'items', 'records', 'results', 'rows']) {
        if (Array.isArray(body[k])) return body[k];
    }
    return [];
}

function mapClientFromApi(c) {
    if (!c || typeof c !== 'object') return null;
    return {
        ...c,
        companyName: c.business_name || c.companyName || c.name,
        location: c.address || c.location || '',
    };
}

function vendorPathId(id) {
    if (id == null || id === '') return '';
    const s = String(id).trim();
    if (/^\d+$/.test(s)) return s;
    const rest = s.replace(/^VND-?/i, '');
    if (/^\d+$/.test(rest)) return rest;
    const m = s.match(/(\d+)/);
    return m ? m[1] : s;
}

function buildVendorApiBody(vendor, companyId) {
    const name = (vendor.name || '').trim();
    if (!name) {
        const err = new Error('Vendor name is required.');
        err.code = 'VALIDATION';
        throw err;
    }
    const contactName = (vendor.contact_name || vendor.contact || '').trim();
    const body = {
        name,
        email: (vendor.email || '').trim() || undefined,
        phone: (vendor.phone || '').trim() || undefined,
        category: (vendor.category || '').trim() || undefined,
        address: (vendor.address || '').trim() || undefined,
    };
    if (contactName) {
        body.contact_name = contactName;
        body.contact_person = contactName;
    }

    const r = vendor.rating;
    const d = vendor.delivery;
    if (r !== '' && r != null && !Number.isNaN(Number(r))) {
        body.rating = Math.min(100, Math.max(0, Math.round(Number(r))));
    }
    if (d !== '' && d != null && !Number.isNaN(Number(d))) {
        body.delivery = Math.min(100, Math.max(0, Math.round(Number(d))));
    }

    if (companyId != null && companyId !== '') {
        const n = Number(companyId);
        body.company_id = Number.isFinite(n) && !Number.isNaN(n) ? n : companyId;
    }

    const st = String(vendor.status || '').toLowerCase();
    if (['active', 'inactive', 'blacklisted'].includes(st)) {
        body.status = st;
    }

    const out = {};
    for (const [k, v] of Object.entries(body)) {
        if (v === undefined || v === '') continue;
        out[k] = v;
    }
    return out;
}

/** DB expects integers — frontend often sends "ORD-12", "CLT-5", or "user_9". */
function parseInvoiceOrderIdForApi(orderId) {
    if (orderId == null || orderId === '') return null;
    if (typeof orderId === 'number' && Number.isFinite(orderId)) return orderId;
    const digits = String(orderId).replace(/\D/g, '');
    if (!digits) return null;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? null : n;
}

/** Personal customers use value "user_<id>" — same as checkout: numeric id as client_id for API. */
function parseInvoiceClientIdForApi(clientId) {
    if (clientId == null || clientId === '') return null;
    if (typeof clientId === 'number' && Number.isFinite(clientId)) return clientId;
    const s = String(clientId).trim();
    if (s.startsWith('user_')) {
        const n = parseInt(s.slice(5), 10);
        return Number.isNaN(n) ? null : n;
    }
    const digits = s.replace(/\D/g, '');
    if (!digits) return null;
    const n = parseInt(digits, 10);
    return Number.isNaN(n) ? null : n;
}

function mapInvoiceStatusForApi(status) {
    const x = String(status || 'unpaid').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    const map = {
        unpaid: 'unpaid',
        partially_paid: 'partially_paid',
        paid: 'paid',
        overdue: 'overdue',
        cancelled: 'cancelled',
        pending: 'pending',
        proforma: 'pro_forma',
        pro_forma: 'pro_forma',
    };
    return map[x] || 'unpaid';
}

/** Body for POST /finance/invoices (snake_case, numeric FKs). */
function buildFinanceInvoiceCreatePayload(invoice) {
    const order_id = parseInvoiceOrderIdForApi(invoice.orderId ?? invoice.order_id);
    const client_id = parseInvoiceClientIdForApi(invoice.clientId ?? invoice.client_id);
    let amount = parseFloat(invoice.totalAmount ?? invoice.amount ?? 0);
    if (!Number.isFinite(amount)) amount = 0;
    let paid_amount = parseFloat(invoice.paidAmount ?? invoice.paid_amount ?? 0);
    if (!Number.isFinite(paid_amount)) paid_amount = 0;
    let due_date = invoice.dueDate || invoice.due_date || invoice.date;
    due_date = due_date ? String(due_date).split('T')[0] : new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];
    const status = mapInvoiceStatusForApi(invoice.status);

    const body = {
        client_id,
        amount,
        due_date,
        status,
    };
    if (Number.isFinite(paid_amount) && paid_amount > 0) body.paid_amount = paid_amount;
    if (order_id != null) body.order_id = order_id;
    return body;
}

export const GlobalDataProvider = ({ children }) => {
    // Initial States from data.js
    const [subscriptionRequests, setSubscriptionRequests] = useState([]);
    const [clients, setClients] = useState(CLIENTS);
    const [vendors, setVendors] = useState(VENDORS);
    const [inventory, setInventory] = useState(INVENTORY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [accessPlans, setAccessPlans] = useState(ACCESS_PLANS);

    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (e) {
                console.error("Failed to parse saved user", e);
            }
        }
        return null;
    });

    const [menuPermissions, setMenuPermissions] = useState(() => {
        const saved = localStorage.getItem('menuPermissions');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return []; }
        }
        return [];
    });

    /** Core procurement screens: DB role menus sometimes omit can_add; procurement staff should manage these. */
    const PROCUREMENT_FULL_CRUD_MENUS = new Set(['quotes', 'purchase requests', 'vendors', 'purchase orders']);

    /** Inventory role: warehouses & stock ledger are core duties; RBAC rows sometimes omit create. */
    const INVENTORY_FULL_CRUD_MENUS = new Set(['warehouses', 'inventory']);
    /** Logistics role: delivery ops screens should always support standard CRUD actions. */
    const LOGISTICS_FULL_CRUD_MENUS = new Set(['fleet', 'deliveries', 'tracking', 'routes', 'urgent']);
    /** Concierge role should always be able to create/manage their core service menus. */
    const CONCIERGE_FULL_CRUD_MENUS = new Set(['events', 'guest requests', 'luxury items']);

    // Helper: check if user has a specific action on a menu
    const hasMenuPermission = (menuName, action = 'can_view') => {
        const role = currentUser?.role?.toLowerCase().replace(/\s+/g, '_');
        if (role === 'super_admin' || role === 'superadmin' || role === 'admin') return true;

        const key = String(menuName || '').trim().toLowerCase();
        if (role === 'procurement' && PROCUREMENT_FULL_CRUD_MENUS.has(key)) {
            return ['can_view', 'can_add', 'can_edit', 'can_delete'].includes(action);
        }
        if (role === 'inventory' && INVENTORY_FULL_CRUD_MENUS.has(key)) {
            return ['can_view', 'can_add', 'can_edit', 'can_delete'].includes(action);
        }
        if (role === 'logistics' && LOGISTICS_FULL_CRUD_MENUS.has(key)) {
            return ['can_view', 'can_add', 'can_edit', 'can_delete'].includes(action);
        }
        if (role === 'concierge' && CONCIERGE_FULL_CRUD_MENUS.has(key)) {
            return ['can_view', 'can_add', 'can_edit', 'can_delete'].includes(action);
        }

        // If no permissions loaded, deny by default (secure fallback)
        if (!menuPermissions || menuPermissions.length === 0) return false;
        const perm = menuPermissions.find(p => String(p.name || '').trim().toLowerCase() === key);
        return perm ? !!perm[action] : false;
    };

    const [users, setUsers] = useState([]);
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [orders, setOrders] = useState(ORDERS);
    const [invoices, setInvoices] = useState(INVOICES);
    const [payments, setPayments] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [chauffeurRequests, setChauffeurRequests] = useState([]);
    const [logs, setLogs] = useState([]);
    const [fleet, setFleet] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [missions, setMissions] = useState([]);
    const [staffAssignments, setStaffAssignments] = useState([]);
    const [payHistory, setPayHistory] = useState([]);
    const [teams, setTeams] = useState([]);
    const [audits, setAudits] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [guestRequests, setGuestRequests] = useState([]);
    const [events, setEvents] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [urgentTasks, setUrgentTasks] = useState([]);
    const [tracking, setTracking] = useState([]);
    // Backend in some deployments doesn't expose tracking/urgent endpoints.
    const trackingApiUnavailableRef = React.useRef(false);
    const urgentApiUnavailableRef = React.useRef(false);
    const [stockMovements, setStockMovements] = useState([]);
    const [cart, setCart] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [revenueFilter, setRevenueFilter] = useState('Weekly');
    const [activePlan, setActivePlan] = useState('Institutional Premium');
    const [dashboardStats, setDashboardStats] = useState({});
    const [systemSettings, setSystemSettings] = useState({});
    const [inventoryAlerts, setInventoryAlerts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addLog = (log) => {
        setLogs(prev => [{
            ...log,
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }, ...prev].slice(0, 50));
    };

    const formatDateTime = (date, time) => {
        if (!date) date = new Date().toISOString().split('T')[0];
        if (!time) return `${date} 00:00:00`;

        // Attempt to parse time string (e.g., "11:20 PM", "23:20", "11:20")
        let hours = 0, minutes = 0, seconds = 0;
        const timeRegex = /(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i;
        const match = String(time).match(timeRegex);

        if (match) {
            hours = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
            seconds = match[3] ? parseInt(match[3], 10) : 0;
            const ampm = match[4];

            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
        }

        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');

        return `${date} ${h}:${m}:${s}`;
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
        addLog({ action: 'Cart Update', detail: `Added ${item.name} to the procurement queue.`, type: 'system' });
    };

    const removeFromCart = (id) => {
        setCart(prev => {
            const item = prev.find(i => i.id === id);
            if (item && item.qty > 1) {
                return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
            }
            return prev.filter(i => i.id !== id);
        });
    };
    const clearCart = () => setCart([]);

    const fetchClients = React.useCallback(async (options = {}) => {
        try {
            const params = new URLSearchParams();
            if (options.search) params.append('search', options.search);
            if (options.client_type) params.append('client_type', options.client_type);
            const url = `/clients${params.toString() ? '?' + params.toString() : ''}`;
            const res = await api.get(url);
            let raw = res.data?.success ? res.data.data : res.data;
            const arr = normalizeClientsResponseBody(raw);
            const mapped = arr.map(mapClientFromApi).filter(Boolean);
            // Empty API list wipes UI dropdowns; keep seed list until backend returns rows.
            if (mapped.length > 0) {
                setClients(mapped);
            } else {
                setClients(CLIENTS.map((c) => mapClientFromApi(c)).filter(Boolean));
            }
        } catch (e) {
            console.error("Fetch clients failed", e);
            setClients(CLIENTS.map((c) => mapClientFromApi(c)).filter(Boolean));
        }
    }, []);

    const fetchVendors = React.useCallback(async () => {
        try {
            const res = await api.get('/vendors');
            const data = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setVendors(data.map(v => ({
                ...v,
                status: v.status || 'active',
                contact: v.contact_name || v.contact || '',
                delivery: v.delivery || Math.round((v.rating || 0) * 100) || 90,
            })));
        } catch (e) {
            console.error("Fetch vendors failed", e);
            setVendors(VENDORS);
        }
    }, []);

    const fetchInventory = React.useCallback(async () => {
        try {
            const res = await api.get('/inventory');
            const data = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setInventory(data.map(i => ({
                ...i,
                qty: i.quantity ?? i.qty ?? 0,
                location: i.warehouse_name || i.location || '',
                inventoryType: i.inventory_type || i.inventoryType || 'Marketplace',
                clientId: i.client_id || i.clientId || null,
                clientName: i.client_name || i.clientName || '',
                vendor_id: i.vendor_id ?? i.vendorId ?? null,
                vendorName: i.vendor_name || i.vendorName || i.vendor || '',
                status: i.status === 'in_stock' ? 'Normal' : i.status === 'low_stock' ? 'Warning' : i.status === 'out_of_stock' ? 'Critical' : (i.status || 'Normal'),
            })));
        } catch (e) {
            console.error("Fetch inventory failed", e);
            setInventory(INVENTORY);
        }
    }, []);

    const fetchAccessPlans = React.useCallback(async () => {
        try {
            const res = await api.get('/saas/plans');
            const rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            if (!Array.isArray(rawData) || rawData.length === 0) {
                setAccessPlans(ACCESS_PLANS);
                return;
            }
            const mapped = rawData.map((row) => {
                let features = [];
                if (row.features != null) {
                    try {
                        features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features;
                    } catch {
                        features = [];
                    }
                }
                if (!Array.isArray(features)) features = [];
                const priceNum = parseFloat(row.price || 0);
                const cycle = row.billing_cycle || 'Monthly';
                const isAnnual = String(cycle).toLowerCase() === 'annually';
                return {
                    id: row.id,
                    name: row.name,
                    tier: cycle,
                    price: `$${priceNum.toLocaleString(undefined, { minimumFractionDigits: priceNum % 1 ? 2 : 0, maximumFractionDigits: 2 })}`,
                    period: isAnnual ? 'per year' : 'per month',
                    yearlyPrice: isAnnual
                        ? `$${priceNum.toLocaleString(undefined, { minimumFractionDigits: priceNum % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
                        : `$${Math.round(priceNum * 12 * 0.8).toLocaleString()}`,
                    description: row.description || '',
                    features,
                    commitment: `${cycle} subscription.`,
                    billing_cycle: cycle,
                    max_users: row.max_users,
                    max_orders: row.max_orders,
                    status: row.status
                };
            });
            setAccessPlans(mapped);
        } catch (e) {
            console.error('Fetch access plans failed', e);
            setAccessPlans(ACCESS_PLANS);
        }
    }, []);

    const fetchSubscriptionRequests = React.useCallback(async (operationId) => {
        try {
            // The backend /api/saas/requests already filters by logged-in user if role is operations
            const res = await api.get('/saas/requests');
            const rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setSubscriptionRequests(rawData);
        } catch (e) { console.error("Fetch subscription requests failed", e); }
    }, []);

    const fetchLeaveRequests = React.useCallback(async () => {
        try {
            const res = await api.get('/staff/leave');
            if (res.data?.success) {
                setLeaveRequests(res.data.data);
            }
        } catch (error) {
            console.error("Fetch leave requests failed", error);
        }
    }, []);

    const fetchStaff = React.useCallback(async () => {
        try {
            const res = await api.get('/users');
            if (res.data?.success) {
                const list = res.data.data;
                setUsers(list);
                return list;
            }
        } catch (e) {
            console.error("Fetch staff failed", e);
            setUsers([]);
        }
        return null;
    }, []);

    const [customerUsers, setCustomerUsers] = React.useState([]);
    const fetchCustomerUsers = React.useCallback(async () => {
        try {
            const res = await api.get('/users/customers');
            if (res.data?.success) {
                setCustomerUsers(res.data.data);
            }
        } catch (e) {
            console.error("Fetch customer users failed", e);
        }
    }, []);

    const fetchFleet = React.useCallback(async () => {
        try {
            const res = await api.get('/logistics/vehicles');
            if (res.data && res.data.success) {
                setFleet(res.data.data.map(v => ({
                    id: v.plate_number,
                    db_id: v.id,
                    type: v.type,
                    model: v.model,
                    fuel: `${v.fuel_level}%`,
                    status: v.status === 'available' ? 'Active' : v.status,
                    vehicle_type: v.vehicle_type,
                    capacity: v.capacity,
                    insurancePolicy: v.insurance_policy,
                    registrationExpiry: v.registration_expiry ? v.registration_expiry.split('T')[0] : '',
                    inspectionDate: v.inspection_date ? v.inspection_date.split('T')[0] : '',
                    diagnosticStatus: v.diagnostic_status
                })));
            }
        } catch (e) { console.error("Fetch fleet failed", e); }
    }, []);

    const fetchDeliveries = React.useCallback(async () => {
        try {
            const res = await api.get('/logistics/deliveries');
            if (res.data && res.data.success) {
                setDeliveries(res.data.data.map(d => {
                    let items = [];
                    if (d.package_details) {
                        try { items = JSON.parse(d.package_details); } catch { items = []; }
                    }
                    if (!Array.isArray(items)) items = [];
                    const orderRef = d.order_id ? `ORD-${String(d.order_id).padStart(3, '0')}` : null;
                    return {
                        id: `DEL-${String(d.id).padStart(3, '0')}`,
                        db_id: d.id,
                        orderId: orderRef,
                        order_id_raw: d.order_id,
                        mission_type: d.mission_type,
                        item: items.length > 0 ? items[0].name : (d.mission_type === 'Chauffeur' ? 'VIP Chauffeur Service' : (orderRef ? `Order ${orderRef}` : 'Internal Mission')),
                        items: items,
                        status: d.status,
                        driverId: d.assigned_driver ?? d.driver_id ?? d.assigned_to ?? null,
                        driver: d.driver_name,
                        vehicleId: d.plate_number,
                        pickupLocation: d.pickup_location,
                        dropLocation: d.drop_location,
                        route: d.route,
                        location: d.route || d.pickup_location || 'In Transit',
                        mode: d.mission_type === 'Chauffeur' ? 'Road' : 'Road',
                        deliveryDate: d.delivery_date ? d.delivery_date.split('T')[0] : null,
                        eta: d.delivery_date ? d.delivery_date.split('T')[0] : 'TBD'
                    };
                }));
            }
        } catch (e) { console.error("Fetch deliveries failed", e); }
    }, []);

    const parsePOItems = (raw) => {
        let items = raw;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { items = []; }
        }
        if (!Array.isArray(items)) return [];
        return items.map((item, idx) => {
            const orderedQty = item.orderedQty ?? item.quantity ?? item.qty ?? 0;
            const price = item.price ?? item.unit_price ?? item.unitPrice ?? 0;
            const receivedQty = item.receivedQty ?? item.received_qty ?? 0;
            return {
                ...item,
                id: item.id ?? idx,
                orderedQty,
                price,
                receivedQty,
                pendingQty: orderedQty - receivedQty
            };
        });
    };

    const fetchProcurement = React.useCallback(async () => {
        try {
            const [reqs, quotes, pos] = await Promise.all([
                api.get('/procurement/requests').catch(e => ({ data: [] })),
                api.get('/procurement/quotes').catch(e => ({ data: [] })),
                api.get('/procurement/po').catch(e => ({ data: [] }))
            ]);
            if (reqs.data?.success) setPurchaseRequests(reqs.data.data);
            if (quotes.data?.success) setQuotes(quotes.data.data);
            if (pos.data?.success) setPurchaseOrders(pos.data.data.map(po => ({ ...po, items: parsePOItems(po.items) })));
        } catch (e) { console.error("Fetch procurement failed", e); }
    }, []);

    const fetchQuotes = React.useCallback(async (params = {}) => {
        try {
            const res = await api.get('/procurement/quotes', { params });
            if (res.data?.success) {
                setQuotes(res.data.data.map(q => ({
                    ...q,
                    vendor: q.vendor_name || q.vendor,
                    vendorName: q.vendor_name || q.vendor,
                    date: q.created_at || q.date,
                    total: parseFloat(q.total_amount || q.total || 0),
                    validity: q.validity_date || q.validity
                })));
            }
        } catch (e) { console.error("Fetch quotes failed", e); }
    }, []);

    const fetchPurchaseRequests = React.useCallback(async (params = {}) => {
        try {
            const res = await api.get('/procurement/requests', { params });
            if (res.data?.success) {
                setPurchaseRequests(res.data.data.map(r => {
                    let parsedItems = r.items;
                    if (typeof parsedItems === 'string') {
                        try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
                    }
                    return { 
                        ...r, 
                        items: Array.isArray(parsedItems) ? parsedItems : [],
                        total: r.estimated_cost || r.total,
                        date: r.created_at || r.date
                    };
                }));
            }
        } catch (e) { console.error("Fetch purchase requests failed", e); }
    }, []);

    const fetchPurchaseOrders = React.useCallback(async (params = {}) => {
        try {
            const res = await api.get('/procurement/po', { params });
            if (res.data?.success) {
                setPurchaseOrders(res.data.data.map(po => ({
                    ...po,
                    vendorName: po.vendor_name || po.vendorName,
                    date: po.created_at || po.date,
                    total: parseFloat(po.total_amount || po.total || 0),
                    paymentTerms: po.payment_terms || po.paymentTerms,
                    items: parsePOItems(po.items)
                })));
            }
        } catch (e) { console.error("Fetch POs failed", e); }
    }, []);

    const fetchOrders = React.useCallback(async () => {
        try {
            const res = await api.get('/orders');
            const rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setOrders(rawData.map(o => {
                let parsedItems = o.items;
                if (typeof parsedItems === 'string') {
                    try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
                }
                const createdDay = isoDateSlice(o.created_at);
                const orderDay = isoDateSlice(o.order_date);
                const dueDay = isoDateSlice(o.due_date);
                const displayDate = orderDay || createdDay;
                return {
                    ...o,
                    items: Array.isArray(parsedItems) ? parsedItems : [],
                    clientId: o.customer_id || o.client_id,
                    companyId: o.company_id,
                    vendorId: o.vendor_id,
                    client: o.customer_name || o.client_name || '',
                    vendor: o.vendor_name || '',
                    total: parseFloat(o.total_amount || 0),
                    date: displayDate,
                    order_date: orderDay || o.order_date,
                    createdAt: o.created_at,
                    requestDate: displayDate,
                    dueDate: dueDay,
                    due_date: dueDay || o.due_date,
                    statusLabel: displayOrderStatus(o.status)
                };
            }));
        } catch (e) { console.error("Fetch orders failed", e); }
    }, []);

    const fetchMissions = React.useCallback(async () => {
        try {
            const res = await api.get('/missions');
            const rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setMissions(rawData.map(m => ({
                ...m,
                orderId: m.order_id,
                driverId: m.assigned_driver,
                driverName: m.driver_name,
                vehicleId: m.vehicle_id,
                plateNumber: m.plate_number,
                missionType: m.mission_type,
                destinationType: m.destination_type,
                date: m.event_date ? m.event_date.split('T')[0] : (m.created_at ? m.created_at.split('T')[0] : '')
            })));
        } catch (e) { console.error("Fetch missions failed", e); }
    }, []);

    const fetchFinance = React.useCallback(async () => {
        try {
            const res = await api.get('/finance/invoices');
            const rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setInvoices(rawData.map(i => ({
                ...i,
                orderId: i.order_id,
                clientId: i.client_id,
                totalAmount: parseFloat(i.amount || 0),
                paidAmount: parseFloat(i.paid_amount || 0), // Assuming backend provides this or default to 0
                date: i.created_at ? i.created_at.split('T')[0] : '',
                dueDate: i.due_date ? i.due_date.split('T')[0] : '',
                clientName: i.client_name
            })));
        } catch (e) { console.error("Fetch finance failed", e); }
    }, []);

    const fetchProjects = React.useCallback(async () => {
        const mapStatusToFrontend = (status) => {
            switch (status?.toLowerCase()) {
                case 'planned': return 'Pending';
                case 'in_progress': return 'Active';
                case 'completed': return 'Completed';
                case 'on_hold': return 'Cancelled';
                default: return status || 'Pending';
            }
        };

        try {
            const res = await api.get('/orders/projects/all');
            const rawData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setProjects(rawData.map(p => ({
                ...p,
                orderId: p.order_id,
                managerId: p.manager_id,
                client: p.client_name, // Mapping join result
                status: mapStatusToFrontend(p.status),
                start: p.start_date ? p.start_date.split('T')[0] : '',
                end: p.end_date ? p.end_date.split('T')[0] : ''
            })));
        } catch (e) { console.error("Fetch projects failed", e); }
    }, []);

    const fetchSupportingDocs = React.useCallback(async () => {
        try {
            const [assignments, leave] = await Promise.all([
                api.get('/staff/assignments').catch(e => ({ data: { success: false, data: [] } })),
                api.get('/staff/leave').catch(e => ({ data: { success: false, data: [] } }))
            ]);
            
            if (assignments.data?.success) {
                setStaffAssignments(assignments.data.data);
            } else if (Array.isArray(assignments.data)) {
                setStaffAssignments(assignments.data);
            }

            if (leave.data?.success) {
                setLeaveRequests(leave.data.data);
            } else if (Array.isArray(leave.data)) {
                setLeaveRequests(leave.data);
            }
        } catch (e) { 
            console.error("Fetch supporting docs failed", e); 
        }
    }, [currentUser?.id]);

    const fetchWarehouses = React.useCallback(async () => {
        try {
            const res = await api.get('/warehouses');
            if (res.data?.success) setWarehouses(res.data.data);
        } catch (e) { console.error("Fetch warehouses failed", e); }
    }, []);

    const fetchTickets = React.useCallback(async () => {
        try {
            const [tickets, eventsData, guestReqs] = await Promise.all([
                api.get('/support/tickets').catch(e => ({ data: [] })),
                api.get('/support/events').catch(e => ({ data: [] })),
                api.get('/support/guest-requests').catch(e => ({ data: [] }))
            ]);
            if (tickets.data?.success) {
                const mapped = tickets.data.data.map(t => {
                    let msgs = [];
                    if (t.messages) {
                        try {
                            msgs = typeof t.messages === 'string' ? JSON.parse(t.messages) : t.messages;
                        } catch (e) { msgs = []; }
                    }
                    if (!Array.isArray(msgs) || msgs.length === 0) {
                        msgs = [{
                            sender: 'client',
                            text: t.description || 'No description provided.',
                            time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }];
                    }

                    return {
                        id: `TKT-${String(t.id).padStart(3, '0')}`,
                        db_id: t.id,
                        clientName: t.submitted_by_name || 'System User',
                        clientId: t.client_id ?? t.company_id ?? null,
                        createdById: t.created_by ?? t.user_id ?? null,
                        createdByEmail: t.created_by_email || t.email || null,
                        createdByName: t.submitted_by_name || t.created_by_name || null,
                        subject: t.subject,
                        category: t.category || 'General',
                        priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
                        status: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('_', ' ') : 'Open',
                        date: t.created_at ? t.created_at.split('T')[0] : '',
                        messages: msgs
                    };
                });
                setSupportTickets(mapped);
            }
            if (eventsData.data?.success) {
                setEvents(eventsData.data.data.map(e => ({
                    ...e,
                    title: e.name,
                    client: e.client_name,
                    date: e.event_date ? e.event_date.split('T')[0] : '',
                    imageUrl: e.image_url,
                    plannerName: e.planner_name,
                    specialRequests: e.special_requests,
                    guestCount: e.guest_count
                })));
            }
            if (guestReqs.data?.success) {
                setGuestRequests(guestReqs.data.data.map(r => ({
                    ...r,
                    request: r.request_details,
                    requestedBy: r.requested_by,
                    time: r.delivery_time,
                    guest: r.guest || r.client_name || 'VIP Suite'
                })));
            }
        } catch (e) { console.error("Fetch tickets failed", e); }
    }, []);

    const fetchLuxuryItems = React.useCallback(async () => {
        try {
            const res = await api.get('/concierge/luxury-items');
            const luxuryData = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            const mapped = luxuryData.map(item => ({
                id: item.id,
                item: item.item_name,
                owner: item.owner_name,
                vault: item.vault_location,
                status: item.status,
                value: item.estimated_value,
                notes: item.notes
            }));
            setLuxuryItems(mapped);
        } catch (e) { console.error("Fetch luxury items failed", e); }
    }, []);

    const fetchDashboardStats = React.useCallback(async () => {
        try {
            const res = await api.get('/dashboard/stats');
            if (res.data?.success) setDashboardStats(res.data.data);
        } catch (e) { console.error("Fetch dashboard stats failed", e); }
    }, []);

    const fetchSystemSettings = React.useCallback(async () => {
        try {
            const res = await api.get('/settings/system');
            if (res.data?.success) setSystemSettings(res.data.data);
        } catch (e) { console.error("Fetch system settings failed", e); }
    }, []);

    const fetchDeliveryPricing = React.useCallback(async () => {
        try {
            const res = await api.get('/logistics/pricing');
            if (res.data?.success) setDeliveryPricing(res.data.data);
        } catch (e) { console.error("Fetch delivery pricing failed", e); }
    }, []);

    const DISMISSED_ALERTS_KEY = 'zz_dismissed_inv_alerts';

    const fetchInventoryAlerts = React.useCallback(async () => {
        let dismissed = [];
        try {
            dismissed = JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || '[]');
        } catch { dismissed = []; }
        const dismissedSet = new Set(dismissed.map(String));
        try {
            const res = await api.get('/inventory/alerts');
            if (res.data?.success) {
                const mapped = res.data.data.map(i => ({
                    id: i.id,
                    name: i.name,
                    qty: i.quantity,
                    threshold: i.threshold,
                    status: i.status === 'low_stock' ? 'Warning' : (i.status === 'out_of_stock' ? 'Critical' : i.status),
                    location: i.warehouse_name || 'General Storage'
                }));
                setInventoryAlerts(mapped.filter(a => !dismissedSet.has(String(a.id))));
            }
        } catch (e) { console.error("Fetch inventory alerts failed", e); }
    }, []);

    const acknowledgeInventoryAlert = React.useCallback((alertId) => {
        const idStr = String(alertId);
        setInventoryAlerts(prev => prev.filter(a => String(a.id) !== idStr));
        try {
            const arr = JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || '[]');
            if (!arr.includes(idStr)) {
                arr.push(idStr);
                localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(arr));
            }
        } catch { /* ignore */ }
    }, []);

    const fetchNotifications = React.useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data?.success) setNotifications(res.data.data);
        } catch (e) { console.error("Fetch notifications failed", e); }
    }, []);

    const fetchUnreadCount = React.useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.data?.success) setUnreadCount(res.data.data.unread);
        } catch (e) { /* silent */ }
    }, []);

    const markNotificationRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error("Mark read failed", e); }
    };

    const markAllNotificationsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) { console.error("Mark all read failed", e); }
    };

    // Poll for new notifications every 30 seconds
    React.useEffect(() => {
        if (!currentUser || !localStorage.getItem('token')) return;
        fetchNotifications();
        fetchUnreadCount();
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);
        return () => clearInterval(interval);
    }, [currentUser, fetchNotifications, fetchUnreadCount]);

    const fetchInitialData = async () => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const fetches = [
                fetchStaff(),
                fetchDashboardStats(),
                fetchSystemSettings(),
                fetchInventoryAlerts(),
                fetchTracking(),
                fetchUrgentTasks()
            ];

            // If the user is staff, fetch their specific data
            if (['staff', 'operations', 'logistics', 'inventory'].includes(currentUser?.role?.toLowerCase())) {
                fetches.push(fetchSupportingDocs());
                fetches.push(fetchDeliveries());
                fetches.push(fetchPayHistory());
            }

            await Promise.all(fetches);
        } catch (err) {
            console.error("Error fetching initial context data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    // Initial Data Fetch
    useEffect(() => {
        if (currentUser && localStorage.getItem('token')) {
            fetchInitialData();
        }
    }, [currentUser]);


    const recordLoss = async (loss) => {
        try {
            const item = inventory.find(i => i.name === loss.item);
            if (!item) return;

            const res = await api.post(`/inventory/${item.id}/adjust`, {
                quantity: loss.qty,
                type: 'loss',
                reason: loss.reason
            });

            if (res.data?.success) {
                setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...res.data.data, qty: res.data.data.quantity } : i));

                setStockMovements(prev => [{
                    ...loss,
                    id: `LS-${Date.now()}`,
                    type: 'Loss',
                    value: (item.price || 0) * parseInt(loss.qty),
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString()
                }, ...prev]);

                addLog({ action: 'Asset Loss Recorded', detail: `Loss of ${loss.qty} units for ${loss.item} noted: ${loss.reason || 'No reason provided'}. Auditor notified.`, type: 'inventory' });
            }
        } catch (error) {
            console.error("Failed to record loss:", error);
        }
    };

    const addStockEntry = async (entry) => {
        try {
            const item = inventory.find(i => i.name === entry.item);

            if (item) {
                const res = await api.post(`/inventory/${item.id}/adjust`, {
                    quantity: entry.qty,
                    type: 'entry',
                    reference_type: entry.prRef ? 'purchase_request' : null,
                    reference_id: entry.prRef || null
                });

                if (res.data?.success) {
                    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...res.data.data, qty: res.data.data.quantity } : i));

                    setStockMovements(prev => [{ ...entry, id: `SE-${Date.now()}`, type: 'Entry', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString() }, ...prev]);

                    if (entry.prRef) {
                        setPurchaseRequests(prev => prev.map(pr => pr.id === entry.prRef ? { ...pr, status: 'Received' } : pr));
                    }

                    addLog({ action: 'Stock Entry', detail: `Procured ${entry.qty} units of ${entry.item} from ${entry.vendor || entry.vendorName || 'Unknown Partner'}.`, type: 'inventory' });
                }
            } else {
                // If item doesn't exist, create it first, then adjust or create with initial qty
                const res = await api.post('/inventory', {
                    name: entry.item,
                    category: entry.category,
                    price: entry.price,
                    quantity: entry.qty,
                    warehouse_id: entry.warehouseId || entry.warehouse_id || null,
                    inventory_type: entry.inventoryType || 'Marketplace',
                    client_id: entry.clientId || null,
                    sku: entry.sku || `SKU-${Math.floor(Math.random() * 100000)}`
                });

                if (res.data?.success) {
                    // Re-fetch to ensure correct mapping
                    await fetchInventory();
                    setStockMovements(prev => [{ ...entry, id: `SE-${Date.now()}`, type: 'Entry', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString() }, ...prev]);
                    addLog({ action: 'Stock Entry', detail: `Procured ${entry.qty} units of ${entry.item} from ${entry.vendor || entry.vendorName || 'Unknown Partner'}.`, type: 'inventory' });
                }
            }
        } catch (error) {
            console.error("Failed to add stock entry:", error);
        }
    };

    const issueStock = async (issue) => {
        try {
            const item = inventory.find(i => i.name === issue.item);
            if (!item) return;

            const res = await api.post(`/inventory/${item.id}/adjust`, {
                quantity: issue.qty,
                type: 'issue',
                reference_type: issue.projectRef ? 'project' : 'client',
                reference_id: issue.projectRef || issue.clientId || null
            });

            if (res.data?.success) {
                const updatedItem = { ...item, ...res.data.data, qty: res.data.data.quantity };
                setInventory(prev => prev.map(i => i.id === item.id ? updatedItem : i));

                setStockMovements(prev => [{ ...issue, id: `SI-${Date.now()}`, type: 'Issue', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString() }, ...prev]);

                // Automate low stock alert if needed (local check after update)
                if (updatedItem.qty < 10) {
                    addLog({ action: 'Automated Procurement Alert', detail: `Low stock detected for ${issue.item}. System generated auto-PR.`, type: 'automated' });
                }

                addLog({ action: 'Stock Issue', detail: `Issued ${issue.qty} units of ${issue.item} to ${issue.client || issue.issuedTo}.`, type: 'inventory' });
            }
        } catch (error) {
            console.error("Failed to issue stock:", error);
        }
    };

    const addPlan = async (plan) => {
        try {
            await api.post('/saas/plans', plan);
            addLog({ action: 'Plan Created', detail: `Super Admin created new protocol: ${plan.name}`, type: 'system' });
            await fetchAccessPlans();
        } catch (error) {
            console.error("Failed to add access plan:", error);
        }
    };

    const updatePlan = async (updated) => {
        try {
            await api.put(`/saas/plans/${updated.id}`, updated);
            addLog({ action: 'Plan Updated', detail: `Super Admin modified protocol: ${updated.name}`, type: 'system' });
            await fetchAccessPlans();
        } catch (error) {
            console.error("Failed to update access plan:", error);
        }
    };

    const deletePlan = async (id) => {
        try {
            await api.delete(`/saas/plans/${id}`);
            addLog({ action: 'Plan Deleted', detail: `Super Admin removed protocol ID: ${id}`, type: 'system' });
            await fetchAccessPlans();
        } catch (error) {
            console.error("Failed to delete access plan:", error);
        }
    };


    const registerSaaSClient = async (formData) => {
        try {
            const res = await api.post('/clients', {
                name: formData.clientName,
                email: formData.email,
                phone: formData.phone || '',
                password: formData.password || 'Password123!', // Default password for initial setup
                location: formData.country || 'Bahamas',
                client_type: 'SaaS',
                plan: formData.plan.replace(' Protocol', ''),
                billing_cycle: 'Monthly',
                payment_method: 'Credit Card',
                contact_person: formData.contact,
                business_name: formData.clientName,
                source: 'Landing Page',
                status: 'active'
            });

            if (res.data?.success) {
                await fetchClients();
                addLog({ action: 'SaaS Registration', detail: `New SaaS client ${formData.clientName} registered via Landing Page.`, type: 'system' });
                return res.data.data;
            }
        } catch (error) {
            console.error("Failed to register SaaS client:", error);
            throw error;
        }
    };

    const dispatchSubscriptionRequest = async (request) => {
        try {
            const res = await api.post('/saas/submit', request);
            return res.data;
        } catch (error) {
            console.error("Failed to submit SaaS request:", error);
            throw error;
        }
    };

    const updateSubscriptionRequest = async (id, status) => {
        try {
            if (status === 'Approved') {
                // Call the provisioning endpoint which creates user + client in DB
                const res = await api.post(`/saas/requests/${id}/provision`);
                if (res.data?.success) {
                    setSubscriptionRequests(prev => prev.map(req =>
                        String(req.id) === String(id) ? { ...req, status: 'Provisioned' } : req
                    ));

                    // Refresh clients list to include the new client
                    await fetchClients();

                    addLog({ action: 'Request Approved', detail: `Provisioned workspace for ${res.data.data.clientName}. Protocol: ${res.data.data.plan}. Credentials generated for ${res.data.data.email}.`, type: 'system' });

                    return res.data.data; // { clientId, clientName, email, password, plan }
                }
            } else {
                // For Rejected or other status updates
                const res = await api.put(`/saas/requests/${id}/status`, { status });
                if (res.data?.success) {
                    setSubscriptionRequests(prev => prev.map(req =>
                        String(req.id) === String(id) ? { ...req, status } : req
                    ));

                    const req = (subscriptionRequests || []).find(r => r.id === id);
                    if (req) {
                        addLog({ action: 'Request Updated', detail: `Registration for ${req.clientName} marked as ${status}.`, type: 'alert' });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update subscription request:", error);
            const errMsg = error.response?.data?.message || 'Provisioning failed';
            alert(errMsg);
        }
        return null;
    };

    const deleteSubscriptionRequest = async (id) => {
        try {
            const res = await api.delete(`/saas/requests/${id}`);
            if (res.data?.success) {
                setSubscriptionRequests(prev => prev.filter(req => req.id !== id));
                addLog({ action: 'Request Purged', detail: `Institutional request ${id} removed from queue.`, type: 'alert' });
            }
        } catch (error) {
            console.error("Failed to delete subscription request:", error);
        }
    };

    const getRevenueChartData = () => {
        const now = new Date();
        const dataMap = {};

        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');

        if (revenueFilter === 'Daily') {
            // Last 24 hours in 2-hour blocks
            for (let i = 0; i < 24; i += 2) {
                const hour = String(i).padStart(2, '0') + ':00';
                dataMap[hour] = 0;
            }
            paidInvoices.forEach(inv => {
                const date = new Date(inv.date);
                if (now.getTime() - date.getTime() < 86400000) {
                    const hour = Math.floor(date.getHours() / 2) * 2;
                    const key = String(hour).padStart(2, '0') + ':00';
                    if (dataMap[key] !== undefined) dataMap[key] += Number(inv.totalAmount);
                }
            });
        } else if (revenueFilter === 'Weekly') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(d => dataMap[d] = 0);
            paidInvoices.forEach(inv => {
                const date = new Date(inv.date);
                if (now.getTime() - date.getTime() < 7 * 86400000) {
                    const day = days[date.getDay()];
                    dataMap[day] += Number(inv.totalAmount);
                }
            });
        } else if (revenueFilter === 'Monthly') {
            ['Week 1', 'Week 2', 'Week 3', 'Week 4'].forEach(w => dataMap[w] = 0);
            paidInvoices.forEach(inv => {
                const date = new Date(inv.date);
                if (now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear()) {
                    const week = Math.min(4, Math.ceil(date.getDate() / 7));
                    dataMap[`Week ${week}`] += Number(inv.totalAmount);
                }
            });
        } else {
            // Generic fallback or larger grouping
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            months.forEach(m => dataMap[m] = 0);
            paidInvoices.forEach(inv => {
                const date = new Date(inv.date);
                if (now.getFullYear() === date.getFullYear()) {
                    const month = months[date.getMonth()];
                    dataMap[month] += Number(inv.totalAmount);
                }
            });
        }

        return Object.keys(dataMap).map(key => ({ name: key, revenue: dataMap[key] }));
    };

    // --- STAFF ACTIONS ---
    const addUser = async (user) => {
        try {
            const res = await api.post('/users', user);
            if (res.data?.success) {
                await fetchStaff();
                addLog({ action: 'Staff Provisioned', detail: `Onboarded ${user.name} as ${user.role}.`, type: 'system' });
                return res.data;
            }
        } catch (error) {
            console.error("Failed to add user:", error);
            const msg = error.response?.data?.message || 'Failed to add user.';
            alert(msg);
            throw error;
        }
    };

    const updateUser = async (updated) => {
        try {
            const id = updated?.id;
            if (id == null) {
                console.error('updateUser: missing user id');
                return;
            }
            const res = await api.put(`/users/${id}`, updated);
            if (res.data?.success) {
                const apiUser = normalizeApiUserPayload(res.data.data);
                const safePayload = withoutPassword(updated);

                const list = await fetchStaff();
                setUsers((prev) => {
                    const baseList = Array.isArray(list) ? list : prev;
                    if (!Array.isArray(baseList)) return prev;
                    return baseList.map((u) => {
                        if (String(u.id) !== String(id)) return u;
                        return mergeUserFields(u, apiUser, safePayload);
                    });
                });

                setCurrentUser((cur) => {
                    if (!cur || String(cur.id) !== String(id)) return cur;
                    const next = mergeUserFields(cur, apiUser, safePayload);
                    try {
                        localStorage.setItem('user', JSON.stringify(next));
                    } catch (e) {
                        console.error('Failed to persist user to localStorage', e);
                    }
                    return next;
                });

                addLog({
                    action: 'Staff Profile Modified',
                    detail: `Updated record for ${safePayload.name || apiUser?.name || id}.`,
                    type: 'system',
                });
                return res.data;
            }
        } catch (error) {
            console.error("Failed to update user:", error);
            const msg = error.response?.data?.message || 'Failed to update user.';
            alert(msg);
            throw error;
        }
    };

    const reviewStaff = async (id, status) => {
        try {
            // Try tenant-scoped review first (admin reviewing their own staff)
            // Falls back to super_admin staff-review endpoint
            try {
                await api.put(`/users/${id}/review`, { status });
            } catch (e) {
                await api.put(`/auth/staff-review/${id}`, { status });
            }

            // Re-fetch staff to update local state
            await fetchStaff();

            addLog({
                action: 'Staff Review',
                detail: `Staff protocol ${status === 'Active' ? 'Activated' : 'Denied'} for ID: ${id}.`,
                type: 'system'
            });
        } catch (error) {
            console.error("Failed to review staff:", error);
            alert("Error updating staff status.");
        }
    };

    const deleteUser = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            await fetchStaff();
            addLog({ action: 'Staff Terminated', detail: `Separated staff member ID: ${id}.`, type: 'alert' });
        } catch (error) {
            console.error("Failed to delete user:", error);
            const msg = error.response?.data?.message || 'Failed to delete user.';
            alert(msg);
            throw error;
        }
    };

    const deleteOrder = async (id) => {
        try {
            await api.delete(`/orders/${id}`);
            setOrders(prev => prev.filter(o => o.id !== id));
            addLog({ action: 'Order Terminated', detail: `Protocol ${id} deleted from ledger.`, type: 'alert' });
        } catch (error) {
            console.error("Failed to delete order:", error);
        }
    };

    const updateOrder = async (orderId, data) => {
        try {
            const numericParam = typeof orderId === 'string' ? orderId.replace(/[^\d]/g, '') || orderId : orderId;

            // Status-only payloads (backward compat): string | { status }
            const isBareStatus =
                typeof data === 'string' ||
                (data && typeof data === 'object' && Object.keys(data).length === 1 && Object.prototype.hasOwnProperty.call(data, 'status'));

            if (isBareStatus) {
                const statusRaw = typeof data === 'string' ? data : data.status;
                const normalized = normalizeOrderStatusForApi(statusRaw);
                if (!normalized) {
                    alert(`Invalid workflow status "${statusRaw}". Use a known stage (e.g. admin_review, operation, logistics, completed).`);
                    return;
                }
                await api.patch(`/orders/${numericParam}/status`, { status: normalized });
                setOrders(prev => prev.map(o => String(o.id) === String(orderId) || String(o.id) === String(numericParam) ? { ...o, status: normalized } : o));
                addLog({ action: 'Order Updated', detail: `Order ${orderId} status changed to ${normalized}.`, type: 'system' });
                return;
            }

            const { status: uiStatusRaw, ...rest } = data;
            const normalizedFromForm = normalizeOrderStatusForApi(uiStatusRaw);

            const mappedData = {
                ...rest,
                client_id: rest.clientId,
                company_id: rest.companyId,
                vendor_id: rest.vendorId,
                total_amount: rest.total,
                due_date: isoDateSlice(rest.dueDate || rest.due_date) || null,
                order_date: isoDateSlice(rest.date || rest.requestDate || rest.order_date) || undefined
            };

            await api.put(`/orders/${numericParam}`, mappedData);

            if (normalizedFromForm) {
                await api.patch(`/orders/${numericParam}/status`, { status: normalizedFromForm });
            }

            await fetchOrders();
            addLog({ action: 'Order Updated', detail: `Order ${orderId} parameters recalibrated.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update order:", error);
            const msg = error.response?.data?.message || '';
            alert(msg || 'Failed to update order.');
        }
    };

    const assignOrderToStage = async (orderId, stage, assignedTo = null, notes = null) => {
        try {
            const res = await api.put(`/orders/${orderId}/assign`, { stage, assigned_to: assignedTo, notes });
            if (res.data?.success) {
                await fetchOrders();
                addLog({ 
                    action: 'Stage Transition', 
                    detail: `Order ${orderId} moved to ${stage} stage.`, 
                    type: 'system' 
                });
                return res.data;
            }
        } catch (error) {
            console.error("Failed to assign order stage:", error);
            const errMsg = error.response?.data?.message || 'Failed to move order to next stage.';
            alert(errMsg);
        }
        return null;
    };

    const launchMissionFromOrder = async (orderId, missionData) => {
        try {
            const res = await api.post(`/missions/convert/${orderId}`, missionData);
            if (res.data?.success) {
                await fetchOrders();
                await fetchMissions();
                addLog({ action: 'Mission Launched', detail: `Order ${orderId} converted to Mission ${res.data.data.id}.`, type: 'system' });
                return res.data.data;
            }
        } catch (error) {
            console.error("Failed to convert order to mission:", error);
        }
    };

    const convertOrderToProject = async (orderId, projectData) => {
        try {
            const res = await api.post(`/orders/convert/${orderId}`, projectData);
            if (res.data?.success) {
                await fetchOrders();
                await fetchProjects();
                addLog({ action: 'Project Launched', detail: `Order ${orderId} converted to Project ${res.data.data.id}.`, type: 'system' });
                return res.data.data;
            }
        } catch (error) {
            console.error("Failed to convert order to project:", error);
        }
    };

    const convertProjectToMission = async (projectId, missionData) => {
        try {
            const res = await api.post(`/missions/convert-project/${projectId}`, missionData);
            if (res.data?.success) {
                await fetchProjects();
                await fetchMissions();
                addLog({ action: 'Mission Launched', detail: `Project ${projectId} converted to Mission ${res.data.data.id}.`, type: 'system' });
                return res.data.data;
            }
        } catch (error) {
            console.error("Failed to convert project to mission:", error);
        }
    };

    const updateMissionStatus = async (id, status) => {
        try {
            await api.put(`/missions/${id}/status`, { status });

            // If mission is dispatched, ensure a delivery row exists for operations tracking.
            if (String(status).toLowerCase() === 'en_route') {
                const mission = missions.find(m => String(m.id) === String(id));
                if (mission) {
                    const hasLinkedDelivery = deliveries.some((d) => {
                        const dOrderRaw = d.order_id_raw ?? (d.orderId ? parseInt(String(d.orderId).replace(/[^0-9]/g, ''), 10) : null);
                        return (
                            (mission.orderId && Number(dOrderRaw) === Number(mission.orderId)) ||
                            (mission.id && String(d.mission_id || '') === String(mission.id))
                        );
                    });

                    if (!hasLinkedDelivery) {
                        await addDelivery({
                            orderId: mission.orderId || null,
                            missionType: mission.missionType || mission.mission_type || 'Logistics',
                            location: mission.route || mission.location || '',
                            driver: mission.driverName || mission.driver_name || '',
                            vehicleId: mission.plateNumber || mission.vehicleId || mission.plate_number || '',
                            items: mission.items || [{ name: `Mission ${mission.id}`, qty: 1 }],
                            pickupLocation: mission.pickup_location || '',
                            dropLocation: mission.drop_location || mission.destination || '',
                            dueDate: mission.date || null,
                            status: 'In Transit',
                        });
                    }
                }
            }
            await fetchMissions();
            addLog({ action: 'Mission Update', detail: `Mission ${id} status updated to ${status}.`, type: 'logistics' });
        } catch (error) {
            console.error("Failed to update mission status:", error);
        }
    };

    const assignMissionDriver = async (missionId, driverId, vehicleId) => {
        try {
            await api.post(`/missions/${missionId}/assign`, { driverId, vehicleId });
            await fetchMissions();
            addLog({ action: 'Driver Assigned', detail: `Driver ${driverId} assigned to Mission ${missionId}.`, type: 'logistics' });
        } catch (error) {
            console.error("Failed to assign driver:", error);
        }
    };

    const deleteMission = async (id) => {
        try {
            await api.delete(`/missions/${id}`);
            setMissions(prev => prev.filter(m => m.id !== id));
            addLog({ action: 'Mission Scrapped', detail: `Removed mission ${id} from operational queue.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete mission:", error);
        }
    };

    const hasPermission = (permission) => {
        const normalizedRole = currentUser?.role?.toLowerCase().replace(/\s/g, '');
        if (normalizedRole === 'superadmin') return true;
        // Financial restrictions
        if (['financial_reports', 'revenue_analytics', 'invoice_management'].includes(permission)) {
            return normalizedRole === 'superadmin';
        }
        return true;
    };

    // --- INTEGRATED DATA FLOW ACTIONS ---

    const addOrder = async (order, options = {}) => {
        const { silentUi = false, customerCheckout = false } = options;
        // Marketplace / store checkout — customers may place orders. Manual "Create Order" is staff-only.
        if (!customerCheckout && !roleCanCreateInstitutionalOrder(normalizeRole(currentUser?.role))) {
            const msg = 'Only authorised staff can create orders here. Customers should use Marketplace checkout, or ask staff to raise an order on their behalf.';
            if (!silentUi) window.alert(msg);
            return { ok: false, error: msg };
        }
        if (!order.items || order.items.length === 0) {
            if (!silentUi) alert("Order Error: No items in manifest.");
            return false;
        }

        // 0. Resolve Client ID if missing but name is present
        let targetClientId = order.clientId;
        if (!targetClientId && order.client) {
            const foundClient = clients.find(c => c.name === order.client);
            if (foundClient) targetClientId = foundClient.id;
        }
        if (!targetClientId) targetClientId = 1;

        const total = (order.items || []).reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.qty || 0)), 0);

        try {
            const userRole = (currentUser?.role || '').toLowerCase().replace(/\s+/g, '_');
            const isCustomer = userRole === 'customer';
            const hqCompanyId = Number(import.meta.env?.VITE_DEFAULT_COMPANY_ID) || 1;
            const orderDateVal = isoDateSlice(order.order_date || order.orderDate || order.date || order.requestDate) || isoDateSlice(new Date().toISOString());
            const dueVal = isoDateSlice(order.dueDate || order.due_date || null);

            const res = await api.post('/orders', {
                customer_id: isCustomer ? currentUser?.id : targetClientId,
                company_id: isCustomer
                    ? hqCompanyId
                    : ((currentUser && userRole !== 'super_admin') ? (currentUser.company_id || currentUser.companyId) : targetClientId),
                vendor_id: order.vendorId != null ? order.vendorId : (order.vendor_id != null ? order.vendor_id : null),
                type: order.type || order.orderType || 'Marketplace Order',
                items: order.items,
                notes: order.notes || null,
                location: order.deliveryAddress || order.location || null,
                delivery_address: order.deliveryAddress || order.location || null,
                order_date: orderDateVal,
                request_date: orderDateVal,
                due_date: dueVal || null,
                order_kind: order.order_kind || order.orderKind || 'marketplace',
                delivery_mode: order.deliveryType || order.delivery_mode || order.deliveryMode,
                book_chauffeur: !!(order.bookChauffeur || order.book_chauffeur),
                custom_request_category: order.custom_request_category || order.customRequestCategory || null,
                concierge_member: !!(currentUser?.concierge_member || currentUser?.conciergeMembership)
            });

            // Re-fetch to ensure sync and correct mapping
            await fetchOrders();

            const newId = res.data?.data?.id ?? res.data?.data ?? res.data?.id;

            // Personal (non–business) accounts: immediately raise invoice + settlement record when finance API is available.
            if (isCustomer && newId != null) {
                try {
                    const invRes = await api.post('/finance/invoices', buildFinanceInvoiceCreatePayload({
                        orderId: newId,
                        clientId: currentUser?.id ?? null,
                        totalAmount: total,
                        dueDate: orderDateVal,
                        paidAmount: 0,
                        status: 'unpaid',
                    }));
                    const payload = invRes.data?.data ?? invRes.data;
                    const invId = payload?.id ?? payload?.invoice_id ?? payload;
                    if (invId != null && String(invId).match(/^\d+$/)) {
                        await api.post(`/finance/invoices/${invId}/pay`, {
                            amount: total,
                            payment_method: 'Instant checkout (personal)',
                            transaction_id: `AUTO-${Date.now()}`
                        });
                        await fetchFinance();
                    }
                } catch (e) {
                    console.warn('Personal auto-charge skipped (finance endpoint or payload):', e?.response?.data || e?.message);
                }
            }

            if (!silentUi) {
                alert("Institutional Protocol Initialized: Order has been successfully logged and queued for audit.");
            }

            addLog({
                action: 'Order Received',
                detail: `${newId} submitted by client.`,
                type: 'system'
            });
            return { ok: true, id: newId };
        } catch (error) {
            console.error("Failed to submit order:", error);
            const hint = error.response?.data?.message || error.message;
            if (!silentUi) alert(hint ? `Order failed: ${hint}` : 'Order failed.');
            return { ok: false, error: hint };
        }
    };

    const generateInvoiceFromOrder = async (order) => {
        try {
            const total = (order.items || []).reduce((acc, item) => acc + (parseFloat(item.price || item.unit_price || 0) * parseInt(item.qty || item.quantity || 0)), 0);

            const reqData = buildFinanceInvoiceCreatePayload({
                orderId: order.id,
                clientId: order.clientId || order.client_id,
                totalAmount: total,
                dueDate: order.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                paidAmount: 0,
                status: 'unpaid',
            });

            await api.post('/finance/invoices', reqData);

            // Re-fetch to sync
            await fetchFinance();

            addLog({ action: 'Manual Ledger Commit', detail: `Institutional Ledger generated for mission ${order.id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to generate invoice:", error);
        }
    };


    const settleInvoice = async (invoiceId, paymentData) => {
        try {
            const numericId = typeof invoiceId === 'string' && invoiceId.startsWith('INV-')
                ? invoiceId.split('-')[1]
                : invoiceId;

            await api.post(`/finance/invoices/${numericId}/pay`, {
                amount: paymentData.amount,
                payment_method: paymentData.method || 'Institutional Settlement',
                transaction_id: `TXN-${Date.now()}`
            });

            await fetchFinance();
            addLog({ action: 'Payment Processed', detail: `Invoice ${invoiceId} settled via ${paymentData.method || 'Corporate Settlement'}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to settle invoice:", error);
        }
    };

    const addInvoice = async (invoice) => {
        try {
            const reqData = buildFinanceInvoiceCreatePayload(invoice);
            if (reqData.client_id == null || Number.isNaN(reqData.client_id)) {
                const msg = 'Choose a valid client (company or personal). IDs like user_123 are converted automatically once selected.';
                window.alert(msg);
                return { ok: false, error: msg };
            }
            await api.post('/finance/invoices', reqData);

            await fetchFinance();
            addLog({ action: 'Invoice Generated', detail: `Institutional ledger entry for Order ${invoice.orderId ?? '—'} successfully logged.`, type: 'system' });
            return { ok: true };
        } catch (error) {
            console.error('Failed to add invoice:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create invoice.';
            window.alert(msg);
            return { ok: false, error: msg };
        }
    };

    const addDelivery = async (del) => {
        try {
            // Sanitize order_id: strip non-numeric prefixes (e.g., 'ord-122' -> 122)
            let sanitizedOrderId = null;
            if (del.orderId) {
                const parsed = typeof del.orderId === 'string'
                    ? parseInt(del.orderId.replace(/[^0-9]/g, ''), 10)
                    : del.orderId;
                if (!isNaN(parsed)) sanitizedOrderId = parsed;
            }

            const reqData = {
                order_id: sanitizedOrderId,
                company_id: del.company_id || null,
                mission_type: del.missionType || del.mission_type || 'Delivery',
                route: del.location || del.route || '',
                driver_name: del.driver || del.driver_name || '',
                plate_number: del.vehicleId || del.plate_number || '',
                package_details: typeof del.items === 'string' ? del.items : JSON.stringify(del.items || []),
                pickup_location: del.pickupLocation || del.pickup_location || '',
                drop_location: del.dropLocation || del.drop_location || '',
                passenger_info: del.passengerInfo || del.passenger_info || null,
                delivery_date: del.dueDate || del.delivery_date || null,
                pickup_time: del.pickup_time || null,
                status: (del.status || 'pending').toLowerCase().replace(/\s+/g, '_')
            };
            const res = await api.post('/logistics/deliveries', reqData);
            if (res.data.success) {
                // Re-fetch to sync
                await fetchDeliveries();

                const delId = `DEL-${String(res.data.data.id).padStart(3, '0')}`;
                addLog({ action: 'Mission Launched', detail: `Logistics Protocol ${delId} initiated for ${del.item || 'Order ' + del.orderId}.`, type: 'logistics' });
            }
        } catch (error) {
            console.error("Failed to add delivery:", error);
            const msg = error.response?.data?.message || 'Failed to create delivery.';
            alert(msg);
        }
    };

    const normalizeDeliveryDbId = (d) => {
        if (d?.db_id != null && /^\d+$/.test(String(d.db_id))) return Number(d.db_id);
        if (d?.id != null && /^\d+$/.test(String(d.id))) return Number(d.id);
        const digits = String(d?.id ?? '').replace(/\D/g, '');
        return digits ? parseInt(digits, 10) : null;
    };

    const toApiDeliveryStatus = (s) => {
        const x = String(s || '').toLowerCase().replace(/\s+/g, '_');
        const map = {
            in_transit: 'en_route',
            pending_pickup: 'pending',
            pending_review: 'pending',
            accepted: 'assigned',
            declined: 'cancelled',
            delivered: 'delivered',
            completed: 'delivered',
            cancelled: 'cancelled'
        };
        return map[x] || x;
    };

    const updateDelivery = async (updated) => {
        const patchId = normalizeDeliveryDbId(updated);
        const apiStatus = toApiDeliveryStatus(updated.status);

        const applyLocal = () => {
            setDeliveries(prev => prev.map(x => {
                if (patchId != null && x.db_id === patchId) return { ...x, ...updated, status: updated.status };
                if (String(x.id) === String(updated.id)) return { ...x, ...updated, status: updated.status };
                return x;
            }));
        };

        if (!patchId) {
            applyLocal();
            return;
        }

        try {
            await api.patch(`/logistics/deliveries/${patchId}/status`, {
                status: apiStatus,
                vehicle_id: updated.vehicle_db_id
            });

            await fetchDeliveries();
            if (updated.status === 'Delivered' || updated.status === 'Completed') {
                // Auto-update the linked order status to 'delivered'
                const numericOrderId = updated.order_id_raw ||
                    (updated.orderId ? parseInt(String(updated.orderId).replace(/[^0-9]/g, ''), 10) : null);
                if (numericOrderId && !isNaN(numericOrderId)) {
                    try {
                        await api.patch(`/orders/${numericOrderId}/status`, { status: 'completed' });
                    } catch (e) {
                        console.warn('Could not auto-update order status:', e.message);
                    }
                }
                await fetchOrders();
                const rawId = updated.order_id_raw ||
                    (updated.orderId ? parseInt(String(updated.orderId).replace(/[^0-9]/g, ''), 10) : null);
                if (rawId) {
                    const matchingOrder = orders.find(o => Number(o.id) === Number(rawId));
                    if (matchingOrder) {
                        await generateInvoiceFromOrder(matchingOrder);
                    }
                }
            }
        } catch (error) {
            console.warn("Delivery status API failed, applying local update:", error?.response?.data || error?.message);
            applyLocal();
        }
    };

    const deleteDelivery = async (id) => {
        try {
            const numericId = typeof id === 'string' && id.includes('-') ? id.split('-')[1] : id;
            await api.delete(`/logistics/deliveries/${numericId}`);
            setDeliveries(prev => prev.filter(d => (d.id !== id && d.db_id !== id)));
            addLog({ action: 'Mission Decommissioned', detail: `Logistics Protocol ${id} terminated and removed from active operations.`, type: 'alert' });
        } catch (error) {
            console.error("Failed to delete delivery:", error);
        }
    };

    const updateInvoice = async (updated) => {
        try {
            // Handle string vs numeric ID
            const numericId = typeof updated.id === 'string' && updated.id.startsWith('INV-')
                ? updated.id.split('-')[1]
                : updated.id;

            const reqData = {
                amount: updated.totalAmount, // Map frontend structural property
                due_date: updated.dueDate,
                status: updated.status ? updated.status.toLowerCase().replace(' ', '_') : 'unpaid'
            };

            await api.put(`/finance/invoices/${numericId}`, reqData);

            await fetchFinance();
            addLog({ action: 'Invoice Updated', detail: `Institutional ledger ${updated.id} parameters recalibrated.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update invoice:", error);
        }
    };

    const deleteInvoice = async (id) => {
        try {
            // Handle string vs numeric ID
            const numericId = typeof id === 'string' && id.startsWith('INV-')
                ? id.split('-')[1]
                : id;

            await api.delete(`/finance/invoices/${numericId}`);
            await fetchFinance();
            addLog({ action: 'Invoice Terminated', detail: `Financial record ${id} removed from ledger.`, type: 'alert' });
        } catch (error) {
            console.error("Failed to delete invoice:", error);
        }
    };

    const confirmDeliveryReceipt = async (id, signature) => {
        try {
            // id might be 'DEL-001' or numeric. The API expects numeric ID.
            const numericId = typeof id === 'string' && id.includes('-') ? id.split('-')[1] : id;
            
            await api.patch(`/logistics/deliveries/${numericId}/status`, { status: 'delivered', signature });
            
            // Sync local state
            await fetchDeliveries();
            await fetchOrders();
            
            addLog({ action: 'Delivery Confirmed', detail: `Client signature received for shipment ${id}.`, type: 'success' });
        } catch (error) {
            console.error("Failed to confirm delivery:", error);
        }
    };

    // --- UNIVERSAL CRUD PROTOCOLS ---
    const addVendor = async (vendor) => {
        try {
            const companyId = currentUser?.company_id ?? currentUser?.companyId;
            const roleNorm = String(currentUser?.role || '').toLowerCase().replace(/\s+/g, '');
            const isSuperAdmin = roleNorm === 'superadmin';
            const vendorWithGate = { ...vendor };
            if (isSuperAdmin) {
                const st = String(vendor.status || 'active').toLowerCase();
                vendorWithGate.status = ['active', 'inactive', 'blacklisted'].includes(st) ? st : 'active';
            } else {
                vendorWithGate.status = 'inactive';
            }
            const reqData = buildVendorApiBody(vendorWithGate, companyId);
            const res = await api.post('/vendors', reqData);

            // Re-fetch to ensure correct mapping and sync
            await fetchVendors();

            addLog({ action: 'Vendor Onboarding', detail: `Registered ${vendor.name} as verified partner.`, type: 'system' });
            return res.data;
        } catch (error) {
            console.error("Failed to add vendor:", error);
            throw error;
        }
    };

    const updateVendor = async (updated) => {
        try {
            const pathId = vendorPathId(updated.id);
            if (!pathId) {
                const err = new Error('Invalid vendor ID.');
                err.code = 'VALIDATION';
                throw err;
            }
            const companyId = currentUser?.company_id ?? currentUser?.companyId;
            const reqData = buildVendorApiBody(updated, companyId);
            const res = await api.put(`/vendors/${pathId}`, reqData);

            // Re-fetch to ensure sync
            await fetchVendors();

            addLog({ action: 'Vendor Update', detail: `Recalibrated profile for ${updated.name}.`, type: 'system' });
            return res.data;
        } catch (error) {
            console.error("Failed to update vendor:", error);
            throw error;
        }
    };

    const deleteVendor = async (id) => {
        try {
            const pathId = vendorPathId(id);
            if (!pathId) {
                const err = new Error('Invalid vendor ID.');
                err.code = 'VALIDATION';
                throw err;
            }
            await api.delete(`/vendors/${pathId}`);
            await fetchVendors();
            addLog({ action: 'Vendor Removal', detail: `Decommissioned vendor reference ID ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete vendor:", error);
            throw error;
        }
    };


    const addInventory = async (item) => {
        try {
            const reqData = {
                name: item.name,
                category: item.category,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.qty) || 0, // Frontend uses qty
                warehouse_id: item.warehouse_id || item.warehouseId || null,
                vendor_id: item.vendorId || null,
                inventory_type: item.inventoryType || 'Marketplace',
                client_id: item.clientId || null,
                sku: item.sku || `SKU-${Math.floor(Math.random() * 10000)}`
            };
            const res = await api.post('/inventory', reqData);

            // Re-fetch to sync and map
            await fetchInventory();

            addLog({ action: 'Asset Intake', detail: `Ingested ${item.name} into Warehouse.`, type: 'system' });
        } catch (error) {
            console.error("Failed to add inventory item:", error);
        }
    };

    const updateInventory = async (updated) => {
        try {
            const reqData = {
                name: updated.name,
                category: updated.category,
                price: parseFloat(updated.price) || 0,
                quantity: parseInt(updated.qty) || 0,
                warehouse_id: updated.warehouse_id || updated.warehouseId || null,
                vendor_id: updated.vendorId || null,
                client_id: updated.clientId || null
            };
            await api.put(`/inventory/${updated.id}`, reqData);

            // Re-fetch to sync
            await fetchInventory();

            addLog({ action: 'Inventory Update', detail: `Asset ${updated.name} protocol modified.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update inventory item:", error);
        }
    };

    const deleteInventory = async (id) => {
        try {
            await api.delete(`/inventory/${id}`);
            setInventory(prev => prev.filter(i => i.id !== id));
            addLog({ action: 'Asset Decommission', detail: `Removed asset ID ${id} from ledger.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete inventory item:", error);
        }
    };

    const issueInventory = (id, qty, issuedTo) => {
        setInventory(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.qty - qty);
                return {
                    ...item,
                    qty: newQty,
                    stockValue: newQty * item.price,
                    issuedTo: issuedTo,
                    lastIssuedDate: new Date().toISOString().split('T')[0]
                };
            }
            return item;
        }));
        const item = inventory.find(i => i.id === id);
        addLog({ action: 'Asset Issued', detail: `Issued ${qty} of ${item?.name || id} to ${issuedTo}.`, type: 'system' });
    };

    const addClient = async (client) => {
        try {
            const res = await api.post('/clients', {
                ...client,
                phone: client.phone,
                password: client.password || null,
                client_type: client.clientType,
                billing_cycle: client.billingCycle,
                payment_method: client.paymentMethod,
                contact_person: client.contact,
                business_name: client.companyName,
                logo_url: client.logo
            });

            // Re-fetch to ensure perfect sync and correct mapping
            await fetchClients();

            addLog({ action: 'Client Onboarding', detail: `Registered ${client.name} via ${client.source || 'Admin Dashboard'}.`, type: 'system' });
            return res.data;
        } catch (error) {
            console.error("Failed to add client:", error);
            throw error;
        }
    };

    const updateClient = async (updated) => {
        try {
            const reqData = {
                ...updated,
                phone: updated.phone, // Ensure phone is mapped
                client_type: updated.clientType,
                billing_cycle: updated.billingCycle,
                payment_method: updated.paymentMethod,
                contact_person: updated.contact,
                business_name: updated.companyName,
                logo_url: updated.logo
            };
            const res = await api.put(`/clients/${updated.id}`, reqData);

            // Re-fetch to ensure sync
            await fetchClients();

            addLog({ action: 'Client Update', detail: `Recalibrated profile for ${updated.name || updated.business_name || updated.id}.`, type: 'system' });
            return res.data;
        } catch (error) {
            console.error("Failed to update client:", error);
            throw error;
        }
    };

    const updateClientBranding = async (clientId, branding) => {
        try {
            // Map frontend naming to backend database fields
            const reqData = {
                business_name: branding.businessName,
                tagline: branding.tagline,
                logo_url: branding.logo
            };

            const res = await api.put(`/clients/${clientId}`, reqData);
            if (res.data?.success) {
                setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...reqData } : c));
                addLog({ action: 'Branding Updated', detail: `Institutional identity recalibrated for ${clientId}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to update client branding:", error);
        }
    };

    const updateDeliveryPricingTier = async (id, price) => {
        try {
            const res = await api.put(`/logistics/pricing/${id}`, { price });
            if (res.data?.success) {
                setDeliveryPricing(prev => prev.map(tier => tier.id === id ? { ...tier, price } : tier));
                addLog({ action: 'Pricing Updated', detail: `Logistics Protocol Rate ID ${id} adjusted to $${price}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to update delivery pricing:", error);
        }
    };

    const deleteClient = async (id) => {
        try {
            await api.delete(`/clients/${id}`);
            setClients(prev => prev.filter(c => c.id !== id));
            addLog({ action: 'Client Decommission', detail: `Removed client reference ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete client:", error);
        }
    };





    const addProject = async (project) => {
        const mapStatusToBackend = (status) => {
            switch (status?.toLowerCase()) {
                case 'pending': return 'planned';
                case 'active': return 'in_progress';
                case 'completed': return 'completed';
                case 'cancelled': return 'on_hold';
                default: return 'planned';
            }
        };

        try {
            const reqData = {
                name: project.name || project.projectName,
                description: project.description || `Tactical deployment for ${project.client}`,
                manager_id: project.manager_id || project.assignedLeaderId || currentUser?.id,
                startDate: project.start || project.startDate,
                location: project.location,
                status: mapStatusToBackend(project.status),
                company_id: project.clientId || project.company_id
            };

            const res = await api.post('/orders/projects', reqData);
            if (res.data?.success) {
                const newProject = res.data.data;
                const mapped = {
                    ...newProject,
                    client: project.client || newProject.client_name,
                    start: newProject.start_date?.split('T')[0]
                };
                setProjects(prev => [mapped, ...prev]);

                // Automatically create a corresponding Logistics/Delivery Mission (UI state only for now as per current logic)
                const deliveryId = `DEL-P-${Math.floor(1000 + Math.random() * 999)}`;
                setDeliveries(prev => [{
                    id: deliveryId,
                    projectId: newProject.id,
                    item: `Project Setup: ${project.name}`,
                    status: 'Pending',
                    location: project.location || 'Client Hub',
                    mode: project.deliveryType || 'Road',
                    pod: { signature: null, image: null, actualTime: null },
                    clientId: project.clientId || 1,
                    assignedStaff: project.assignedLeader || 'Operational Queue'
                }, ...prev]);

                addLog({
                    action: 'Project Deployment',
                    detail: `Initiated ${project.name} for ${project.client}. Distribution protocol ${project.deliveryType || 'Road'} initialized under ${deliveryId}.`,
                    type: 'system'
                });
            }
        } catch (error) {
            console.error("Failed to add project:", error);
        }
    };

    const updateProject = async (updated) => {
        const mapStatusToBackend = (status) => {
            switch (status?.toLowerCase()) {
                case 'pending': return 'planned';
                case 'active': return 'in_progress';
                case 'completed': return 'completed';
                case 'cancelled': return 'on_hold';
                default: return status;
            }
        };

        try {
            const reqData = {
                name: updated.name || updated.projectName,
                description: updated.description,
                status: mapStatusToBackend(updated.status),
                location: updated.location,
                start_date: updated.start || updated.startDate,
                manager_id: updated.manager_id || updated.managerId
            };
            await api.put(`/orders/projects/${updated.id}`, reqData);
            await fetchProjects();
            addLog({ action: 'Project Redesign', detail: `Updated parameters for ${updated.name}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update project:", error);
        }
    };

    const deleteProject = async (id) => {
        try {
            await api.delete(`/orders/projects/${id}`);
            setProjects(prev => prev.filter(p => p.id !== id));
            addLog({ action: 'Project Decommission', detail: `Archived project reference ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    };

    const updateAssignment = async (updated) => {
        try {
            await api.put(`/staff/assignments/${updated.id}`, updated);
            setStaffAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
        } catch (error) {
            console.error("Failed to update assignment:", error);
        }
    };

    const clockStorageKey = () => {
        const uid = currentUser?.id ?? currentUser?.email ?? 'guest';
        return `zz_clock_${uid}`;
    };

    const clockIn = async (location) => {
        const loc = location || currentUser?.location || 'Central Hub';
        const payload = { location: loc };
        let shiftRef = null;

        try {
            const res = await api.post('/staff/clock-in', payload);
            const root = res.data;
            const inner = root?.data !== undefined && typeof root.data === 'object' ? root.data : null;
            shiftRef = inner?.shiftId ?? inner?.shift_id ?? inner?.id ?? root?.shiftId;
            const ok = root?.success !== false && root?.error == null;
            if (ok) {
                const ref = shiftRef ?? true;
                if (currentUser?.id) toggleAvailability(currentUser.id, true);
                localStorage.setItem(clockStorageKey(), JSON.stringify({ in: true, at: new Date().toISOString(), location: loc, shiftRef: ref }));
                return ref;
            }
        } catch (error) {
            console.warn('Clock-in API unavailable, using local session:', error?.response?.data?.message || error.message);
        }

        shiftRef = shiftRef || `local-${Date.now()}`;
        if (currentUser?.id) toggleAvailability(currentUser.id, true);
        localStorage.setItem(clockStorageKey(), JSON.stringify({ in: true, at: new Date().toISOString(), location: loc, shiftRef }));
        return shiftRef;
    };

    const clockOut = async () => {
        try {
            const res = await api.post('/staff/clock-out');
            const root = res.data;
            const ok = root?.success !== false && root?.error == null;
            if (ok) {
                localStorage.removeItem(clockStorageKey());
                if (currentUser?.id) toggleAvailability(currentUser.id, false);
                try { await fetchPayHistory(); } catch { /* optional */ }
                return root?.data || root || { ok: true };
            }
        } catch (error) {
            console.warn('Clock-out API unavailable, clearing local session:', error?.response?.data?.message || error.message);
        }
        localStorage.removeItem(clockStorageKey());
        if (currentUser?.id) toggleAvailability(currentUser.id, false);
        return { ok: true, local: true };
    };

    const addStaffAssignment = async (asg) => {
        try {
            const reqData = {
                assigneeId: asg.assigneeId,
                task: asg.task,
                location: asg.location,
                status: asg.status || 'Pending',
                priority: asg.priority || 'Normal',
                missionType: asg.missionType,
                passengerName: asg.passengerName,
                pickupTime: asg.pickupTime,
                dropLocation: asg.dropLocation,
                luggage: asg.luggage,
                goodsDetails: asg.goodsDetails,
                weight: asg.weight,
                pickupLocation: asg.pickupLocation,
                deliveryLocation: asg.deliveryLocation
            };
            const res = await api.post('/staff/assignments', reqData);
            if (res.data?.success) {
                const newAsg = {
                    ...asg,
                    id: res.data.data.id,
                    db_id: res.data.data.id
                };
                setStaffAssignments(prev => [newAsg, ...prev]);
                addLog({ action: 'Mission Delegated', detail: `${asg.missionType || 'General'} mission assigned to ${asg.assignee}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add assignment:", error);
        }
    };

    const addAudit = async (audit) => {
        try {
            const res = await api.post('/support/audits', audit); // Need to check if POST exists, implementation plan said maps to audit_logs
            setAudits(prev => [res.data.data, ...prev]);
            addLog({ action: 'Audit Initialized', detail: `Started ${audit.title || 'Inventory'} compliance screening.`, type: 'system' });
        } catch (error) {
            console.error("Failed to add audit:", error);
        }
    };

    const updateAudit = async (updated) => {
        try {
            await api.put(`/support/audits/${updated.id}`, updated);
            setAudits(prev => prev.map(a => a.id === updated.id ? updated : a));
            addLog({ action: 'Audit Updated', detail: `Recalibrated metrics for ${updated.id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update audit:", error);
        }
    };

    const deleteAudit = async (id) => {
        try {
            await api.delete(`/support/audits/${id}`);
            setAudits(prev => prev.filter(a => a.id !== id));
            addLog({ action: 'Audit Removal', detail: `Decommissioned audit record ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete audit:", error);
        }
    };

    const addQuote = async (quote) => {
        try {
            const res = await api.post('/procurement/quotes', {
                ...quote,
                quote_type: quote.quoteType ?? quote.quote_type ?? 'client',
            });
            if (res.data?.success) {
                await fetchQuotes();
                addLog({ action: 'Quote Manifest', detail: `Received procurement offer from Vendor ${quote.vendorId}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add quote:", error);
        }
    };

    const updateQuote = async (updated) => {
        try {
            const qid = quotePathId(updated.id);
            const payload = {
                vendor_id: updated.vendorId ?? updated.vendor_id,
                vendor_name: updated.vendor_name || updated.vendor,
                items: updated.items,
                total_amount: updated.total ?? updated.total_amount,
                lead_time: updated.leadTime ?? updated.lead_time,
                validity_date: updated.validity ?? updated.validity_date,
                status: updated.status,
                quote_type: updated.quoteType ?? updated.quote_type ?? 'client',
                payment_terms: updated.paymentTerms ?? updated.payment_terms,
                notes: updated.notes,
            };
            await api.put(`/procurement/quotes/${qid}`, payload);
            setQuotes(prev => prev.map(q => q.id === updated.id ? { ...updated, ...payload } : q));
            addLog({ action: 'Quote Revision', detail: `Updated terms for ${updated.id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update quote:", error);
            setQuotes(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated } : q));
        }
    };

    const deleteQuote = async (id) => {
        try {
            await api.delete(`/procurement/quotes/${id}`);
            setQuotes(prev => prev.filter(q => q.id !== id));
            addLog({ action: 'Quote Discarded', detail: `Removed quote reference ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete quote:", error);
        }
    };

    const addPurchaseRequest = async (req) => {
        try {
            const body = {
                ...req,
                status: req.status && String(req.status).trim() !== '' ? req.status : 'pending_approval'
            };
            const res = await api.post('/procurement/requests', body);
            if (res.data?.success) {
                await fetchPurchaseRequests();
                addLog({ action: 'Request Initialized', detail: `New purchase manifest submitted by ${req.requester}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add purchase request:", error);
        }
    };

    const updatePurchaseRequest = async (updated) => {
        try {
            await api.put(`/procurement/requests/${updated.id}`, updated);
            setPurchaseRequests(prev => prev.map(r => r.id === updated.id ? updated : r));
            addLog({ action: 'Request Updated', detail: `Modified procurement request ${updated.id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update purchase request:", error);
        }
    };

    const deletePurchaseRequest = async (id) => {
        try {
            await api.delete(`/procurement/requests/${id}`);
            setPurchaseRequests(prev => prev.filter(r => r.id !== id));
            addLog({ action: 'Request Purged', detail: `Removed request ID ${id} from queue.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete purchase request:", error);
        }
    };

    const addPurchaseOrder = async (po) => {
        try {
            const reqData = {
                vendor_id: po.vendorId != null ? parseInt(String(po.vendorId).replace(/\D/g, ''), 10) || po.vendorId : po.vendorId,
                vendorId: po.vendorId,
                payment_terms: po.paymentTerms || po.payment_terms || 'Net 30',
                notes: po.notes || '',
                total_amount: po.total || po.total_amount,
                status: 'Pending',
                items: po.items.map(item => ({
                    name: item.name,
                    category: item.category,
                    quantity: item.orderedQty ?? item.quantity,
                    unit_price: item.price
                }))
            };
            const res = await api.post('/procurement/po', reqData);
            if (res.data?.success) {
                await fetchPurchaseOrders();
                addLog({ action: 'PO Issued', detail: `Purchase Order ${res.data.data.id} sent to ${po.vendorName}.`, type: 'procurement' });
            }
        } catch (error) {
            console.error("Failed to add PO:", error);
        }
    };

    const updatePurchaseOrder = async (updated) => {
        try {
            const pid = poNumericId(updated.id);
            const payload = {
                payment_terms: updated.paymentTerms ?? updated.payment_terms ?? 'Net 30',
                total_amount: updated.total ?? updated.total_amount,
                items: (updated.items || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    quantity: item.orderedQty ?? item.quantity,
                    unit_price: item.price,
                    received_qty: item.receivedQty ?? item.received_qty,
                })),
                vendor_name: updated.vendorName ?? updated.vendor_name,
            };
            await api.put(`/procurement/po/${pid}`, payload);
            const merged = {
                ...updated,
                payment_terms: payload.payment_terms,
                paymentTerms: payload.payment_terms,
            };
            setPurchaseOrders(prev => prev.map(po => po.id === updated.id ? merged : po));
            addLog({ action: 'PO Revised', detail: `Purchase Order ${updated.id} parameters adjusted for ${updated.vendorName}.`, type: 'procurement' });
        } catch (error) {
            console.error("Failed to update PO:", error);
            setPurchaseOrders(prev => prev.map(po => po.id === updated.id ? { ...po, ...updated } : po));
        }
    };

    const receiveGoodsAgainstPO = async (poId, receivedData) => {
        try {
            // Extract numeric ID if it's "PO-1002" format
            const numericId = typeof poId === 'string' && poId.includes('-') ? poId.split('-')[1] : poId;

            const reqData = receivedData.map(r => ({
                id: r.id, // Expecting item database ID
                receivedQty: Number(r.receivedNow)
            }));

            const res = await api.put(`/procurement/po/${numericId}/receive`, reqData);
            if (res.data?.success) {
                // Re-fetch POs or update locally
                const poRes = await api.get('/procurement/po');
                if (poRes.data?.success) setPurchaseOrders(poRes.data.data.map(po => ({ ...po, items: parsePOItems(po.items) })));

                addLog({ action: 'Goods Receiving', detail: `Shipment received against PO ${poId}.`, type: 'inventory' });
            }
        } catch (error) {
            console.error("Failed to receive goods:", error);
        }
    };

    /** Reduce received quantities when goods were registered incorrectly (local sync if API missing). */
    const reverseGoodsReceipt = async (poId, lineAdjustments) => {
        const pid = poNumericId(poId);
        try {
            await api.post(`/procurement/po/${pid}/reverse-receipt`, { lines: lineAdjustments });
            const poRes = await api.get('/procurement/po');
            if (poRes.data?.success) setPurchaseOrders(poRes.data.data.map(po => ({ ...po, items: parsePOItems(po.items) })));
        } catch (error) {
            console.warn('reverse-receipt API fallback local', error);
            setPurchaseOrders(prev => prev.map(po => {
                if (String(po.id) !== String(poId)) return po;
                const items = (po.items || []).map(it => {
                    const adj = lineAdjustments.find(a => String(a.id) === String(it.id));
                    if (!adj) return it;
                    const dec = Math.max(0, Number(adj.reduceBy ?? adj.quantityToReverse) || 0);
                    const rq = Math.max(0, (Number(it.receivedQty) || 0) - dec);
                    const ord = Number(it.orderedQty) || 0;
                    return { ...it, receivedQty: rq, pendingQty: Math.max(0, ord - rq) };
                });
                let status = po.status;
                const allPending = items.every(i => (i.receivedQty || 0) === 0);
                const anyRecv = items.some(i => (i.receivedQty || 0) > 0);
                if (allPending && po.status !== 'Pending') status = 'Pending';
                else if (anyRecv && items.some(i => (i.pendingQty || 0) > 0)) status = 'Partially Received';
                return { ...po, items, status };
            }));
            addLog({ action: 'Receipt reversed', detail: `Adjusted receiving for PO ${poId}.`, type: 'inventory' });
        }
    };

    const addWarehouse = async (wh) => {
        try {
            const managerId = wh.manager_id !== '' && wh.manager_id != null ? parseInt(wh.manager_id, 10) : null;
            const warehouseData = {
                name: wh.name,
                location: wh.location,
                capacity: wh.capacity,
                status: wh.status || 'active',
                company_id: currentUser?.company_id || wh.company_id,
                manager_id: Number.isFinite(managerId) ? managerId : null
            };
            const res = await api.post('/warehouses', warehouseData);
            if (res.data?.success) {
                await fetchWarehouses();
                addLog({ action: 'Facility Added', detail: `Commissioned ${wh.name} into the network.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add warehouse:", error);
        }
    };

    const updateWarehouse = async (updated) => {
        try {
            const managerId = updated.manager_id !== '' && updated.manager_id != null ? parseInt(updated.manager_id, 10) : null;
            const payload = {
                name: updated.name,
                location: updated.location,
                capacity: updated.capacity,
                status: updated.status,
                manager_id: Number.isFinite(managerId) ? managerId : null,
                company_id: updated.company_id
            };
            const res = await api.put(`/warehouses/${updated.id}`, payload);
            if (res.data?.success) {
                await fetchWarehouses();
                addLog({ action: 'Facility Updated', detail: `Modified configurations for ${updated.name}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to update warehouse:", error);
        }
    };

    const deleteWarehouse = async (id) => {
        try {
            await api.delete(`/warehouses/${id}`);
            setWarehouses(prev => prev.filter(w => w.id !== id));
            addLog({ action: 'Facility Decommission', detail: `Removed warehouse reference ID ${id} from ledger.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete warehouse:", error);
        }
    };



    const [luxuryItems, setLuxuryItems] = useState([]);

    const addLuxuryItem = async (item) => {
        try {
            const reqData = {
                item_name: item.item,
                owner_name: item.owner,
                vault_location: item.vault,
                estimated_value: item.value,
                status: item.status,
                notes: item.notes
            };
            const res = await api.post('/concierge/luxury-items', reqData);
            setLuxuryItems(prev => [{ ...item, id: res.data.id || Date.now() }, ...prev]);
            addLog({ action: 'Luxury Item Registered', detail: `New vault entry: ${item.item}`, type: 'system' });
        } catch (error) {
            console.error("Failed to add luxury item:", error);
        }
    };

    const updateLuxuryItem = async (updated) => {
        try {
            const reqData = {
                item_name: updated.item,
                owner_name: updated.owner,
                vault_location: updated.vault,
                estimated_value: updated.value,
                status: updated.status,
                notes: updated.notes
            };
            await api.put(`/concierge/luxury-items/${updated.id}`, reqData);
            setLuxuryItems(prev => prev.map(i => i.id === updated.id ? updated : i));
            addLog({ action: 'Luxury Item Updated', detail: `Recalibrated details for vault entry: ${updated.item}`, type: 'system' });
        } catch (error) {
            console.error("Failed to update luxury item:", error);
        }
    };

    const fetchChauffeurRequests = React.useCallback(async () => {
        try {
            const res = await api.get('/support/chauffeur-requests');
            if (res.data?.success) {
                const mapped = res.data.data.map(d => {
                    let passengerData = {};
                    if (d.passenger_info) {
                        try {
                            passengerData = typeof d.passenger_info === 'string' ? JSON.parse(d.passenger_info) : d.passenger_info;
                        } catch (e) { /* ignore parse error */ }
                    }
                    return {
                        id: d.id,
                        clientId: d.client_id || d.company_id,
                        company_id: d.company_id,
                        created_by: d.created_by,
                        clientName: d.clientName || 'VIP Guest',
                        driverName: d.driver_name || null,
                        plateNumber: d.plate_number || null,
                        serviceType: passengerData.serviceType || d.mission_type,
                        pickupLocation: d.pickup_location,
                        dropLocation: d.drop_location,
                        dueDate: d.delivery_date?.split('T')[0] || null,
                        pickupDate: d.delivery_date?.split('T')[0] || null,
                        pickupTime: d.pickup_time || null,
                        status: d.status,
                        numberOfPassengers: passengerData.passengers || 1,
                        luggage: passengerData.luggage || 'No',
                        bags: passengerData.bags || 0,
                        amenities: passengerData.amenities || [],
                        stops: passengerData.stops || 'No',
                        stopLocations: passengerData.stopLocations || null,
                        returnDate: passengerData.returnDate || null,
                        returnTime: passengerData.returnTime || null,
                        numberOfDays: passengerData.numberOfDays || null,
                        requestDate: d.created_at?.split('T')[0] || null
                    };
                });
                setChauffeurRequests(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch chauffeur requests:", error);
        }
    }, []);

    const fetchAudits = React.useCallback(async () => {
        try {
            const res = await api.get('/support/audits');
            if (res.data?.success) {
                setAudits(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch audits:", error);
        }
    }, []);

    const toggleAvailability = async (userId, forcedStatus = null) => {
        try {
            const user = users.find(u => u.id === userId);
            const newStatus = forcedStatus !== null ? forcedStatus : (user ? !user.isAvailable : true);
            
            await api.put(`/staff/${userId}`, { is_available: newStatus });

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAvailable: newStatus } : u));
            if (currentUser?.id === userId) {
                const updatedUser = { ...currentUser, isAvailable: newStatus };
                setCurrentUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            addLog({ action: 'Status Update', detail: `${user?.name || 'Staff'} availability updated to ${newStatus ? 'Active' : 'Offline'}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to toggle availability:", error);
        }
    };

    const fetchPayHistory = React.useCallback(async () => {
        try {
            const res = await api.get('/finance/my-payroll');
            if (res.data?.success) {
                const mapped = res.data.data.map(p => ({
                    id: p.id,
                    period: new Date(p.payment_date || p.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    date: (p.payment_date || p.created_at)?.split('T')[0],
                    hours: p.hours || "Variable",
                    total: `$${parseFloat(p.net_amount || p.amount || 0).toLocaleString()}`,
                    status: p.status || 'Processed',
                    userId: p.user_id,
                    userName: p.user_name
                }));
                setPayHistory(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch pay history:", error);
        }
    }, []);


    const deleteLuxuryItem = async (id) => {
        try {
            await api.delete(`/concierge/luxury-items/${id}`);
            setLuxuryItems(prev => prev.filter(i => i.id !== id));
            addLog({ action: 'Luxury Item Decommissioned', detail: `Removed vault entry ID ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete luxury item:", error);
        }
    };

    const dispatchVehicle = async (data) => {
        try {
            // data.id is plate_number, data.db_id is the integer ID
            // data.deliveryId is the DEL-00x formatted ID, data.delivery_db_id is the integer ID
            const deliveryDbId = data.delivery_db_id || (typeof data.deliveryId === 'string'
                ? parseInt(String(data.deliveryId).replace(/[^0-9]/g, ''), 10)
                : data.deliveryId);
            if (!deliveryDbId) {
                throw new Error('No delivery selected for dispatch.');
            }

            await api.patch(`/logistics/deliveries/${deliveryDbId}/status`, {
                status: 'en_route',
                vehicle_id: data.db_id, // Ensure it's assigned if not already
                route_id: data.routeId || null
            });

            // Re-fetch to sync
            const [vRes, dRes] = await Promise.all([
                api.get('/logistics/vehicles'),
                api.get('/logistics/deliveries')
            ]);

            if (vRes.data.success) {
                setFleet(vRes.data.data.map(v => ({
                    id: v.plate_number,
                    db_id: v.id,
                    type: v.type,
                    model: v.model,
                    fuel: `${v.fuel_level}%`,
                    status: v.status === 'available' ? 'Active' : v.status,
                    vehicle_type: v.vehicle_type
                })));
            }

            if (dRes.data.success) {
                const mappedDeliveries = dRes.data.data.map(d => ({
                    id: `DEL-${String(d.id).padStart(3, '0')}`,
                    db_id: d.id,
                    orderId: d.order_id,
                    order_id_raw: d.order_id,
                    status: d.status,
                    driver: d.driver_name,
                    vehicleId: d.plate_number,
                    location: d.route || 'In Transit',
                    route: d.route,
                    items: d.package_details ? JSON.parse(d.package_details) : []
                }));
                setDeliveries(mappedDeliveries);

                // Auto-sync tracking row for dispatched mission so Tracking tab reflects immediately.
                const dispatched = mappedDeliveries.find((d) => Number(d.db_id) === Number(deliveryDbId))
                    || mappedDeliveries.find((d) => String(d.id) === String(data.deliveryId));
                if (dispatched) {
                    const trackingRow = {
                        id: `TRK-DEL-${dispatched.db_id}`,
                        asset: dispatched.vehicleId || data.id || 'Assigned Vehicle',
                        location: data.routeName || dispatched.route || dispatched.location || 'In Transit',
                        signal: 'Strong',
                        eta: dispatched.eta || 'Live',
                        status: String(dispatched.status || '').toLowerCase() === 'en_route' ? 'En Route' : 'Active',
                        deliveryId: dispatched.id,
                    };
                    setTracking(prev => {
                        const idx = prev.findIndex(t => String(t.id) === String(trackingRow.id));
                        if (idx === -1) return [trackingRow, ...prev];
                        const next = [...prev];
                        next[idx] = { ...next[idx], ...trackingRow };
                        return next;
                    });
                }
            }

            if (data.markUrgent) {
                setUrgentTasks(prev => [{
                    id: `URG-${Date.now()}`,
                    task: data.mission || 'High-priority dispatch',
                    time: 'Immediate',
                    priority: 'Critical',
                    location: data.routeName || 'Dispatch Route',
                    assignee: data.driver || 'Logistics Team'
                }, ...prev]);
            }

            addLog({ action: 'Fleet Dispatch', detail: `Vehicle ${data.id} launched for ${data.mission}. Pilot: ${data.driver}`, type: 'system' });
        } catch (error) {
            console.error("Failed to dispatch vehicle:", error);
        }
    };

    const TRACKING_ENDPOINTS = ['/logistics/tracking', '/tracking'];
    const URGENT_ENDPOINTS = ['/logistics/urgent', '/logistics/urgent-tasks', '/support/urgent'];

    const fetchTracking = React.useCallback(async () => {
        if (trackingApiUnavailableRef.current) return;
        for (const ep of TRACKING_ENDPOINTS) {
            try {
                const res = await api.get(ep);
                if (res.data?.success || Array.isArray(res.data?.data) || Array.isArray(res.data)) {
                    const rows = res.data?.success ? res.data.data : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
                    setTracking((rows || []).map((t) => ({
                        id: t.tracker_id || t.code || `TRK-${String(t.id || Date.now()).padStart(3, '0')}`,
                        db_id: t.id || null,
                        asset: t.asset || t.plate_number || t.vehicle || 'Assigned Vehicle',
                        location: t.location || t.route || t.current_location || 'In Transit',
                        signal: t.signal || t.signal_strength || 'Strong',
                        eta: t.eta || t.estimated_time || 'Live',
                        status: t.status || 'Active',
                        deliveryId: t.delivery_id || t.deliveryId || null
                    })));
                    return;
                }
            } catch (_) { /* try next endpoint */ }
        }
        trackingApiUnavailableRef.current = true;
        // Keep existing state if endpoint unavailable.
    }, []);

    const addTracking = async (t) => {
        const payload = {
            asset: t.asset,
            location: t.location,
            signal: t.signal || 'Strong',
            eta: t.eta || null,
            status: t.status || 'active',
            delivery_id: t.deliveryId || null,
            tracker_id: t.id || null
        };
        if (!trackingApiUnavailableRef.current) for (const ep of TRACKING_ENDPOINTS) {
            try {
                const res = await api.post(ep, payload);
                if (res.data?.success || res.data?.data) {
                    await fetchTracking();
                    addLog({ action: 'Tracker Linked', detail: `Connected asset ${t.asset} to Geo-Spatial Network.`, type: 'system' });
                    return;
                }
            } catch (_) { /* try next endpoint */ }
        }
        trackingApiUnavailableRef.current = true;
        // Fallback to local state if API not available
        setTracking(prev => [{ ...t, id: t.id || `TRK-${Math.floor(500 + Math.random() * 99)}` }, ...prev]);
        addLog({ action: 'Tracker Linked', detail: `Connected asset ${t.asset} to Geo-Spatial Network.`, type: 'system' });
    };

    // --- FLEET ACTIONS ---
    const addFleet = async (vehicle) => {
        try {
            const statusMap = { 'Active': 'available', 'Inactive': 'offline', 'Maintenance': 'maintenance' };
            const reqData = {
                plate_number: vehicle.id,
                model: vehicle.model,
                type: vehicle.type,
                fuel_level: parseInt(vehicle.fuel) || 100,
                vehicle_type: vehicle.vehicle_type || (vehicle.type?.includes('Van') ? 'Van' :
                    vehicle.type?.includes('Boat') ? 'Boat' :
                        vehicle.type?.includes('Plane') ? 'Plane' : 'Truck'),
                status: statusMap[vehicle.status] || 'available',
                capacity: vehicle.capacity,
                insurance_policy: vehicle.insurancePolicy,
                registration_expiry: vehicle.registrationExpiry || null,
                inspection_date: vehicle.inspectionDate || null,
                diagnostic_status: vehicle.diagnosticStatus
            };
            const res = await api.post('/logistics/vehicles', reqData);
            if (res.data?.success) {
                setFleet(prev => [{ ...vehicle, db_id: res.data.data.id }, ...prev]);
                addLog({ action: 'Asset Induction', detail: `Commissioned ${vehicle.id} into active fleet.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add fleet asset:", error);
        }
    };

    const updateFleet = async (updated) => {
        try {
            const statusMap = { 'Active': 'available', 'Inactive': 'offline', 'Maintenance': 'maintenance' };
            const reqData = {
                plate_number: updated.id,
                model: updated.model,
                type: updated.type,
                fuel_level: parseInt(updated.fuel) || 100,
                vehicle_type: updated.vehicle_type || (updated.type?.includes('Van') ? 'Van' :
                    updated.type?.includes('Boat') ? 'Boat' :
                        updated.type?.includes('Plane') ? 'Plane' : 'Truck'),
                status: statusMap[updated.status] || updated.status.toLowerCase(),
                capacity: updated.capacity,
                insurance_policy: updated.insurancePolicy,
                registration_expiry: updated.registrationExpiry || null,
                inspection_date: updated.inspectionDate || null,
                diagnostic_status: updated.diagnosticStatus
            };
            await api.put(`/logistics/vehicles/${updated.db_id}`, reqData);
            setFleet(prev => prev.map(v => v.id === updated.id ? updated : v));
            addLog({ action: 'Asset Recalibration', detail: `Updated telemetry for ${updated.id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update fleet asset:", error);
        }
    };

    const deleteFleet = async (id) => {
        try {
            const vehicle = fleet.find(v => v.id === id);
            if (vehicle && vehicle.db_id) {
                await api.delete(`/logistics/vehicles/${vehicle.db_id}`);
                setFleet(prev => prev.filter(v => v.id !== id));
                addLog({ action: 'Asset Decommissioned', detail: `Removed ${id} from active fleet operations.`, type: 'alert' });
            }
        } catch (error) {
            console.error("Failed to delete fleet asset:", error);
        }
    };

    // --- ROUTE ACTIONS ---
    const addRoute = async (route) => {
        try {
            const reqData = {
                name: route.name,
                start_location: route.start || '',
                end_location: route.end || '',
                distance_km: parseFloat(route.dist) || 0,
                estimated_time: route.time
            };
            const res = await api.post('/logistics/routes', reqData);
            if (res.data.success) {
                setRoutes(prev => [{ ...route, id: res.data.data.id }, ...prev]);
                addLog({ action: 'Route Mapping', detail: `Charted new logistics corridor: ${route.name}`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add route:", error);
        }
    };

    const updateRoute = async (updated) => {
        try {
            const reqData = {
                name: updated.name,
                start_location: updated.start || '',
                end_location: updated.end || '',
                distance_km: parseFloat(updated.dist) || 0,
                estimated_time: updated.time
            };
            await api.put(`/logistics/routes/${updated.id}`, reqData);
            setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r));
            addLog({ action: 'Route Updated', detail: `Corridor ${updated.name} parameters recalibrated.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update route:", error);
        }
    };

    const fetchRoutes = React.useCallback(async () => {
        try {
            const res = await api.get('/logistics/routes');
            if (res.data?.success) {
                setRoutes(res.data.data.map(r => ({
                    id: r.id,
                    name: r.name,
                    start: r.start_location,
                    end: r.end_location,
                    dist: r.distance_km ? `${r.distance_km}km` : '0km',
                    time: r.estimated_time,
                    type: r.type || 'Land',
                    status: r.status || 'Active'
                })));
            }
        } catch (error) {
            console.error("Failed to fetch routes:", error);
        }
    }, []);

    const deleteRoute = async (id) => {
        try {
            await api.delete(`/logistics/routes/${id}`);
            setRoutes(prev => prev.filter(r => r.id !== id));
            addLog({ action: 'Route Decommissioned', detail: `Path ID ${id} removed from distribution network.`, type: 'alert' });
        } catch (error) {
            console.error("Failed to delete route:", error);
        }
    };

    const addChauffeurRequest = async (request) => {
        try {
            const reqData = {
                mission_type: 'Chauffeur',
                company_id: request.clientId && request.clientId !== 'CLT-GUEST' ? request.clientId : null,
                pickup_location: request.pickupLocation,
                drop_location: request.dropLocation,
                delivery_date: request.dueDate || null,
                pickup_time: request.pickupTime || null,
                driver_name: request.driverName || null,
                plate_number: request.plateNumber || null,
                passenger_info: JSON.stringify({
                    passengers: request.numberOfPassengers,
                    luggage: request.luggage,
                    amenities: request.amenities,
                    serviceType: request.serviceType,
                    returnDate: request.returnDate || null,
                    returnTime: request.returnTime || null,
                    numberOfDays: request.numberOfDays || null,
                    stops: request.stops || 'No',
                    stopLocations: request.stopLocations || null,
                    bags: request.bags || 0
                }),
                status: request.driverName ? 'assigned' : 'pending_review'
            };
            const res = await api.post('/logistics/deliveries', reqData);
            if (res.data?.success) {
                fetchChauffeurRequests();
                addLog({ action: 'Chauffeur Dispatched', detail: `VIP Transport secured for ${request.clientName}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add chauffeur request:", error);
            const msg = error.response?.data?.message || 'Failed to create chauffeur request.';
            alert(msg);
        }
    };

    const updateChauffeurRequest = async (updated) => {
        try {
            await api.patch(`/logistics/deliveries/${updated.id}/status`, {
                status: updated.status,
                driver_name: updated.driverName || updated.driver_name || undefined,
                plate_number: updated.plateNumber || updated.plate_number || undefined
            });
            fetchChauffeurRequests();
            addLog({ action: 'Chauffeur Updated', detail: `Protocol ID ${updated.id} status recalibrated.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update chauffeur request:", error);
        }
    };

    const deleteChauffeurRequest = async (id) => {
        try {
            await api.delete(`/logistics/deliveries/${id}`);
            setChauffeurRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete chauffeur request:", error);
        }
    };
    const updateTracking = async (updated) => {
        const payload = {
            asset: updated.asset,
            location: updated.location,
            signal: updated.signal,
            eta: updated.eta,
            status: updated.status,
            delivery_id: updated.deliveryId || null,
            tracker_id: updated.id
        };
        if (!trackingApiUnavailableRef.current) for (const ep of TRACKING_ENDPOINTS) {
            try {
                await api.put(`${ep}/${encodeURIComponent(updated.db_id || updated.id)}`, payload);
                await fetchTracking();
                return;
            } catch (_) { /* try next endpoint */ }
        }
        trackingApiUnavailableRef.current = true;
        setTracking(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const deleteTracking = async (id) => {
        if (!trackingApiUnavailableRef.current) for (const ep of TRACKING_ENDPOINTS) {
            try {
                const row = tracking.find((t) => String(t.id) === String(id) || String(t.db_id) === String(id));
                await api.delete(`${ep}/${encodeURIComponent(row?.db_id || id)}`);
                await fetchTracking();
                addLog({ action: 'Signal Severed', detail: `Decommissioned tracker ${id}.`, type: 'alert' });
                return;
            } catch (_) { /* try next endpoint */ }
        }
        trackingApiUnavailableRef.current = true;
        setTracking(prev => prev.filter(t => t.id !== id));
        addLog({ action: 'Signal Severed', detail: `Decommissioned tracker ${id}.`, type: 'alert' });
    };


    const addEvent = async (event) => {
        try {
            const clientId = event.client_id || clients.find(c => c.name === event.client)?.id || null;

            const formData = new FormData();
            formData.append('name', event.title || '');
            formData.append('event_date', event.date || '');
            formData.append('location', event.location || '');
            formData.append('client_id', clientId || '');
            formData.append('manager_id', currentUser?.id || '');
            formData.append('status', event.status || 'planned');
            formData.append('special_requests', event.specialRequests || '');
            formData.append('planner_name', event.plannerName || '');
            formData.append('guest_count', event.guestCount || event.guests || 0);
            if (event.imageFile) formData.append('image', event.imageFile);

            const res = await api.post('/support/events', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success) {
                const newEvt = {
                    ...res.data.data,
                    title: res.data.data.name,
                    client: res.data.data.client_name,
                    date: res.data.data.event_date ? res.data.data.event_date.split('T')[0] : '',
                    imageUrl: res.data.data.image_url
                };
                setEvents(prev => [newEvt, ...prev]);
                await fetchTickets();
                addLog({ action: 'Event Registry', detail: `New event request: ${event.title}`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add event:", error);
        }
    };

    const updateEvent = async (updated) => {
        try {
            const clientId = updated.client_id || clients.find(c => c.name === updated.client)?.id || null;
            const formData = new FormData();
            formData.append('name', updated.title || '');
            formData.append('event_date', updated.date || '');
            formData.append('location', updated.location || '');
            formData.append('client_id', clientId || '');
            formData.append('status', updated.status || 'planned');
            formData.append('special_requests', updated.specialRequests || '');
            formData.append('planner_name', updated.plannerName || '');
            formData.append('guest_count', updated.guestCount || updated.guests || 0);
            if (updated.imageFile) formData.append('image', updated.imageFile);

            await api.put(`/support/events/${updated.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchTickets();
            addLog({ action: 'Event Update', detail: `Synchronized details for ${updated.title}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update event:", error);
        }
    };

    const deleteEvent = async (id) => {
        try {
            await api.delete(`/support/events/${id}`);
            setEvents(prev => prev.filter(e => e.id !== id));
            addLog({ action: 'Event Cancellation', detail: `Removed event reference ID ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete event:", error);
        }
    };

    const [deliveryPricing, setDeliveryPricing] = useState([]);

    const [saasRequests, setSaasRequests] = useState([]);




    const getVacationBalance = (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user || user.role === 'client') return 0;

        const join = new Date(user.joinedDate || '2024-01-01');
        const now = new Date();
        const diffYears = (now - join) / (1000 * 60 * 60 * 24 * 365);
        const diffMonths = diffYears * 12;

        if (user.isSalaried) {
            if (diffYears > 10) return 15; // 3 weeks
            if (diffYears >= 1) return 10; // 2 weeks
            if (diffMonths >= 6) return 5;  // 1 week
            return 0;
        } else {
            // Hourly
            if (diffYears >= 1) return 10; // 2 weeks
            return 0;
        }
    };

    const submitSaaSRequest = async (data) => {
        try {
            const res = await api.post('/clients', {
                ...data,
                password: data.password || null,
                client_type: data.clientType,
                billing_cycle: data.billingCycle,
                payment_method: data.paymentMethod,
                contact_person: data.contact,
                business_name: data.companyName,
                logo_url: data.logo,
                status: 'pending'
            });
            if (res.data?.success) {
                setClients(prev => [res.data.data, ...prev]);
                addLog({ action: 'SaaS Invite Request', detail: `New request from ${data.name} for ${data.plan} plan.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to submit SaaS request:", error);
        }
    };

    const processSaaSRequest = async (id, action) => {
        try {
            const newStatus = action === 'approve' ? 'active' : 'rejected';
            await api.put(`/clients/${id}`, { status: newStatus });
            setClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            addLog({ action: 'SaaS Request Processed', detail: `Request ${id} marked as ${newStatus}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to process SaaS request:", error);
        }
    };

    const addSupportTicket = async (ticket) => {
        try {
            const payload = {
                subject: ticket.subject,
                category: ticket.category || 'General',
                description: ticket.messages?.[0]?.text || '',
                messages: ticket.messages,
                priority: (ticket.priority || 'medium').toLowerCase(),
                client_id: ticket.clientId || currentUser?.clientId || currentUser?.company_id || null,
                created_by: ticket.createdById || currentUser?.id || null
            };
            const res = await api.post('/support/tickets', payload);
            if (res.data?.success) {
                await fetchTickets();
                addLog({ action: 'Ticket Creation', detail: `Ticket opened: ${ticket.subject}`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add support ticket:", error);
        }
    };

    const updateSupportTicket = async (ticketOrId, status = null) => {
        try {
            let id, payload;
            if (typeof ticketOrId === 'object') {
                id = ticketOrId.db_id || ticketOrId.id;
                // Strip prefix if needed
                if (typeof id === 'string' && id.includes('-')) id = id.split('-')[1];
                
                payload = {
                    status: (ticketOrId.status || 'open').toLowerCase().replace(' ', '_'),
                    messages: ticketOrId.messages
                };
            } else {
                id = ticketOrId;
                if (typeof id === 'string' && id.includes('-')) id = id.split('-')[1];
                payload = { status: status.toLowerCase().replace(' ', '_') };
            }

            await api.patch(`/support/tickets/${id}/status`, payload);
            await fetchTickets();
            addLog({ action: 'Ticket Update', detail: `Synchronized support ticket ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update ticket:", error);
        }
    };

    const addGuestRequest = async (request) => {
        try {
            const formattedTime = formatDateTime(request.date, request.time);
            const userRole = (currentUser?.role || '').toLowerCase().replace(/\s+/g, '_');
            const isClientRole = ['client', 'customer', 'admin', 'saas_client'].includes(userRole);
            const res = await api.post('/support/guest-requests', {
                client_id: request.clientId || (isClientRole ? (currentUser.clientId || currentUser.company_id) : (clients.find(c => c.name === request.client)?.id || null)),
                guest: request.guest,
                requested_by: request.requestedBy,
                request_details: request.request || request.details,
                delivery_time: formattedTime,
                priority: request.priority || 'medium',
                status: 'pending'
            });
            if (res.data?.success) {
                await fetchTickets(); // Re-fetch all tickets to include new one with mapped fields
                addLog({ action: 'Concierge Request', detail: `New guest requirement logged for ${request.guest}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add guest request:", error);
        }
    };

    const updateGuestRequest = async (data) => {
        try {
            const { id, ...updateData } = data;
            const formattedTime = formatDateTime(updateData.date, updateData.time);
            const reqData = {
                guest: updateData.guest,
                requested_by: updateData.requestedBy,
                request_details: updateData.request || updateData.request_details || null,
                delivery_time: formattedTime,
                priority: updateData.priority || 'medium',
                status: updateData.status || 'pending'
            };
            await api.put(`/support/guest-requests/${id}`, reqData);
            await fetchTickets(); // Sync state
            addLog({ action: 'Concierge Update', detail: `Request ${id} parameters updated.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update guest request:", error);
        }
    };

    const deleteGuestRequest = async (id) => {
        try {
            await api.delete(`/support/guest-requests/${id}`);
            setGuestRequests(prev => prev.filter(r => r.id !== id));
            addLog({ action: 'Concierge Request Cancelled', detail: `Removed guest requirement reference ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete guest request:", error);
        }
    };

    const recordWorkSession = (session) => {
        // session = { userId, userName, start, end, durationHours }
        const entry = {
            id: `SESS-${Date.now()}`,
            userId: session.userId,
            userName: session.userName,
            period: `${new Date(session.start).toLocaleDateString()} ${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}`,
            date: new Date().toISOString().split('T')[0],
            hours: Number(session.durationHours).toFixed(2),
            total: `$${(session.durationHours * 25).toFixed(2)}`, // Base calculated rate $25/hr
            status: 'Logged',
            type: 'Service Record'
        };
        setPayHistory(prev => [entry, ...prev]);
        addLog({
            action: 'Shift Hours Logged',
            detail: `${session.userName} completed ${session.durationHours.toFixed(2)}h shift. Pay added to cycle.`,
            type: 'system'
        });
    };

    const addLeaveRequest = async (requestData) => {
        try {
            const payload = {
                user_id: requestData.userId,
                company_id: currentUser?.company_id,
                leave_type: requestData.type,
                start_date: requestData.start,
                end_date: requestData.end,
                reason: requestData.reason || 'No reason provided'
            };
            const res = await api.post('/staff/leave', payload);
            if (res.data?.success) {
                await fetchLeaveRequests();
                addLog({ action: 'Leave Requested', detail: `Submitted ${requestData.type} request.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add leave request:", error);
        }
    };

    const fetchUrgentTasks = React.useCallback(async () => {
        if (urgentApiUnavailableRef.current) return;
        for (const ep of URGENT_ENDPOINTS) {
            try {
                const res = await api.get(ep);
                if (res.data?.success || Array.isArray(res.data?.data) || Array.isArray(res.data)) {
                    const rows = res.data?.success ? res.data.data : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
                    setUrgentTasks((rows || []).map((t) => ({
                        id: t.id || `URG-${Date.now()}`,
                        task: t.task || t.title || t.name || 'Urgent Mission',
                        time: t.time || t.time_label || t.deadline || 'Immediate',
                        priority: t.priority || 'Critical',
                        location: t.location || t.route || 'N/A',
                        assignee: t.assignee || t.owner || 'Pending'
                    })));
                    return;
                }
            } catch (_) { /* try next endpoint */ }
        }
        urgentApiUnavailableRef.current = true;
    }, []);

    const addUrgentTask = async (task) => {
        const payload = {
            task: task.task || task.title || 'Urgent Mission',
            time: task.time || 'Immediate',
            priority: task.priority || 'Critical',
            location: task.location || '',
            assignee: task.assignee || 'Pending'
        };
        if (!urgentApiUnavailableRef.current) for (const ep of URGENT_ENDPOINTS) {
            try {
                const res = await api.post(ep, payload);
                if (res.data?.success || res.data?.data) {
                    await fetchUrgentTasks();
                    addLog({ action: 'Urgent Task Logged', detail: payload.task, type: 'alert' });
                    return;
                }
            } catch (_) { /* try next endpoint */ }
        }
        urgentApiUnavailableRef.current = true;
        setUrgentTasks(prev => [{ ...payload, id: task.id || `URG-${Date.now()}` }, ...prev]);
        addLog({ action: 'Urgent Task Logged', detail: payload.task, type: 'alert' });
    };

    const updateUrgentTask = async (updated) => {
        const payload = {
            task: updated.task,
            time: updated.time,
            priority: updated.priority,
            location: updated.location,
            assignee: updated.assignee
        };
        if (!urgentApiUnavailableRef.current) for (const ep of URGENT_ENDPOINTS) {
            try {
                await api.put(`${ep}/${encodeURIComponent(updated.id)}`, payload);
                await fetchUrgentTasks();
                return;
            } catch (_) { /* try next endpoint */ }
        }
        urgentApiUnavailableRef.current = true;
        setUrgentTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const deleteUrgentTask = async (id) => {
        if (!urgentApiUnavailableRef.current) for (const ep of URGENT_ENDPOINTS) {
            try {
                await api.delete(`${ep}/${encodeURIComponent(id)}`);
                await fetchUrgentTasks();
                return;
            } catch (_) { /* try next endpoint */ }
        }
        urgentApiUnavailableRef.current = true;
        setUrgentTasks(prev => prev.filter(t => t.id !== id));
    };


    const updateLeaveRequest = async (reqData) => {
        try {
            const statusMap = {
                'Approved': 'approved',
                'Rejected': 'rejected',
                'Pending': 'pending'
            };
            const postData = { ...reqData, status: statusMap[reqData.status] || reqData.status.toLowerCase() };
            const res = await api.put(`/staff/leave/${reqData.id}`, postData);
            if (res.data?.success) {
                await fetchLeaveRequests();
                addLog({ action: 'Leave Updated', detail: `Leave request ${reqData.id} status changed to ${reqData.status}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to update leave request:", error);
        }
    };

    const generateSaaSInvoice = (client) => {
        const invId = `SaaS-${Math.floor(1000 + Math.random() * 9000)}`;
        const newInvoice = {
            id: invId,
            clientId: client.id,
            clientName: client.name,
            totalAmount: client.plan === 'Platinum' ? 4999 : client.plan === 'Executive' ? 2499 : 999,
            paidAmount: 0,
            status: 'Unpaid',
            date: new Date().toISOString().split('T')[0],
            type: 'SaaS Subscription',
            orderId: `WS-${client.id}`
        };
        setInvoices(prev => [newInvoice, ...prev]);
        addLog({ action: 'SaaS Invoice Generated', detail: `Subscription invoice ${invId} issued for ${client.name}.`, type: 'finance' });
        return newInvoice;
    };

    console.log("GlobalData Provider providing:", { fetchSubscriptionRequests, fetchSupportingDocs });
    return (
        <GlobalDataContext.Provider value={{
            // Auth & User
            currentUser, setCurrentUser, hasPermission, menuPermissions, setMenuPermissions, hasMenuPermission, roles: ['super_admin', 'operations', 'procurement', 'inventory', 'logistics', 'finance', 'sales', 'support'],

            // Notifications
            notifications, unreadCount, fetchNotifications, markNotificationRead, markAllNotificationsRead,

            // Clients
            clients, setClients, fetchClients, addClient, updateClient, deleteClient, updateClientBranding,

            // Staff & Assignments
            users, setUsers, fetchStaff, addUser, updateUser, deleteUser, toggleAvailability, reviewStaff,
            customerUsers, fetchCustomerUsers,
            staffAssignments, addStaffAssignment, updateAssignment, fetchSupportingDocs,
            clockIn, clockOut,
            payHistory, setPayHistory, fetchPayHistory, recordWorkSession, getVacationBalance, workStatusOptions: ['Probation', 'Full Time', 'Part Time', 'Inactive'],
            leaveRequests, addLeaveRequest, updateLeaveRequest, teams, setTeams,

            // Inventory
            inventory, setInventory, fetchInventory, addInventory, updateInventory, deleteInventory, issueInventory, recordLoss, fetchInventoryAlerts, inventoryAlerts, acknowledgeInventoryAlert,
            luxuryItems, setLuxuryItems, fetchLuxuryItems, addLuxuryItem, updateLuxuryItem, deleteLuxuryItem,
            stockMovements, addStockEntry, issueStock,

            // Procurement
            vendors, setVendors, fetchVendors, addVendor, updateVendor, deleteVendor,
            purchaseRequests, setPurchaseRequests, addPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest, fetchPurchaseRequests,
            quotes, setQuotes, addQuote, updateQuote, deleteQuote, fetchProcurement, fetchQuotes,
            purchaseOrders, setPurchaseOrders, addPurchaseOrder, updatePurchaseOrder, receiveGoodsAgainstPO, reverseGoodsReceipt, fetchPurchaseOrders,
            cart, addToCart, removeFromCart, clearCart,

            // Orders, Missions & Projects
            orders, setOrders, fetchOrders, addOrder, updateOrder, deleteOrder, launchMissionFromOrder, assignOrderToStage,
            missions, setMissions, fetchMissions, updateMissionStatus, assignMissionDriver, deleteMission,
            projects, setProjects, fetchProjects, addProject, updateProject, deleteProject, convertOrderToProject, convertProjectToMission,

            // Logistics & Fleet
            fleet, setFleet, fetchFleet, addFleet, updateFleet, deleteFleet, dispatchVehicle,
            deliveries, setDeliveries, fetchDeliveries, addDelivery, updateDelivery, deleteDelivery, confirmDeliveryReceipt,
            routes, setRoutes, fetchRoutes, addRoute, updateRoute, deleteRoute,
            urgentTasks, fetchUrgentTasks, addUrgentTask, updateUrgentTask, deleteUrgentTask,
            deliveryPricing, updateDeliveryPricing: updateDeliveryPricingTier, tracking, fetchTracking, addTracking, updateTracking, deleteTracking,
            warehouses, setWarehouses, fetchWarehouses, addWarehouse, updateWarehouse, deleteWarehouse,

            // Concierge & Support
            guestRequests, setGuestRequests, fetchTickets, addGuestRequest, updateGuestRequest, deleteGuestRequest,
            events, setEvents, addEvent, updateEvent, deleteEvent,
            chauffeurRequests, setChauffeurRequests, fetchChauffeurRequests, addChauffeurRequest, updateChauffeurRequest, deleteChauffeurRequest,
            supportTickets, addSupportTicket, updateSupportTicket,

            // Finance
            invoices, setInvoices, fetchFinance, addInvoice, updateInvoice, deleteInvoice, generateSaaSInvoice, settleInvoice, generateInvoiceFromOrder,
            payments, setPayments, getRevenueChartData, revenueFilter, setRevenueFilter,

            // Admin & Plans
            accessPlans, setAccessPlans, fetchAccessPlans, addPlan, updatePlan, deletePlan, activePlan, setActivePlan,
            saasRequests, submitSaaSRequest, processSaaSRequest,
            subscriptionRequests, fetchSubscriptionRequests, dispatchSubscriptionRequest, updateSubscriptionRequest, deleteSubscriptionRequest,

            // Audits & Logs
            audits, fetchAudits, addAudit, updateAudit, deleteAudit,
            logs, addLog,

            // Dashboard & Settings
            dashboardStats, fetchDashboardStats, systemSettings, fetchSystemSettings,

            // Utility
            refreshData: fetchInitialData, fetchInitialData
        }}>
            {children}
        </GlobalDataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(GlobalDataContext);
    if (!context) throw new Error('useData must be used within GlobalDataProvider');
    return context;
};
