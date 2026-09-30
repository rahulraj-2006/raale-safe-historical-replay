# RAALE Testing Strategy & Technical Verification Documentation

## 1. Overview & Testing Philosophy

The **Replay Assurance and Audit for Legacy Events (RAALE)** platform utilizes a strict, multi-layered automated test suite built on `pytest` and `Starlette TestClient`. 

Because RAALE is designed for mission-critical healthcare integration re-execution where unintended target state mutation could cause data corruption, testing emphasizes **zero-defect interception**, **strict role-based access control (RBAC)**, **idempotency verification**, and **payload structural validation**.

---

## 2. Testing Framework & Stack

* **Primary Test Runner**: `Pytest` (v9.1.1)
* **API Test Client**: `fastapi.testclient.TestClient` / `starlette.testclient.TestClient`
* **HTTP & Async Utilities**: `httpx` (v0.28.1), `anyio` (v4.15.1)
* **Database Backend for Testing**: Isolated in-memory/file-backed SQLite with fixture rollbacks before each test case
* **Execution Environment**: Python 3.14 virtual environment (`backend/.venv`)

---

## 3. Test Directory Structure

```
backend/tests/
├── conftest.py                   # Shared pytest fixtures, TestClient setup, and database reset hooks
├── test_auth.py                  # JWT authentication, login validation, and protected token endpoints
├── test_authorization.py         # Role-based authorization checks (Integration Engineer vs Clinical Lead)
├── test_benchmark.py            # Comparative experiment calculation and 14-metric evaluation
├── test_dependencies.py         # Prerequisite event dependency validation and sequence ordering
├── test_dry_run.py              # Non-mutating dry-run simulation and predicted snapshot hash diffs
├── test_edge_cases.py           # Intentional defect edge cases (malformed payload, missing dep, conflict)
├── test_events.py               # Historical event retrieval, pagination, filtering, and health check
├── test_payload_validation.py   # HL7 ADT, HL7 ORU, and FHIR Bundle synthetic payload validation (10 TCs)
└── test_replay.py               # Full end-to-end replay workflow (request, approve, execute, idempotency)
```

---

## 4. Test Execution Instructions

### Running the Full Test Suite
To run all automated unit and integration tests across the entire backend:

```powershell
# From the backend directory
.\.venv\Scripts\pytest.exe
```

### Running Specific Test Modules
To run individual test files for targeted verification:

```powershell
# Run Authentication Tests
.\.venv\Scripts\pytest.exe tests/test_auth.py

# Run Role-Based Authorization Tests
.\.venv\Scripts\pytest.exe tests/test_authorization.py

# Run Healthcare Payload Validation Tests
.\.venv\Scripts\pytest.exe tests/test_payload_validation.py

# Run Benchmark & Metrics Tests
.\.venv\Scripts\pytest.exe tests/test_benchmark.py

# Run Replay Workflow Tests
.\.venv\Scripts\pytest.exe tests/test_replay.py
```

### Running with Verbose Output
```powershell
.\.venv\Scripts\pytest.exe -v -s
```

---

## 5. Detailed Test Categories & Specifications

### A. Authentication & Session Testing (`test_auth.py`)
* **Purpose**: Verify that user credentials produce valid JWT tokens and unauthenticated access is rejected.
* **Input / Condition**: Valid credentials (`engineer`/`engineer123`), invalid password (`wrong_pass`), or missing Bearer token.
* **Expected Result**: HTTP 200 with JWT access token for valid login; HTTP 401 Unauthorized for bad credentials or missing token.
* **Failure Behaviour**: Requests lacking valid Bearer headers are immediately rejected before executing endpoint logic.
* **Safety Expectation**: Passwords are hashed with SHA-256 and salt; plain-text credentials are never stored.

### B. Authorization & Role Testing (`test_authorization.py`)
* **Purpose**: Enforce strict separation of duties between `Integration Engineer` and `Clinical Lead` roles.
* **Input / Condition**: Integration Engineer requesting approval vs Clinical Lead approving replay.
* **Expected Result**: Integration Engineer approval attempt fails with HTTP 403 Forbidden; Clinical Lead approval succeeds with HTTP 200 (`status: "APPROVED"`).
* **Failure Behaviour**: Unauthorized approval/rejection attempts are rejected with `403 Forbidden` and logged in the audit trail as `AUTHORIZATION_DENIED`.
* **Safety Expectation**: An Integration Engineer can never directly approve or execute an unapproved replay.

### C. Healthcare Payload Validation Testing (`test_payload_validation.py`)
* **Purpose**: Validate structural syntax, required fields, and schema compatibility for HL7 ADT, HL7 ORU, and FHIR Bundle resources.
* **Input / Condition**: 10 synthetic test cases (valid/invalid ADT, valid/invalid ORU, valid/invalid FHIR Bundle, missing fields, schema issue, transformation mismatch).
* **Expected Result**: Diagnostic classification into `VALID`, `INVALID`, `INCOMPLETE`, `SCHEMA_INCOMPATIBLE`, or `TRANSFORMATION_INCOMPATIBLE`.
* **Failure Behaviour**: Payload parser flags specific segment or JSON errors and returns issue arrays.
* **Safety Expectation**: Any payload with status other than `VALID` is blocked from target execution.

