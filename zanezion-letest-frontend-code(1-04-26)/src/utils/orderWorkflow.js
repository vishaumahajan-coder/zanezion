/** Backend orders.status ENUM + aliases handled by orderController.normalizeOrderStatus */

export function normalizeOrderStatusForApi(input) {
    if (input === undefined || input === null || String(input).trim() === '') return null;
    const raw = String(input).trim().toLowerCase().replace(/\s+/g, '_');
    const aliases = {
        pending: 'admin_review',
        pending_review: 'admin_review',
        processing: 'operation',
        in_progress: 'operation',
        approved: 'operation',
        shipped: 'logistics',
        in_transit: 'logistics',
        dispatch: 'logistics',
        delivered: 'completed',
        fulfilled: 'completed',
        done: 'completed',
        canceled: 'cancelled',
        cancelled: 'cancelled'
    };
    const resolved = aliases[raw] || raw;
    const valid = ['created', 'admin_review', 'operation', 'procurement', 'inventory', 'logistics', 'completed', 'cancelled'];
    return valid.includes(resolved) ? resolved : null;
}

export function coerceOrderStatusToApi(input, fallback = 'admin_review') {
    return normalizeOrderStatusForApi(input) || fallback;
}

export function isoDateSlice(v) {
    if (v == null || v === '') return '';
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
        return v.toISOString().split('T')[0];
    }
    const s = String(v);
    if (s.includes('T')) return s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10))) return s.slice(0, 10);
    try {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch { /* ignore */ }
    return '';
}

export function displayOrderStatus(dbStatus) {
    const key = String(dbStatus || '').toLowerCase();
    const map = {
        created: 'Submitted',
        admin_review: 'Pending Review',
        operation: 'In Operations',
        procurement: 'Procurement',
        inventory: 'Inventory',
        logistics: 'Out for Delivery',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };
    return map[key] || (dbStatus ? String(dbStatus).replace(/_/g, ' ') : 'Unknown');
}

export const ORDER_STATUS_OPTIONS = [
    { value: 'created', label: 'Created / Draft' },
    { value: 'admin_review', label: 'Admin review' },
    { value: 'operation', label: 'Operations' },
    { value: 'procurement', label: 'Procurement' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'logistics', label: 'Logistics / Dispatch' },
    { value: 'completed', label: 'Completed / Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];
