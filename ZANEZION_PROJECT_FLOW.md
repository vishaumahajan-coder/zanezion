# ZANEZION - Complete Project Flow & Role Guide
### Updated: 3 April 2026

---

## SYSTEM OVERVIEW

ZaneZion ek **multi-tenant luxury concierge management system** hai. Isme 9 roles hain jo ek order lifecycle ko manage karte hain - client order place karta hai, admin approve karta hai, operations coordinate karta hai, procurement items source karta hai, inventory stock manage karta hai, logistics deliver karta hai, concierge VIP services handle karta hai, staff field work karta hai, aur customer end result receive karta hai.

**Architecture:** React Frontend + Node.js/Express Backend + MySQL Database (Railway hosted)

---

## 9 ROLES & UNKA KAM

| # | Role (DB) | Frontend Name | Login (Demo) | Ek Line Summary |
|---|-----------|---------------|-------------|-----------------|
| 1 | `super_admin` | Super Admin | admin@zanezion.com | Poora platform manage karta hai - companies, plans, global settings |
| 2 | `admin` | Client (Company Owner) | admin@demo.com | Apni company manage karta hai - staff, customers, orders, inventory, payroll |
| 3 | `operation` | Operations | operation@demo.com | Orders ko projects/missions me convert karta hai, staff assign karta hai |
| 4 | `procurement` | Procurement | procurement@demo.com | Purchase requests, vendor quotes, purchase orders manage karta hai |
| 5 | `logistics` | Logistics | logistics@demo.com | Fleet, drivers, routes, deliveries, tracking manage karta hai |
| 6 | `inventory` | Inventory | inventory@demo.com | Stock levels, warehouses, stock entry/issue, alerts manage karta hai |
| 7 | `concierge` | Concierge | concierge@demo.com | VIP events, guest requests, luxury items, chauffeur manage karta hai |
| 8 | `staff` | Staff | staff@demo.com | Assignments execute karta hai, clock in/out, leave apply karta hai |
| 9 | `customer` | Customer | customer@demo.com | Orders dekhta hai, concierge services request karta hai |

**Demo Password:** `admin123`

---

## ROLE-WISE DETAILED BREAKDOWN

---

### 1. SUPER ADMIN (`super_admin`)

**Kya hai:** Platform ka owner. Saari companies (tenants) manage karta hai. Kisi ek company ka nahi hai — poore system ka admin hai.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Global stats — total companies, users, revenue |
| Clients | `/dashboard/clients` | Companies (SaaS + Personal) manage karna |
| Plans | `/dashboard/plans` | SaaS subscription plans create/edit karna |
| Settings | `/dashboard/settings` | Global system settings |

**Kya Add/Manage Karta Hai:**

| Action | Detail |
|--------|--------|
| **Company Add (SaaS)** | Clients page > SaaS tab > Add SaaS Client → Company + admin user auto-create hota hai with credentials |
| **Company Add (Personal)** | Clients page > Personal tab > Add Personal Client → Lightweight client create hota hai |
| **Company Edit/Delete** | Client card pe click → edit details, status change (active/suspended/rejected) |
| **SaaS Plans** | Plans page → Create plans with features, pricing, billing cycle, user/order limits |
| **SaaS Requests** | Landing page se aaye requests approve/reject karna → approve pe auto company + user create |

**Data Scope:** Global — saari companies ka data dekh sakta hai

**Important Notes:**
- Super Admin kisi ek company me nahi hota — wo system-level admin hai
- Super Admin ke events/data kisi client ko nahi dikhte
- Jab Super Admin clients page pe jata hai, `companies` table se data aata hai (not `customers`)

---

### 2. ADMIN / CLIENT — Company Owner (`admin` in DB → `client` in frontend)

