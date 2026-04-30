import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart,
  Truck, Calendar, BarChart3, UserCog, Settings, X, Menu,
  Box, LogOut, Briefcase, Navigation, Activity, AlertCircle,
  ShieldCheck, ClipboardList, Gift, Heart, Headphones,
  ShoppingBag, Map, History, FileText, Smartphone, CreditCard,
  Globe, Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = {
  superadmin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clients', path: '/dashboard/clients' },
    { icon: UserCog, label: 'HQ Personnel', path: '/dashboard/users' },
    { icon: Globe, label: 'Plans', path: '/dashboard/plans' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  operations: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Projects', path: '/dashboard/projects' },
    { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
    { icon: Navigation, label: 'Missions', path: '/dashboard/missions' },
    { icon: Truck, label: 'Deliveries', path: '/dashboard/deliveries' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: Smartphone, label: 'Staff Terminal', path: '/dashboard/staff-terminal' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard?tab=leave' },
    { icon: History, label: 'Pay & Records', path: '/dashboard?tab=pay' },
  ],
  procurement: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Purchase Requests', path: '/dashboard/purchase-requests' },
    { icon: Store, label: 'Vendors', path: '/dashboard/vendors' },
    { icon: Box, label: 'Quotes', path: '/dashboard/quotes' },
    { icon: FileText, label: 'Purchase Orders', path: '/dashboard/purchase-orders' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: BarChart3, label: 'Audit Log', path: '/dashboard/audits' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard/leave' },
    { icon: History, label: 'Pay & Records', path: '/dashboard/payroll' },
  ],
  logistics: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Navigation, label: 'Active Missions', path: '/dashboard/missions' },
    { icon: Truck, label: 'Deliveries', path: '/dashboard/deliveries' },
    { icon: Truck, label: 'Fleet', path: '/dashboard/fleet' },
    { icon: Navigation, label: 'Routes', path: '/dashboard/logistics-routes' },
    { icon: Activity, label: 'Tracking', path: '/dashboard/logistics-tracking' },
    { icon: AlertCircle, label: 'Urgent', path: '/dashboard/logistics-urgent' },
    { icon: Smartphone, label: 'Staff Terminal', path: '/dashboard/staff-terminal' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard?tab=leave' },
    { icon: History, label: 'Pay & Records', path: '/dashboard?tab=pay' },
  ],
  inventory: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'StockHub', path: '/dashboard/inventory' },
    { icon: Store, label: 'Warehouse', path: '/dashboard/warehouses' },
    { icon: AlertCircle, label: 'Alerts', path: '/dashboard/inventory-alerts' },
    { icon: BarChart3, label: 'Audit Protocol', path: '/dashboard/audits' },
    { icon: Smartphone, label: 'Staff Terminal', path: '/dashboard/staff-terminal' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard?tab=leave' },
    { icon: History, label: 'Pay & Records', path: '/dashboard?tab=pay' },
  ],
  concierge: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/dashboard/events' },
    { icon: Heart, label: 'Guest Requests', path: '/dashboard/guest-requests' },
    { icon: Gift, label: 'Luxury Items', path: '/dashboard/luxury-items' },
    { icon: Package, label: 'Storage Hub', path: '/dashboard/inventory' },
    { icon: ShieldCheck, label: 'Access Plans', path: '/dashboard/vip-access' },
    { icon: Car, label: 'Chauffeur Protocol', path: '/dashboard/chauffeur' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard?tab=leave' },
    { icon: History, label: 'Pay & Records', path: '/dashboard?tab=pay' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/dashboard/store' },
    { icon: FileText, label: 'Custom Requisition', path: '/dashboard/purchase-requests' },
    { icon: Box, label: 'My Orders', path: '/dashboard/client-orders' },
    { icon: Car, label: 'Chauffeur Protocol', path: '/dashboard/chauffeur' },
    { icon: Calendar, label: 'Concierge Events', path: '/dashboard/client-events' },
    { icon: Truck, label: 'Track Delivery', path: '/dashboard/track-delivery' },
    { icon: Package, label: 'Inventory Hub', path: '/dashboard/inventory' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  client: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Customers', path: '/dashboard/clients' },
    { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
    { icon: Briefcase, label: 'Projects', path: '/dashboard/projects' },
    { icon: Navigation, label: 'Missions', path: '/dashboard/missions' },
    { icon: Truck, label: 'Deliveries', path: '/dashboard/deliveries' },
    { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
    { icon: UserCog, label: 'Staff Management', path: '/dashboard/users' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: CreditCard, label: 'Payroll', path: '/dashboard/payroll' },
    { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
    { icon: Headphones, label: 'Support', path: '/dashboard/support-tickets' },
    { icon: Car, label: 'Chauffeur', path: '/dashboard/chauffeur' },
    { icon: Calendar, label: 'Events', path: '/dashboard/events' },
    { icon: Heart, label: 'Guest Requests', path: '/dashboard/guest-requests' },
    { icon: Gift, label: 'Luxury Items', path: '/dashboard/luxury-items' },
    { icon: Store, label: 'Vendors', path: '/dashboard/vendors' },
    { icon: ShoppingCart, label: 'Purchase Requests', path: '/dashboard/purchase-requests' },
    { icon: Box, label: 'Quotes', path: '/dashboard/quotes' },
    { icon: FileText, label: 'Purchase Orders', path: '/dashboard/purchase-orders' },
    { icon: Truck, label: 'Fleet', path: '/dashboard/fleet' },
    { icon: Store, label: 'Warehouses', path: '/dashboard/warehouses' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    { icon: ShieldCheck, label: 'Security Protocol', path: '/dashboard/roles-permissions' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard/leave' },
  ],
  saas_client: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Customers', path: '/dashboard/clients' },
    { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
    { icon: Briefcase, label: 'Projects', path: '/dashboard/projects' },
    { icon: Navigation, label: 'Missions', path: '/dashboard/missions' },
    { icon: Truck, label: 'Deliveries', path: '/dashboard/deliveries' },
    { icon: Package, label: 'Inventory', path: '/dashboard/inventory' },
    { icon: UserCog, label: 'Staff Management', path: '/dashboard/users' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: CreditCard, label: 'Payroll', path: '/dashboard/payroll' },
    { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
    { icon: Headphones, label: 'Support', path: '/dashboard/support-tickets' },
    { icon: Car, label: 'Chauffeur', path: '/dashboard/chauffeur' },
    { icon: Calendar, label: 'Events', path: '/dashboard/events' },
    { icon: Heart, label: 'Guest Requests', path: '/dashboard/guest-requests' },
    { icon: Gift, label: 'Luxury Items', path: '/dashboard/luxury-items' },
    { icon: Store, label: 'Vendors', path: '/dashboard/vendors' },
    { icon: ShoppingCart, label: 'Purchase Requests', path: '/dashboard/purchase-requests' },
    { icon: Box, label: 'Quotes', path: '/dashboard/quotes' },
    { icon: FileText, label: 'Purchase Orders', path: '/dashboard/purchase-orders' },
    { icon: Truck, label: 'Fleet', path: '/dashboard/fleet' },
    { icon: Store, label: 'Warehouses', path: '/dashboard/warehouses' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    { icon: ShieldCheck, label: 'Security Protocol', path: '/dashboard/roles-permissions' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard/leave' },
  ],
  customer: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/dashboard/store' },
    { icon: ShoppingCart, label: 'My Orders', path: '/dashboard/client-orders' },
    { icon: Truck, label: 'Track Delivery', path: '/dashboard/track-delivery' },
    { icon: Headphones, label: 'Support', path: '/dashboard/support' },
  ],
  staff: [
    { icon: LayoutDashboard, label: 'Staff Terminal', path: '/dashboard' },
    { icon: Smartphone, label: 'My Assignments', path: '/dashboard?tab=assignments' },
    { icon: Map, label: 'Field Map', path: '/dashboard?tab=map' },
    { icon: Calendar, label: 'Leave & Absence', path: '/dashboard?tab=leave' },
    { icon: History, label: 'Pay & Records', path: '/dashboard?tab=pay' },
  ]
};

import { useData } from '../context/GlobalDataContext';
import { normalizeRole } from '../utils/authUtils';

const ROLE_DISPLAY = {
  superadmin: 'Super Admin',
  admin: 'Manager',
  operations: 'Operations',
  procurement: 'Procurement',
  logistics: 'Logistics',
  inventory: 'Inventory',
  concierge: 'Concierge',
  client: 'Business Client',
  saas_client: 'SaaS Admin',
  customer: 'Personal User',
  staff: 'Field Staff',
};

const Sidebar = ({ isOpen, toggleSidebar, role }) => {
  const { currentUser, menuPermissions } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const userRole = normalizeRole(role || 'superadmin');

  const userInitials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'ZN';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');
    localStorage.removeItem('menuPermissions');
    navigate('/login');
  };

  // Dynamic menu: if menuPermissions are loaded from the DB, use them.
  // Otherwise fall back to the static menuItems map.
  const isSuperAdmin = ['superadmin', 'super_admin'].includes(userRole);
  const { clients } = useData();

  // Plan-based access for customer role
  const userPlan = (currentUser?.plan || 'Free').toLowerCase();
  // Personal (customer) users: no Events, no Concierge, no Invoices — pay at checkout only
  const planMenuAccess = {
    free:       ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
    basic:      ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
    standard:   ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
    executive:  ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
    platinum:   ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
    premium:    ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
    enterprise: ['Dashboard', 'Marketplace', 'My Orders', 'Track Delivery', 'Support'],
  };

  const currentMenu = (() => {
    // Company admin & SaaS Admin: poora institutional menu milega (staff wala alag, permissions se)
    if (userRole === 'admin' || userRole === 'saas_client') {
      return menuItems.client || menuItems.superadmin;
    }
    if (menuPermissions && menuPermissions.length > 0 && !isSuperAdmin) {
      const iconMap = {
        'LayoutDashboard': LayoutDashboard, 'Users': Users, 'Shield': ShieldCheck, 'ShieldCheck': ShieldCheck,
        'CloudCog': Globe, 'Globe': Globe, 'Building': Users, 'Briefcase': Briefcase, 'Box': Box,
        'MapPin': Navigation, 'Navigation': Navigation, 'ShoppingCart': ShoppingCart, 'Target': Navigation,
        'Truck': Truck, 'Zap': AlertCircle, 'AlertCircle': AlertCircle, 'FileText': FileText,
        'ShoppingBag': ShoppingBag, 'Package': Package, 'Building2': Store, 'Store': Store,
        'Bell': AlertCircle, 'BellConcierge': Heart, 'Heart': Heart, 'Diamond': Gift, 'Gift': Gift,
        'Ticket': Calendar, 'Calendar': Calendar, 'Car': Car, 'CheckSquare': Smartphone, 'Smartphone': Smartphone,
        'BarChart2': BarChart3, 'BarChart3': BarChart3, 'DollarSign': CreditCard, 'CreditCard': CreditCard, 'Settings': Settings,
        'Headphones': Headphones, 'History': History, 'ClipboardList': ClipboardList, 'Activity': Activity, 'UserCog': UserCog
      };
      let items = menuPermissions
        .filter(p => p.can_view && p.path)
        .map(p => ({
          icon: iconMap[p.icon] || LayoutDashboard,
          label: p.name,
          path: p.path,
          can_add: p.can_add,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        }));
      const hasDashboard = items.some(i => (i.path || '').split('?')[0] === '/dashboard');
      if (userRole === 'client' && !hasDashboard) {
        items = [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }, ...items];
      }
      return items;
    }
    if (userRole === 'client') {
      return [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }];
    }
    // Customer role: filter by plan
    if (userRole === 'customer') {
      const allowed = planMenuAccess[userPlan] || planMenuAccess.free;
      return (menuItems.customer || []).filter(item => allowed.includes(item.label));
    }
    return menuItems[userRole] || menuItems.superadmin;
  })();
  // For SaaS tenant admins and business clients — show their company name as branding
  const tenantCompanyName = currentUser?.company_name || currentUser?.companyName || null;
  const tenantType = currentUser?.tenant_type || null;

  const clientBranding = (userRole === 'client' || userRole === 'admin' || userRole === 'saas_client')
    ? (clients || []).find(c =>
        String(c.id).replace('CLT-', '') === String(currentUser?.clientId).replace('CLT-', '') ||
        String(c.id) === String(currentUser?.company_id) ||
        c.name === currentUser?.name
      )?.branding
    : null;

  // Determine display name and tagline for sidebar header
  const sidebarBrandName = clientBranding?.businessName
    || tenantCompanyName
    || 'ZANEZION';

  const sidebarTagline = clientBranding?.tagline
    || (tenantType === 'saas' ? 'SaaS Platform' : null)
    || (tenantType === 'business' ? 'Business Portal' : null)
    || 'Institutional';

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: (isMobile && !isOpen) ? '-100%' : 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed top-0 left-0 h-[100dvh] w-72 max-[320px]:w-[260px] bg-sidebar border-r border-border z-50 flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 md:p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 md:w-11 md:h-11 bg-white border border-white/10 rounded-xl flex items-center justify-center shadow-2xl overflow-hidden shrink-0 transition-transform group-hover:scale-105 p-1.5">
              <img
                src={clientBranding?.logo || "/logo.png"}
                alt={sidebarBrandName}
                className={`w-full h-full object-contain ${!clientBranding?.logo ? 'scale-[2.2]' : ''} transition-all duration-300`}
              />
            </div>
            <div className="flex flex-col min-w-0 pr-2 overflow-hidden">
              <span className="text-xs md:text-sm font-black tracking-tight text-white group-hover:text-accent transition-colors uppercase leading-tight truncate">
                {sidebarBrandName}
              </span>
              <span className="text-[7px] md:text-[8px] font-bold tracking-[0.1em] text-accent/80 uppercase opacity-70 group-hover:opacity-100 italic truncate">
                {sidebarTagline}
              </span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              className="p-2 ml-auto text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {currentMenu.map((item) => {
            const currentPathWithSearch = location.pathname + location.search;
            const isActive =
              currentPathWithSearch === item.path ||
              (item?.path && item.path !== '/dashboard' && !item.path.includes('?tab=') &&
                (location.pathname === item.path || location.pathname.startsWith(item.path + '/')));

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => isMobile && toggleSidebar()}
                className={`
                    flex items-center gap-4 px-4 py-3.5 md:py-3 rounded-xl transition-all duration-300 group touch-manipulation
                    ${isActive
                    ? 'bg-accent text-black font-bold shadow-[0_8px_20px_-4px_rgba(200,169,106,0.3)]'
                    : 'text-secondary hover:text-white hover:bg-white/5 active:bg-white/10'
                  }
                  `}
              >
                <item.icon size={22} className={`shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-sm md:text-sm tracking-wide">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 md:p-4 pb-6 md:pb-8 border-t border-border mt-auto bg-sidebar/50 backdrop-blur-md shrink-0">
          <div className="bg-white/5 border border-white/[0.08] rounded-2xl p-3 md:p-4 mb-3 md:mb-4">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold shadow-inner text-sm uppercase">
                  {userInitials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-sidebar rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{currentUser?.name || 'Guest'}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted truncate uppercase tracking-widest font-black">{ROLE_DISPLAY[userRole] || userRole}</p>
                  {userRole === 'customer' && currentUser?.plan && (
                    <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[8px] font-black uppercase rounded tracking-wider">{currentUser.plan}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 md:py-3 rounded-xl text-secondary hover:text-danger hover:bg-danger/10 active:bg-danger/20 transition-all duration-300 group touch-manipulation"
          >
            <LogOut size={22} className="group-hover:-translate-x-1 shrink-0 transition-transform" />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
