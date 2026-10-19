# Web-Based Essential Goods Distribution and Inventory Management System for North Shewa Zone — Project Specification

**Date:** Oct 19, 2026  
**Author:** @abreham  
**Target Region:** North Shewa Zone, Amhara Region, Ethiopia  

---

## Abstract

Essential goods such as sugar, cooking oil, wheat flour, and rice are distributed to citizens with subsidized access through the Zone, Woreda, and Kebele offices of North Shewa Zone, Amhara Region, Ethiopia. In many offices these activities are still recorded on paper, which causes inaccurate stock records, untracked movement of goods between offices, duplicate beneficiary registration, uneven quota enforcement, delayed reporting, and weak transparency.

This project will design and implement a web-based Essential Goods Distribution and Inventory Management System that replaces these paper processes with one central platform. The system will keep a store at each administrative level and manage stock requests, approvals, transfers, and receipt confirmation between levels. It will register beneficiaries with a unique ID number and prevent duplicates, calculate family-based quotas and block over-distribution, control batches and expiry dates with first-expiry-first-out issuing, and raise rule-based alerts. It will also provide dashboards, reports, an audit log, role-based access control, and an Amharic and English interface.

The system will be built with React.js for the frontend, Node.js and Express.js for the backend, and MongoDB for the database, following an Agile process and a three-tier architecture. A review of related systems shows that existing public distribution, humanitarian, supply chain, and identity systems each cover only part of this problem. The expected outcome is a tested web application that gives each office accurate, current stock and distribution records and gives decision-makers reliable reports. AI-based demand forecasting and anomaly detection are planned as future work.

**Keywords:** inventory management, essential goods distribution, beneficiary quota, multi-level stock flow, role-based access control, North Shewa Zone

---

## Chapter One: Introduction

This project will design and implement a web-based system that manages the distribution of essential goods and their inventory across the Zone, Woreda, and Kebele offices of North Shewa Zone, Amhara Region, Ethiopia.

### 1.1 Background of the Project
Essential goods such as sugar, cooking oil, wheat flour, and rice are distributed by government and local administrations to give citizens fair access to basic commodities and to help stabilize market prices. In Ethiopia, state trading enterprises have imported staples such as wheat, edible oil, and sugar to stabilize the market, as reported in 2019 [10]. At the local level, distribution is carried out through the Zone, Woreda, and Kebele administrative offices. These offices receive goods, manage stock, register beneficiaries, allocate quotas, and record each distribution.

In many areas, including North Shewa Zone, these tasks are still done with paper records. Paper records make it hard to know how much stock each office holds, to detect duplicate beneficiaries, and to produce timely reports. Evidence from other countries shows the cost of weak controls. An evaluation of India's Targeted Public Distribution System found that of about 14.07 million tonnes of quota issued to 16 large states in 2003-04, only about 5.93 million tonnes reached the intended poor families [1]. Earlier systems have used computerized ration card databases and web-based monitoring of distribution outlets to improve transparency [3].

Identity is a second weakness. Before the national Fayda ID, the working ID in Ethiopia was issued by the lowest administrative unit, was paper-based, was vulnerable to fraud, and was not traceable [2]. A distribution system therefore needs a clear rule for identifying each beneficiary and for preventing the same household from being registered twice.

This project will address these problems with a centralized web-based platform. The platform will manage inventory at every administrative level, register beneficiaries, enforce family-based quotas, handle stock requests and transfers, record distributions, and produce reports for decision-makers.

### 1.2 Problems and Justification

#### 1.2.1 Problems
The current distribution process in North Shewa Zone is mainly manual and paper-based. The following problems are expected to be confirmed through the interviews, observation, and document analysis described in Chapter Three:
1. Stock records are kept on paper, so stock levels at each office are inaccurate and hard to track.
2. Goods moving from the Zone to Woredas and Kebeles are not tracked, and there is no formal confirmation that the receiving office got what was sent.
3. Beneficiary records may be duplicated or incomplete, and eligibility is hard to verify.
4. Quotas are applied manually, so a household can receive more than its share without detection.
5. Stock requests and approvals are slow.
6. Expiry dates are not monitored systematically, which risks wasted goods.
7. Reports are late and fragmented, and records can be lost or altered.