**Kya hai:** Ek company ka owner/admin. Apni company ke andar sab manage karta hai — staff hire karta hai, customers add karta hai, orders manage karta hai, inventory control karta hai.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Company stats — orders, revenue, staff count |
| Customers | `/dashboard/clients` | Company ke customers manage karna |
| Orders | `/dashboard/orders` | Saare orders dekhna, approve karna, stages assign karna |
| Projects | `/dashboard/projects` | Projects create/manage karna |
| Missions | `/dashboard/missions` | Delivery/pickup missions manage karna |
| Deliveries | `/dashboard/deliveries` | Delivery status track karna |
| Inventory | `/dashboard/inventory` | Stock dekhna, entry/issue karna |
| Staff Management | `/dashboard/users` | Staff hire karna, roles assign karna |
| Invoices | `/dashboard/invoices` | Company invoices manage karna |
| Payroll | `/dashboard/payroll` | Staff salary manage karna |
| Reports | `/dashboard/reports` | Company reports dekhna |
| Support Dashboard | `/dashboard/support-tickets` | Support tickets manage karna |
| Chauffeur Protocol | `/dashboard/chauffeur` | Chauffeur services manage karna |
| Staff Terminal | `/dashboard/staff-terminal` | Employee portal (leave, pay) |
| Security Protocol | `/dashboard/roles-permissions` | Roles ke liye menu permissions set karna |
| Settings | `/dashboard/settings` | Company settings, branding |

**Kya Add/Manage Karta Hai:**

| Action | Detail |
|--------|--------|
| **Customer Add** | Customers page > Add Customer → Customer + auto login credentials generate hote hain |
| **Staff Add** | Staff Management > Add User → New staff member (operation, procurement, logistics, inventory, concierge, staff roles) |
| **Order Create** | Orders page > New Order → Custom order create with items, customer, notes |
| **Order Approve** | Orders > Click order > Change status → Move order through workflow stages |
| **Inventory Stock Entry** | Inventory > Stock Entry → Add new stock (Marketplace or Client inventory) |
| **Inventory Stock Issue** | Inventory > Stock Issue → Issue stock to customer/project |
| **Project Create** | Projects > New Project → Create project linked to order |
| **Role Permissions** | Security Protocol > Select role > Toggle menus → Decide kaun sa role kya dekh sakta hai sidebar me |
| **Vendor Manage** | Vendors page > Add/Edit/Delete vendors |

**Data Scope:** Company-scoped — sirf apni company ka data

**Important Notes:**
- DB me role `admin` hai, but frontend me `client` key se identify hota hai (via `normalizeRole()`)
- Jab admin Customers page pe jata hai, `customers` table se data aata hai (not `companies`)
- Admin apne staff ke liye permissions set kar sakta hai via Security Protocol
- Admin ka sidebar static + DB permissions dono se work karta hai

---

### 3. OPERATIONS (`operation` → `operations` in frontend)

**Kya hai:** Orders ko execution me convert karta hai. Admin approve kare, operations implement kare.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Operations stats — active orders, missions |
| Projects | `/dashboard/projects` | Orders se projects banana |
| Orders | `/dashboard/orders` | Assigned orders manage karna |
| Missions | `/dashboard/missions` | Delivery/pickup missions create karna |
| Deliveries | `/dashboard/deliveries` | Delivery coordination |
| Invoices | `/dashboard/invoices` | Operations invoices |
| Staff Terminal | `/dashboard/staff-terminal` | Leave & pay |
| Leave & Absence | `/dashboard?tab=leave` | Leave request |
| Pay & Records | `/dashboard?tab=pay` | Payroll records |

**Kya Karta Hai:**

| Action | Detail |
|--------|--------|
| **Order → Project** | Approved order ko project me convert karna — items, timeline, budget |
| **Order → Mission** | Order ko delivery/pickup mission me convert karna |
| **Staff Assign** | Project/mission me staff assign karna |
| **Customer Create** | New customers add kar sakta hai |
| **Stage Management** | Order ko next stage me move karna (operation → procurement/inventory/logistics) |

**Data Scope:** Company-scoped

