  # ZANEZION - Complete Project Flow & Testing Report
### Date: 28 March 2026

---

## 9 DASHBOARDS & THEIR ROLES

| # | Role | Login | Dashboard | Kya Karta Hai |
|---|------|-------|-----------|---------------|
| 1 | Super Admin | admin@zanezion.com | Admin Dashboard | Poora system manage karta hai - clients, staff, orders, reports, permissions |
| 2 | Operations | operation@example.com | Operations Dashboard | Orders ko projects/missions me convert karta hai, staff assign karta hai |
| 3 | Procurement | procurement@example.com | Procurement Dashboard | Purchase requests, vendor quotes, purchase orders manage karta hai |
| 4 | Logistics | logistics@example.com | Logistics Dashboard | Fleet, drivers, routes, deliveries, tracking manage karta hai |
| 5 | Inventory | inventory@example.com | Inventory Dashboard | Stock levels, warehouses, alerts, stock movements manage karta hai |
| 6 | Concierge | demo1@example.com | Concierge Dashboard | VIP guest requests, events, luxury items, chauffeur manage karta hai |
| 7 | Client | john@client.com | Client Dashboard | Orders place karta hai, deliveries track karta hai, invoices pay karta hai |
| 8 | SaaS Client | (provisioned by admin) | SaaS Dashboard | Limited portal - events, orders, settings |
| 9 | Staff | staff@example.com | Staff Terminal | Assignments dekh ta hai, clock in/out, leave apply karta hai |

**Password sabka:** `123456`

---

## STEP-BY-STEP COMPLETE FLOW (Kya Pehle, Kya Baad Me)

---

### PHASE 1: SYSTEM SETUP (Super Admin)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 1.1 | Login as Super Admin | Login Page | Admin Dashboard loads |
| 1.2 | Go to Security Protocols | Sidebar > Security Protocols | Roles list dikhega (Super Admin, Operations, etc.) |
| 1.3 | Set permissions for each role | Click each role, toggle menus | Save karo - ye decide karta hai kisko kya dikhega sidebar me |
| 1.4 | Go to Staff Management | Sidebar > Staff Management | Staff list dikhegi |
| 1.5 | Add Operations staff | Click Add > Fill form > Role: Operations | Naya operations user banega |
| 1.6 | Add Procurement staff | Click Add > Fill form > Role: Procurement | Naya procurement user banega |
| 1.7 | Add Logistics staff | Click Add > Fill form > Role: Logistics | Naya logistics user banega |
| 1.8 | Add Inventory staff | Click Add > Fill form > Role: Inventory | Naya inventory user banega |
| 1.9 | Add Concierge staff | Click Add > Fill form > Role: Concierge | Naya concierge user banega |

**Result:** Sab roles ke users ban gaye, ab system use ho sakta hai.

---

### PHASE 2: CLIENT ONBOARDING (Super Admin)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 2.1 | Go to SaaS Clients page | Sidebar > SaaS Clients | Client list dikhegi with toggle (SaaS / Personal) |
| 2.2 | Click "Personal Clients" tab | Toggle button | Personal clients dikhenge |
| 2.3 | Click "Add Personal Client" | Button top-right | Modal opens at top |
| 2.4 | Fill client details (name, email, phone, password) | Modal form | Form accepts input |
| 2.5 | Click "Register Client" | Modal button | Client created - credentials shown |
| 2.6 | Switch to "SaaS Clients" tab | Toggle button | SaaS clients dikhenge (personal client yaha NAHI dikhega) |
| 2.7 | Click "Add SaaS Client" | Button top-right | Modal opens |
| 2.8 | Fill SaaS client details | Modal form | Form accepts input |
| 2.9 | Click "Register Client" | Modal button | SaaS client created with auto-generated password |

**Result:** Personal aur SaaS clients alag-alag ban gaye. Dono ka data isolated hai.

---

### PHASE 3: VENDOR SETUP (Super Admin / Procurement)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 3.1 | Go to Vendors | Sidebar > Vendors | Vendor list dikhegi |
| 3.2 | Click "Add Vendor" | Button top-right | Modal opens |
| 3.3 | Fill vendor details (name, email, category, rating) | Modal form | Form accepts input |
| 3.4 | Save vendor | Modal button | Vendor created |

**Result:** Vendors ready hain procurement ke liye.

---