#### 1.2.2 Justification
A centralized web-based system will give each office accurate and current records, make every stock movement traceable, apply quota rules automatically, and give officials the information they need to decide. It will also reduce paperwork and make the distribution process more transparent and accountable.

### 1.3 Project Objectives

#### 1.3.1 General Objective
To design and implement a web-based essential goods distribution and inventory management system for North Shewa Zone, Amhara Region, Ethiopia, that supports multi-level stock management, family-based quota control, and transparent distribution recording.

#### 1.3.2 Specific Objectives
The project will:
1. Conduct a feasibility study to assess the technical, operational, economic, and schedule viability of the system.
2. Gather, analyze, and document requirements from Zone, Woreda, and Kebele officials and store managers.
3. Define the system actors and their roles, and implement secure authentication with role-based access control (RBAC).
4. Design and implement a multi-level inventory model with a store at each of the Zone, Woreda, and Kebele levels, including stock transfer, receipt confirmation, and discrepancy reporting.
5. Design and implement a stock request and approval workflow between Kebele and Woreda offices and between Woreda and Zone offices.
6. Implement batch and expiry-date control, with first-expiry-first-out issuing and expiry alerts.
7. Digitize beneficiary registration and prevent duplicate registration using a unique ID number and a household identifier.
8. Implement a quota management module that allocates goods by family size, goods type, and distribution period, and blocks distribution beyond the allowed quota.
9. Implement distribution recording that updates the correct store automatically and issues a receipt.
10. Implement rule-based alerts for low stock, unconfirmed transfers, stock mismatches, and attempts to exceed quota.
11. Provide dashboards and reports for inventory, distribution, beneficiaries, and transactions, with an audit log of user actions.
12. Provide an Amharic and English user interface.
13. Test the system through unit, integration, system, and usability testing.

### 1.4 Project Scope and Limitations

#### 1.4.1 Project Scope
The system will cover the following:
- User management, authentication, and RBAC.
- Goods management and categorization.
- Multi-level inventory with batch and expiry tracking, stock transfer, and receipt confirmation.
- Stock request and approval between Kebele and Woreda offices and between Woreda and Zone offices.
- Beneficiary registration with duplicate prevention.
- Family-based quota allocation and enforcement.
- Distribution recording with automatic stock updates and receipts.
- Rule-based alerts and notifications.
- Dashboards, reports, and an audit log.
- Amharic and English interface.
- Operation at the Zone, Woreda, and Kebele levels of North Shewa Zone.

#### 1.4.2 Project Limitations
The following are outside the scope of this project and are listed as future work:
- AI-based demand forecasting and anomaly detection.
- Live integration with the national Fayda ID system and other government systems. The system will store the ID number, but will not verify it online.
- Biometric verification of beneficiaries.
- Online payment and banking integration.
- Transportation, logistics, and GPS tracking.
- Native mobile applications.
- Full offline operation and SMS notifications.

### 1.5 Significance of the Project
The system will benefit the North Shewa Zone administration and the communities it serves in these ways:
- Accurate, current stock information at every administrative level.
- Traceable movement of goods from the Zone store to the Kebele, with confirmation of receipt.
- Fairer distribution through duplicate prevention and enforced family quotas.
- Less waste from expired goods.
- Faster stock requests and approvals.
- Greater transparency and accountability through audit logs and reports.
- A model that other zones in Ethiopia can adopt later.

---

## Chapter Two: Review of Related Work

No reviewed system combines multi-level stock flow, family-based quota control, and ID-based duplicate prevention for a Zone, Woreda, and Kebele hierarchy. This chapter reviews the closest public-distribution, humanitarian, supply-chain, and identity systems, then explains how this project differs from them.

### 2.1 Public Distribution Systems and Their Weaknesses
India's Targeted Public Distribution System (TPDS) is the best-documented example of subsidized goods reaching households through a tiered administration. A national evaluation covered 18 states, 240 fair price shops, and 3,600 households [1]. It found targeting errors, ghost ration cards, and unidentified households. In 2003-04, 16 large states were issued 14.07 million tonnes of quota for poor families, but only about 5.93 million tonnes reached them [1]. Its recommendations included computerizing shop-wise delivery against quota at block and village level, and computerizing baseline household data for monitoring and regular updating [1].

This evidence supports two design choices in this project: strong beneficiary identification and tracked stock movement at every administrative level. TPDS is an evaluation of a policy, not a software design, so it gives no model for the system itself.

