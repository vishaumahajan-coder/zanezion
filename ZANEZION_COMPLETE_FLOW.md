# ZaneZion — Complete Project Flow & Test Guide

---

## 🔑 Default Login (After Cleanup)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@zanezion.com | admin123 |

---

## 📦 System Overview

```
ZaneZion Platform
├── Super Admin     → Platform owner, approves clients
├── Admin           → Internal manager, manages staff & operations
├── Operations      → Projects, Missions, Deliveries
├── Procurement     → Purchase Requests, Quotes, POs
├── Logistics       → Fleet, Routes, Tracking
├── Inventory       → Stock, Warehouses, Alerts
├── Concierge       → Events, Guest Requests, Luxury Items
├── Field Staff     → Assignments, Leave, Pay
├── Business Client → Orders with Invoice/PO
├── SaaS Tenant     → Own admin + staff + data
└── Customer        → Marketplace shopping only
```

---

## ✅ STEP 1 — Super Admin Login & Setup

### Login
```
URL: /login
Email: admin@zanezion.com
Password: admin123
→ Redirects to: /dashboard (Admin Dashboard)
```

### Super Admin Dashboard Shows
- Total Clients, Orders, Revenue stats
- Pending approvals notifications

### Super Admin Sidebar
- Dashboard
- Clients → `/dashboard/clients`
- HQ Personnel → `/dashboard/users`
- Plans → `/dashboard/plans`
- Settings → `/dashboard/settings`

---

## ✅ STEP 2 — Super Admin Adds Admin User

```
/dashboard/users
→ Click "New User"
→ Role: Admin (Internal Manager)  ← only this option for SuperAdmin
→ Fill: Name, Email, Password, Phone
→ Save
→ API: POST /api/users
→ DB: users table (role='admin', company_id=1)
```

**Test Check:**
- Admin user milta hai users list mein
- Admin login kar sakta hai
- Admin ka sidebar: full institutional menu (25+ items)

---

## ✅ STEP 3 — Admin Login & Staff Add

### Admin Login
```
URL: /login
Email: (jo SuperAdmin ne banaya)
Password: (jo set kiya tha)
→ Redirects to: /dashboard (Client Dashboard)
```

### Admin Adds Staff
```
/dashboard/users → "New User"
Role options:
  - Operations
  - Procurement
  - Logistics
  - Inventory
  - Concierge
  - Field Staff

Fill: Name, Email, Password, Phone, Birthday
      NIB Number, Banking Info, Vacation Balance
→ API: POST /api/users
→ DB: users table (company_id = admin's company_id)
```

**Test Check - Each Staff Login:**

| Role | Email | Dashboard |
|------|-------|-----------|
| operations | created by admin | Operations Dashboard |
| procurement | created by admin | Procurement Dashboard |
| logistics | created by admin | Logistics Dashboard |
| inventory | created by admin | Inventory Dashboard |
| concierge | created by admin | Concierge Dashboard |
| staff | created by admin | Employee Portal |

---

## ✅ STEP 4 — Public Signup (3 Types)

### 4A — Personal Account (Customer)
```
URL: /signup → "Personal Account"
Fill: Name, Email, Phone, Password
Accept T&C
→ API: POST /api/auth/signup
→ DB: users (role='customer', status='active', no company)
→ Redirect: /login

After Login:
→ Dashboard → Marketplace → Place Order → Track Delivery
```

### 4B — Business Account
```
URL: /signup → "Business Account"
Fill: Name, Email, Phone, Password, Company Name
Upload: Business License (PDF/JPG)
Accept T&C
→ API: POST /api/auth/signup
→ DB:
   companies (client_type='Business', tenant_type='business', status='pending')
   users (role='client', company_id=new_company, status='pending')

Status: PENDING — cannot login yet

Super Admin Approves:
→ /dashboard/clients → Find pending client → Approve
→ API: PUT /api/auth/staff-review/:id { status: 'active' }
→ Email notification sent

After Approval Login:
→ Full Business Portal (orders, invoices, POs, events, etc.)
```

