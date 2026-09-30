# RAALE – Safe Historical Replay Platform

**Location**: `D:\Users\welcome\Documents\Raale project`  
**Version**: 2.0.0 (Enterprise Safe Historical Replay Platform for Healthcare Integrations)  
**Status**: Review 3 Final Implementation (100% Complete)

---

## 1. Project Overview

### The Problem
Hospitals integrate dozens of legacy clinical systems (Laboratory, Radiology, Pharmacy, Admissions, Billing) acquired over decades from disparate vendors. When an integration transformation defect is discovered and fixed in an interface engine, engineers must replay historical events. Uncontrolled legacy replay causes catastrophic failures:
* **Duplicate target mutations** (re-triggering billing charges or duplicate medication dispenses)
* **Missing dependencies** (creating orphaned lab observations lacking patient encounter context)
* **Transformation mismatches** (corrupting electronic health record chart history)
* **Snapshot state conflicts** (overwriting real-time clinical updates made by attending physicians)
* **Compliance audit failure** (inability to trace who authorized or re-executed historical data)

### The RAALE Solution
**RAALE (Replay Assurance and Audit for Legacy Events)** implements a zero-trust, safety-first historical replay platform. Every event re-execution passes through multi-layer validation, non-mutating dry-run simulation, role-based dual-control governance, and immutable audit logging.

```
Historical Event
       │
       ▼
Authentication & Role Check (JWT Guard)
       │
       ▼
Dependency Validation (Sequence & Parent Prerequisites)
       │
       ▼
Payload Structural Validation (HL7 ADT/ORU & FHIR Bundle)
       │
       ▼
Transformation Rule Processing (v2.0 Schema Alignment)
       │
       ▼
Dry-Run Simulation & Diffs (Non-mutating state prediction)
       │
       ▼
Replay Request Submission (Integration Engineer)
       │
       ▼
Dual-Control Approval (Clinical Lead Sign-Off)
       │
       ▼
Replay Execution & Mock Target Update (Idempotency Locked)
       │
       ▼
Immutable Audit Log Entry Persisted
```

---

## 2. Review Progress Roadmap

| Review Phase | Weight | Implementation Highlights | Status |
| :--- | :--- | :--- | :--- |
| **Review 1** | **35%** | Core safety engine, dependency checker, dry-run simulation, snapshot manager, basic audit trail | **Completed** |
| **Review 2** | **35%** | 14-metric comparative experiment benchmark, JWT auth & RBAC (Engineer vs Clinical Lead), HL7 ADT/ORU & FHIR payload validation, 10 edge-case test suite scenarios | **Completed** |
| **Review 3** | **30%** | Comprehensive unit test documentation (`TESTING.md`), error boundary architecture (`ERROR_HANDLING.md`), expanded code comments, complete API reference, and DB schema documentation | **Current / Final (100%)** |

---

## 3. System Architecture & Communication Flow

### Technology Stack
* **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Recharts 2, Lucide Icons
* **Backend**: Python 3.14 / 3.12, FastAPI, PyJWT, Pydantic v2, SQLAlchemy 2.0, Uvicorn
* **Database**: SQLite 3 (`data/raale.db`) with 10,000+ synthetic historical events
* **Testing**: Pytest 9, Starlette TestClient, HTTPX, AnyIO

### Communication Flow

```
+-------------------------------------------------------+
|                React 18 TypeScript UI                 |
|   (Dashboard, Events, Payloads, DryRun, Experiments)  |
+---------------------------+---------------------------+
                            |
                            | REST API (HTTP / JSON / JWT)
                            v
+-------------------------------------------------------+
|                  FastAPI REST Routers                 |
| (auth, payloads, events, replay, audit, experiments)  |
+---------------------------+---------------------------+
                            |
                            | Internal Service Invocations
                            v
+-------------------------------------------------------+
|                  RAALE Service Engines                |
|  (AuthService, PayloadValidator, DependencyChecker,   |
|   DryRunEngine, ReplayEngine, SnapshotManager, Audit) |
+---------------------------+---------------------------+
                            |
                            | ORM Layer
                            v
+-------------------------------------------------------+
|                    SQLAlchemy 2.0                     |
+---------------------------+---------------------------+
                            |
                            | SQL
                            v
+-------------------------------------------------------+
|                 SQLite 3 Database                     |
|                   (data/raale.db)                     |
+-------------------------------------------------------+
```

---

## 4. Project Directory Structure

