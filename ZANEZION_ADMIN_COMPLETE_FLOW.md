# ZANEZION - Institutional Admin (Client Role) Complete Flow Report

**Note:** In this system, the **Client role** functions as the **Institutional Admin**. This user has full control over their company's staff, inventory, logistics, and customers.

---

## 1. ADMIN DASHBOARD & MENU OVERVIEW

| Menu Module | Purpose | Key Actions |
|---|---|---|
| **Dashboard** | Overview of Business Health | View stats (Revenue, Orders, Staff, Missions). |
| **Customers** | CRM & Client Management | Manage your company's own customers/SaaS clients. |
| **Orders** | Incoming Demand Management | Review, Approve, and Process incoming orders. |
| **Staff Management** | Human Resources | Add staff, assign roles, approve documents. |
| **Security Protocol** | Access Control | Set granular menu permissions for your staff. |
| **Supply Chain** | Procurement | Vendors, Purchase Requests, Quotes, POs. |
| **Inventory Hub** | Warehouse Control | Stock levels, Warehouse management, Alerts. |
| **Logistics** | Fleet & Dispatch | Manage Missions, Deliveries, Fleet, and Tracking. |
| **Finance & Payroll** | Accounting | View Invoices, Process Payroll, View Reports. |
| **Concierge** | VIP Services | Manage VIP Events, Guest Requests, Luxury Vault. |

---

## STEP-BY-STEP OPERATIONAL FLOW (ADMIN PERSPECTIVE)

### PHASE 1: TEAM & SECURITY SETUP

| Step | Action | Page | Expected Result |
|:---|:---|:---|:---|
| 1.1 | Login as Admin (`client` role) | Login Page | Admin Dashboard loads |
| 1.2 | Go to Security Protocol | Sidebar > Security Protocol | View list of roles (Ops, Proc, etc.) |
| 1.3 | Set Menu Permissions | Click Role > Toggle Menus | Define what your employees can see in their sidebar |
| 1.4 | Onboard Staff | Sidebar > Staff Management | Click Add > Fill details (Role: Operations, etc.) |
| 1.5 | Audit Staff Docs | Staff Management > Audits | Review and Approve/Reject pending staff documents |

---

### PHASE 2: PROCUREMENT & INVENTORY

| Step | Action | Page | Expected Result |
|:---|:---|:---|:---|
| 2.1 | Manage Vendors | Sidebar > Vendors | Add suppliers and rate their performance |
| 2.2 | Create Purchase Request | Sidebar > Purchase Requests | Add item needs (e.g., "50 Chairs") |
| 2.3 | Get Vendor Quotes | Sidebar > Quotes | Receive and compare price quotes from vendors |
| 2.4 | Issue Purchase Order | Sidebar > Purchase Orders | Finalize PO with selected vendor |
| 2.5 | Receive Stock | Purchase Orders > Receive | Stock is added to Inventory Hub automatically |
| 2.6 | Manage Warehouses | Sidebar > Warehouses | Organize stock across different physical locations |

---

### PHASE 3: CRM & ORDER MANAGEMENT

| Step | Action | Page | Expected Result |
|:---|:---|:---|:---|
| 3.1 | Manage Customers | Sidebar > Customers | View/Edit your business customers' profiles |
| 3.2 | Review New Orders | Sidebar > Orders | Pending orders from your customers appear here |
| 3.3 | Approve Order | Order Detail > Status: Approved | Moves order to "Processing" state |
| 3.4 | Process Fulfillment | Orders > Convert | Convert to Project (Long-term) or Mission (Delivery) |

---

### PHASE 4: LOGISTICS & EXECUTION

| Step | Action | Page | Expected Result |
|:---|:---|:---|:---|
| 4.1 | Fleet Management | Sidebar > Fleet | Add vehicles and assign them to missions |
| 4.2 | Route Planning | Sidebar > Routes | Define standard delivery routes |
| 4.3 | Active Missions | Sidebar > Missions | Assign a driver and vehicle to a mission |
| 4.4 | Real-time Tracking | Sidebar > Tracking | View live location of your fleet on the map |
| 4.5 | Dispatch Urgent Tasks | Sidebar > Urgent | Handle priority deliveries or logistics emergencies |

---

### PHASE 5: FINANCE, PAYROLL & REPORTS

| Step | Action | Page | Expected Result |
|:---|:---|:---|:---|
| 5.1 | Invoice Management | Sidebar > Invoices | Review all generated invoices (Auto-created on delivery) |
| 5.2 | Process Payroll | Sidebar > Payroll | View worked hours and calculate staff pay |
| 5.3 | Financial Reports | Sidebar > Reports | Generate Revenue vs. Expense charts |
| 5.4 | Leave Management | Sidebar > Leave & Absence | Approve or Reject staff leave requests |

---

### PHASE 6: VIP CONCIERGE SERVICES

| Step | Action | Page | Expected Result |
|:---|:---|:---|:---|
| 6.1 | Event Planning | Sidebar > Events | Create and manage corporate or guest events |
| 6.2 | Guest Requests | Sidebar > Guest Requests | Manage personalized VIP tasks (Airport pickups, etc.) |
| 6.3 | Luxury Item Vault | Sidebar > Luxury Items | Track high-value items separately from general stock |
| 6.4 | Access Plans | Sidebar > Security Protocol | Manage VIP access tiers and credentials |

---

## ADMIN CONTROL CHECKLIST (For Testing)

- [ ] **Permissions**: Can I restrict my "Logistics" staff from seeing "Payroll"?
- [ ] **Customer Creation**: Can I add a new customer and see them in the "Orders" filter?
- [ ] **Stock Sync**: When I mark a PO as "Received", does the Inventory quantity update?
- [ ] **Mission Control**: Can I assign a driver who is currently "Clocked In"?
- [ ] **Invoice Logic**: Does an invoice automatically generate when a mission is marked "Delivered"?
- [ ] **Staff Audit**: Can I see the police record/ID card of a pending staff member?

---
**Tested By:** _______________  
**Date:** _______________  
**Overall Result:** _______________
