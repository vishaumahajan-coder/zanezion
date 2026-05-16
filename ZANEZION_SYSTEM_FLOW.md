# ZaneZion — Complete System Flow Document
### Based on Actual Backend Code Analysis (No Assumptions)

---

## 🗺️ COMPLETE END-TO-END CHAIN

```
Customer/Admin → Order Created → Admin Reviews → Assign to Stage →
Operations (Project Created) → Mission Created → Driver Assigned →
Delivery Created → Status: En Route → Delivered → Completed

Parallel:
Order → Procurement (Purchase Request → Quote → PO → Receive Goods → Inventory Auto-Updated)
```

---

# MODULE 1: ORDERS

## MENU: Create Order

**Purpose:** Entry point for all work in the system. Every project, mission, and delivery starts from an order.

**Entry Point:**
- Customer via Marketplace (`/dashboard/store`) → POST `/api/orders` with `status=admin_review`
- Admin/Operations via Orders page → POST `/api/orders` with `status=created`

**DB Tables:** `orders`, `order_items`, `order_flow_logs`, `customers`, `notifications`

**Data Flow:**
```
1. User fills order form (items, location/delivery address, type)
2. POST /api/orders
3. Backend calculates totalAmount from items (price × qty)
4. If customer role → status = 'admin_review'
   If admin/operation → status = 'created'
5. INSERT into orders table
6. INSERT each item into order_items table
7. INSERT first flow log: stage='created', status='completed'
8. Notification sent to: admin + super_admin
9. Order visible in /dashboard/orders
```

**Status Flow:**
```
admin_review → created → in_progress → completed (cancelled)
```

**Role Responsibility:**
- Customer: creates order (marketplace only)
- Admin/Operation: creates direct orders

**Visibility:**
- super_admin: ALL orders (no filter)
- admin/operation/procurement/logistics: company orders only
- customer: only their own orders (by created_by)

**Assignment:** NOT AUTOMATIC — Admin manually assigns via `assignToStage`

**Edge Cases:**
- Order not approved → stays in `admin_review`, no further processing
- No items → frontend blocks submission

---

## MENU: Order Approval / Stage Assignment

**Purpose:** Admin moves order through workflow stages manually.

**API:** `PUT /api/orders/:id/assign`

**Roles:** super_admin, admin, manager, operation

**Workflow Stages (in order):**
```
admin_review → operation → procurement → inventory → logistics → completed
```

**Bespoke / `order_kind = custom_request`:** after `admin_review`, assign stage **`concierge`** first (VIP desk triage), then concierge forwards to `operation`, `procurement`, or `logistics` as needed. Backend must allow `status` / `current_stage` value **`concierge`** on `orders` and accept `PUT /api/orders/:id/assign` with `{ "stage": "concierge" }`.

**Data Flow:**
```
1. Admin opens order → clicks "Assign to Stage"
2. Selects stage (operation/procurement/inventory/logistics)
3. Optionally selects assigned_to (user ID)
4. PUT /api/orders/:id/assign { stage, assigned_to, notes }
5. Backend:
   a. Marks PREVIOUS flow log as completed
   b. Updates order: status=stage, current_stage=stage, assigned_to=user
   c. Creates NEW flow log: stage=new_stage, status='pending'
   d. Sends notification to target role
6. Order now visible in that role's dashboard
```

**Status Changes:**
```
current_stage field updated to: operation/procurement/inventory/logistics/completed
```

**Assignment Logic:** MANUAL — Admin selects both stage AND assigned_to person
- No auto-assignment exists in backend
- assigned_to is optional (can be null)

**Visibility after assignment:**
- Stage = 'operation' → visible to operations staff
- Stage = 'procurement' → visible to procurement staff
- Stage = 'logistics' → visible to logistics staff

---

## MENU: Order Status Update

**API:** `PATCH /api/orders/:id/status`

**Roles:** super_admin, admin, operation, procurement, inventory, logistics

**Flow:**
```
1. Any allowed role can update status
2. PATCH /api/orders/:id/status { status: 'new_status' }
3. No validation on status value (accepts any string)
4. Notifications sent to: customer + admin + super_admin
```

---

## MENU: Convert Order to Project