---

### 4. PROCUREMENT (`procurement`)

**Kya hai:** Jab stock nahi hai toh vendor se purchase karta hai. Purchase lifecycle manage karta hai.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Procurement stats |
| Purchase Requests | `/dashboard/purchase-requests` | PRs approve/create karna |
| Vendors | `/dashboard/vendors` | Vendor manage karna |
| Quotes | `/dashboard/quotes` | Vendor quotes compare karna |
| Purchase Orders | `/dashboard/purchase-orders` | POs create karna |
| Invoices | `/dashboard/invoices` | Procurement invoices |
| Audit Log | `/dashboard/audits` | Procurement audit trail |
| Leave & Absence | `/dashboard?tab=leave` | Leave request |
| Pay & Records | `/dashboard?tab=pay` | Payroll records |

**Procurement Flow:**

```
Low Stock Alert / Manual Need
         |
         v
  PURCHASE REQUEST (PR)     ← Koi bhi create kar sakta hai
         |
         v
  VENDOR QUOTES              ← Procurement multiple vendors se quotes leta hai
         |
         v
  QUOTE COMPARISON           ← Best quote select karta hai
         |
         v
  PURCHASE ORDER (PO)        ← Selected quote se PO create hota hai
         |
         v
  GOODS RECEIVED             ← Inventory team goods receive karti hai, PO mark received
         |
         v
  INVENTORY UPDATED          ← Stock automatically update hota hai
```

**Data Scope:** Company-scoped

---

### 5. INVENTORY (`inventory`)

**Kya hai:** Stock ka guardian. Kya hai, kitna hai, kaha hai — sab track karta hai.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Inventory stats |
| StockHub | `/dashboard/inventory` | All inventory items manage karna |
| Warehouse | `/dashboard/warehouses` | Warehouse locations manage karna |
| Alerts | `/dashboard/inventory-alerts` | Low stock / out of stock alerts |
| Audit Protocol | `/dashboard/audits` | Inventory audit trail |
| Staff Terminal | `/dashboard/staff-terminal` | Leave & pay |
| Leave & Absence | `/dashboard?tab=leave` | Leave request |
| Pay & Records | `/dashboard?tab=pay` | Payroll records |

**Kya Karta Hai:**

| Action | Detail |
|--------|--------|
| **Stock Entry** | New stock add karna — Marketplace (general) ya Client (specific customer ke liye) |
| **Stock Issue** | Stock issue karna — customer/project ke liye |
| **Record Loss** | Damaged/lost stock record karna |
| **Warehouse Manage** | Warehouse create/edit/delete |
| **Goods Receive** | Purchase Order pe goods receive karna → stock auto update |
| **Alerts Monitor** | Low stock items track karna |

**Inventory Types:**
| Type | Kya Hai |
|------|---------|
| **Marketplace** | General stock — clients marketplace me dekh sakte hain |
| **Client** | Specific customer ke liye reserved stock |

**Data Scope:** Company-scoped

---

### 6. LOGISTICS (`logistics`)

**Kya hai:** Delivery ka incharge. Fleet manage karta hai, drivers assign karta hai, routes plan karta hai.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Logistics stats |
| Active Missions | `/dashboard/missions` | Current missions track karna |
| Deliveries | `/dashboard/deliveries` | Delivery management |
| Fleet | `/dashboard/fleet` | Vehicles manage karna |
| Routes | `/dashboard/logistics-routes` | Delivery routes plan karna |
| Tracking | `/dashboard/logistics-tracking` | Real-time tracking |
| Urgent | `/dashboard/logistics-urgent` | Priority deliveries |
| Staff Terminal | `/dashboard/staff-terminal` | Leave & pay |
| Leave & Absence | `/dashboard?tab=leave` | Leave request |
| Pay & Records | `/dashboard?tab=pay` | Payroll records |

**Kya Karta Hai:**

