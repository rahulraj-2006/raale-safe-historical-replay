from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, Field

# --- Event Schemas ---
class EventBase(BaseModel):
    id: str
    source_system: str
    event_type: str
    event_timestamp: datetime
    entity_reference: str
    payload: Dict[str, Any]
    schema_version: str
    transformation_version: str
    dependency_ids: List[str] = []
    status: str
    is_malformed: bool = False
    has_missing_dependency: bool = False
    has_transformation_mismatch: bool = False
    has_snapshot_conflict: bool = False

class EventDetailResponse(EventBase):
    dependencies_detail: List[Dict[str, Any]] = []
    target_snapshot: Optional[Dict[str, Any]] = None
    replay_history: List[Dict[str, Any]] = []

class EventListResponse(BaseModel):
    items: List[EventBase]
    total: int
    page: int
    size: int
    pages: int

# --- Dependency Check Schemas ---
class DependencyCheckRequest(BaseModel):
    actor_role: str = "Integration Engineer"

class DependencyCheckResult(BaseModel):
    event_id: str
    status: str  # PASS, WARNING, BLOCKED
    checks_passed: int
    checks_total: int
    block_reasons: List[str]
    warning_reasons: List[str]
    details: Dict[str, Any]

# --- Dry Run Schemas ---
class DryRunRequest(BaseModel):
    actor_role: str = "Integration Engineer"
    target_transformation_version: str = "v2.0"

class DryRunResult(BaseModel):
    dry_run_id: str
    event_id: str
    original_snapshot: Dict[str, Any]
    predicted_snapshot: Dict[str, Any]
    changed_fields: List[str]
    added_fields: List[str]
    removed_fields: List[str]
    hash_before: str
    hash_after: str
    hash_difference: bool
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    dependency_status: str
    transformation_version: str
    executed_at: datetime

# --- Replay Schemas ---
class ReplayRequestInput(BaseModel):
    actor_role: str = "Integration Engineer"
    reason: str = "Defect corrected in transformation engine v2.0"

class ApprovalRequestInput(BaseModel):
    actor_role: str = "Auditor / Operations Manager"
    reason: Optional[str] = "Dry run verified and approved for safe execution"

class ReplayExecutionInput(BaseModel):
    actor_role: str = "Integration Engineer"

class ReplayResponse(BaseModel):
    event_id: str
    replay_record_id: int
    status: str  # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED, BLOCKED, FAILED
    message: str
    target_updated: bool
    new_snapshot_hash: Optional[str] = None
    executed_at: Optional[datetime] = None

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    event_id: str
    actor_role: str
    action: str
    timestamp: datetime
    status: str
    reason: Optional[str]
    transformation_version: Optional[str]
    snapshot_hash: Optional[str]
    dry_run_result: Optional[Dict[str, Any]]
    replay_result: Optional[Dict[str, Any]]

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int

# --- Rule Schemas ---
class RuleResponse(BaseModel):
    id: int
    rule_key: str
    name: str
    description: str
    is_enabled: bool
    category: str

class RuleUpdateInput(BaseModel):
    is_enabled: bool

# --- Experiment Schemas ---
class ExperimentMetrics(BaseModel):
    engine_name: str
    total_events: int
    successful_replays: int
    duplicate_replays: int
    unsafe_replays: int
    blocked_events: int
    dependency_failures: int
    snapshot_conflicts: int
    transformation_errors: int
    total_processing_time_ms: float
    avg_processing_time_ms: float
    error_rate_pct: float

class ExperimentRunResponse(BaseModel):
    experiment_id: str
    timestamp: datetime
    baseline: ExperimentMetrics
    safe_replay: ExperimentMetrics
    summary: str

# --- Dashboard Schemas ---
class DashboardMetrics(BaseModel):
    total_events: int
    eligible_events: int
    blocked_events: int
    already_replayed: int
    dry_runs_executed: int
    successful_replays: int
    failed_replays: int
    duplicates_prevented: int
    events_by_source: Dict[str, int]
    replay_status_counts: Dict[str, int]
    failure_reason_counts: Dict[str, int]
    avg_processing_time_ms: float