**API:** `POST /api/orders/convert/:orderId`

**Roles:** super_admin, admin, operation

**Flow:**
```
1. Admin/Operations selects order → "Convert to Project"
2. POST /api/orders/convert/:orderId { name, description, manager_id, start_date, end_date }
3. Backend:
   a. Creates entry in projects table (order_id stored)
   b. Updates order: status='in_progress', current_stage='completed'
   c. Notifications sent to: operation + admin
4. Project now appears in /dashboard/projects
```

**Status after conversion:**
- Order: `in_progress`
- Project: starts as `planned`

---

# MODULE 2: PROJECTS

## MENU: Projects List

**Purpose:** Projects are created from orders. They track large-scale work.

**DB Table:** `projects`

**API:** `GET /api/orders/projects/all`

**Fields:** company_id, order_id, name, description, manager_id, location, status, start_date, end_date

**Status Flow:**
```
planned → in_progress → completed (on_hold)
```

**Roles:**
- Create: super_admin, admin, operation
- Update: super_admin, admin, operation
- Delete: super_admin, admin
- View: All scoped roles

**Data Flow:**
```
Order → Convert to Project → Project created with order_id reference
Project → Convert to Mission (see Module 3)
```

---

## MENU: Convert Project to Mission

**API:** `POST /api/missions/convert-project/:projectId`

**Roles:** super_admin, admin, operation

**Flow:**
```
1. Operations selects project → "Create Mission"
2. Fills: mission_type, destination_type, event_date, notes
3. POST /api/missions/convert-project/:projectId
4. Backend:
   a. Fetches project (gets project.location, start_date, description, order_id)
   b. Creates mission: company_id, project_id, order_id(from project), mission_type,
      destination_type←project.location, event_date←project.start_date, notes←project.description
   c. Updates project: status='in_progress'
   d. Notifications sent to: operation + logistics
5. Mission appears in /dashboard/missions
```

---

# MODULE 3: MISSIONS

## MENU: Missions List

**Purpose:** Missions track physical field work — deliveries, pickups, chauffeur, etc.

**DB Table:** `missions`

**Fields:** company_id, order_id, project_id, mission_type, destination_type, assigned_driver, vehicle_id, status, event_date, notes

**Status Flow:**
```
(no default) → assigned → en_route → completed (cancelled)
```

**Mission Types:** Delivery, Pickup, Transfer, Chauffeur, Custom

**Creation Methods:**
1. From Order: `POST /api/missions/convert/:orderId`
2. From Project: `POST /api/missions/convert-project/:projectId`

---

## MENU: Assign Driver to Mission

**API:** `POST /api/missions/:id/assign`

**Roles:** super_admin, admin, operation, logistics

**Flow:**
```
1. Logistics opens mission → "Assign Driver"
2. Selects driver (user) + vehicle (optional)
3. POST /api/missions/:id/assign { driverId, vehicleId }
4. Backend:
   a. Updates mission: assigned_driver=driverId, vehicle_id=vehicleId, status='assigned'
   b. Returns mission with driver_name + plate_number joins
```

**Assignment Logic:** MANUAL — Logistics/Admin manually selects driver and vehicle
- No automatic assignment
- Vehicle is optional

---

## MENU: Update Mission Status

**API:** `PUT /api/missions/:id/status`

**Roles:** Any (no role restriction)

**Flow:**
```
{ status: 'en_route' / 'completed' / 'cancelled' }
No status validation — accepts any value
```

---

# MODULE 4: LOGISTICS

## MENU: Deliveries

**Purpose:** Track physical delivery of goods from pickup to destination.

**DB Table:** `deliveries`

**API:** `POST /api/logistics/deliveries` / `PATCH /api/logistics/deliveries/:id/status`

**Fields:** company_id, order_id, mission_type, route, driver_name, plate_number, package_details(JSON), pickup_location, drop_location, passenger_info(JSON), delivery_date, pickup_time, status

**DELIVERY STATUS FLOW:**
```
pending → dispatched → en_route → delivered → completed
```