### PHASE 4: INVENTORY SETUP (Inventory / Super Admin)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 4.1 | Login as Inventory role | Login page | Inventory Dashboard loads |
| 4.2 | Go to StockHub | Sidebar > StockHub | Inventory list dikhegi |
| 4.3 | Add inventory items | Click Add > Fill (name, SKU, qty, price, warehouse) | Item added |
| 4.4 | Set item type = "Marketplace" | Type dropdown | Item visible to clients in their marketplace |
| 4.5 | Set item type = "Client" | Type dropdown | Item visible only to specific client |
| 4.6 | Go to Warehouses | Sidebar > Warehouse | Warehouse list dikhegi |
| 4.7 | Add warehouse | Click Add > Fill details | Warehouse created |

**Result:** Stock ready hai orders fulfill karne ke liye.

---

### PHASE 5: CLIENT PLACES ORDER (Client Portal)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 5.1 | Login as Client (john@client.com) | Login page | Client Dashboard loads |
| 5.2 | Go to Marketplace | Sidebar > Marketplace | Available items dikhenge (Marketplace type only) |
| 5.3 | Add items to cart | Click Add to Cart | Cart count increases |
| 5.4 | Checkout | Cart > Proceed to Checkout | Order summary dikhega |
| 5.5 | Confirm order | Click Place Order | Order created, status: "pending_review" |
| 5.6 | Go to My Orders | Sidebar > My Orders | Order dikhega with "Pending" status |

**Result:** Client ne order place kar diya. Ab Super Admin/Operations ko dikhega.

---

### PHASE 6: ORDER APPROVAL (Super Admin)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 6.1 | Login as Super Admin | Login page | Dashboard loads |
| 6.2 | Check Recent Operations Ledger | Dashboard bottom section | Client ka order dikhega - "Pending Review" |
| 6.3 | Go to Orders | Sidebar > Orders | All orders list with pending order |
| 6.4 | Click on pending order | Table row | Order details modal |
| 6.5 | Approve order | Status dropdown > "Approved" > Save | Order status: "Approved" |

**Result:** Order approved. Ab Operations ko assign hoga.

---

### PHASE 7: ORDER TO PROJECT/MISSION (Operations)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 7.1 | Login as Operations | Login page | Operations Dashboard loads |
| 7.2 | See approved orders | Orders tab | Approved orders dikhenge |
| 7.3 | **Option A:** Convert to Project | Click Convert to Project button | Project created from order |
| 7.4 | **Option B:** Convert to Mission | Click Convert to Mission | Mission created for delivery |
| 7.5 | Assign staff to project/mission | Assignment modal > Select staff | Staff assigned, task created |

**Result:** Order ab ya toh Project ban gaya ya Mission ban gaya.

---

### PHASE 8: PROCUREMENT (If Stock Needed)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 8.1 | Login as Procurement | Login page | Procurement Dashboard loads |
| 8.2 | Check Purchase Requests | Priority Purchase Requests section | Pending PRs dikhenge |
| 8.3 | Create new PR (if needed) | Click New Request | PR form opens |
| 8.4 | Fill PR details (item, qty, department) | PR form | PR created, status: "Pending" |
| 8.5 | Go to Vendors | Sidebar > Vendors | Vendor list |
| 8.6 | Request Quote from vendor | Quotes tab > New Quote | Quote request sent |
| 8.7 | Compare quotes | Quotes tab > Live Quote Market | Side-by-side comparison |
| 8.8 | Select best quote | Click Select | Quote approved |
| 8.9 | Create Purchase Order | PO tab > New PO | PO created from selected quote |
| 8.10 | PO sent to vendor | PO status: "Pending" | Vendor processes PO |

**Flow:** PR -> Quote -> Compare -> PO -> Vendor delivers goods

---

### PHASE 9: GOODS RECEIVING (Inventory)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 9.1 | Login as Inventory | Login page | Inventory Dashboard loads |
| 9.2 | Vendor delivers goods | Physical delivery | Goods arrive at warehouse |
| 9.3 | Receive goods against PO | PO > Mark Received | Stock qty updated in inventory |
| 9.4 | Check stock levels | StockHub | Updated quantities dikhenge |
| 9.5 | Check alerts | Alerts tab | Low stock alerts cleared (if restocked) |

**Result:** Inventory updated, goods ready for order fulfillment.

---

