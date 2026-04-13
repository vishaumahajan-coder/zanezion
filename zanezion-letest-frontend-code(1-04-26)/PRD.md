# ZaneZion Institutional - Product Requirements Document (PRD)

## 1. Executive Summary
ZaneZion Institutional is a premium, multi-module enterprise platform designed for managing ultra-high-net-worth (UHNW) assets, logistics, and concierge services. It provides a "Platinum Standard" operating environment for yachts, private islands, and luxury estates, now operating as a **SaaS (Software as a Service)** platform.

## 2. Core Modules & Objectives

### 2.1 Logistics & Fleet Management
- **Objective**: Coordinate movements of luxury assets (trucks, boats, jets).
- **Features**: Fleet tracking, Route optimization, Urgent mission dispatching, and GPS monitoring.
- **KPIs**: Delivery success rate, Fleet fuel efficiency, Response time for urgent tasks.

### 2.2 Procurement & Vendor Relations
- **Objective**: Manage high-end supply chains with direct order placement.
- **Features**: Vendor performance analytics, Purchase Request (PR) lifecycle, Quotes comparison, and Institutional Audits.
- **Integration**: Approved PRs automatically generate Logistics Orders.

### 2.3 Inventory Control
- **Objective**: Real-time monitoring of premium stocks (Liquor, Fuel, Marine Supplies).
- **Features**: Multi-warehouse management, Low-stock alerts, and automated reorder triggers.

### 2.4 Concierge & Event Management
- **Objective**: Coordinating bespoke guest experiences and high-tier celebrations.
- **Features**: Event scheduling with luxury date pickers, Guest request tracking, and Luxury Asset (Vault) custody.

### 2.5 SaaS Management (Super Admin Module)
- **Objective**: Oversee the entire institutional ecosystem and subscription health.
- **Features**: 
    - **Subscription Registry**: Manage and configure tiered access protocols (Standard, Executive, Platinum).
    - **Active Company Portfolio**: Monitor all active business entities and their workspace IDs.
    - **Workspace Preview**: Tactical satellite-encryption handshake to preview sub-entity environments.
    - **Financial Monitoring**: Track Monthly Recurring Revenue (MRR) and subscription status (Active, Arrears, Trial).

### 2.6 Client Portal (SaaS Institutional Interface)
- **Objective**: Providing clients with a private, branded window into their managed assets.
- **Privacy**: **Isolated Client Views**. Clients can ONLY see their own orders, invoices, and inventory. Dropdowns are restricted to their own business identity.
- **Features**: Order creation with **Departmental Routing** (e.g., F&B, Deck), Real-time status tracking, and Proof of Delivery (POD) viewing.

### 2.7 Staff Terminal (Employee Portal)
- **Objective**: Real-time field execution for drivers, pilots, and personnel.
- **Features**: 
    - **Shift Synchronization**: Clock In/Out timer with session tracking.
    - **Global Assignment Queue**: Staff can browse and "Accept" available tasks.
    - **Mission Interaction**: Status updates (Pending -> In Progress -> En Route -> Completed).
    - **Leave Protocols**: Request vacation/absence with **Half-Day Protocol** support and tenure-based balance calculation.
    - **Safety & Payouts**: Emergency Panic Button and transparent Pay History/Stub tracking.

## 3. SaaS Monetization & Plans
The system operates on a tiered subscription model:
- **Standard Protocol ($99/mo)**: Core order management and standard support.
- **Executive Protocol ($249/mo)**: Geo-location tasks, real-time GPS, automated procurement quotes, and priority support.
- **Platinum Protocol ($499/mo)**: White-labeling, full fleet suite, dedicated account management, and POD with imagery.

## 4. Technical Design & Data Flow
- **Unified Data Flow**: Centralized `GlobalDataContext`.
    - `Order` created by Client -> Appears in `Operations` -> Assigned to `Staff`.
    - `Staff` updates status -> Reflects live on `Client Dashboard`.
    - `Logistics` completion -> Triggers `Invoice` and `Inventory` decrement.
- **Rich Aesthetics**: Dark-mode primary interface with glassmorphism and gold accents (`#C8A96A`).
- **Enhanced UI Components**:
    - **Tactical Maps**: Global logistics distribution with satellite-themed visualization.
    - **Document Management**: Institutional PDF upload for signed quote manifests.
    - **Multi-Line Entries**: Dynamic order and quote generation with real-time total calculation.
    - **Auditor Assignment**: Selective mission assignment for stock integrity audits.
- **Institutional Reporting**: Native PDF generation for performance audits and Proof of Delivery (POD).

---
*Proprietary ZaneZion Document • Platinum Network Version 2.0 (SaaS Edition)*