**Create Delivery Flow:**
```
1. Logistics/Admin creates delivery record
2. POST /api/logistics/deliveries
3. Backend:
   a. Resolves company_id from: companyScope → body.company_id → lookup from order
   b. Sanitizes: delivery_date, pickup_time (empty string → null)
   c. package_details stored as JSON
   d. If mission_type = 'chauffeur' → notify concierge
   e. Else → notify logistics
4. Default status='pending'
```

**Update Delivery Status Flow (CRITICAL):**
```
PATCH /api/logistics/deliveries/:id/status
{ status, vehicle_id, signature, driver_name, plate_number }

Backend Actions by Status:
- 'en_route' + vehicle_id provided → SET vehicles.status='en_route'
- 'delivered' or 'completed' → SET vehicles.status='available'
- Any status → notify admin
- 'delivered'/'completed' → notify customer role too
```

**IMPORTANT:** Delivery status does NOT auto-update order status. Orders must be manually updated.

---

## MENU: Fleet (Vehicles)

**API:** `GET/POST/PUT/DELETE /api/logistics/vehicles`

**Roles:** Create/Update/Delete: super_admin, admin, logistics

**Vehicle Status:**
- `available` (default)
- `en_route` (set when delivery is en_route)
- `maintenance`, `decommissioned` (manual set)

**Vehicle automatically becomes 'available' when delivery is marked 'delivered' or 'completed'**

---

## MENU: Routes

**API:** `GET/POST/PUT/DELETE /api/logistics/routes`

**Roles:** Create/Update/Delete: super_admin, admin, logistics

**Fields:** company_id, name, start_location, end_location, distance_km, estimated_time

**NOT CONNECTED to deliveries automatically** — reference only

---

## TRACKING FLOW

**How Tracking Works:**
```
No dedicated tracking table in backend
Tracking is done via:
1. deliveries.status updates (dispatched/en_route/delivered/completed)
2. missions.status updates (assigned/en_route/completed)
3. Frontend ClientTracking page reads from deliveries + orders

Customer tracking:
→ GET /api/orders (filtered by created_by = customer)
→ GET /api/logistics/deliveries (filtered by company + order_id)
```

**⚠️ NOT FOUND IN BACKEND:** Real-time GPS tracking table or live location updates

---

# MODULE 5: PROCUREMENT

## MENU: Purchase Requests

**Purpose:** Request to purchase items for company operations.

**DB Table:** `purchase_requests`

**API:** `GET/POST/PUT/DELETE /api/procurement/requests`

**Roles:** Any authenticated user can create. No role restriction.

**Flow:**
```
1. Any staff creates purchase request
2. POST /api/procurement/requests
   { item_name/items(JSON), category, quantity, estimated_cost, priority, notes, department }
3. Backend:
   a. Resolves item_name from: explicit or first item in JSON array
   b. Resolves quantity from: explicit or first item qty
   c. Sets requester = req.user.name
   d. Notifications to: procurement + admin
4. PR appears in /dashboard/purchase-requests
```

**Status:** No default status set on creation. Manual update required.

**Status Values (manual):** Pending, Approved, Rejected, Received, Cancelled

---

## MENU: Quotes

**Purpose:** Get price quotes from vendors for purchase requests.

**DB Table:** `quotes`

**API:** `GET/POST/PUT/DELETE /api/procurement/quotes`

**Roles:** Create/Update/Delete: super_admin, admin, procurement

**Flow:**
```
1. Procurement creates quote linked to vendor + optionally PR
2. POST /api/procurement/quotes
   { vendor_id/vendorId, purchase_request_id, items(JSON), total_amount, validity_date, status }
3. Default status = 'Pending'
4. Notifications to: procurement + admin
```

---

## MENU: Purchase Orders

**Purpose:** Formal order placed with vendor after quote acceptance.

**DB Table:** `purchase_orders`

**API:** `GET/POST/PUT /api/procurement/po`
**Receive Goods:** `PUT /api/procurement/po/:id/receive`

**Roles:** Create/Update: super_admin, admin, procurement
**Receive:** super_admin, admin, procurement, inventory

**PO Creation Flow:**
```
1. Procurement creates PO linked to vendor
2. POST /api/procurement/po { vendor_id, items(JSON), total_amount, notes }
3. Notifications to: procurement + admin + inventory
```