### D. Dependency Validation Testing (`test_dependencies.py`)
* **Purpose**: Confirm upstream sequence prerequisite events are satisfied before replay.
* **Input / Condition**: Event `EVT-DEMO-001` requiring `EVT-DEMO-000` vs `EVT-TEST-MIS-DEP` requiring missing parent.
* **Expected Result**: `PASS` status for satisfied dependencies; `BLOCKED` status with reason array for missing prerequisites.
* **Failure Behaviour**: Execution halts immediately if parent event state is missing.
* **Safety Expectation**: Out-of-order execution is prevented.

### E. Dry-Run Simulation Testing (`test_dry_run.py`)
* **Purpose**: Verify non-mutating target state diff calculation prior to execution.
* **Input / Condition**: Execute dry run on `EVT-DEMO-001` with transformation `v2.0`.
* **Expected Result**: Returns predicted snapshot, changed fields list, hash before/after, and risk level without altering SQLite database tables.
* **Failure Behaviour**: Returns structural diff breakdown and critical risk alerts if schema mapping fails.
* **Safety Expectation**: Dry-run engine never issues SQL `UPDATE` or `INSERT` on mock target table.

### F. End-to-End Replay Workflow & Idempotency Testing (`test_replay.py`)
* **Purpose**: Test full lifecycle: Event → Auth → Dependency Check → Dry Run → Request → Approval → Execution → Target Update → Audit Log.
* **Input / Condition**: Execute replay on approved event vs re-executing already replayed event.
* **Expected Result**: First execution updates mock target snapshot and marks event `REPLAYED`. Second execution returns `BLOCKED` with duplicate replay message.
* **Failure Behaviour**: Duplicate replay requests return status `BLOCKED` and log `REPLAY_BLOCKED` to audit trail.
* **Safety Expectation**: Idempotency safety lock guarantees 0 duplicate target mutations.

### G. Comparative Benchmark Testing (`test_benchmark.py`)
* **Purpose**: Validate comparative 14-metric calculation between RAALE Controlled Replay and Baseline Uncontrolled Replay.
* **Input / Condition**: Run benchmark batch over sample dataset of 100–500 historical events.
* **Expected Result**: Computes failure capture rate (`100%` for RAALE vs `0%` for Baseline), data corruption risk (`0%` for RAALE), average latency, total execution time, and persists run into `BenchmarkRun` DB table.
* **Failure Behaviour**: Handled gracefully with fallback dataset if sample size is zero.
* **Safety Expectation**: Empirical evaluation produces reproducible metrics on real synthetic data without fabrication.

---

## 6. Test Coverage Matrix

| Feature / Module | Test Type | Input Condition | Expected Behaviour | Safety Expectation |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | API Unit Test | Valid / Invalid User Credentials | Returns JWT token on success; HTTP 401 on failure | Password hash verified; token required for protected routes |
| **Authorization** | RBAC Integration Test | Integration Engineer approving replay | HTTP 403 Forbidden response | Prevents unauthorized replay approvals |
| **Historical Events** | API Unit Test | GET `/api/events` with pagination | Returns paginated list of synthetic events | Read-only archive access |
| **Dependency Validation** | Unit / Service Test | Event with unfulfilled prerequisite | Status `BLOCKED` with missing dependency reason | Out-of-order execution prevented |
| **Payload Validation** | Unit / Edge Test | 10 Synthetic HL7/FHIR edge cases | Correctly classifies `VALID` / `INVALID` / `INCOMPLETE` / `SCHEMA_INCOMPATIBLE` | Blocked payloads cannot modify target |
| **Transformation Validation**| Service Test | Legacy schema v1.0 mapping to v2.0 | Dry-run produces valid predicted state diff | Malformed transformations caught prior to write |
| **Dry Run Engine** | Service Test | Non-mutating simulation call | Calculates hash diff and risk level | Target database state remains unmodified |
| **Difference Review** | Integration Test | Compare original vs predicted snapshot | Identifies changed, added, and removed fields | Full transparency into state changes |
| **Replay Approval** | Workflow Test | Clinical Lead approving requested replay | Replay status transitions to `APPROVED` | Requires explicit role sign-off |
| **Replay Execution** | Integration Test | Execute approved valid event | Mock target state updated; event marked `REPLAYED` | Target mutated only after safety pass |
| **Duplicate Protection** | Integration Test | Re-execute already `REPLAYED` event | Status `BLOCKED`; duplicate error logged | Idempotency guaranteed |
| **Benchmark Module** | System Test | Batch benchmark run over 500 events | Computes 14 comparative metrics; persists to DB | Failure capture rate = 100%; Corruption risk = 0% |
| **Audit Logging** | Service Test | Execute actions (auth, dry-run, approve, replay) | Log entry created with timestamp, actor, and result | Complete audit trail for compliance |
| **Failure Handling** | Edge Case Test | Defective events (malformed json, snapshot conflict)| Replay blocked; target state unchanged | Intercepts 100% of defective historical events |

---

## 7. Current Verification Status

```
====================== 25 passed, 254 warnings in 5.36s =======================
```
All **25 automated tests** pass with 100% success rate.