```
Raale project/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application initialization & middleware
│   │   ├── config.py             # Application settings & CORS configuration
│   │   ├── database.py           # SQLAlchemy database session setup
│   │   ├── models.py             # Database ORM entity models
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py           # Authentication & login endpoints
│   │   │   ├── payloads.py       # Healthcare payload validation & test-suite endpoints
│   │   │   ├── events.py         # Historical event listing & detail retrieval
│   │   │   ├── dependencies.py   # Dependency validation endpoints
│   │   │   ├── replay.py         # Dry-run, request, approve, & execute endpoints
│   │   │   ├── audit.py          # Audit log retrieval & query endpoints
│   │   │   ├── experiments.py    # Comparative benchmark & metrics endpoints
│   │   │   ├── dashboard.py      # System summary metrics endpoint
│   │   │   └── rules.py          # Safety rule configuration endpoints
│   │   ├── services/
│   │   │   ├── auth_service.py   # JWT token generation, password hashing, RBAC guards
│   │   │   ├── payload_validator.py # HL7 ADT, HL7 ORU, & FHIR Bundle validator
│   │   │   ├── dependency_checker.py # Prerequisite event sequence validator
│   │   │   ├── dry_run_engine.py  # Non-mutating state prediction engine
│   │   │   ├── replay_engine.py   # Idempotency-locked replay execution engine
│   │   │   ├── baseline_engine.py # Direct legacy unvalidated replay engine
│   │   │   ├── snapshot_manager.py# Target state hashing & conflict detector
│   │   │   ├── transformation_engine.py # Schema mapping version engine
│   │   │   └── audit_service.py  # Immutable audit log recorder
│   │   └── seed/
│   │       └── seed_data.py      # SQLite database seeder (10,000+ synthetic events & users)
│   ├── tests/                    # Automated pytest suite (25 test cases)
│   ├── requirements.txt          # Python dependencies
│   └── run.py                    # Application launcher
│
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components (Header, Sidebar, DiffViewer, etc.)
│   │   ├── pages/                # Page views (Dashboard, Events, PayloadValidation, Experiments, etc.)
│   │   ├── services/             # Axios API client (api.ts)
│   │   ├── types/                # TypeScript interfaces (index.ts)
│   │   ├── App.tsx               # Main application router
│   │   └── main.tsx              # React entry point
│   └── package.json              # Frontend dependencies
│
├── data/
│   └── raale.db                  # SQLite database file
├── docs/
│   ├── TESTING.md                # Comprehensive test strategy & matrix documentation
│   ├── ERROR_HANDLING.md         # Error boundary & failure handling documentation
│   ├── ARCHITECTURE.md           # Deep architectural specification
│   ├── USER_GUIDE.md             # Platform walkthrough guide
│   └── TEST_RESULTS.md           # Measured empirical test results
├── README.md                     # Technical project documentation
└── start.bat                     # Windows platform launcher batch script
```

---

## 5. Complete API Reference

Interactive OpenAPI / Swagger documentation is available at `http://127.0.0.1:8000/docs` when the backend is running.