**Receive Goods Flow (CRITICAL — AUTO INVENTORY SYNC):**
```
1. PUT /api/procurement/po/:id/receive
   { receivedItems: [{ id/name, receivedQty/receivedNow }] }
2. For each received item:
   a. Find matching item in PO by id or name
   b. Add to item.received_qty
3. Check if ALL items fully received → allReceived = true/false
4. AUTO INVENTORY SYNC:
   For each item with qty received now > 0:
   a. Look up inventory by: name + company_id
   b. If EXISTS → UPDATE quantity += received_qty
                   status = 'in_stock' (if qty > 10) / 'low_stock'
   c. If NOT EXISTS → INSERT new inventory item
5. PO status: allReceived → 'Received', else → 'Partially Received'
6. Notifications to: procurement + inventory + admin
```

**PO → Inventory is AUTOMATIC via receiveGoods**

---

# MODULE 6: INVENTORY

## MENU: Stock Management (StockHub)

**Purpose:** Manage all physical stock. Auto-updated when PO goods received.

**DB Table:** `inventory`, `inventory_movements`

**API:** `GET/POST/PUT/DELETE /api/inventory`

**Roles:**
- View: All roles (customers see ONLY Marketplace type items)
- Create: super_admin, admin, inventory, procurement
- Update/Delete: super_admin, admin, inventory

**Inventory Types:** Marketplace (visible to customers), Internal, Client

**Status (auto-calculated):**
```
quantity = 0           → out_of_stock
quantity <= threshold  → low_stock (default threshold = 10)
quantity > threshold   → in_stock
```

**Stock Adjustment Flow:**
```
POST /api/inventory/:id/adjust
{ quantity, type: 'entry'/'issue'/'loss', reference_type, reference_id, reason }

entry: newQty = currentQty + qty
issue: newQty = MAX(0, currentQty - qty)
loss:  newQty = MAX(0, currentQty - qty)
other: newQty = qty (direct override)

Status auto-recalculated after adjustment
If status = low_stock/out_of_stock:
  → Notify inventory role + admin
Logs to inventory_movements
```

**Low Stock Alert:** Auto-notified when stock drops to low_stock or out_of_stock

---

## MENU: Warehouses

**DB Table:** `warehouses`

**Fields:** company_id, name, location, capacity, manager_id, status

**Status:** active, inactive, maintenance

**NOTE:** manager_id is FK to users table — manager dropdown in UI loads from `/api/users`

---

# MODULE 7: STAFF

## MENU: Staff Assignments

**Purpose:** Delegate specific tasks to field staff.

**DB Table:** `staff_assignments`

**API:** `GET/POST/PUT /api/staff/assignments`

**Roles:** Any (admin/manager see all; staff see only their own)

**Flow:**
```
1. Admin creates assignment
2. POST /api/staff/assignments
   { assignee_id, task, location, priority, mission_type,
     passenger_name, pickup_time, drop_location, ... }
3. Default status = 'Pending'
4. Notifications to: assignee_id (user) + admin
5. Staff sees their assignments in Employee Portal
```

**Assignment Logic:** FULLY MANUAL — Admin selects specific staff member by ID

---

## MENU: Clock In / Clock Out

**API:** `POST /api/staff/clock-in` / `POST /api/staff/clock-out`

**DB Table:** `shifts`

**Flow:**
```
Clock In:
1. POST /api/staff/clock-in { location }
2. Check: no active shift (clock_out IS NULL) — if active → error
3. Insert shift: clock_in=NOW(), location
4. Update user: is_available=TRUE

Clock Out:
1. POST /api/staff/clock-out
2. Find last active shift (clock_out IS NULL)
3. Update: clock_out=NOW(), duration_hours=TIMESTAMPDIFF
4. Update user: is_available=FALSE
```

---

## MENU: Leave Requests

**DB Table:** `leave_requests`

**API:** `GET/POST/PUT /api/staff/leave`

**Flow:**
```
Staff submits:
POST /api/staff/leave { leave_type, start_date, end_date, reason }
→ Notify admin

Admin approves/rejects:
PUT /api/staff/leave/:id { status: 'approved'/'rejected' }
→ reviewed_by = admin id
→ Notify staff member
```

