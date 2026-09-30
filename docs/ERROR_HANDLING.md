# RAALE Error Boundary & Failure Handling Architecture

## 1. Overview & Error Handling Principles

The **Replay Assurance and Audit for Legacy Events (RAALE)** platform implements defensive programming and multi-stage failure boundaries. Because legacy event replays carry potential risks of corrupting downstream target systems, RAALE adheres to five strict safety principles:

1. **Default Deny / Block**: Replay execution is blocked unless all safety gates explicitly pass.
2. **Non-Mutating Failure Boundaries**: Validation failures, authorization errors, or schema mismatches halt execution *before* any target database state is mutated.
3. **Audit Immutability**: Every blocked replay attempt, failed authentication, or authorization denial is logged to the `audit_logs` table with actor role, timestamp, and diagnostic reasons.
4. **Information Leakage Prevention**: User-facing API error messages explain operational status without exposing internal stack trace details or sensitive system paths.
5. **Clear Error Categorization**: Errors are distinguished into Validation Failures, Authorization Failures, Business-Rule Failures, and System Exceptions.

---

## 2. Failure Classification Matrix

| Error Type | Description | HTTP Status | Handling Mechanism |
| :--- | :--- | :--- | :--- |
| **Validation Failure** | Payload syntax error, missing fields, HL7 format issue | HTTP 200 / 400 | Intercepted by `PayloadValidator` or `DependencyChecker` |
| **Authorization Failure**| Invalid credentials, unauthenticated request, or improper role | HTTP 401 / 403 | Intercepted by FastAPI `require_role` & Bearer token guard |
| **Business-Rule Failure** | Duplicate replay attempt, unapproved execution request | HTTP 200 (Blocked status) | Intercepted by `ReplayEngine` idempotency & rule guards |
| **System Exception** | Unexpected database error or missing resource | HTTP 404 / 500 | Caught by FastAPI exception handlers; logged quietly |

---

## 3. Comprehensive Failure Scenarios & Diagnostics

### 1. Invalid Authentication
* **Category**: Authorization Failure
* **Detection**: User submits invalid username or password to `/api/auth/login`.
* **Validation Check**: `verify_password` compares SHA-256 salted password hash against SQLite `users` record.
* **User-Visible Result**: HTTP 401 Unauthorized with message `"Invalid username or password."`
* **Replay Blocked**: N/A (Authentication layer).
* **Audit Logging**: Logs `action: "LOGIN_FAILED"`, `status: "FAILED"`, `actor_role: "Unauthenticated User"`.

---

### 2. Unauthorized Access / Role Violation
* **Category**: Authorization Failure
* **Detection**: User with role `Integration Engineer` attempts to call POST `/{event_id}/replay/approve` or `/{event_id}/replay/reject`.
* **Validation Check**: `require_role(["Clinical Lead", "Auditor / Operations Manager"])` dependency checks user token payload.
* **User-Visible Result**: HTTP 403 Forbidden with detail `"Access Denied: Role 'Integration Engineer' is not authorized to approve replays. Requires 'Clinical Lead' role."`
* **Replay Blocked**: YES. Replay request remains in `PENDING_APPROVAL` status; no execution occurs.
* **Audit Logging**: Logs `action: "AUTHORIZATION_DENIED"`, `status: "BLOCKED"`, `actor_role: "Integration Engineer"`.

---

### 3. Missing Dependencies
* **Category**: Validation / Business-Rule Failure
* **Detection**: `DependencyChecker.check_dependencies()` queries SQLite `dependencies` table for event prerequisites.
* **Validation Check**: Checks whether all required parent events exist and have `status == "REPLAYED"`.
* **User-Visible Result**: Returns JSON response with `status: "BLOCKED"` and `block_reasons: ["Missing mandatory prerequisite event 'EVT-00010'"]`.
* **Replay Blocked**: YES. Event status updated to `BLOCKED`.
* **Audit Logging**: Logs `action: "REPLAY_BLOCKED"`, `status: "BLOCKED"`, `reason: "Replay blocked due to safety violations: Missing mandatory prerequisite event"`.

---

### 4. Invalid / Malformed Payload
* **Category**: Validation Failure
* **Detection**: `PayloadValidator.validate_payload()` parses HL7 pipe strings or FHIR JSON structures.
* **Validation Check**: Evaluates JSON syntax, HL7 `MSH` segment header presence, and field delimiter count.
* **User-Visible Result**: Diagnostic status `INVALID` with issues `["MSH segment incomplete or missing required message type in MSH-9"]`.
* **Replay Blocked**: YES. Payload validation check in `ReplayEngine` halts execution before snapshot updates.
* **Audit Logging**: Logs `action: "PAYLOAD_VALIDATED"`, `status: "INVALID"`, `reason: "Payload type HL7_ADT evaluated to INVALID"`.

---

### 5. Incomplete Payload (Missing Required Fields)
* **Category**: Validation Failure
* **Detection**: `PayloadValidator` checks mandatory business attributes (e.g., Patient ID in `PID-3`, FHIR Observation `status` or `code`).
* **Validation Check**: Inspects presence of required identifier strings and nested resource fields.
* **User-Visible Result**: Diagnostic status `INCOMPLETE` with issues `["Missing required Patient ID in PID-3"]`.
* **Replay Blocked**: YES. Execution engine rejects incomplete payload.
* **Audit Logging**: Logs `action: "PAYLOAD_VALIDATED"`, `status: "INCOMPLETE"`.