| Action | Detail |
|--------|--------|
| **Vehicle Add** | Fleet me vehicles add karna (Van, Truck, Car, SUV, Boat, Plane) |
| **Driver Assign** | Mission/delivery me driver + vehicle assign karna |
| **Route Create** | Routes define karna (Land/Sea/Air) with distance, time |
| **Delivery Update** | Status update: pending → assigned → en_route → delivered → completed |
| **Track Live** | Deliveries ka real-time tracking |

**Delivery Flow:**
```
Mission Created (by Operations)
         |
         v
  ASSIGN DRIVER + VEHICLE    ← Logistics
         |
         v
  SET ROUTE                   ← Logistics
         |
         v
  DISPATCH (en_route)         ← Logistics
         |
         v
  DELIVER + POD (signature)   ← Driver
         |
         v
  COMPLETE                    ← Auto/Logistics
```

**Data Scope:** Company-scoped

---

### 7. CONCIERGE (`concierge`)

**Kya hai:** VIP customer services manage karta hai. Events, luxury items, chauffeur, guest requests — premium experiences.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Concierge stats |
| Events | `/dashboard/events` | Event management |
| Guest Requests | `/dashboard/guest-requests` | Guest service requests |
| Luxury Items | `/dashboard/luxury-items` | Luxury item vault management |
| Storage Hub | `/dashboard/inventory` | Inventory access |
| Access Plans | `/dashboard/vip-access` | VIP access plan management |
| Chauffeur Protocol | `/dashboard/chauffeur` | Chauffeur service management |
| Leave & Absence | `/dashboard?tab=leave` | Leave request |
| Pay & Records | `/dashboard?tab=pay` | Payroll records |

**Kya Karta Hai:**

| Action | Detail |
|--------|--------|
| **Event Create** | Client ke liye events create karna (planned → confirmed → in_progress → completed) |
| **Guest Request Manage** | Guest requests accept/process karna |
| **Luxury Item Store** | Client ke luxury items vault me store karna (jewelry, watches, etc.) |
| **Chauffeur Arrange** | Chauffeur service schedule karna |
| **VIP Access** | VIP access plans create karna |

**Data Scope:** Company-scoped

---

### 8. STAFF (`staff`)

**Kya hai:** Field worker. Assigned tasks execute karta hai, attendance track karta hai.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Staff Terminal | `/dashboard` | Main dashboard — clock in/out, assignments |
| My Assignments | `/dashboard?tab=assignments` | Assigned tasks dekhna |
| Field Map | `/dashboard?tab=map` | Location-based assignments |
| Leave & Absence | `/dashboard?tab=leave` | Leave apply karna |
| Pay & Records | `/dashboard?tab=pay` | Salary records dekhna |

**Kya Karta Hai:**

| Action | Detail |
|--------|--------|
| **Clock In/Out** | Shift start/end karna — hours track hote hain |
| **View Assignments** | Assigned tasks/missions dekhna |
| **Complete Task** | Task mark complete karna |
| **Leave Apply** | Leave request submit karna |
| **Pay View** | Apna payroll dekhna |

**Data Scope:** Personal only — sirf apna data

**Self-Registration:** Staff `/staff-signup` page se apply kar sakta hai → status `pending` → Admin approve kare → `active`

---

### 9. CUSTOMER (`customer`)

**Kya hai:** End consumer. Company ka customer hai jisko admin ne add kiya. Limited portal access.

**Sidebar Menu:**
| Menu | Path | Kya Karta Hai |
|------|------|---------------|
| Dashboard | `/dashboard` | Customer overview |
| Orders | `/dashboard/client-orders` | Apne orders dekhna |
| Concierge | `/dashboard/guest-requests` | Guest services request karna |
| Settings | `/dashboard/settings` | Profile settings |

**Kya Karta Hai:**

| Action | Detail |
|--------|--------|
| **Orders View** | Apne orders track karna |
| **Guest Request** | Concierge services request karna |
| **Profile Update** | Apni settings update karna |