### 2.2 Subsidy Distribution Systems for Developing Countries
El-Shishtawy [3] built a mobile subsidy system for Egypt. It identifies beneficiaries by national ID, supports personal or family-based quota, sets distribution schedules (yearly, monthly, weekly, daily, or once), and implements stock entry, stock transfer, quota definition, and quota delivery through SMS and Java phones. It uses a layered architecture with an Oracle database [3]. The paper also reviews earlier systems, such as a unified ration card database with unique numbers and barcodes, and a website that monitors outlets and delivery vehicles [3].

Its strengths are the family quota model and the multi-channel delivery. Its limits for this project are that distribution happens through merchant outlets rather than government administrative offices, the paper describes no request-and-approval workflow between offices, and it describes no batch or expiry tracking. The author also notes that operation without network coverage was not achieved [3].

### 2.3 Humanitarian Beneficiary and Commodity Systems
The World Food Programme (WFP) uses SCOPE as its beneficiary identity and benefit management platform. It registers beneficiaries once and supports cash, in-kind, and voucher transfers [4]. WFP Ethiopia started SCOPE In-Kind to prevent food aid diversion by tracking food, but WFP's internal audit of the roll-out reported a risk that system capabilities did not match operational requirements [5].

These platforms show the value of one central beneficiary record. They are built for a humanitarian agency, not for a zone administration that distributes subsidized goods through its own offices. The audit finding also supports starting from the real business process, which is why this project begins with requirements gathering.

### 2.4 Multi-Level Supply Chain and Logistics Systems
OpenLMIS is an open-source system for health commodity supply chains. It supports requisition-based replenishment, a configurable supply chain hierarchy with level-skipping approvals, and multi-step approval workflows [6]. Its stock management tracks lots and expiry, raises low-stock notifications, confirms receipt with proof of delivery, and lets a receiver reject shipped stock [6]. Requisitions are routed up a supervisory hierarchy where users hold approval rights at each node [7].

Ethiopia's own health logistics system, the electronic Logistics Management Information System known as Dagu, aims to improve visibility and efficiency across the health supply chain [9]. A national assessment of 251 public health facilities found that 63.7% operated a functional system, and these facilities showed better availability of tracer medicines [9]. A study in the Amhara Region found that only 37 of 102 surveyed facilities had implemented the digital system, and its performance depended on internet access and user experience [8].

These systems prove that requisition, approval, lot tracking, and receipt confirmation work across administrative levels. They manage health commodities for facilities, so they have no beneficiary registry, no household quota, and no distribution to citizens. The Amhara findings also show that weak connectivity and limited training are real risks for any system in this region.

### 2.5 Digital Identity in Ethiopia
Before the national digital ID (Fayda), the ID in use was issued by the lowest administrative unit. It was not a foundational ID, was paper-based, was vulnerable to fraud, and was not traceable [2]. The National ID Program lists preventing double benefit in social protection as a reason for Fayda, and its registration process includes a central duplication check [2]. It also identifies beneficiary identification, avoiding duplicated support, and managing food aid as uses of the ID, while naming low infrastructure and low digital literacy in rural areas as challenges [2].

Fayda is an identity layer, not a goods and inventory system. This project will store the Fayda number or kebele ID as the unique beneficiary key and will plan live verification as future work.

### 2.6 Comparison of Related Systems
| System | Beneficiary registry and ID | Family quota | Multi-level stock requests and approvals | Batch and expiry | Setting |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mobile subsidy system [3]** | Yes, national ID | Yes, with schedules | Partly: stock entry and transfer, no approval workflow described | Not described | Egypt, merchant outlets |
| **WFP SCOPE [4][5]** | Yes, central identity record | Transfer management | Partly: in-kind commodity tracking | Not described | Humanitarian agency |
| **OpenLMIS [6][7]** | No | No | Yes: configurable hierarchy and approvals | Yes: lots and expiry | Health commodities |
| **Dagu eLMIS [8][9]** | No | No | Supply chain visibility for health facilities | Not described | Ethiopian health sector |
| **Fayda national ID [2]** | Yes, central duplication check | No | No | No | National identity |
| **This project** | **Planned: ID number plus household** | **Planned: by family size and period** | **Planned: Zone, Woreda, Kebele with transfer and receipt confirmation** | **Planned: first-expiry-first-out** | **North Shewa Zone administration** |