| HTTP Method | Endpoint | Purpose | Auth Required | Required Role | Request Body / Query Params | Response Purpose | Important Failure Responses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | No | Any | `LoginInput` (`username`, `password`) | JWT access token & user profile | `401 Unauthorized` (Invalid credentials) |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) | Any | None | User profile & role details | `401 Unauthorized` (Missing/expired token) |
| `GET` | `/api/auth/users` | List prototype seed users | No | Any | None | List of available users & roles | None |
| `GET` | `/api/health` | Service health status check | No | Any | None | System status & database count | `500 Internal Error` |
| `GET` | `/api/dashboard` | Aggregated system metrics | No | Any | None | Total events, replayed, blocked counts | `500 Internal Error` |
| `GET` | `/api/events` | List historical events | No | Any | `page`, `size`, `source_system`, `status`, `search` | Paginated event list | `422 Validation Error` |
| `GET` | `/api/events/{id}` | Fetch event details & history | No | Any | Path `id` | Event detail, dependencies, snapshot | `404 Not Found` |
| `POST` | `/api/events/{id}/dependencies/check` | Validate prerequisite dependencies | Optional | Any | `DependencyCheckRequest` (`actor_role`) | Status (`PASS` / `BLOCKED`), reasons | `404 Not Found` |
| `POST` | `/api/events/{id}/dry-run` | Run non-mutating dry run diff | Optional | Integration Eng / Clinical Lead | `DryRunRequest` (`actor_role`, `target_transformation_version`) | Predicted snapshot diff & risk level | `404 Not Found`, `500 Error` |
| `POST` | `/api/events/{id}/replay/request` | Submit replay approval request | Optional | Integration Eng / Clinical Lead | `ReplayRequestInput` (`actor_role`, `reason`) | Request status (`PENDING_APPROVAL`) | `404 Not Found` |
| `POST` | `/api/events/{id}/replay/approve` | Approve replay for execution | Yes / Role | **Clinical Lead** | `ApprovalRequestInput` (`actor_role`, `reason`) | Approval status (`APPROVED`) | `403 Forbidden` (Integration Eng attempt) |
| `POST` | `/api/events/{id}/replay/reject` | Reject replay request | Yes / Role | **Clinical Lead** | `ApprovalRequestInput` (`actor_role`, `reason`) | Rejection status (`REJECTED`) | `403 Forbidden` (Integration Eng attempt) |
| `POST` | `/api/events/{id}/replay/execute` | Execute safe target mutation | Optional | Integration Eng / Clinical Lead | `ReplayExecutionInput` (`actor_role`) | Execution status (`EXECUTED`), new hash | `404 Not Found`, `200` (Status `BLOCKED`) |
| `GET` | `/api/events/{id}/replay-history` | Fetch replay history records | No | Any | Path `id` | List of past replay attempts | `404 Not Found` |
| `POST` | `/api/payloads/validate` | Validate HL7 or FHIR payload | No | Any | `ValidatePayloadInput` (`payload`, `payload_type`, `event_id`) | Status (`VALID`, `INVALID`, `INCOMPLETE`, etc.) | `422 Validation Error` |
| `GET` | `/api/payloads/test-suite` | Fetch 10 synthetic test cases | No | Any | None | List of 10 test case samples | None |
| `POST` | `/api/payloads/test-suite/run-all` | Run automated test suite | No | Any | None | Aggregated test suite results | `500 Internal Error` |
| `GET` | `/api/audit-logs` | Query audit trail records | No | Any | `event_id`, `action`, `status`, `search`, `limit` | Audit log list | `422 Validation Error` |
| `GET` | `/api/rules` | Fetch safety policy rules | No | Any | None | List of configurable rules | `500 Internal Error` |
| `PUT` | `/api/rules/{id}` | Update safety rule status | No | Any | `RuleUpdateInput` (`is_enabled`) | Updated rule record | `404 Not Found` |
| `GET` | `/api/experiments` | Fetch latest benchmark result | No | Any | None | 14-metric baseline vs safe comparison | `500 Internal Error` |
| `POST` | `/api/experiments/run` | Run new comparative benchmark | No | Any | `sample_size` (default 500) | Computed benchmark metrics & definitions | `500 Internal Error` |

---

## 6. Database Schema Documentation

RAALE uses SQLAlchemy 2.0 mapping to a SQLite database (`data/raale.db`).

### Entity Relationship Diagram

```
User (Authentication & RBAC Roles)
  │
  ├─────────────────────────────────────────┐
  ▼                                         ▼
ReplayRecord (Requests & Approvals)    AuditLog (Immutable Logs)
  │                                         ▲
  ▼                                         │
Event (Historical Legacy Payload) ──────────┤
  │                                         │
  ├───────────────► Dependency              │
  │                                         │
  ├───────────────► TargetSnapshot ─────────┤
  │                                         │
  ├───────────────► PayloadValidationRecord ┘
  │
  ▼
MockTarget (Simulated Downstream State)
```

### Table Definitions

#### 1. `users` (`User`)
* **Purpose**: User authentication credentials and operational roles.
* **Primary Key**: `id` (Integer)
* **Fields**: `username` (String, Unique), `email` (String, Unique), `hashed_password` (String), `role` (String: `"Integration Engineer"`, `"Clinical Lead"`), `full_name` (String), `is_active` (Boolean), `created_at` (DateTime).

#### 2. `events` (`Event`)
* **Purpose**: Immutable archive of historical events ingested from legacy clinical systems.
* **Primary Key**: `id` (String)
* **Fields**: `source_system` (String), `event_type` (String), `event_timestamp` (DateTime), `entity_reference` (String), `payload` (Text), `schema_version` (String), `transformation_version` (String), `dependency_ids` (Text), `status` (String: `"ARCHIVED"`, `"PENDING_REPLAY"`, `"REPLAYED"`, `"BLOCKED"`), `is_malformed` (Boolean), `has_missing_dependency` (Boolean), `has_transformation_mismatch` (Boolean), `has_snapshot_conflict` (Boolean).