**Data Scope:** Personal only — sirf apna data

**How Customer is Created:** Admin (Company Owner) → Customers page → Add Customer → Auto login credentials generate hote hain

---

## COMPLETE ORDER LIFECYCLE

Ye system ka core flow hai — order create se delivery tak:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ORDER LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 1: ORDER CREATE                                               │
│  ├─ Client → Marketplace → Add to Cart → Checkout                   │
│  ├─ Client → Custom Requisition → Submit                            │
│  └─ Admin → Orders → New Order                                      │
│         |                                                           │
│         v                                                           │
│  STEP 2: ADMIN REVIEW (status: admin_review)                        │
│  ├─ Admin reviews order details                                     │
│  ├─ Approve → moves to next stage                                   │
│  └─ Reject → order cancelled                                        │
│         |                                                           │
│         v                                                           │
│  STEP 3: OPERATIONS (status: operation)                              │
│  ├─ Operations sees approved orders                                  │
│  ├─ Convert to PROJECT (multi-item, complex)                         │
│  │   └─ Assign staff, set timeline                                   │
│  ├─ Convert to MISSION (delivery/pickup)                             │
│  │   └─ Assign driver, set route                                     │
│  └─ Check: Stock available?                                          │
│         |                                                           │
│    YES ─┤── NO                                                       │
│         |    |                                                       │
│         |    v                                                       │
│         |  STEP 4: PROCUREMENT (status: procurement)                 │
│         |  ├─ Create Purchase Request                                │
│         |  ├─ Get Vendor Quotes                                      │
│         |  ├─ Compare & Select Best Quote                            │
│         |  ├─ Create Purchase Order                                  │
│         |  └─ Vendor delivers goods                                  │
│         |         |                                                  │
│         |         v                                                  │
│         |  STEP 5: INVENTORY (status: inventory)                     │
│         |  ├─ Receive goods against PO                               │
│         |  ├─ Stock Entry → inventory updated                        │
│         |  └─ Allocate stock for order                               │
│         |         |                                                  │
│         ├─────────┘                                                  │
│         v                                                           │
│  STEP 6: LOGISTICS (status: logistics)                               │
│  ├─ Assign driver + vehicle                                          │
│  ├─ Set delivery route                                               │
│  ├─ Dispatch                                                         │
│  ├─ Track real-time                                                  │
│  └─ Deliver + Capture POD (signature)                                │
│         |                                                           │
│         v                                                           │
│  STEP 7: COMPLETED (status: completed)                               │
│  ├─ Invoice generated                                                │
│  ├─ Client receives notification                                     │
│  ├─ Client pays invoice                                              │
│  └─ Order cycle complete                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Order Statuses:** `created` → `admin_review` → `operation` → `procurement` → `inventory` → `logistics` → `completed` (ya `cancelled`)

**Order Flow Logs:** Har stage change pe `order_flow_logs` table me entry hoti hai — who assigned, when started, when completed (full audit trail)

---

## CLIENT ONBOARDING FLOW

### SaaS Client (Full Company Setup)

```
Option A: Super Admin creates directly
  Super Admin → Clients → SaaS tab → Add SaaS Client
  → Company created + Admin user created + Credentials shown

Option B: Landing page request
  Visitor → Landing Page → Select Plan → Submit Request
  → Super Admin → SaaS Management → Approve Request
  → Company auto-created + Admin user auto-created + Credentials generated
```

### Personal Client (Lightweight)

```
  Super Admin → Clients → Personal tab → Add Personal Client
  → Simple client record created (no full company setup)
```

### Customer (Under a Company)

```
  Admin (Company Owner) → Customers page → Add Customer
  → Customer record created in `customers` table
  → Auto login user created with role 'customer'
  → Credentials shown to Admin
```

---

## PERMISSION SYSTEM

### How It Works:

