# RAALE – Safe Historical Replay Platform

**Location**: `D:\Users\welcome\Documents\Raale project`  
**Version**: 1.0.0 (Synthetic Healthcare Integration Safety Platform)

---

## 1. Problem Statement & Business Context
Hospitals integrate complex clinical systems (Laboratory, Radiology, Pharmacy, Admissions, Billing) acquired over decades from multiple software vendors. When an integration transformation defect is discovered and corrected, engineers must replay historical events. Unsafe historical replay causes catastrophic downstream failures:
- **Duplicate events** re-triggering billing or medication dispenses
- **Missing dependencies** leading to orphaned observation records
- **Transformation mismatches** corrupting patient chart history
- **Target snapshot state conflicts** overwriting real-time concurrent clinical changes
- **Lack of auditability** violating healthcare compliance regulations

---

## 2. Solution Overview
**RAALE** provides a zero-trust, safety-first replay platform featuring:
1. **Dependency Checker**: 10-point mandatory safety pre-validation.
2. **Dry Run Engine**: Non-mutating target state prediction and JSON structural diff calculation with risk scoring.
3. **Safe Replay Engine**: Idempotency-locked target mutation with configurable safety policies.
4. **Baseline vs Safe Replay Experiment**: Empirical benchmark over 10,000+ synthetic historical events.
5. **Role-Based Governance**: Dual control switching between *Integration Engineer* and *Auditor / Operations Manager*.
6. **Complete Audit Trail**: Immutable logging of every dry run, approval, block, and execution.

---

## 3. Technology Stack

- **Backend**: Python 3.14 / 3.12, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, Pytest, SQLite 3
- **Frontend**: React 18, TypeScript 5, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios
- **Database**: SQLite 3 (`data/raale.db`) with 10,000+ synthetic events
- **Zero External Overhead**: Runs 100% locally without Docker, Kubernetes, Redis, Kafka, or Cloud services.

---

## 4. Getting Started

### 4.1 Quick Start (Single Click)
Double-click `start.bat` in the project root directory:
```powershell
D:\Users\welcome\Documents\Raale project\start.bat
```

### 4.2 Manual Backend Startup
```powershell
cd "D:\Users\welcome\Documents\Raale project\backend"
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python run.py
```
- FastAPI Server: `http://127.0.0.1:8000`
- Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

### 4.3 Manual Frontend Startup (When Node.js LTS is installed)
```powershell
cd "D:\Users\welcome\Documents\Raale project\frontend"
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 5. Demonstration Scenario (`EVT-DEMO-001`)

1. Open the platform UI or API documentation.
2. Navigate to `/events/EVT-DEMO-001` or click **Launch EVT-DEMO-001** in the header.
3. Click **Check Dependencies**: Returns `PASS`.
4. Click **Run Dry Run**: Simulates v2.0 transformation prediction without target mutation (`status: pending` -> `completed`). Risk Level: `LOW`.
5. Click **Request Replay** (as *Integration Engineer*): Status updates to `PENDING_APPROVAL`.
6. Switch top-right role header to **Auditor / Operations Manager** and click **Approve Replay**.
7. Click **Execute Safe Replay**: Target snapshot and mock target are safely updated.
8. Re-attempt executing replay on `EVT-DEMO-001`: Idempotency lock blocks duplicate execution with message:  
   *"Replay blocked: event has already been successfully replayed."*
9. Open **Audit Logs** to inspect complete audit trail.

---

## 6. Automated Testing Verification
Run backend automated test suite:
```powershell
cd "D:\Users\welcome\Documents\Raale project\backend"
.\.venv\Scripts\python.exe -m pytest -q
```
**Results**: `13 passed in 2.50s` (100% Pass Rate).

---

## 7. Synthetic Data & Ethics Declaration
This project uses **100% synthetic patient identifiers** (`PATIENT-TEST-00001` ... `PATIENT-TEST-00500`) and deterministic random seeds (`seed(42)`). No real patient data or PHI is used.

---

## 8. Project Structure
```
Raale project/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/ (dashboard, events, dependencies, replay, audit, experiments, rules)
│   │   ├── services/ (dependency_checker, dry_run_engine, replay_engine, baseline_engine, snapshot_manager, audit_service)
│   │   └── seed/ (seed_data.py)
│   ├── tests/ (test_events, test_dependencies, test_dry_run, test_replay, test_edge_cases, conftest)
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/ (Header, Sidebar, StatusBadge, MetricCard, JsonViewer, DiffViewer, ReplayModal)
│   │   ├── pages/ (Dashboard, Events, EventDetails, DryRun, ReplayOperations, AuditLogs, Experiments, Settings, SystemHealth)
│   │   ├── services/ (api.ts)
│   │   ├── types/ (index.ts)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
│
├── data/
│   └── raale.db (SQLite database with 10,000+ events)
├── docs/ (ARCHITECTURE.md, USER_GUIDE.md, TEST_RESULTS.md, ETHICS.md, DEPLOYMENT.md)
├── README.md
└── start.bat
```