#### 3. `replay_records` (`ReplayRecord`)
* **Purpose**: Tracks replay approval request lifecycle and dual-control sign-off.
* **Primary Key**: `id` (Integer)
* **Foreign Keys**: `event_id` → `events.id`
* **Fields**: `requested_by_role` (String), `approved_by_role` (String), `status` (String: `"PENDING_APPROVAL"`, `"APPROVED"`, `"REJECTED"`, `"EXECUTED"`, `"BLOCKED"`), `requested_at` (DateTime), `approved_at` (DateTime), `executed_at` (DateTime), `dry_run_id` (String), `error_message` (Text).

#### 4. `audit_logs` (`AuditLog`)
* **Purpose**: Immutable audit log of every system operation and safety block.
* **Primary Key**: `id` (Integer)
* **Fields**: `event_id` (String), `actor_role` (String), `action` (String), `timestamp` (DateTime), `status` (String), `reason` (Text), `transformation_version` (String), `snapshot_hash` (String), `dry_run_result` (Text), `replay_result` (Text).

#### 5. `target_snapshots` (`TargetSnapshot`)
* **Purpose**: Current state representation and hash of downstream target entities.
* **Primary Key**: `id` (Integer)
* **Fields**: `entity_reference` (String, Unique), `snapshot_hash` (String), `state_data` (Text), `updated_at` (DateTime).

#### 6. `mock_target` (`MockTarget`)
* **Purpose**: Simulated target system mutated only by safe replay execution.
* **Primary Key**: `id` (Integer)
* **Fields**: `entity_reference` (String, Unique), `target_state` (Text), `last_updated_by_event_id` (String), `version` (Integer), `updated_at` (DateTime).

#### 7. `dependencies` (`Dependency`)
* **Purpose**: Sequence prerequisite event mapping.
* **Primary Key**: `id` (Integer)
* **Foreign Keys**: `event_id` → `events.id`
* **Fields**: `required_event_id` (String), `dependency_type` (String), `status` (String).

#### 8. `transformations` (`Transformation`)
* **Purpose**: Corrected schema transformation catalog.
* **Primary Key**: `id` (String)
* **Fields**: `source_system` (String), `target_system` (String), `source_version` (String), `target_version` (String), `rules_json` (Text), `description` (Text), `is_active` (Boolean).

#### 9. `replay_rules` (`ReplayRule`)
* **Purpose**: Configurable safety and process policies.
* **Primary Key**: `id` (Integer)
* **Fields**: `rule_key` (String, Unique), `name` (String), `description` (Text), `is_enabled` (Boolean), `category` (String).

#### 10. `benchmark_runs` (`BenchmarkRun`)
* **Purpose**: Persisted comparative experiment benchmark metrics.
* **Primary Key**: `id` (Integer)
* **Fields**: `experiment_id` (String, Unique), `created_at` (DateTime), `total_events` (Integer), `baseline_metrics_json` (Text), `safe_metrics_json` (Text), `summary` (Text).

#### 11. `payload_validation_records` (`PayloadValidationRecord`)
* **Purpose**: Results log for HL7 ADT/ORU & FHIR Bundle validations.
* **Primary Key**: `id` (Integer)
* **Fields**: `event_id` (String), `payload_type` (String), `validation_status` (String), `issues_json` (Text), `validated_at` (DateTime).

---

## 7. Setup & Execution Guide

### Quick Start (Launcher Script)
Double-click `start.bat` in the project root:
```powershell
D:\Users\welcome\Documents\Raale project\start.bat
```

### Manual Backend Setup & Startup
```powershell
cd "D:\Users\welcome\Documents\Raale project\backend"
python -m venv .venv
.\.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
python run.py
```
* **Backend API**: `http://127.0.0.1:8000`
* **Swagger API Docs**: `http://127.0.0.1:8000/docs`

### Running Backend Test Suite
```powershell
cd "D:\Users\welcome\Documents\Raale project\backend"
.\.venv\Scripts\pytest.exe
```
* **Current Result**: `25 passed in 5.36s` (100% Pass Rate).

---

## 8. Synthetic Data & Compliance Declaration
This application uses **100% synthetic patient identifiers** (`PATIENT-TEST-00001` ... `PATIENT-TEST-00500`) and deterministic seed values (`seed(42)`). No real patient data or Protected Health Information (PHI) is used.
