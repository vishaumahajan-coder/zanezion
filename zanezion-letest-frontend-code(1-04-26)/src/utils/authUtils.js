/**
 * Normalizes a role string to a canonical shorthand key used by the application.
 * Maps backend roles to frontend route/sidebar keys.
 * @param {string} role - The raw role string from the database or UI.
 * @returns {string} - The normalized canonical role key.
 */
export const normalizeRole = (role) => {
    if (!role) return 'staff'; // Default fallback

    const r = role.toLowerCase().trim();

    if (r.includes('superadmin') || r.includes('super admin') || r.includes('super_admin')) return 'superadmin';
    // Company admin (DB role `admin`) must stay `admin` — mapping to `client` broke invoices and permission UI
    if (r === 'admin') return 'admin';
    if (r === 'manager') return 'operations';         // Backend 'manager' maps to operations
    if (r === 'operation') return 'operations';       // Backend 'operation' → frontend 'operations'
    if (r.includes('procurement')) return 'procurement';
    if (r.includes('operations')) return 'operations';
    if (r.includes('logistics')) return 'logistics';
    if (r.includes('inventory') || r.includes('stock')) return 'inventory';
    if (r.includes('concierge')) return 'concierge';
    if (r.includes('saas_client') || r.includes('saas client') || r.includes('saas')) return 'saas_client';
    if (r === 'customer') return 'customer';            // Backend 'customer' → frontend 'customer'
    if (r.includes('client')) return 'client';
    if (r.includes('vendor')) return 'vendor';
    if (r.includes('staff')) return 'staff';

    return 'staff'; // Final fallback for unknown roles
};