---

### 6. Schema Incompatibility
* **Category**: Validation Failure
* **Detection**: Payload structure does not match expected HL7 message segment set or FHIR resource specification.
* **Validation Check**: Evaluates presence of mandatory segments (`MSH`, `PID`, `PV1` for ADT; `MSH`, `PID`, `OBR`, `OBX` for ORU) or FHIR `resourceType`.
* **User-Visible Result**: Diagnostic status `SCHEMA_INCOMPATIBLE` with issues `["Missing mandatory patient visit segment 'PV1' for ADT message"]`.
* **Replay Blocked**: YES.
* **Audit Logging**: Logs `action: "PAYLOAD_VALIDATED"`, `status: "SCHEMA_INCOMPATIBLE"`.

---

### 7. Transformation Incompatibility
* **Category**: Validation Failure
* **Detection**: Event payload attributes fail target schema version mapping rules (e.g., v1.0 legacy code unable to map to FHIR Core v2.0).
* **Validation Check**: `TransformationEngine` checks source version vs active target transformation rules.
* **User-Visible Result**: Diagnostic status `TRANSFORMATION_INCOMPATIBLE` with issues `["Legacy payload attributes fail target transformation mapping rules v2.0"]`.
* **Replay Blocked**: YES. Event flagged as transformation mismatch.
* **Audit Logging**: Logs `action: "REPLAY_BLOCKED"`, `status: "BLOCKED"`, `reason: "Transformation version mismatch"`.

---

### 8. Duplicate Replay Attempt (Idempotency Safety)
* **Category**: Business-Rule Failure
* **Detection**: Replay requested for an event that already has `status == "REPLAYED"` or an existing `EXECUTED` replay record.
* **Validation Check**: `ReplayEngine.request_replay()` and `execute_replay()` check existing `ReplayRecord` history in SQLite.
* **User-Visible Result**: Returns response with `status: "BLOCKED"`, `message: "Replay blocked: event has already been successfully replayed."`, `target_updated: false`.
* **Replay Blocked**: YES. Double mutation of downstream target is impossible.
* **Audit Logging**: Logs `action: "REPLAY_BLOCKED"`, `status: "BLOCKED"`, `reason: "Replay blocked: event has already been successfully replayed."`.

---

### 9. Target Snapshot Conflict
* **Category**: Business-Rule Failure
* **Detection**: Target entity state has experienced un-reconciled concurrent modifications since the original historical event timestamp.
* **Validation Check**: `SnapshotManager` checks entity reference state hash against target snapshot records.
* **User-Visible Result**: Returns `status: "BLOCKED"`, `block_reasons: ["Target snapshot conflict detected: concurrent mutation occurred"]`.
* **Replay Blocked**: YES.
* **Audit Logging**: Logs `action: "REPLAY_BLOCKED"`, `status: "BLOCKED"`.

---

### 10. Unapproved Replay Execution Attempt
* **Category**: Business-Rule Failure
* **Detection**: Execution requested for an event that does not have an active `APPROVED` record in `replay_records`.
* **Validation Check**: `ReplayEngine.execute_replay()` checks if `require_approval` rule is enabled and queries for `APPROVED` record.
* **User-Visible Result**: Returns `status: "BLOCKED"`, `message: "Replay blocked: Approval is required from an Auditor before execution."`.
* **Replay Blocked**: YES.
* **Audit Logging**: Logs `action: "REPLAY_BLOCKED"`, `status: "BLOCKED"`, `reason: "Approval is required from an Auditor before execution."`.

---

### 11. Failed Replay Execution / System Exception
* **Category**: Unexpected System Error
* **Detection**: Database transaction failure or runtime error during dry-run calculation or snapshot write.
* **Validation Check**: Wrapped in try/except blocks in router endpoints and service engines.
* **User-Visible Result**: HTTP 500 Internal Server Error with sanitized detail message `"Dry run simulation error: <sanitized message>"`.
* **Replay Blocked**: YES. Database transaction rolled back (`db.rollback()`).
* **Audit Logging**: Logs `action: "REPLAY_FAILED"`, `status: "FAILED"`, `reason: "<error string>"`.

---

### 12. Frontend / API Communication Failures
* **Category**: Network / Client Error
* **Detection**: Axios interceptor catches HTTP 401, 403, 404, or 500 error responses from FastAPI backend.
* **User-Visible Result**: Displays prominent alert banner or toast in the React UI with clear operational feedback (e.g. *"Access Denied: Role 'Integration Engineer' is not authorized to approve replays"*).
* **Replay Blocked**: UI disables action buttons and stops loading spinners.

---

## 4. Error Isolation Architecture Summary

```
                      [ Client / React Frontend ]
                                  │
                                  ▼ (REST Request)
                      [ FastAPI Middleware & Auth Guard ]
                                  │
                   ┌──────────────┴──────────────┐
                   │ Unauthorized (HTTP 401/403) │
                   ▼                             ▼
         [ Reject & Audit Log ]        [ Service Layer Validation ]
                                                 │
                                  ┌──────────────┴──────────────┐
                                  │ Invalid / Blocked           │
                                  ▼                             ▼
                        [ Block & Audit Log ]         [ Execute Target Mutation ]
                                                                │
                                                                ▼
                                                      [ Audit Trail Logged ]
```