### 4C — SaaS Membership
```
URL: /signup → "SaaS Membership"
→ SaaS Info Screen (shows $299 fee)
→ "I Understand" → Form
Fill: Name, Email, Phone, Password, Company Name
Accept T&C
→ API: POST /api/auth/signup
→ DB:
   companies (client_type='SaaS', tenant_type='saas', status='pending')
   users (role='admin', company_id=new_tenant, status='pending')

Status: PENDING + Payment Required

Super Admin Approves:
→ /dashboard/saas-clients → Find pending → Approve
→ API: PUT /api/auth/staff-review/:id { status: 'active' }

After Approval Login:
→ Full Admin Dashboard (same as Business Client)
→ CAN add own staff (Operations, Logistics, etc.)
→ Their data isolated by company_id
```

---

## ✅ STEP 5 — Customer Flow (Personal Account)

```
Login → /dashboard (ClientDashboard - customer mode)

Sidebar:
├── Dashboard
├── Marketplace  → /dashboard/store
├── My Orders    → /dashboard/client-orders
├── Track Delivery → /dashboard/track-delivery
└── Support      → /dashboard/support

PLACE ORDER:
1. /dashboard/store
2. Browse products → "Add to Manifest"
3. Cart icon → Open cart drawer
4. Enter Delivery Address (required)
5. Select: Road / Sea / Air
6. "Confirm Dispatch"
→ API: POST /api/orders
→ DB: orders (company_id=1, created_by=user_id, status='admin_review')
→ Admin sees this order immediately in /dashboard/orders

TRACK ORDER:
/dashboard/track-delivery → See order status
```

**Admin sees Customer Order:**
```
/dashboard/orders → Shows ALL orders including customer orders
Status shows: "admin_review"
Admin can: View, Process, Change Status, Assign Delivery
```

---

## ✅ STEP 6 — Business Client Flow

```
Login → /dashboard (Full Business Portal)

Key Features:
├── Orders         → Place orders (Invoice-based allowed)
├── Invoices       → View/Pay invoices
├── Purchase Requests → Submit PRs
├── Events         → Book concierge events
├── Inventory      → View-only access
├── Tracking       → Track deliveries
└── Support        → Raise tickets
```

---

## ✅ STEP 7 — Operations Staff Flow

```
Login → /dashboard (Operations Dashboard)

Sidebar:
├── Dashboard
├── Projects       → Manage projects
├── Orders         → Process orders
├── Missions       → Field missions
├── Deliveries     → Track deliveries
├── Invoices
├── Staff Terminal
├── Leave & Absence
└── Pay & Records

KEY ACTIONS:
1. View pending orders → Change status
2. Create projects from orders
3. Assign missions to drivers
4. Mark deliveries complete
```

---

## ✅ STEP 8 — Procurement Staff Flow

```
Login → /dashboard (Procurement Dashboard)

Sidebar:
├── Purchase Requests → Review & approve
├── Vendors           → Manage vendors
├── Quotes            → Create quotes
├── Purchase Orders   → Create POs
├── Invoices
└── Audit Log

KEY ACTIONS:
1. Receive purchase request → Create quote → Convert to PO
2. Add vendors
3. Process payments
```

---

## ✅ STEP 9 — Logistics Staff Flow

```
Login → /dashboard (Logistics Dashboard)

Sidebar:
├── Active Missions
├── Deliveries
├── Fleet          → Manage vehicles
├── Routes         → Define routes
├── Tracking       → Live tracking
└── Urgent

KEY ACTIONS:
1. Assign driver to delivery
2. Update delivery status
3. Add/manage vehicles
4. Mark delivery complete
```

---

## ✅ STEP 10 — Inventory Staff Flow

```
Login → /dashboard (Inventory Dashboard)

Sidebar:
├── StockHub       → View/update inventory
├── Warehouse      → Manage warehouses
├── Alerts         → Low stock alerts
└── Audit Protocol

KEY ACTIONS:
1. Add new inventory items
2. Record stock movements (entry/issue/loss)
3. Manage warehouses
4. View alerts
```

