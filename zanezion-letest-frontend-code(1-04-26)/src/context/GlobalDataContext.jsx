import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { VENDOR_PERFORMANCE, INVENTORY_ALERTS, RECENT_ORDERS, CLIENTS, ACCESS_PLANS, USERS, ORDERS, INVOICES, VENDORS, INVENTORY } from '../utils/data';

const GlobalDataContext = createContext();

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

    // Helper: check if user has a specific action on a menu
    const hasMenuPermission = (menuName, action = 'can_view') => {
        const role = currentUser?.role?.toLowerCase().replace(/\s+/g, '_');
        // Super admin and admin always have full access
        if (role === 'super_admin' || role === 'superadmin' || role === 'admin') return true;
        // If no permissions loaded, deny by default (secure fallback)
        if (!menuPermissions || menuPermissions.length === 0) return false;
        const key = String(menuName || '').trim().toLowerCase();
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
            const data = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setClients(data.map(c => ({
                ...c,
                companyName: c.business_name || c.name,
                location: c.address || c.location || '',
            })));
        } catch (e) {
            console.error("Fetch clients failed", e);
            setClients(CLIENTS);
        }
    }, []);

    const fetchVendors = React.useCallback(async () => {
        try {
            const res = await api.get('/vendors');
            const data = res.data?.success ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setVendors(data.map(v => ({
                ...v,
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
                setUsers(res.data.data);
            }
        } catch (e) {
            console.error("Fetch staff failed", e);
            setUsers([]);
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
                    const items = d.package_details ? JSON.parse(d.package_details) : [];
                    return {
                        id: `DEL-${String(d.id).padStart(3, '0')}`,
                        db_id: d.id,
                        orderId: d.order_id,
                        mission_type: d.mission_type,
                        item: items.length > 0 ? items[0].name : (d.mission_type === 'Chauffeur' ? 'VIP Chauffeur Service' : `Order #${d.order_id}`),
                        items: items,
                        status: d.status,
                        driver: d.driver_name,
                        vehicleId: d.plate_number,
                        location: d.route || 'In Transit',
                        mode: 'Road',
                        deliveryDate: d.delivery_date,
                        eta: 'Calculating...'
                    };
                }));
            }
        } catch (e) { console.error("Fetch deliveries failed", e); }
    }, []);

    const fetchProcurement = React.useCallback(async () => {
        try {
            const [reqs, quotes, pos] = await Promise.all([
                api.get('/procurement/requests').catch(e => ({ data: [] })),
                api.get('/procurement/quotes').catch(e => ({ data: [] })),
                api.get('/procurement/po').catch(e => ({ data: [] }))
            ]);
            if (reqs.data?.success) setPurchaseRequests(reqs.data.data);
            if (quotes.data?.success) setQuotes(quotes.data.data);
            if (pos.data?.success) setPurchaseOrders(pos.data.data);
        } catch (e) { console.error("Fetch procurement failed", e); }
    }, []);

    const fetchQuotes = React.useCallback(async (params = {}) => {
        try {
            const res = await api.get('/procurement/quotes', { params });
            if (res.data?.success) setQuotes(res.data.data);
        } catch (e) { console.error("Fetch quotes failed", e); }
    }, []);

    const fetchPurchaseRequests = React.useCallback(async (params = {}) => {
        try {
            const res = await api.get('/procurement/requests', { params });
            if (res.data?.success) setPurchaseRequests(res.data.data);
        } catch (e) { console.error("Fetch purchase requests failed", e); }
    }, []);

    const fetchPurchaseOrders = React.useCallback(async (params = {}) => {
        try {
            const res = await api.get('/procurement/po', { params });
            if (res.data?.success) setPurchaseOrders(res.data.data);
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
                return {
                    ...o,
                    items: Array.isArray(parsedItems) ? parsedItems : [],
                    clientId: o.customer_id || o.client_id,
                    companyId: o.company_id,
                    vendorId: o.vendor_id,
                    client: o.customer_name || o.client_name || '',
                    vendor: o.vendor_name || '',
                    total: parseFloat(o.total_amount || 0),
                    date: o.order_date ? o.order_date.split('T')[0] : '',
                    dueDate: o.due_date ? o.due_date.split('T')[0] : ''
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
                api.get('/staff/assignments').catch(e => ({ data: [] })),
                api.get('/staff/leave').catch(e => ({ data: [] }))
            ]);
            if (assignments.data?.success) setStaffAssignments(assignments.data.data);
            if (leave.data?.success) setLeaveRequests(leave.data.data);
        } catch (e) { console.error("Fetch supporting docs failed", e); }
    }, []);

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
            if (tickets.data?.success) setSupportTickets(tickets.data.data);
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
            if (luxuryData.length > 0) {
                setLuxuryItems(luxuryData.map(item => ({
                    id: item.id,
                    item: item.item_name,
                    owner: item.owner_name,
                    vault: item.vault_location,
                    status: item.status,
                    value: item.estimated_value,
                    notes: item.notes
                })));
            }
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

    const fetchInventoryAlerts = React.useCallback(async () => {
        try {
            const res = await api.get('/inventory/alerts');
            if (res.data?.success) {
                setInventoryAlerts(res.data.data.map(i => ({
                    id: i.id,
                    name: i.name,
                    qty: i.quantity,
                    threshold: i.threshold,
                    status: i.status === 'low_stock' ? 'Warning' : (i.status === 'out_of_stock' ? 'Critical' : i.status),
                    location: i.warehouse_name || 'General Storage'
                })));
            }
        } catch (e) { console.error("Fetch inventory alerts failed", e); }
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
            await Promise.all([
                fetchStaff(),
                fetchDashboardStats(),
                fetchSystemSettings(),
                fetchInventoryAlerts()
            ]);
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
            const res = await api.put(`/users/${updated.id}`, updated);
            if (res.data?.success) {
                await fetchStaff();
                addLog({ action: 'Staff Profile Modified', detail: `Updated record for ${updated.name}.`, type: 'system' });
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
            await api.put(`/auth/staff-review/${id}`, { status });

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
            if (typeof data === 'string' || (data && Object.keys(data).length === 1 && data.status)) {
                // It's a status-only update (passed as string or status-only object)
                const statusValue = typeof data === 'string' ? data : data.status;
                await api.patch(`/orders/${orderId}/status`, { status: statusValue });
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: statusValue } : o));
                addLog({ action: 'Order Updated', detail: `Order ${orderId} status changed to ${statusValue}.`, type: 'system' });
            } else {
                // It's a full update
                // Map common camelCase fields to snake_case for the legacy PUT endpoint
                const mappedData = {
                    ...data,
                    client_id: data.clientId,
                    company_id: data.companyId,
                    vendor_id: data.vendorId,
                    total_amount: data.total,
                    due_date: data.dueDate,
                    order_date: data.date || data.requestDate
                };
                await api.put(`/orders/${orderId}`, mappedData);
                await fetchOrders();
                addLog({ action: 'Order Updated', detail: `Order ${orderId} parameters recalibrated.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to update order:", error);
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

    const addOrder = async (order) => {
        if (!order.items || order.items.length === 0) {
            alert("Order Error: No items in manifest.");
            return;
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
            const res = await api.post('/orders', {
                customer_id: isCustomer ? null : targetClientId,
                company_id: (currentUser && userRole !== 'super_admin') ? (currentUser.company_id || currentUser.companyId) : targetClientId,
                vendor_id: order.vendorId || null,
                type: order.type || 'Custom Order',
                items: order.items,
                notes: order.notes,
                location: order.location || null,
                due_date: order.dueDate || null,
                status: order.status || 'pending_review'
            });

            // Re-fetch to ensure sync and correct mapping
            await fetchOrders();

            alert("Institutional Protocol Initialized: Order has been successfully logged and queued for audit.");

            addLog({
                action: 'Order Received',
                detail: `${res.data.id} submitted by client. Awaiting Admin Review & Project Conversion.`,
                type: 'system'
            });
        } catch (error) {
            console.error("Failed to submit order:", error);
        }
    };

    const generateInvoiceFromOrder = async (order) => {
        try {
            const total = (order.items || []).reduce((acc, item) => acc + (parseFloat(item.price || item.unit_price || 0) * parseInt(item.qty || item.quantity || 0)), 0);

            const reqData = {
                order_id: order.id,
                client_id: order.clientId || order.client_id, // ensure fallback in case data structure varies
                amount: total,
                due_date: order.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'unpaid'
            };

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
            const reqData = {
                order_id: invoice.orderId,
                client_id: invoice.clientId,
                amount: invoice.totalAmount,
                due_date: invoice.dueDate
            };
            await api.post('/finance/invoices', reqData);

            await fetchFinance();
            addLog({ action: 'Invoice Generated', detail: `Institutional ledger entry for Order ${invoice.orderId} successfully logged.`, type: 'system' });
        } catch (error) {
            console.error("Failed to add invoice:", error);
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

    const updateDelivery = async (updated) => {
        try {
            await api.patch(`/logistics/deliveries/${updated.db_id || updated.id}/status`, {
                status: updated.status.toLowerCase().replace(' ', '_'),
                vehicle_id: updated.vehicle_db_id
            });

            // Re-fetch to sync
            await fetchDeliveries();
            if (updated.status === 'Delivered' || updated.status === 'Completed') {
                await fetchOrders();
                if (updated.orderId) {
                    const matchingOrder = orders.find(o => String(o.id) === String(updated.orderId));
                    if (matchingOrder) {
                        await generateInvoiceFromOrder(matchingOrder);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update delivery:", error);
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
            const reqData = {
                ...vendor,
                contact_name: vendor.contact || vendor.contact_name || null,
            };
            const res = await api.post('/vendors', reqData);

            // Re-fetch to ensure correct mapping and sync
            await fetchVendors();

            addLog({ action: 'Vendor Onboarding', detail: `Registered ${vendor.name} as verified partner.`, type: 'system' });
        } catch (error) {
            console.error("Failed to add vendor:", error);
        }
    };

    const updateVendor = async (updated) => {
        try {
            const reqData = {
                ...updated,
                contact_name: updated.contact,
                phone: updated.phone
            };
            await api.put(`/vendors/${updated.id}`, reqData);

            // Re-fetch to ensure sync
            await fetchVendors();

            addLog({ action: 'Vendor Update', detail: `Recalibrated profile for ${updated.name}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update vendor:", error);
        }
    };

    const deleteVendor = async (id) => {
        try {
            await api.delete(`/vendors/${id}`);
            setVendors(prev => prev.filter(v => v.id !== id));
            addLog({ action: 'Vendor Removal', detail: `Decommissioned vendor reference ID ${id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to delete vendor:", error);
        }
    };


    const addInventory = async (item) => {
        try {
            const reqData = {
                name: item.name,
                category: item.category,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.qty) || 0, // Frontend uses qty
                warehouse_id: item.warehouse_id || item.location ? 1 : null, // Simplification for now
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
                warehouse_id: updated.warehouse_id || null,
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

    const clockIn = async (location) => {
        try {
            const res = await api.post('/staff/clock-in', { location });
            if (res.data?.success) {
                if (currentUser?.id) toggleAvailability(currentUser.id, true);
                return res.data.shiftId;
            }
        } catch (error) {
            console.error("Clock in failed:", error);
        }
    };

    const clockOut = async () => {
        try {
            const res = await api.post('/staff/clock-out');
            if (res.data?.success) {
                if (currentUser?.id) toggleAvailability(currentUser.id, false);
                await fetchPayHistory(); // Sync updated pay/shifts
                return res.data;
            }
        } catch (error) {
            console.error("Clock out failed:", error);
        }
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
            const res = await api.post('/procurement/quotes', quote);
            if (res.data?.success) {
                setQuotes(prev => [res.data.data, ...prev]);
                addLog({ action: 'Quote Manifest', detail: `Received procurement offer from Vendor ${quote.vendorId}.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add quote:", error);
        }
    };

    const updateQuote = async (updated) => {
        try {
            await api.put(`/procurement/quotes/${updated.id}`, updated);
            setQuotes(prev => prev.map(q => q.id === updated.id ? updated : q));
            addLog({ action: 'Quote Revision', detail: `Updated terms for ${updated.id}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to update quote:", error);
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
            const res = await api.post('/procurement/requests', req);
            if (res.data?.success) {
                setPurchaseRequests(prev => [res.data.data, ...prev]);
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
                vendorId: po.vendorId,
                notes: po.notes || '',
                total_amount: po.total || po.total_amount,
                status: 'Pending',
                items: po.items.map(item => ({
                    name: item.name,
                    category: item.category,
                    quantity: item.orderedQty,
                    unit_price: item.price
                }))
            };
            const res = await api.post('/procurement/po', reqData);
            if (res.data?.success) {
                setPurchaseOrders(prev => [res.data.data, ...prev]);
                addLog({ action: 'PO Issued', detail: `Purchase Order ${res.data.data.id} sent to ${po.vendorName}.`, type: 'procurement' });
            }
        } catch (error) {
            console.error("Failed to add PO:", error);
        }
    };

    const updatePurchaseOrder = async (updated) => {
        try {
            await api.put(`/procurement/po/${updated.id}`, updated);
            setPurchaseOrders(prev => prev.map(po => po.id === updated.id ? updated : po));
            addLog({ action: 'PO Revised', detail: `Purchase Order ${updated.id} parameters adjusted for ${updated.vendorName}.`, type: 'procurement' });
        } catch (error) {
            console.error("Failed to update PO:", error);
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
                if (poRes.data?.success) setPurchaseOrders(poRes.data.data);

                addLog({ action: 'Goods Receiving', detail: `Shipment received against PO ${poId}.`, type: 'inventory' });
            }
        } catch (error) {
            console.error("Failed to receive goods:", error);
        }
    };

    const addWarehouse = async (wh) => {
        try {
            // Ensure company_id is provided for SaaS clients
            const warehouseData = {
                ...wh,
                company_id: currentUser?.company_id || wh.company_id,
                manager_id: wh.manager_id || null // Ensure no undefined reach the backend
            };
            const res = await api.post('/warehouses', warehouseData);
            if (res.data?.success) {
                setWarehouses(prev => [res.data.data, ...prev]);
                addLog({ action: 'Facility Added', detail: `Commissioned ${wh.name} into the network.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add warehouse:", error);
        }
    };

    const updateWarehouse = async (updated) => {
        try {
            await api.put(`/warehouses/${updated.id}`, updated);
            setWarehouses(prev => prev.map(w => w.id === updated.id ? updated : w));
            addLog({ action: 'Facility Updated', detail: `Modified configurations for ${updated.name}.`, type: 'system' });
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

    const fetchPayHistory = React.useCallback(async () => {
        try {
            const res = await api.get('/finance/my-payroll');
            if (res.data?.success) {
                const mapped = res.data.data.map(p => ({
                    id: p.id,
                    period: new Date(p.payment_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    date: p.payment_date?.split('T')[0],
                    hours: "Variable",
                    total: `$${parseFloat(p.net_amount || 0).toLocaleString()}`,
                    status: p.status,
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

            await api.patch(`/logistics/deliveries/${data.delivery_db_id}/status`, {
                status: 'en_route',
                vehicle_id: data.db_id // Ensure it's assigned if not already
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
                setDeliveries(dRes.data.data.map(d => ({
                    id: `DEL-${String(d.id).padStart(3, '0')}`,
                    db_id: d.id,
                    orderId: d.order_id,
                    status: d.status,
                    driver: d.driver_name,
                    vehicleId: d.plate_number,
                    location: d.route || 'In Transit',
                    items: d.package_details ? JSON.parse(d.package_details) : []
                })));
            }

            addLog({ action: 'Fleet Dispatch', detail: `Vehicle ${data.id} launched for ${data.mission}. Pilot: ${data.driver}`, type: 'system' });
        } catch (error) {
            console.error("Failed to dispatch vehicle:", error);
        }
    };

    const addTracking = (t) => {
        setTracking(prev => [{ ...t, id: `TRK-${Math.floor(500 + Math.random() * 99)}` }, ...prev]);
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
    const updateTracking = (updated) => {
        setTracking(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const deleteTracking = (id) => {
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
                addLog({ action: 'Event Registry', detail: `New event request: ${event.title}`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add event:", error);
        }
    };

    const updateEvent = async (updated) => {
        try {
            const reqData = {
                name: updated.title,
                event_date: updated.date,
                location: updated.location,
                client_id: updated.client_id || clients.find(c => c.name === updated.client)?.id,
                status: updated.status
            };
            await api.put(`/support/events/${updated.id}`, reqData);
            setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
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

    const toggleAvailability = async (userId) => {
        try {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const newStatus = !user.isAvailable;
            await api.put(`/staff/${userId}`, { is_available: newStatus });

            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAvailable: newStatus } : u));
            if (currentUser?.id === userId) {
                setCurrentUser(prev => ({ ...prev, isAvailable: newStatus }));
            }
            addLog({ action: 'Status Update', detail: `${user.name} availability toggled to ${newStatus ? 'Active' : 'Offline'}.`, type: 'system' });
        } catch (error) {
            console.error("Failed to toggle availability:", error);
        }
    };



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
            const res = await api.post('/support/tickets', ticket);
            if (res.data?.success) {
                setSupportTickets(prev => [res.data.data, ...prev]);
                addLog({ action: 'Ticket Creation', detail: `Ticket opened: ${ticket.subject}`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add support ticket:", error);
        }
    };

    const updateSupportTicket = async (id, status) => {
        try {
            await api.patch(`/support/tickets/${id}/status`, { status });
            setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            addLog({ action: 'Ticket Resolution', detail: `Updated ticket ${id} to ${status}`, type: 'system' });
        } catch (error) {
            console.error("Failed to update ticket status:", error);
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
            const res = await api.post('/staff/leave', requestData);
            if (res.data?.success) {
                await fetchLeaveRequests();
                addLog({ action: 'Leave Requested', detail: `Submitted leave request.`, type: 'system' });
            }
        } catch (error) {
            console.error("Failed to add leave request:", error);
        }
    };

    const addUrgentTask = (task) => {
        setUrgentTasks(prev => [{ ...task, id: Date.now() }, ...prev]);
        addLog({ action: 'Urgent Task Logged', detail: task.title, type: 'alert' });
    };

    const updateUrgentTask = (updated) => {
        setUrgentTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const deleteUrgentTask = (id) => {
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
            staffAssignments, addStaffAssignment, updateAssignment, fetchSupportingDocs,
            clockIn, clockOut,
            payHistory, setPayHistory, fetchPayHistory, recordWorkSession, getVacationBalance, workStatusOptions: ['Probation', 'Full Time', 'Part Time', 'Inactive'],
            leaveRequests, addLeaveRequest, updateLeaveRequest, teams, setTeams,

            // Inventory
            inventory, setInventory, fetchInventory, addInventory, updateInventory, deleteInventory, issueInventory, recordLoss, fetchInventoryAlerts, inventoryAlerts,
            luxuryItems, setLuxuryItems, fetchLuxuryItems, addLuxuryItem, updateLuxuryItem, deleteLuxuryItem,
            stockMovements, addStockEntry, issueStock, warehouses: [], fetchWarehouses, addWarehouse, updateWarehouse, deleteWarehouse,

            // Procurement
            vendors, setVendors, fetchVendors, addVendor, updateVendor, deleteVendor,
            purchaseRequests, setPurchaseRequests, addPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest, fetchPurchaseRequests,
            quotes, setQuotes, addQuote, updateQuote, deleteQuote, fetchProcurement, fetchQuotes,
            purchaseOrders, setPurchaseOrders, addPurchaseOrder, updatePurchaseOrder, receiveGoodsAgainstPO, fetchPurchaseOrders,
            cart, addToCart, removeFromCart, clearCart,

            // Orders, Missions & Projects
            orders, setOrders, fetchOrders, addOrder, updateOrder, deleteOrder, launchMissionFromOrder, assignOrderToStage,
            missions, setMissions, fetchMissions, updateMissionStatus, assignMissionDriver, deleteMission,
            projects, setProjects, fetchProjects, addProject, updateProject, deleteProject, convertOrderToProject, convertProjectToMission,

            // Logistics & Fleet
            fleet, setFleet, fetchFleet, addFleet, updateFleet, deleteFleet, dispatchVehicle,
            deliveries, setDeliveries, fetchDeliveries, addDelivery, updateDelivery, deleteDelivery, confirmDeliveryReceipt,
            routes, setRoutes, fetchRoutes, addRoute, updateRoute, deleteRoute,
            urgentTasks, addUrgentTask, updateUrgentTask, deleteUrgentTask,
            deliveryPricing, updateDeliveryPricing: updateDeliveryPricingTier, tracking, addTracking, updateTracking, deleteTracking,
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
