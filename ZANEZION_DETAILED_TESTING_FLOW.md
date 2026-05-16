# ZANEZION - Comprehensive Functional Testing Flow (Role-Wise)

This report provides a step-by-step walkthrough of the system from the perspective of each role (excluding Super Admin). Use this to verify every menu and logic flow.

---

## 1. DASHBOARDS & ROLES SUMMARY

| # | Role | Login | Dashboard Module | Core Responsibility |
|---|------|-------|------------------|---------------------|
| 1 | **Client** | john@client.com | Client Dashboard | Places orders, tracks deliveries, pays invoices. |
| 2 | **SaaS Client** | provisioned | SaaS Dashboard | Simplified portal for events and limited orders. |
| 3 | **Operations** | ops@example.com | Operations Hub | Converts orders into Projects or Missions; assigns staff. |
| 4 | **Procurement** | proc@example.com | Supply Chain | Manages vendors, PRs, Quotes, and POs. |
| 5 | **Logistics** | log@example.com | Fleet & Dispatch | Assigns drivers/vehicles, tracks missions, POD. |
| 6 | **Inventory** | inv@example.com | StockHub | Manages stock levels, warehouses, and movements. |
| 7 | **Concierge** | vip@example.com | Concierge Suite | Manages VIP events, guest requests, and luxury items. |
| 8 | **Staff** | staff@example.com | Staff Terminal | Clock in/out, task updates, leave requests. |

**Default Password:** `123456` (or as set during registration)

---

## STEP-BY-STEP TESTING PHASES

### PHASE 1: PROCUREMENT & VENDOR SETUP (Procurement Role)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 1.1 | Login as Procurement | Login Page | Access to Procurement Dashboard |
| 1.2 | Add New Vendor | Sidebar > Vendors > "Add Vendor" | Vendor record created in `vendors` table |
| 1.3 | Create Purchase Request | Sidebar > Purchase Requests > "New" | PR status: `pending`. Notification sent to Admin |
| 1.4 | Request Quote | Sidebar > Quotes > "New Quote" | Link PR to Vendor; Quote status: `Pending` |
| 1.5 | Compare & Approve Quote | Sidebar > Quotes > Live Quote Market | Select best quote; status changes to `Approved` |
| 1.6 | Generate PO | Sidebar > Purchase Orders > "Create" | PO generated from Quote; Status: `Pending` |

---

### PHASE 2: INVENTORY & WAREHOUSING (Inventory Role)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 2.1 | Login as Inventory | Login Page | Access to StockHub Dashboard |
| 2.2 | Create Warehouse | Sidebar > Warehouse Management | New location available for stock |
| 2.3 | Add Item to Inventory | Sidebar > StockHub > "Add Item" | Item visible in inventory list |
| 2.4 | Receive Goods (PO) | Sidebar > Purchase Orders > "Receive" | `qty` increases; `inventory_movements` log created |
| 2.5 | Manual Adjustment | StockHub > "Adjust" button | Choose Entry/Issue/Loss; qty updates correctly |
| 2.6 | Check Low Stock Alerts | Sidebar > Alerts | Items below threshold (default 10) show here |

---

### PHASE 3: CLIENT ORDERING (Client Role)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 3.1 | Login as Client | Login Page | Access to Client Dashboard |
| 3.2 | Browse Marketplace | Sidebar > Marketplace | Only items with type='Marketplace' are visible |
| 3.3 | Add to Cart & Checkout | Cart Drawer > "Place Order" | Order created; Status: `pending_review` |
| 3.4 | Track My Orders | Sidebar > My Orders | Order visible; can see items and total amount |
| 3.5 | Request Custom Order | Sidebar > Support > "Custom Request" | Admin receives a notification for special sourcing |

---

### PHASE 4: OPERATIONS LIFECYCLE (Operations Role)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 4.1 | Login as Operations | Login Page | Access to Operations Dashboard |
| 4.2 | Review Client Order | Sidebar > Orders | Open the order placed in Phase 3 |
| 4.3 | Approve Order | Order Detail > Status: "Approved" | Order status updates; Client notified |
| 4.4 | Convert to Project | Order Row > "Convert to Project" | `projects` entry created; manager assigned |
| 4.5 | Launch Mission | Order Row > "Launch Mission" | `missions` entry created for Logistics to handle |
| 4.6 | Assign Staff | Project/Mission Detail > "Assign" | Staff selected gets task in their Terminal |