### 2.7 Limitations of Existing Systems and Proposed Solution
Each reviewed system solves only one part of the problem. Public distribution and subsidy systems handle beneficiaries and quota. Supply chain systems handle multi-level stock, approval, and receipt. Fayda handles identity. None combines these for the Zone, Woreda, and Kebele structure used in Ethiopian local administration.

This project will address these limitations with one web-based system that provides:
- A store at every administrative level, with stock requests, approvals, transfers, and receipt confirmation.
- Beneficiary registration with duplicate prevention based on a unique ID number and household identifier.
- Quota rules based on family size and distribution period, enforced at the point of distribution.
- Batch and expiry control with first-expiry-first-out issuing.
- Rule-based alerts, an audit log, and an Amharic and English interface.

The related work also shapes the design in four ways: verify identity centrally to prevent duplicates and ghost records [1][2]; track stock and confirm receipt at every level [1][6]; plan for weak connectivity and limited training [2][8]; and start from the real business process [5].

---

## Chapter Three: Methodology

This chapter explains how the system will be developed: the process, how requirements will be collected, the tools, the architecture, the testing approach, and the feasibility of the project.

### 3.1 Development Methodology
The project will follow Agile development in short iterations. Each iteration will deliver one working module (for example, authentication, then inventory, then stock requests) that can be demonstrated to the advisor and, where possible, to the officials who will use it.

Agile suits this project for four reasons:
- Requirements will be refined as officials react to working screens.
- Each module can be built and tested before the next one starts.
- Problems are found early, when they are cheap to fix.
- The team can adjust the plan if time or data becomes limited.

The three team members will work in a shared Git repository. Each feature will be developed on its own branch and merged after review.

### 3.2 Data Collection Methods
- **Interviews.** The team will interview Zone, Woreda, and Kebele officials and store managers about how goods are received, stored, requested, registered, and distributed today, and what problems they face.
- **Observation.** The team will observe a real distribution and a stock-handling process at a Woreda or Kebele office.
- **Document analysis.** The team will collect and study the forms, registers, stock cards, request letters, and reports used today.
The results will be recorded in a short requirements note after each visit, and the numbered requirements in Chapter Four will be updated from it.

### 3.3 System Analysis and Design Techniques
The project will use UML for analysis and design: use case diagrams for actors and functions, activity and sequence diagrams for workflows, a class diagram for objects, and an ERD for the database. In this version of the document these models are described in text, and the diagrams will be drawn and added after the basic implementation is working.

### 3.4 Development Tools and Technologies
- **Frontend:** React.js, react-i18next for Amharic and English.
- **Backend:** Node.js with Express.js for REST API.
- **Database:** MongoDB with Mongoose (requires replica set for multi-document ACID transactions, such as MongoDB Atlas).
- **Authentication:** JWT, passwords hashed with bcrypt.
- **Validation and security:** Joi/Zod or express-validator, Helmet, express-rate-limit.
- **Development environment:** Google Antigravity AI-assisted environment, Git & GitHub.
- **Testing:** Jest and Supertest on backend, Postman for manual API checks.

### 3.5 System Architecture
Three-tier architecture:
1. Presentation layer: React web app.
2. Application layer: Express API (business rules, validation, access control).
3. Data layer: MongoDB database.

### 3.6 Testing Approach
- Unit testing: quota formulas, FEFO batch selection, stock calculations.
- Integration testing: workflows across modules (request -> approve -> dispatch -> receipt).
- System testing: end-to-end scenarios from login to reporting.
- Usability testing: time-to-task and error tracking with administrative staff.
- Security testing: RBAC enforcement, office-scoping boundaries.

### 3.7 Feasibility Study
- **Technical:** Free, open-source stack, runs on ordinary PCs via browser.
- **Operational:** Mirrors existing administrative hierarchy (Zone -> Woreda -> Kebele).
- **Economic:** Open-source stack, low running costs.
- **Schedule:** Structured in 8 phased iterations from setup to defense.

---

## Chapter Four: System Requirements

### 4.1 Functional Requirements

