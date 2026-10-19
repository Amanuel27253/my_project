# Web-Based Essential Goods Distribution and Inventory Management System
### North Shewa Zone Administration — Amhara National Regional State, Ethiopia

A full-stack, enterprise-grade, web-based inventory management and essential goods distribution platform built for the administrative offices (Zone, Woredas, Kebeles) of North Shewa Zone, Amhara Region, Ethiopia.

The system replaces legacy paper-based ledgers with a centralized, transparent platform providing multi-tier inventory tracking, First-Expiry-First-Out (FEFO) batch issuing, duplicate beneficiary prevention, family-based quota enforcement, and ACID transaction distribution recording with official printable receipts.

---

## 🏛️ Administrative Hierarchy & Role-Based Access Control (RBAC)

The system enforces strict multi-tier hierarchy according to regional administrative governance:

```
North Shewa Zone Administration (Zone Store & Oversight)
  │
  ├── Debre Berhan City Administration (Woreda Store & Approval)
  │     ├── Kebele 01 (Tegbared) (Kebele Store & Beneficiary Distribution)
  │     ├── Kebele 02
  │     └── Kebele 03
  ├── Basona Werana Woreda
  ├── Ankober Woreda
  └── Moretna Jiru Woreda
```

### System Actors & Permissions

| Role | Administrative Scope | Primary Responsibilities |
|---|---|---|
| **Administrator (`admin`)** | System-Wide | System configuration, user accounts, administrative offices, goods catalog, quota rules, immutable audit log. |
| **Zone Officer (`zone_officer`)** | Zone-Wide | Reviews & approves Woreda stock requests, monitors zone-wide inventory, triggers alert scans. |
| **Woreda Officer (`woreda_officer`)** | Woreda + Kebeles | Submits requests to Zone, approves Kebele requests, monitors woreda stock. |
| **Kebele Officer (`kebele_officer`)** | Kebele Level | Registers and verifies household beneficiaries, executes subsidized distributions, issues receipts. |
| **Store Manager (`store_manager`)** | Warehouse / Store | Receives supplier shipments (Zone), dispatches transfers via FEFO, confirms receipts & reports discrepancies. |

---

## ⚡ Core Business Rules & Features

- **Duplicate Prevention (`FR-BEN-02`, `FR-BEN-03`)**: System-wide unique ID validation (Fayda / Kebele IDs) and soft duplicate warnings for matching name + phone in the same Kebele.
- **Family Quota Allocation (`FR-QTA-01`, `FR-QTA-02`)**:
  $$\text{Allowed Quota} = \min(\text{QuantityPerPerson} \times \text{FamilySize}, \text{MaxPerHousehold})$$
  $$\text{Remaining Quota} = \text{Allowed Quota} - \text{UsedInPeriod}$$
- **First-Expiry-First-Out (FEFO) (`FR-INV-05`)**: Earliest expiring available non-expired batch is automatically deducted first on transfers and distributions. Expired batches are blocked.
- **ACID Atomic Transactions (`FR-DST-03`)**: Kebele store inventory deduction, beneficiary quota balance update, and distribution record creation execute inside a single MongoDB transaction.
- **Official Printable Receipts (`FR-DST-04`)**: Generates unique receipt codes (e.g. `RC-KEB01-2026-10-0001`) with complete household details, commodity breakdown, and print styles.
- **Discrepancy Reporting (`FR-TRF-03`)**: Detects sent vs. received mismatches upon arrival and immediately alerts oversight officers.
- **Rule-Based Automated Alerts (`FR-ALT-01` to `FR-ALT-05`)**: Daily scanner checks for stock below minimum thresholds, batches expiring within 30 days, and in-transit transfers overdue (>3 days).
- **Bilingual Interface (`FR-I18N-01`)**: Full English and Amharic (አማርኛ) translation switcher.
- **Immutable Audit Trail (`FR-AUD-01`, `FR-AUD-02`)**: Tamper-proof logging of all sensitive administrative actions.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, React Router v7, Axios, Lucide React Icons, i18next & react-i18next, Vite.
- **Backend**: Node.js & Express.js, MongoDB (Mongoose with replica set transaction support), JWT authentication, bcryptjs, Helmet, Morgan, Node-Cron.
- **Testing**: Jest, Supertest, MongoDB-Memory-Server (in-memory replica set testing).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup & Database Seeding

```bash
cd backend
npm install
npm run seed
```

This seeds:
- North Shewa Zone, Woredas, and Kebeles
- Standard commodities (Sugar, Cooking Oil, Wheat Flour, Rice)
- Demo users for all 5 roles
- Configured family quota rules
- Central warehouse batches and sample Kebele store stock
- Sample verified household beneficiaries

### 2. Run Tests

```bash
cd backend
npm test
```

Verifies duplicate prevention, FEFO batch selection, family quota formulas, and atomic distribution transactions.

### 3. Start Backend Server

```bash
cd backend
npm start
# Server starts at http://localhost:5000
# Health check: http://localhost:5000/api/v1/health
```

### 4. Start Frontend Client

```bash
cd frontend
npm install
npm run dev
# Vite dev server starts at http://localhost:5173
```

---

## 🔑 Demo Credentials

All test accounts share the default password: **`Admin@123456`**

| Username | Role | Office Location |
|---|---|---|
| `admin` | Administrator | North Shewa Zone Administration |
| `zone_officer` | Zone Officer | North Shewa Zone Administration |
| `woreda_officer` | Woreda Officer | Debre Berhan City Administration |
| `kebele_officer` | Kebele Officer | Kebele 01 (Tegbared) |
| `store_manager` | Store Manager | North Shewa Zone Administration Store |

*(One-click quick login buttons for all these roles are available on the login page).*

---

## 📡 Key API Endpoints (`/api/v1`)

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/auth/login` | POST | Authenticates user and returns JWT token |
| | `/auth/me` | GET | Returns authenticated user profile |
| | `/auth/change-password` | POST | Updates current user password |
| **Inventory** | `/inventory` | GET | Lists stock batches with FEFO sorting |
| | `/inventory/receive` | POST | Records supplier delivery into store |
| | `/inventory/adjust` | POST | Records stock adjustment with reason |
| | `/inventory/write-off` | POST | Writes off expired batch |
| **Requests & Transfers** | `/stock-requests` | GET, POST | Submit and view hierarchical stock requests |
| | `/stock-requests/:id/decide` | POST | Approve or reject stock request |
| | `/transfers/dispatch` | POST | Dispatches transfer with FEFO deduction |
| | `/transfers/:id/receive` | POST | Confirms receipt and logs discrepancies |
| **Beneficiaries** | `/beneficiaries` | GET, POST | Register and search households |
| | `/beneficiaries/check-id` | GET | Validates ID number availability |
| | `/beneficiaries/:id/verify` | POST | Marks household verified and eligible |
| **Distribution** | `/quota-rules/beneficiary/:id` | GET | Calculates remaining monthly family quota |
| | `/distributions` | POST | Executes atomic distribution and receipt |
| | `/distributions/:id/receipt` | GET | Retrieves printable receipt details |
| **Monitoring** | `/dashboard/summary` | GET | Role-scoped operational metrics |
| | `/reports/*` | GET | Inventory, distribution, beneficiary reports |
| | `/alerts` | GET | Active warnings and thresholds |
| | `/alerts/scan` | POST | Triggers rule-based alert scan |
| | `/audit-logs` | GET | Immutable audit log (Admin only) |