---

### PHASE 5: LOGISTICS & DISPATCH (Logistics Role)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 5.1 | Login as Logistics | Login Page | Access to Logistics Dashboard |
| 5.2 | Manage Fleet | Sidebar > Vehicles | CRUD operations on cars/trucks |
| 5.3 | Assign Mission | Sidebar > Active Missions > "Assign" | Link Vehicle + Driver to the Mission |
| 5.4 | Dispatch & Track | Sidebar > Live Tracking | Mission status: `en_route`. Driver status: `On Duty` |
| 5.5 | Complete Delivery | Sidebar > Deliveries > "Delivered" | POD (Signature/Photo) captured; Status: `delivered` |
| 5.6 | **Auto-Invoice Trigger** | (Background Logic) | Invoice generated in Finance module automatically |

---

### PHASE 6: CONCIERGE & EVENTS (Concierge / SaaS Client)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 6.1 | Login as Concierge | Login Page | Access to Concierge Suite |
| 6.2 | Create VIP Event | Sidebar > Events > "Add Event" | Event visible ONLY to Concierge/Admin |
| 6.3 | Handle Guest Request | Sidebar > Guest Requests | CRUD for specific VIP needs (e.g., "Airport Pick") |
| 6.4 | Manage Luxury Items | Sidebar > Luxury Vault | High-value inventory tracking |
| 6.5 | Login as SaaS Client | Login Page | Simplified SaaS Portal access |
| 6.6 | Request Event | Sidebar > Concierge > "Request Event" | Request sent to Concierge/Admin for approval |

---

### PHASE 7: STAFF TERMINAL (Field Staff Role)

| Step | Action | Menu / Page | Expected Result |
|:---|:---|:---|:---|
| 7.1 | Staff Registration | /staff-register | Submit docs; status: `pending` (needs Admin approval) |
| 7.2 | Clock In | Dashboard > "Clock In" | Active shift record created; location recorded |
| 7.3 | View Assignments | Assignments Tab | Tasks from Operations (Phase 4) appear here |
| 7.4 | Submit Task Update | Task Row > "Update Progress" | Operations can see the progress in real-time |
| 7.5 | Request Leave | Sidebar > Leave Management | Balance check (Vacation formula applied) |
| 7.6 | Clock Out | Dashboard > "Clock Out" | Duration calculated; availability set to `false` |

---

## DATA INTEGRITY & ISOLATION CHECKLIST

| Rule | Test Case | Expected Result |
|:---|:---|:---|
| **Company Isolation** | Logistics (Comp A) tries to see Mission (Comp B) | Forbidden / No data returned |
| **Event Privacy** | Client creates event; SaaS Client logs in | SaaS Client cannot see Client's event |
| **Inventory Link** | Receive PO for item "Wine" | StockHub quantity for "Wine" must increase |
| **Finance Trigger** | Mark Delivery as "Delivered" | New Unpaid Invoice must appear for the Client |
| **Role Guard** | Staff role tries to access `/api/vendors` | Status 403 Forbidden |

---

## QUICK TEST CHECKLIST (Final Verification)

- [ ] **Auth**: Login works for all 8 roles with correct dashboard redirect.
- [ ] **Procurement**: PR -> Quote -> PO -> Receive cycle is unbroken.
- [ ] **Inventory**: Manual adjustments create audit logs in `inventory_movements`.
- [ ] **Orders**: Client can only see "Marketplace" items, not internal items.
- [ ] **Finance**: Client can pay invoice; status changes from `unpaid` to `paid`.
- [ ] **Staff**: Cannot clock in twice without clocking out first.
- [ ] **SaaS**: Approval of SaaS request generates random password and sends email.

---
**Tested By:** _______________  
**Date:** _______________  
**Status:** [ PASS / FAIL / PENDING ]