#### Authentication and User Management (AUTH)
- `FR-AUTH-01` (Must): Log in with username/password, issue JWT token.
- `FR-AUTH-02` (Must): User change own password.
- `FR-AUTH-03` (Must): Admin create, update, deactivate, and assign role + office (Zone, Woreda, Kebele).
- `FR-AUTH-04` (Must): Block login for deactivated users.
- `FR-AUTH-05` (Should): Lock account for 15 minutes after 5 failed login attempts.

#### Offices and Goods (LOC, GDS)
- `FR-LOC-01` (Must): Store office hierarchy: 1 Zone -> Woredas -> Kebeles.
- `FR-LOC-02` (Must): Admin add and edit Woredas and Kebeles.
- `FR-GDS-01` (Must): Register goods (name, category, unit of measure e.g., kg, liter, piece).
- `FR-GDS-02` (Should): Store Amharic name of each good.

#### Inventory (INV)
- `FR-INV-01` (Must): Stock record for each good, batch, and office.
- `FR-INV-02` (Must): Zone Store Manager records goods received from suppliers (batch, qty, receipt date, expiry date).
- `FR-INV-03` (Must): Every stock change creates an immutable stock movement record.
- `FR-INV-04` (Must): Stock correction only via recorded adjustment with reason.
- `FR-INV-05` (Must): Issue stock earliest expiry first (FEFO); never issue/transfer expired stock.
- `FR-INV-06` (Must): View stock by office, good, batch.
- `FR-INV-07` (Should): Mark expired stock as written off with reason.

#### Stock Requests and Transfers (REQ, TRF)
- `FR-REQ-01` (Must): Woreda Officer submits stock request to Zone; Kebele Officer to Woreda.
- `FR-REQ-02` (Must): Supplying office officer approves (full/partial) or rejects with reason.
- `FR-REQ-03` (Must): Request states: Pending, Approved, Rejected, Dispatched, Received, Closed.
- `FR-REQ-04` (Must): Requester can cancel pending request.
- `FR-TRF-01` (Must): Dispatch approved transfer via FEFO, deduct sender stock.
- `FR-TRF-02` (Must): Receiver Store Manager confirms received quantity, adds to receiver stock.
- `FR-TRF-03` (Must): Discrepancy logged and notification sent if received != sent.
- `FR-TRF-04` (Should): Transfer note printout.

#### Beneficiaries (BEN)
- `FR-BEN-01` (Must): Kebele Officer registers household (head name, gender, ID type [Fayda/Kebele], ID number, phone, address, family size).
- `FR-BEN-02` (Must): Unique ID check; reject duplicates system-wide.
- `FR-BEN-03` (Must): Duplicate warning on matching name + phone within same Kebele.
- `FR-BEN-04` (Must): Verification workflow: only Verified status can receive goods.
- `FR-BEN-05` (Must): Kebele officers manage own beneficiaries; Woreda/Zone officers have read scope.
- `FR-BEN-06` (Should): Suspend beneficiary with reason.

#### Quota and Distribution (QTA, DST)
- `FR-QTA-01` (Must): Admin or Zone Officer defines quota rule: qty/person/period and max/household.
- `FR-QTA-02` (Must): Allowed quantity = min(qtyPerPerson * familySize, maxPerHousehold).
- `FR-QTA-03` (Must): Display remaining quota before distribution.
- `FR-DST-01` (Must): Kebele Officer records distribution to Verified beneficiary.
- `FR-DST-02` (Must): Block distribution exceeding quota or stock with clear reason.
- `FR-DST-03` (Must): Single ACID transaction updates Kebele stock (FEFO), deducts quota balance, saves distribution record.
- `FR-DST-04` (Must): Generate distribution receipt with unique receipt number.
- `FR-DST-05` (Should): View beneficiary distribution history.

#### Alerts and Notifications (ALT)
- `FR-ALT-01` (Must): In-app notifications for request/transfer status transitions.
- `FR-ALT-02` (Must): Low stock alert when stock <= minimum level.
- `FR-ALT-03` (Must): Expiry alert for batches expiring within 30 days.
- `FR-ALT-04` (Should): Alerts for transfers in-transit > 3 days or discrepancy on arrival.
- `FR-ALT-05` (Should): Alert when distribution blocked due to quota exceed attempt.

#### Dashboard and Reports (RPT)
- `FR-RPT-01` (Must): Role-scoped dashboards (stock, pending requests, beneficiaries, monthly distributions, alerts).
- `FR-RPT-02` (Must): Filterable reports (office, good, date range) for inventory, distribution, beneficiaries, stock movements.
- `FR-RPT-03` (Should): Export reports to PDF/Excel.