### PHASE 10: LOGISTICS & DELIVERY

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 10.1 | Login as Logistics | Login page | Logistics Dashboard loads |
| 10.2 | Check Active Missions | Missions tab | Assigned missions dikhenge |
| 10.3 | Assign driver to mission | Click Assign > Select driver, vehicle | Driver assigned |
| 10.4 | Set route | Routes tab > Assign route | Route mapped |
| 10.5 | Dispatch vehicle | Dispatch button | Vehicle status: "On Mission" |    
| 10.6 | Track delivery | Tracking tab | Real-time location |
| 10.7 | Driver completes delivery | Status > "Delivered" | Delivery marked complete |
| 10.8 | Capture POD | Signature + Photo | Proof of Delivery saved |

**Result:** Goods delivered to client.

---

### PHASE 11: CLIENT RECEIVES & PAYS

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 11.1 | Login as Client | Login page | Client Dashboard loads |
| 11.2 | Check delivery status | Track Delivery | Shows "Delivered" |
| 11.3 | Go to Invoices | Sidebar > Invoices | Invoice dikhega with amount |
| 11.4 | Pay invoice | Click Pay > Select payment method | Invoice status: "Paid" |

**Result:** Order complete, payment received. Full cycle done.

---

### PHASE 12: EVENTS (Concierge / Client / SaaS)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 12.1 | Login as Super Admin | Login page | Dashboard loads |
| 12.2 | Go to Events | Sidebar > Events | ONLY Super Admin ke events dikhenge |
| 12.3 | Create event "Admin Gala" | Schedule Event button | Event saved |
| 12.4 | Logout, Login as Client | Login page | Client Dashboard |
| 12.5 | Go to Concierge Events | Sidebar > Concierge Events | ONLY client ke events dikhenge, "Admin Gala" NAHI dikhega |
| 12.6 | Create event "Client Party" | Request New Event | Event saved |
| 12.7 | Logout, Login as SaaS Client | Login page | SaaS Dashboard |
| 12.8 | Go to Events | Sidebar > Concierge | ONLY SaaS client ke events dikhenge |
| 12.9 | Create event "SaaS Conference" | Request New Event | Event saved |
| 12.10 | Logout, Login as Super Admin | Login page | Dashboard |
| 12.11 | Go to Events | Sidebar > Events | "Admin Gala" dikhega, "Client Party" aur "SaaS Conference" NAHI dikhega |

**ISOLATION RULE:** Har user sirf apne events dekhta hai (manager_id = logged-in user ka ID)

---

### PHASE 13: STAFF MANAGEMENT

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 13.1 | Login as Operations/Super Admin | Login page | Dashboard loads |
| 13.2 | Go to Staff Management | Sidebar > Staff Management | Staff list |
| 13.3 | Assign task to staff | Users page > Delegate Mission | Task created |
| 13.4 | Login as Staff | Login page | Staff Terminal loads |
| 13.5 | Check My Assignments | Assignments tab | Assigned task dikhega |
| 13.6 | Clock In | Dashboard > Clock In button | Shift started |
| 13.7 | Complete task | Assignment > Mark Complete | Task status: "Completed" |
| 13.8 | Clock Out | Dashboard > Clock Out button | Shift ended, hours recorded |
| 13.9 | Apply for leave | Leave tab > New Request | Leave request submitted |
| 13.10 | Login as Super Admin | Login page | Dashboard |
| 13.11 | Approve leave | Staff Management > Leave tab | Leave approved/rejected |

---

### PHASE 14: SaaS CLIENT PROVISIONING (Landing Page)

| Step | Action | Page | Expected Result |
|------|--------|------|-----------------|
| 14.1 | Open landing page | / (root URL) | Landing page with plans |
| 14.2 | Click "Activate" on any plan | Plan card | Request form opens |
| 14.3 | Fill company name, email, phone | Form | Form accepts input |
| 14.4 | Submit | Submit button | "Request Submitted" message |
| 14.5 | Login as Super Admin | Login page | Dashboard |
| 14.6 | Go to SaaS Management | Sidebar > SaaS Management | Pending request dikhega |
| 14.7 | Approve request | Click Approve | Client provisioned, credentials generated |
| 14.8 | New SaaS client logins with credentials | Login page | SaaS Dashboard loads |

---

## DATA FLOW DIAGRAM