1. **Admin** goes to Security Protocol page (`/dashboard/roles-permissions`)
2. Selects a role (e.g., Operations)
3. Toggles which menus that role can see: `can_view`, `can_add`, `can_edit`, `can_delete`
4. Saves → stored in `menu_permissions` table
5. When that role's user logs in next time → `menuPermissions` loaded with `path`, `icon`, `name`
6. Sidebar renders only the menus where `can_view = true`

### Permission Priority:
| Role | Sidebar Source |
|------|---------------|
| `super_admin` | Always static (hardcoded) — full access |
| All other roles | DB permissions if exist, else static fallback |

### 25 Available Menus for Permission Control:
Dashboard, Customers, Orders, Projects, Missions, Deliveries, Inventory, Staff Management, Invoices, Payroll, Reports, Support, Chauffeur, Events, Guest Requests, Luxury Items, Vendors, Purchase Requests, Quotes, Purchase Orders, Fleet, Warehouses, Staff Terminal, Settings, Security Protocol

---

## DATA ISOLATION RULES

| Rule | Detail |
|------|--------|
| **Company Scoping** | Har query `company_id` se filtered hoti hai. Admin sirf apni company ka data dekhta hai |
| **Super Admin** | Global scope — koi filter nahi |
| **Events** | Company-scoped — ek company ke events doosri company ko nahi dikhte |
| **Orders** | Customer sirf apne orders dekhta hai (`customer_id` filter) |
| **Staff** | Staff sirf apne assignments, shifts, pay dekhta hai (`user_id` filter) |
| **Inventory** | Client Inventory sirf specific customer ke liye; Marketplace Inventory sabko |
| **Customers vs Companies** | Super Admin → `companies` table; Admin/Staff → `customers` table |

---

## DATABASE TABLES & OWNERSHIP

| Table | Kaun Create Karta Hai | Kaun Dekhta Hai |
|-------|----------------------|-----------------|
| `companies` | Super Admin | Super Admin |
| `users` | Super Admin / Admin | Admin (own company), Super Admin (all) |
| `customers` | Admin / Operations | Admin, Operations, Concierge (own company) |
| `orders` | Client / Admin | Admin, Operations, Customer (own orders) |
| `order_items` | Auto (with order) | Same as orders |
| `order_flow_logs` | Auto (stage changes) | Admin, Operations |
| `projects` | Operations / Admin | Operations, Admin |
| `missions` | Operations | Operations, Logistics |
| `vendors` | Admin / Procurement | Procurement, Admin |
| `purchase_requests` | Anyone | Procurement, Admin |
| `quotes` | Procurement | Procurement, Admin |
| `purchase_orders` | Procurement | Procurement, Inventory, Admin |
| `inventory` | Inventory / Procurement | Inventory, Admin, Client (marketplace) |
| `inventory_movements` | Auto (stock changes) | Inventory, Admin |
| `warehouses` | Inventory / Admin | Inventory, Admin |
| `vehicles` | Logistics / Admin | Logistics, Admin |
| `deliveries` | Logistics / Operations | Logistics, Admin, Client (tracking) |
| `routes` | Logistics | Logistics, Admin |
| `events` | Concierge / Client | Concierge, Admin (own company) |
| `guest_requests` | Customer / Client | Concierge, Admin |
| `luxury_items` | Concierge | Concierge, Admin |
| `support_tickets` | Anyone | Admin, Support |
| `invoices` | Admin / Auto | Admin, Client |
| `payments` | Client | Admin |
| `payroll` | Admin | Admin, Staff (own) |
| `shifts` | Staff (clock in/out) | Admin, Staff (own) |
| `staff_assignments` | Operations / Admin | Staff (assigned), Operations, Admin |
| `leave_requests` | Staff | Staff (own), Admin |
| `menu_permissions` | Admin | Auto-loaded at login |
| `saas_plans` | Super Admin | Super Admin, Landing Page |
| `saas_requests` | Landing Page visitor | Super Admin |
| `audit_logs` | Auto / Admin | Admin, Procurement, Inventory |
| `delivery_pricing` | Admin | Admin, Logistics |
| `system_settings` | Admin | Admin |

