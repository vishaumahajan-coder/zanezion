# Portal menus — kaunse role par kaunse menu (reference)

Ye strings **`menu_permissions.menu_name`** ke liye hain aur backend **`SYSTEM_MENUS.name`** se **exact match** honi chahiye. Roles & Permissions screen par inhi names se tick karein.

Source of truth: `zanezion-backend/zanzoin-backend/config/systemMenus.js`  
Recommended presets (same names): `src/config/portalMenus.js` → `RECOMMENDED_MENU_NAMES_BY_PORTAL`

---

## Super Admin

| Sidebar label | DB menu name (`SYSTEM_MENUS`) |
|---------------|-------------------------------|
| Dashboard | Dashboard |
| Clients | Customers |
| Plans | _(abhi `SYSTEM_MENUS` mein Plans row nahi — agar permission use karni ho to pehle backend mein menu add karein)_ |
| Settings | Settings |

Super Admin user ko frontend mostly **static** menu milta hai (`Sidebar` → `menuItems.superadmin`). Baaki roles ke liye menu **login par aane wali `menuPermissions`** se banta hai.

---

## Company Admin (`admin`) — jo aap Super Admin se add karte ho

Ye **poori company** ka control panel hai. Recommended modules: `RECOMMENDED_MENU_NAMES_BY_PORTAL.admin` (same list as `portalMenus.js`).

Short grouping:

- **Core ops:** Dashboard, Customers, Orders, Projects, Missions, Deliveries, Inventory, Staff Management  
- **Money / reports:** Invoices, Payroll, Reports  
- **Support / settings:** Support, Settings, Security Protocol, Leave & Absence  
- **Supply chain:** Vendors, Purchase Requests, Quotes, Purchase Orders, Fleet, Warehouses  
- **Concierge / CX:** Chauffeur, Events, Guest Requests, Luxury Items  
- **Field:** Staff Terminal  

---

## Operations (`operation` in DB → app mein `operations`)

| Typical sidebar | DB name |
|-----------------|--------|
| Projects | Projects |
| Orders | Orders |
| Missions | Missions |
| Deliveries | Deliveries |
| Invoices | Invoices |
| Staff Terminal | Staff Terminal |
| Leave & Absence | Leave & Absence |
| Pay & Records | Pay & Records |

---

## Procurement (`procurement`)

| Typical sidebar | DB name |
|-----------------|--------|
| Purchase Requests | Purchase Requests |
| Vendors | Vendors |
| Quotes | Quotes |
| Purchase Orders | Purchase Orders |
| Invoices | Invoices |
| Audit Log | Audit Log |
| Leave / Pay | Leave & Absence, Pay & Records |

---

## Logistics (`logistics`)

| Typical sidebar | DB name |
|-----------------|--------|
| Active Missions | Missions |
| Deliveries | Deliveries |
| Fleet | Fleet |
| Routes | Routes |
| Tracking | Tracking |
| Urgent | Urgent Tasks |
| Staff Terminal | Staff Terminal |
| Leave / Pay | Leave & Absence, Pay & Records |

---

## Inventory (`inventory`)

| Typical sidebar | DB name |
|-----------------|--------|
| StockHub | Inventory |
| Warehouse | Warehouses |
| Alerts | Inventory Alerts |
| Audit Protocol | Audit Log |
| Staff Terminal | Staff Terminal |
| Leave / Pay | Leave & Absence, Pay & Records |

---

## Concierge (`concierge`)

| Typical sidebar | DB name |
|-----------------|--------|
| Events | Events |
| Guest Requests | Guest Requests |
| Luxury Items | Luxury Items |
| Storage Hub | Inventory |
| Access Plans | VIP Access |
| Chauffeur Protocol | Chauffeur |
| Leave / Pay | Leave & Absence, Pay & Records |

---

## Field Staff (`staff`)

Static sidebar: Staff Terminal (dashboard), My Assignments, Field Map, Leave, Pay — zyada tar **`?tab=`** wale links Employee Portal ke andar hain.

DB mein jo menus assign karein, unka **effective access** = **us staff user ke `staff` permissions** ∩ **usi company ke `admin` permissions** (login API yahi intersect karti hai). Matlab: **admin jis module ko khud allow nahi karta, staff ko wo kabhi nahi milega**, chahe staff row mein tick ho.

Recommended minimum names: `Staff Terminal`, `Leave & Absence`, `Pay & Records`, `Dashboard`.

---

## Customer / personal client (`customer`)

Plan se filter (Free / Basic / …). DB names customer wale preset se milti hain — `Marketplace`, `My Orders`, `Invoices`, `Track Delivery`, `Purchase Requests`, `Chauffeur`, `Concierge Events`, `Guest Requests`, etc.

---

## SaaS client (`saas_client`)

Sidebar: mostly orders, history, invoices, chauffeur, events, track, support, settings — details `Sidebar` → `menuItems.saas_client` + `SYSTEM_MENUS` paths.

---

## Important notes

1. **Labels ≠ DB names:** Sidebar par "Customers" / "Clients" dikhe, DB mein name **`Customers`** hai.  
2. **Leave / Pay:** `Leave & Absence` path `/dashboard/leave`; `Pay & Records` path `/dashboard?tab=pay` — dono `SYSTEM_MENUS` mein hain.  
3. **Staff assignments / map tabs** pure menu table se tie nahi ho sakte; wo Employee Portal ke tabs hain.

---

## Aapka workflow (Role & Permission)

1. Har company ke liye **`admin` role** + `company_id` par woh modules enable karein jo company ko chahiye.  
2. **`staff`** (aur baaki roles) ke liye alag se permissions set karein — staff ka final menu **admin ∩ staff** hoga jab company par `admin` ki rows maujood hon.  
3. **`client`** user agar DB mein hai to bhi `SYSTEM_ROLES` mein sirf listed roles dikhengi — company portal ke liye aam taur par **`admin`** use hota hai.