#### Audit and Language (AUD, I18N)
- `FR-AUD-01` (Must): Audit log entry for critical actions (login, logout, users, beneficiaries, stock, requests, transfers, distributions).
- `FR-AUD-02` (Must): Immutable audit log viewable only by Administrator.
- `FR-I18N-01` (Should): English and Amharic UI with language switcher.

### 4.2 Non-Functional Requirements
- **Performance:** Response times < 3s for up to 50 concurrent users. Server-side pagination.
- **Security:** bcrypt hashing, HTTPS, JWT authentication, role & office scoping, server-side validation.
- **Reliability:** MongoDB replica-set transactions for atomic stock/quota updates. Daily backups.
- **Usability:** Responsive layout for laptop and mobile web, intuitive workflows, bilingual labels.
- **Compatibility:** Chrome, Edge, Firefox.
- **Maintainability:** Modular architecture, consistent code conventions, full README.
- **Scalability:** Easily extensible hierarchy of Woredas, Kebeles, goods, and users.

### 4.3 System Constraints
- Defense timeline: January 2027.
- Three team members; open-source budget.
- Target offices may face intermittent internet connectivity.
- Web application only (no native mobile app, biometric hardware, or live Fayda API in v1).

### 4.4 User Roles and Permissions
1. **Administrator:** System configuration, users, offices, goods, quota rules, audit log. No direct inventory/distribution operations.
2. **Zone Officer:** Approves/rejects Woreda requests; zone-wide reports and visibility.
3. **Woreda Officer:** Requests from Zone; approves/rejects Kebele requests; woreda-wide reports.
4. **Kebele Officer:** Requests from Woreda; registers/verifies beneficiaries; issues distributions & receipts.
5. **Store Manager:** Located at an office; receives supplier stock (Zone only); dispatches transfers; confirms receipts; logs adjustments.

---

## Chapter Five: System Analysis

### 5.1 Actors
- Administrator
- Zone Officer
- Woreda Officer
- Kebele Officer
- Store Manager
- Daily Alert Job (System scheduled actor)

### 5.2 Main Use Cases
- `UC-01`: Log in
- `UC-02`: Receive stock from a supplier (Zone Store Manager)
- `UC-03`: Submit a stock request (Woreda / Kebele Officer)
- `UC-04`: Approve or reject a stock request (Zone / Woreda Officer)
- `UC-05`: Dispatch and receive a transfer (Supplying and Receiving Store Managers)
- `UC-06`: Register and verify a beneficiary (Kebele Officer)
- `UC-07`: Record a distribution (Kebele Officer)
- `UC-08`: Generate a report and view dashboard (All roles scoped)
- `UC-09`: Daily alert job (System Scheduler)

### 5.3 Business Rules
- `BR-01` (Supply chain): Strict hierarchy: Zone -> Woreda -> Kebele. Requests only to immediate parent.
- `BR-02` (Approval): Approval limited to available unexpired stock at supplying office. Partial approvals allowed.
- `BR-03` (Stock movement): Deducted on dispatch, credited on receipt confirmation. In-transit belongs to neither store.
- `BR-04` (Discrepancy): Shortage logged permanently on transfer; alerts approving officer.
- `BR-05` (First Expiry First Out - FEFO): Earliest expiry batch consumed first; expired stock blocked from issue/transfer.
- `BR-06` (Stock records): Immutable ledger. Corrections only via adjustments with mandatory reason.
- `BR-07` (Duplicate prevention): ID number globally unique. Duplicate name + phone in Kebele triggers warning.
- `BR-08` (Verification): Only Verified beneficiaries of the specific Kebele can receive goods.
- `BR-09` (Quota formula): `allowed = min(qtyPerPerson * familySize, maxPerHousehold)`. `remaining = allowed - usedThisPeriod`.
- `BR-10` (Period): Monthly period key (e.g. `2027-01`), Gregorian default.
- `BR-11` (Atomic distribution): Stock reduction, quota balance deduction, and distribution record creation must run in one ACID transaction.
- `BR-12` (No deletion): Soft delete / suspension only; immutable audit and transaction history.
- `BR-13` (Access scope): Users can only access data belonging to their office and descendant offices.
- `BR-14` (Alert limits): Configurable thresholds (min stock, expiry warning default 30 days, overdue transit default 3 days).