**Leave Types (DB ENUM):** vacation, sick, personal, bereavement

---

# MODULE 8: CONCIERGE

## MENU: Luxury Items (Vault)

**Purpose:** Track high-value items stored in secure vault.

**DB Table:** `luxury_items`

**API:** `GET/POST/PUT/DELETE /api/concierge/luxury-items`

**Roles:** Create/Update/Delete: super_admin, admin, concierge

**Status:** Stored (default), In Use, Transferred, Returned

**Flow:**
```
1. Concierge adds item to vault
2. POST /api/concierge/luxury-items
   { item_name, owner_name, vault_location, estimated_value, notes }
3. Default status = 'Stored'
4. Company-scoped
```

## MENU: Events

**DB Table:** `events`

**⚠️ Events CRUD is in support routes (`/api/support/events`), NOT in concierge routes directly**

---

# MODULE 9: ADMIN PANEL

## MENU: Clients (/dashboard/clients)

**Purpose:** SuperAdmin manages all company accounts (SaaS, Business, Personal).

**Tabs:**
- SaaS Clients → companies where client_type='SaaS' AND tenant_type='saas'
- Business Clients → companies where client_type='Business' OR tenant_type='business'
- Website Clients → from saas_requests table

**Approve/Activate Flow:**
```
PUT /api/clients/:id { status: 'active' }
→ If email exists and no user yet → auto-creates login credentials
→ Sends welcome email
```

---

## MENU: HQ Personnel (/dashboard/users)

**Purpose:** Admin manages internal staff.

**Tabs:** Personnel, Pending, Live Status, Absence, Time Logs, Vault, Missions

**Add Staff Flow:**
```
SuperAdmin → adds Admin (role='admin', company_id defaults to 1)
Admin → adds Operations/Logistics/Inventory/Procurement/Concierge/Staff
         (all get company_id = admin's company_id)
POST /api/users { name, email, password, phone, role,
                  birthday, bank_name, account_number,
                  routing_number, nib_number, vacation_balance }
```

---

## MENU: Plans (/dashboard/plans)

**DB Table:** `saas_plans`

**Fields:** name, price, billing_cycle, features(JSON), max_users, max_orders, status

**Status:** active, inactive

---

# MODULE 10: CUSTOMER (Personal User)

## MENU: Marketplace (/dashboard/store)

**Purpose:** Browse and order products.

**Inventory shown:** Only items with inventory_type='Marketplace'

**Order Flow:**
```
1. Customer browses catalog → adds to cart (frontend only, no API)
2. Opens cart → enters delivery address (REQUIRED)
3. Selects logistics mode: Road/Sea/Air
4. "Confirm Dispatch"
5. POST /api/orders
   { items, delivery_address, location, type='Marketplace Protocol',
     company_id = 1 (default ZaneZion HQ) }
6. Order status = 'admin_review'
7. Admin sees in /dashboard/orders
```

---

## MENU: My Orders (/dashboard/client-orders)

**Shows:** All orders where created_by = customer's user ID

**Tracking:** Read delivery status from `/api/logistics/deliveries` by order_id

---

# ROLE-BY-ROLE VISIBILITY SUMMARY

| Menu | superadmin | admin | operations | procurement | logistics | inventory | concierge | staff | customer |
|------|-----------|-------|-----------|------------|---------|----------|----------|-------|---------|
| Orders | ALL | Company | Assigned/Stage | Assigned/Stage | Assigned/Stage | Assigned/Stage | ❌ | ❌ | Own only |
| Projects | ALL | Company | Company | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Missions | ALL | Company | Company | ❌ | Company | ❌ | ❌ | ❌ | ❌ |
| Deliveries | ALL | Company | Company | ❌ | Company | ❌ | ❌ | ❌ | ❌ |
| Inventory | ALL | Company | ❌ | Company | ❌ | Company | ❌ | ❌ | Marketplace only |
| Purchase Requests | ALL | Company | ❌ | Company | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quotes/PO | ALL | Company | ❌ | Company | ❌ | PO receive | ❌ | ❌ | ❌ |
| Fleet | ALL | Company | ❌ | ❌ | Company | ❌ | ❌ | ❌ | ❌ |
| Staff | ALL | Company | ❌ | ❌ | ❌ | ❌ | ❌ | Own only | ❌ |
| Luxury Items | ALL | Company | ❌ | ❌ | ❌ | ❌ | Company | ❌ | ❌ |