---

## MARKETPLACE & CART FLOW (Client Portal)

```
Client Login
    |
    v
Marketplace Page (/dashboard/store)
    |
    ├─ Browse Marketplace Inventory items
    ├─ Add items to Cart (localStorage)
    ├─ View Cart → Adjust quantities
    |
    v
Checkout
    |
    ├─ Order created (status: 'created')
    ├─ Order items stored in `order_items` table
    ├─ Cart cleared
    |
    v
My Orders Page (/dashboard/client-orders)
    |
    └─ Track order status through stages
```

---

## CONCIERGE SERVICES FLOW

```
CLIENT                          CONCIERGE
  |                                |
  ├─ Request Event ──────────────> Events page (plan, confirm, execute)
  ├─ Guest Request ──────────────> Guest Requests (process, fulfill)
  ├─ Chauffeur Request ──────────> Chauffeur Protocol (schedule, assign)
  |                                |
  |                          LUXURY VAULT
  |                                |
  └─ Store valuables ────────────> Luxury Items (store, transfer, return)
```

**Event Statuses:** `planned` → `confirmed` → `in_progress` → `completed` (ya `cancelled`)

---

## STAFF LIFECYCLE

```
JOINING:
  Option A: Admin creates → Staff Management → Add User (role: staff) → Active
  Option B: Self-signup → /staff-signup → Status: Pending → Admin approves → Active

DAILY WORK:
  Staff Login → Staff Terminal
    ├─ Clock In (shift starts)
    ├─ View Assignments (from Operations/Admin)
    ├─ Complete Tasks
    ├─ Clock Out (shift ends, hours recorded)
    └─ View Pay & Records

LEAVE:
  Staff → Leave tab → Apply (vacation/sick/personal/bereavement)
  → Admin → Approve/Reject
```

---

## KEY TECHNICAL DETAILS

### Role Mapping (Backend → Frontend)
```
super_admin  →  superadmin
admin        →  client        (Company Owner)
operation    →  operations
procurement  →  procurement
logistics    →  logistics
inventory    →  inventory
concierge    →  concierge
staff        →  staff
customer     →  customer
```
Handled by `normalizeRole()` in `src/utils/authUtils.js`

### API Base URL
```
Production: https://zanezion2-backend-production.up.railway.app/api
Local: http://localhost:5000/api
```

### Multi-Tenant Middleware
- `scopeByCompany` — Sets `req.companyScope` from JWT token
- `companyFilter(req)` — Returns WHERE clause for list queries
- `companyScope(req)` — Returns AND clause for single-record queries
- Super Admin: `companyScope = null` (no filter)
- Others: `companyScope = user.company_id`

### Auto-Migration System
- Server startup pe `migrations/run.js` automatically run hota hai
- `_migrations` table track karta hai kaunsi migrations already run ho chuki hain
- Safe to re-run — duplicate check hota hai

---

## QUICK REFERENCE: KAUN KYA ADD KARTA HAI

| Role | Add Karta Hai |
|------|--------------|
| **Super Admin** | Companies (SaaS/Personal), SaaS Plans, Global Settings |
| **Admin (Client)** | Customers, Staff Users, Orders, Projects, Inventory, Vendors, Role Permissions |
| **Operations** | Projects (from orders), Missions, Staff Assignments, Customers |
| **Procurement** | Purchase Requests, Vendor Quotes, Purchase Orders |
| **Inventory** | Stock Entries, Stock Issues, Loss Records, Warehouses |
| **Logistics** | Vehicles, Routes, Delivery Assignments |
| **Concierge** | Events, Guest Requests, Luxury Items, Chauffeur, VIP Access Plans |
| **Staff** | Clock In/Out, Leave Requests, Task Completions |
| **Customer** | Guest Requests, Order Views |