---

## ✅ STEP 11 — Concierge Staff Flow

```
Login → /dashboard (Concierge Dashboard)

Sidebar:
├── Events         → Manage events
├── Guest Requests → Handle requests
├── Luxury Items   → Vault management
├── Storage Hub
├── Access Plans
└── Chauffeur Protocol

KEY ACTIONS:
1. Create/manage events
2. Handle guest requests
3. Manage luxury item vault
4. Schedule chauffeur
```

---

## ✅ STEP 12 — Field Staff Flow

```
Login → /dashboard (Employee Portal)

Sidebar:
├── Staff Terminal → My assignments
├── My Assignments
├── Field Map
├── Leave & Absence → Apply for leave
└── Pay & Records

KEY ACTIONS:
1. View assigned tasks
2. Update task status
3. Apply for leave
4. View pay records
```

---

## ✅ STEP 13 — Profile Update (All Roles)

```
Any user → Click profile icon → /dashboard/profile

Fields:
├── Personal: Name, Email, Phone, Birthday
├── Security: New Password
└── Banking: Bank Name, Account No., Routing No., NIB No.

→ API: PUT /api/auth/profile
→ DB: users table updated
```

---

## ✅ STEP 14 — Staff Management (Admin)

```
/dashboard/users

TABS:
├── Personnel  → Active staff list
├── Pending    → Pending approval
├── Live Status → Who is available
├── Absence    → Leave requests
├── Time Logs  → Work hours
├── Vault      → Documents
└── Missions   → Assigned tasks

ADD USER:
→ "New User" → Fill form → Save
→ API: POST /api/users
→ Fields saved: name, email, phone, role, birthday,
                bank_name, account_number, routing_number,
                nib_number, vacation_balance

EDIT USER:
→ Edit icon → Form autofills ALL fields → Save
→ API: PUT /api/users/:id

VIEW USER:
→ Eye icon → Shows all stored details including
             birthday, NIB, banking, vacation balance

DELETE USER:
→ Delete icon → Confirm → Remove
→ API: DELETE /api/users/:id

APPROVE PENDING STAFF:
→ Pending tab → "Activate" button
→ API: PUT /api/users/:id/review { status: 'active' }
```

---

## ✅ STEP 15 — SaaS Tenant Admin Flow (Isolated)

```
SaaS Admin Login (after SuperAdmin approval)
→ Own Dashboard with company name in sidebar

ADDS OWN STAFF:
/dashboard/users → Add Operations, Logistics, etc.
→ All staff get: company_id = SaaS_company_id
→ ISOLATED from ZaneZion's main data

OWN ORDERS:
→ Only sees orders with company_id = their tenant
→ ZaneZion admin CANNOT see their orders
→ SuperAdmin CAN see all orders

THEIR SIDEBAR: Full institutional menu
THEIR BRAND: Sidebar shows THEIR company name
```

---

## 🔗 Complete API Reference

### Auth APIs (Public)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/login | Login |
| POST | /api/auth/signup | Public signup (Personal/Business/SaaS) |
| POST | /api/auth/staff-register | Staff self-signup with documents |
| POST | /api/auth/forgot-password | Send OTP |
| POST | /api/auth/reset-password | Reset with OTP |
| PUT | /api/auth/profile | Update own profile |
| PUT | /api/auth/staff-review/:id | Approve/reject staff (Admin only) |

### Users APIs (Protected)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/users | Get all users (scoped by company) |
| GET | /api/users/:id | Get single user |
| POST | /api/users | Create user (Admin/SuperAdmin) |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |
| PUT | /api/users/:id/review | Approve/reject user |

### Orders APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/orders | Get orders (role-scoped) |
| POST | /api/orders | Create order |
| PUT | /api/orders/:id | Update order |
| PATCH | /api/orders/:id/status | Update status |
| DELETE | /api/orders/:id | Delete order |