---

# DELIVERY LIFECYCLE (COMPLETE)

```
STEP 1: Order Created
  Customer/Admin → POST /api/orders
  DB: orders (status=admin_review or created)

STEP 2: Admin Reviews & Assigns to Logistics
  Admin → PUT /api/orders/:id/assign { stage:'logistics' }
  DB: orders (current_stage=logistics), order_flow_logs (new entry)

STEP 3: Create Mission from Order
  Operations/Admin → POST /api/missions/convert/:orderId
  DB: missions (status=pending, order_id linked)
  DB: orders (status=in_progress)

STEP 4: Assign Driver to Mission
  Logistics → POST /api/missions/:id/assign { driverId, vehicleId }
  DB: missions (status=assigned, assigned_driver=driverId)

STEP 5: Create Delivery Record
  Logistics → POST /api/logistics/deliveries
  { order_id, driver_name, plate_number, pickup_location, drop_location }
  DB: deliveries (status=pending)

STEP 6: Dispatch (status update)
  Logistics → PATCH /api/logistics/deliveries/:id/status { status:'dispatched' }
  DB: deliveries (status=dispatched)
  Notification → admin

STEP 7: En Route
  Logistics → PATCH /api/logistics/deliveries/:id/status { status:'en_route', vehicle_id }
  DB: deliveries (status=en_route)
  DB: vehicles (status=en_route) ← AUTO
  Notification → admin

STEP 8: Delivered
  Logistics → PATCH /api/logistics/deliveries/:id/status { status:'delivered' }
  DB: deliveries (status=delivered)
  DB: vehicles (status=available) ← AUTO
  Notification → admin + customer

STEP 9: Mark Order Complete (MANUAL — NOT AUTO)
  Admin → PATCH /api/orders/:id/status { status:'completed' }
  DB: orders (status=completed)

⚠️ IMPORTANT: Delivery 'delivered' does NOT auto-update order status.
   Admin must manually mark order as completed.
```

---

# ⚠️ GAPS FOUND IN BACKEND

| Feature | Status |
|---------|--------|
| Real-time GPS tracking | NOT FOUND IN BACKEND |
| Auto order completion when delivery delivered | NOT IMPLEMENTED |
| Auto stage assignment (no manual selection needed) | NOT IMPLEMENTED |
| Payment processing (SaaS fee, checkout) | NOT IMPLEMENTED (UI only) |
| Chauffeur dedicated flow | Partially — uses deliveries with mission_type='chauffeur', notifies concierge |
| Warehouse routes | Controller exists but routes file NOT found |
| Email notifications on approval | EXISTS (sendMail in customerController) |
| Status validation on orders | NOT VALIDATED — accepts any string |
| Mission status default | NOT SET on creation |
| PR status default | NOT SET on creation |

---

# 🧪 TEST SEQUENCE (Step-by-Step)

```
1. Login: admin@zanezion.com / admin123 (SuperAdmin)
2. Add Admin user → /dashboard/users → New User (role=admin)
3. Admin login → Add Operations/Logistics/Procurement/Inventory staff
4. Customer signup → /signup (Personal Account)
5. Customer login → Marketplace → Add items → Enter address → Place order
6. Admin panel → /dashboard/orders → order appears (status=admin_review)
7. Admin → Assign to Stage = 'operation'
8. Operations login → order appears in their dashboard
9. Operations → Convert to Project
10. Operations → Create Mission from Project
11. Logistics login → Assign Driver + Vehicle to Mission
12. Logistics → Create Delivery record
13. Logistics → Update status: dispatched → en_route → delivered
14. Customer → Track Delivery page → sees status updates
15. Admin → Manually update order status to 'completed'
16. Procurement → Create Purchase Request → Quote → PO
17. Inventory → Receive Goods against PO → inventory auto-updated
```

---
*Generated: 2026-04-30 | Based on actual backend code analysis*