### 5.4 Data Entities
- User
- Location (Zone, Woreda, Kebele)
- Goods
- Inventory (Office + Good + Batch)
- StockMovement (Immutable ledger)
- StockRequest
- StockTransfer
- Beneficiary
- QuotaRule
- QuotaBalance
- Distribution
- Notification
- Setting
- AuditLog
- Counter (Sequential numbering)

---

## Chapter Six: System Design

### 6.1 Architecture Design
Three-tier architecture with clean separation:
- Presentation: React SPA
- Application Layer: Express.js (Route -> Middleware -> Controller -> Service -> Model)
- Data Layer: MongoDB replica set (with transactions)

### 6.2 Database Collections & Schemas
- `locations`: `name`, `nameAm`, `code` (unique), `type`: `zone` | `woreda` | `kebele`, `parentId`, `status`
- `users`: `fullName`, `username` (unique), `email`, `passwordHash`, `phone`, `role`: `admin` | `zone_officer` | `woreda_officer` | `kebele_officer` | `store_manager`, `locationId`, `language`: `en` | `am`, `status`: `active` | `inactive`, `failedLogins`, `lockedUntil`
- `goods`: `name`, `nameAm`, `category`, `unit`: `kg` | `liter` | `piece`, `status`
- `inventory`: `locationId`, `goodsId`, `batchNumber`, `quantity`, `receivedDate`, `expiryDate`, `status`: `available` | `written_off`  
  *Unique Index:* `locationId` + `goodsId` + `batchNumber`  
  *Index:* `locationId` + `goodsId` + `expiryDate`
- `stock_movements`: `type`: `receipt` | `transfer_out` | `transfer_in` | `distribution` | `adjustment` | `write_off`, `locationId`, `goodsId`, `batchNumber`, `expiryDate`, `quantityChange`, `balanceAfter`, `refType`, `refId`, `reason`, `createdBy`
- `stock_requests`: `requestNo`, `fromLocationId`, `toLocationId`, `items`: `[{ goodsId, quantityRequested, quantityApproved }]`, `status`: `pending` | `approved` | `rejected` | `dispatched` | `received` | `closed` | `cancelled`, `requestedBy`, `decidedBy`, `decisionNote`, `decidedAt`
- `stock_transfers`: `transferNo`, `requestId`, `fromLocationId`, `toLocationId`, `items`: `[{ goodsId, batchNumber, expiryDate, quantitySent, quantityReceived }]`, `status`: `in_transit` | `received` | `received_with_discrepancy`, `dispatchedBy`, `dispatchedAt`, `receivedBy`, `receivedAt`, `discrepancyNote`
- `beneficiaries`: `headName`, `gender`, `idType`: `fayda` | `kebele`, `idNumber` (unique), `phone`, `address`, `kebeleId`, `woredaId`, `familySize`, `status`: `registered` | `verified` | `suspended`, `registeredBy`, `verifiedBy`, `verifiedAt`, `suspendReason`  
  *Index:* `kebeleId` + `headName` + `phone`
- `quota_rules`: `goodsId`, `quantityPerPerson`, `maxPerHousehold`, `periodType`: `monthly`, `active`
- `quota_balances`: `beneficiaryId`, `goodsId`, `periodKey`, `allowed`, `used`  
  *Unique Index:* `beneficiaryId` + `goodsId` + `periodKey`
- `distributions`: `receiptNo` (unique), `beneficiaryId`, `kebeleId`, `periodKey`, `items`: `[{ goodsId, batchNumber, quantity }]`, `distributedBy`, `distributedAt`
- `stock_levels`: `locationId`, `goodsId`, `minLevel`
- `settings`: `key`, `value`
- `notifications`: `userId`, `type`, `message`, `refType`, `refId`, `isRead`
- `alerts`: `type`: `low_stock` | `expiring` | `transfer_overdue` | `discrepancy` | `quota_blocked`, `locationId`, `goodsId`, `refId`, `message`, `alertDate`
- `audit_logs`: `userId`, `action`, `entityType`, `entityId`, `details`, `ipAddress`
- `counters`: `key`, `seq`