### Other APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST/PUT/DELETE | /api/inventory | Inventory management |
| GET/POST/PUT/DELETE | /api/vendors | Vendor management |
| GET/POST/PUT/DELETE | /api/missions | Mission management |
| GET/POST/PUT/DELETE | /api/logistics/vehicles | Fleet management |
| GET/POST/PUT/DELETE | /api/logistics/deliveries | Delivery management |
| GET/POST/PUT/DELETE | /api/procurement/requests | Purchase requests |
| GET/POST/PUT/DELETE | /api/procurement/quotes | Quotes |
| GET/POST/PUT/DELETE | /api/procurement/po | Purchase orders |
| GET/POST/PUT/DELETE | /api/finance/invoices | Invoices |
| GET/POST/PUT/DELETE | /api/warehouses | Warehouses |
| GET/POST/PUT/DELETE | /api/support/tickets | Support tickets |
| GET | /api/clients | Get clients/companies |

---

## 🗄️ Database Flow — Data Kahan Jaata Hai

```
User Signup
└── users table (role, company_id, status)
    └── companies table (for Business/SaaS)

Order Placed
└── orders table (company_id, created_by, items JSON)
    └── order_items table (each product line)
    └── order_flow_logs table (workflow audit)
    └── notifications (admin notified)

Staff Added
└── users table (role, company_id, bank_name, nib_number, etc.)

Inventory Added
└── inventory table (company_id, warehouse_id)
    └── inventory_movements (stock changes)

Mission Created
└── missions table (company_id, order_id, assigned_driver)
    └── deliveries table (tracking info)

Invoice Generated
└── invoices table (company_id, order_id, amount)
    └── payments table (when paid)
```

---

## 🧪 Complete Test Checklist

### Phase 1 — Setup
- [ ] Super Admin login works → `admin@zanezion.com / admin123`
- [ ] Super Admin can add Admin user
- [ ] Admin login works
- [ ] Admin can add Operations/Logistics/Inventory/Procurement/Concierge/Staff

### Phase 2 — Signup
- [ ] Personal signup → instant active → marketplace access
- [ ] Business signup → pending → SuperAdmin approves → full portal
- [ ] SaaS signup → pending → SuperAdmin approves → full admin portal

### Phase 3 — Customer Order Flow
- [ ] Customer adds item to cart
- [ ] Customer enters delivery address
- [ ] Order placed → shows in Admin's `/dashboard/orders`
- [ ] Admin can change order status
- [ ] Customer can track order

### Phase 4 — Staff Operations
- [ ] Operations staff sees orders, can process
- [ ] Logistics staff can manage fleet & deliveries
- [ ] Inventory staff can update stock
- [ ] Procurement staff can create POs
- [ ] Concierge staff can manage events
- [ ] Field staff can see assignments

### Phase 5 — Profile & Data
- [ ] Any user updates profile → data saves
- [ ] Birthday, NIB, banking all save correctly
- [ ] Edit user modal autofills all fields
- [ ] Vacation balance shows correctly (not 0)

### Phase 6 — SaaS Multi-Tenant
- [ ] SaaS admin login → sees own company name in sidebar
- [ ] SaaS admin adds own staff
- [ ] SaaS admin's orders NOT visible to ZaneZion admin
- [ ] SuperAdmin CAN see all tenants' data

---

## 🚨 Important Notes

1. **Password:** All new users ka password admin sets karta hai — user profile se change kar sakta hai
2. **Company Scope:** Har role ka data unke `company_id` se isolated hai
3. **Customer Orders:** Customer ke orders `company_id=1` (ZaneZion) jaate hain taaki Admin dekh sake
4. **Pending Users:** Jab tak approve nahi, login pe "Account pending approval" error aayega
5. **SuperAdmin:** Koi bhi data restrict nahi — sab kuch dekh sakta hai

---

*Last Updated: 2026-04-29 | ZaneZion Platform v2.0*