```
LANDING PAGE                    SUPER ADMIN
    |                               |
    | Subscribe Request             | Approve + Provision
    v                               v
+----------+    Credentials    +----------+
| SaaS Req | ───────────────> | SaaS User|
+----------+                  +----------+
                                   |
                                   | Login
                                   v
CLIENT PORTAL ──── Place Order ──── > ORDERS
                                        |
                            +-----------+-----------+
                            |                       |
                     Convert to Project      Convert to Mission
                            |                       |
                            v                       v
                       PROJECTS              MISSIONS/DELIVERIES
                            |                       |
                            |              +--------+--------+
                            |              |                 |
                            |        Assign Driver     Assign Vehicle
                            |              |                 |
                            v              v                 v
                    STAFF ASSIGNMENTS    LOGISTICS         FLEET
                            |              |
                            |         Track & Deliver
                            |              |
                            v              v
                    TASK COMPLETION    DELIVERY + POD
                                          |
                                    Generate Invoice
                                          |
                                          v
                                      INVOICES
                                          |
                                    Client Pays
                                          |
                                          v
                                      PAYMENTS
                                    (Order Complete)


PROCUREMENT FLOW (Parallel):

Low Stock Alert ──> PURCHASE REQUEST ──> VENDOR QUOTES ──> PURCHASE ORDER ──> GOODS RECEIVED ──> INVENTORY UPDATED
```

---

## WHO CREATES WHAT & WHERE IT GOES

| Kaun Create Karta Hai | Kya Create Karta Hai | Kisko Dikhta Hai |
|----------------------|---------------------|------------------|
| **Super Admin** | Staff users, Clients (Personal/SaaS), Plans, Permissions | Sabko role ke according |
| **Super Admin** | Events (apne) | SIRF Super Admin ko |
| **Client** | Orders (Marketplace/Custom), Event Requests | Client ko + Super Admin/Operations ko (orders) |
| **Client** | Events (apne) | SIRF us Client ko |
| **SaaS Client** | Events (apne), Orders | SIRF us SaaS Client ko |
| **Operations** | Projects (from orders), Missions, Staff Assignments | Operations + Logistics + Assigned Staff |
| **Procurement** | Purchase Requests, Quotes, Purchase Orders | Procurement + Super Admin |
| **Logistics** | Deliveries, Route assignments, Vehicle dispatch | Logistics + Operations + Client (tracking) |
| **Inventory** | Stock entries, Warehouse management | Inventory + Super Admin |
| **Concierge** | Guest Requests, Luxury Items, VIP Plans | Concierge + Super Admin |
| **Staff** | Clock In/Out, Leave Requests, Task Updates | Staff + Operations + Super Admin |
| **Landing Page Visitor** | Subscription Request | Super Admin (for approval) |

---

## IMPORTANT ISOLATION RULES

1. **Events:** Har user SIRF apne banaye events dekhta hai (manager_id = user.id)
2. **Clients:** Personal clients aur SaaS clients alag-alag tabs me dikhte hain
3. **Orders:** Client sirf apne orders dekhta hai (client_id filter)
4. **Invoices:** Client sirf apni invoices dekhta hai
5. **Deliveries:** Client sirf apni deliveries track kar sakta hai
6. **Staff:** Staff sirf apne assignments aur payslips dekhta hai
7. **SaaS Client:** Limited portal - sirf events, orders, settings

---

## QUICK TEST CHECKLIST

| # | Test | Steps | Pass/Fail |
|---|------|-------|-----------|
| 1 | Super Admin login | admin@zanezion.com / 123456 | |
| 2 | Add Personal Client | SaaS Clients > Personal tab > Add | |
| 3 | Add SaaS Client | SaaS Clients > SaaS tab > Add | |
| 4 | Personal/SaaS toggle shows different data | Switch tabs | |
| 5 | Client login | Client credentials | |
| 6 | Client places order | Marketplace > Cart > Checkout | |
| 7 | Super Admin approves order | Orders > Approve | |
| 8 | Operations converts to mission | Orders > Convert to Mission | |
| 9 | Logistics assigns driver | Missions > Assign | |
| 10 | Delivery completed | Deliveries > Mark Delivered | |
| 11 | Client pays invoice | Invoices > Pay | |
| 12 | Event isolation - Super Admin | Create event > Only SA sees it | |
| 13 | Event isolation - Client | Create event > Only Client sees it | |
| 14 | Event isolation - SaaS | Create event > Only SaaS sees it | |
| 15 | Staff clock in/out | Staff Terminal > Clock In/Out | |
| 16 | Leave request | Staff > Leave tab > Apply | |
| 17 | Procurement flow | PR > Quote > PO > Receive | |
| 18 | Inventory alerts | Stock below threshold > Alert shows | |
| 19 | Permission changes reflect in sidebar | Security > Toggle menu > Logout/Login | |
| 20 | Landing page subscription | / > Subscribe > Admin approves | |

---

**Tested By:** _______________
**Date:** _______________
**Overall Result:** _______________