### 6.3 Key Operations
- **Transactions:** MongoDB replica set multi-document ACID transactions for atomic multi-collection updates.
- **FEFO:** Sort by `expiryDate` ascending, filter `quantity > 0`, `status = available`, non-expired.
- **Atomic Quota Check:** Single conditional update `used + quantity <= allowed`.
- **Sequential Numbering:** Counter collection for clean codes like `RC-KEB01-2027-01-0001`.
- **Office Scope Filter:** Middleware resolves accessible location IDs hierarchy.

### 6.4 API Design
Base path: `/api/v1`
- Auth: `/auth/login`, `/auth/me`, `/auth/change-password`
- Users & Offices: `/users`, `/users/:id`, `/users/:id/status`, `/locations`, `/locations/:id`
- Goods & Quota: `/goods`, `/goods/:id`, `/quota-rules`, `/quota-rules/:id`
- Inventory: `/inventory`, `/inventory/receive`, `/inventory/adjust`, `/inventory/write-off`, `/inventory/expiring`, `/stock-movements`, `/stock-levels`
- Requests & Transfers: `/stock-requests`, `/stock-requests/:id/approve`, `/stock-requests/:id/reject`, `/stock-requests/:id/cancel`, `/transfers`, `/transfers/:id/receive`
- Beneficiaries & Distribution: `/beneficiaries`, `/beneficiaries/check-id`, `/beneficiaries/:id/verify`, `/beneficiaries/:id/suspend`, `/beneficiaries/:id/quota`, `/distributions`, `/distributions/:id/receipt`
- Monitoring: `/dashboard/summary`, `/reports/*`, `/alerts`, `/notifications`, `/audit-logs`

### 6.5 User Interface Design
Responsive React SPA with role-based navigation sidebar, i18n switcher, and clean forms with validation.

### 6.6 Security Design
JWT (8h expiry), bcrypt password hashing, RBAC middleware, office scoping, helmet headers, rate limiting, immutable audit logs.

### 6.7 Project Structure
```
essential-goods-system/
  backend/
    src/
      config/
      models/
      routes/
      controllers/
      services/
      middleware/
      jobs/
      utils/
      app.js
      server.js
    tests/
    .env.example
    package.json
  frontend/
    src/
      api/
      components/
      pages/
      routes/
      context/
      i18n/
  docs/
  README.md
```

---

## Chapter Seven: Implementation Plan & Phases

- **Phase 0: Setup:** Repository, folder structure, config, Express & React baseline, seed script.
- **Phase 1: Authentication, Users & Offices:** FR-AUTH, FR-LOC.
- **Phase 2: Goods & Inventory:** FR-GDS, FR-INV, FEFO algorithm.
- **Phase 3: Stock Requests & Transfers:** FR-REQ, FR-TRF, discrepancy handling.
- **Phase 4: Beneficiaries:** FR-BEN, duplicate prevention.
- **Phase 5: Quota & Distribution:** FR-QTA, FR-DST, atomic transaction.
- **Phase 6: Alerts, Dashboard, Reports & Audit:** FR-ALT, FR-RPT, FR-AUD.
- **Phase 7: Bilingual UI, Testing & Release:** FR-I18N, full test suite, defense preparation.

---

## References
1. Planning Commission, Government of India, *Performance Evaluation of Targeted Public Distribution System (TPDS)*, 2005.
2. National ID Program Ethiopia, *Ethiopia's Digital ID Ecosystem: Challenges, Opportunities and Lessons*.
3. T. El-Shishtawy, *A Mobile Management System for Reforming Subsidies Distribution in Developing Countries*, arXiv:1405.0039.
4. World Food Programme, *SCOPE: Beneficiary Identity and Benefit Management*.
5. WFP Office of the Inspector General, *Internal Audit of SCOPE In-Kind Rollout (AR/25/26)*.
6. OpenLMIS, *Functional Documentation (v3)*.
7. OpenLMIS, *Requisition Groups and Supervisory Nodes*.
8. Z. T. Mekonen et al., *End Users' Perspective of Digital Logistics Management Information System (eLMIS) Performance at Public Health Facilities of Amhara Region, Ethiopia*, 2025.
9. WHO Ethiopia, *Ethiopia moves toward smarter health and nutrition supply chain management*, 2025.
10. Addis Fortune, *Corporation Bags 38.4m Br in Revenue*, 2019.
