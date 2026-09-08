# RAALE – System Architecture Document

## 1. System Overview
RAALE (Safe Historical Replay Platform) is an enterprise hospital integration safety platform designed to prevent target data corruption, duplicate mutations, and un-audited historical replay after integration defect resolution.

```
+-----------------------------------------------------------------------+
|                              FRONTEND                                 |
|      React 18 + TypeScript + Vite + Tailwind CSS + Recharts           |
+-----------------------------------------------------------------------+
                                   |
                                   | REST API (http://127.0.0.1:8000/api)
                                   v
+-----------------------------------------------------------------------+
|                               BACKEND                                 |
|                    FastAPI + Uvicorn + Pydantic                       |
+-----------------------------------------------------------------------+
   |             |                |                 |             |
   v             v                v                 v             v
[Dependency] [Dry Run]  [Transformation]    [Safe Replay]   [Audit Log]
[ Checker  ] [ Engine]  [    Engine    ]    [   Engine  ]   [ Service ]
   |             |                |                 |             |
   +-------------+----------------+-----------------+-------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                               DATABASE                                |
|                        SQLite 3 (raale.db)                            |
|                                                                       |
| Tables: events, transformations, dependencies, target_snapshots,      |
|         mock_target, replay_records, audit_logs, replay_rules          |
+-----------------------------------------------------------------------+
```

## 2. Core Components & Responsibilities

### 2.1 Dependency Checker Service (`dependency_checker.py`)
Validates 10 mandatory safety pre-conditions:
1. Event Existence
2. JSON Payload Validity
3. Prerequisite Event Existence
4. Dependency Satisfaction Status
5. Transformation Availability
6. Transformation Version Compatibility
7. Target Snapshot Availability
8. Idempotency Lock (Event not already replayed)
9. Active Replay Safety Rules
10. Target Snapshot Conflict Detection

### 2.2 Dry Run Engine (`dry_run_engine.py`)
Provides non-mutating prediction of target state changes:
- Applies corrected v2.0 transformation to historical payload.
- Merges with current `TargetSnapshot`.
- Computes JSON key diffs (`changed_fields`, `added_fields`, `removed_fields`).
- Calculates before and after SHA256 snapshot hashes.
- Assigns Risk Level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 2.3 Safe Replay Engine (`replay_engine.py`)
Executes safe target mutations with strict governance:
- Checks idempotency locks to block duplicate replays.
- Enforces configurable safety rules (`block_duplicate_replay`, `require_dependency_success`, `require_dry_run`, `require_approval`, `block_snapshot_conflict`).
- Mutates `MockTarget` and `TargetSnapshot` tables atomically.
- Records structured immutable audit entries.

### 2.4 Baseline Engine (`baseline_engine.py`)
Direct legacy replay implementation used as an empirical baseline to benchmark against Safe Replay.

## 3. Database Schema

- `events`: Historical synthetic events archive (10,000+ records).
- `transformations`: Catalog of versioned mapping logic.
- `dependencies`: Prerequisite event dependency graph.
- `target_snapshots`: Canonical state snapshots per entity reference.
- `mock_target`: Simulated downstream target system database.
- `replay_records`: Governance requests and approval records.
- `audit_logs`: Immutable system action audit trail.
- `replay_rules`: Configurable safety policies.
