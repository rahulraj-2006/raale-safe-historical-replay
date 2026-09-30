from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Event(Base):
    """
    Represents an immutable historical event ingested from legacy healthcare systems
    (e.g., HL7 ADT, HL7 ORU, FHIR Bundle, Lab V1, Pharmacy).
    """
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    source_system = Column(String, index=True, nullable=False)
    event_type = Column(String, index=True, nullable=False)
    event_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    entity_reference = Column(String, index=True, nullable=False)
    payload = Column(Text, nullable=False)  # JSON or raw HL7 string
    schema_version = Column(String, nullable=False, default="v1.0")
    transformation_version = Column(String, nullable=False, default="v1.2")
    dependency_ids = Column(Text, nullable=True, default="[]")  # JSON list string
    status = Column(String, default="ARCHIVED", index=True)  # ARCHIVED, PENDING_REPLAY, REPLAYED, BLOCKED, FAILED
    
    # Intentional defect test flags for benchmark evaluation
    is_malformed = Column(Boolean, default=False)
    has_missing_dependency = Column(Boolean, default=False)
    has_transformation_mismatch = Column(Boolean, default=False)
    has_snapshot_conflict = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transformation(Base):
    """
    Catalog of corrected transformation rules used to map legacy schema payloads
    to modern target FHIR Core schemas.
    """
    __tablename__ = "transformations"

    id = Column(String, primary_key=True, index=True)
    source_system = Column(String, nullable=False, index=True)
    target_system = Column(String, nullable=False, default="FHIR_CORE_TARGET")
    source_version = Column(String, nullable=False)
    target_version = Column(String, nullable=False)
    rules_json = Column(Text, nullable=False)  # Mapping logic JSON
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)


class Dependency(Base):
    """
    Sequence and prerequisite dependencies between historical events to ensure
    out-of-order execution is prevented.
    """
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, ForeignKey("events.id"), index=True, nullable=False)
    required_event_id = Column(String, index=True, nullable=False)
    dependency_type = Column(String, default="PREREQUISITE")  # PREREQUISITE, PARENT_ORDER, ENCOUNTER_CONTEXT
    status = Column(String, default="SATISFIED")  # SATISFIED, MISSING, FAILED


class TargetSnapshot(Base):
    """
    Current state snapshot of target entities (e.g. Patient, Encounter) used for
    conflict detection and state hashing before executing safe replay.
    """
    __tablename__ = "target_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_reference = Column(String, unique=True, index=True, nullable=False)
    snapshot_hash = Column(String, nullable=False)
    state_data = Column(Text, nullable=False)  # JSON representation of current state
    updated_at = Column(DateTime, default=datetime.utcnow)


class MockTarget(Base):
    """
    Simulated target database table where safe re-executions mutate target state
    only after passing all pre-validation and approval gates.
    """
    __tablename__ = "mock_target"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_reference = Column(String, unique=True, index=True, nullable=False)
    target_state = Column(Text, nullable=False)  # JSON representation of target state
    last_updated_by_event_id = Column(String, nullable=True)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ReplayRecord(Base):
    """
    Tracks replay execution lifecycle, requesting role, approval role sign-off,
    and timestamp history for dual-control governance.
    """
    __tablename__ = "replay_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, ForeignKey("events.id"), index=True, nullable=False)
    requested_by_role = Column(String, default="Integration Engineer")
    approved_by_role = Column(String, nullable=True)
    status = Column(String, default="PENDING_APPROVAL", index=True)  # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED, BLOCKED, FAILED
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    dry_run_id = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)


class AuditLog(Base):
    """
    Immutable audit trail capturing all system interactions (authentication, payload
    validations, dry runs, replay requests, approvals, execution, and blocks).
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, index=True, nullable=False)
    actor_role = Column(String, nullable=False)
    action = Column(String, index=True, nullable=False)  # LOGIN_SUCCESS, REPLAY_REQUESTED, REPLAY_APPROVED, REPLAY_BLOCKED, etc.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, nullable=False)  # SUCCESS, FAILED, BLOCKED, WARNING
    reason = Column(Text, nullable=True)
    transformation_version = Column(String, nullable=True)
    snapshot_hash = Column(String, nullable=True)
    dry_run_result = Column(Text, nullable=True)  # JSON string
    replay_result = Column(Text, nullable=True)  # JSON string


class ReplayRule(Base):
    """
    Configurable safety policies and process guards that control replay behavior.
    """
    __tablename__ = "replay_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    is_enabled = Column(Boolean, default=True)
    category = Column(String, default="SAFETY")  # SAFETY, VALIDATION, PROCESS


class User(Base):
    """
    Registered system user account with password hash and assigned operational role
    (Integration Engineer, Clinical Lead, System Administrator).
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Integration Engineer, Clinical Lead, System Administrator
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BenchmarkRun(Base):
    """
    Persisted results of comparative experiments evaluating RAALE Controlled Replay
    vs Baseline Direct Replay over sample historical datasets.
    """
    __tablename__ = "benchmark_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    total_events = Column(Integer, nullable=False)
    baseline_metrics_json = Column(Text, nullable=False)
    safe_metrics_json = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)


class PayloadValidationRecord(Base):
    """
    Audit record storing results of HL7 ADT, HL7 ORU, and FHIR Bundle validations.
    """
    __tablename__ = "payload_validation_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, index=True, nullable=True)
    payload_type = Column(String, nullable=False)  # HL7_ADT, HL7_ORU, FHIR_BUNDLE
    validation_status = Column(String, nullable=False)  # VALID, INVALID, INCOMPLETE, SCHEMA_INCOMPATIBLE, TRANSFORMATION_INCOMPATIBLE
    issues_json = Column(Text, nullable=False)  # JSON string list
    validated_at = Column(DateTime, default=datetime.utcnow)
