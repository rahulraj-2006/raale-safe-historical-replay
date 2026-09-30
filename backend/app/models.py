from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    source_system = Column(String, index=True, nullable=False)
    event_type = Column(String, index=True, nullable=False)
    event_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    entity_reference = Column(String, index=True, nullable=False)
    payload = Column(Text, nullable=False)  # JSON string
    schema_version = Column(String, nullable=False, default="v1.0")
    transformation_version = Column(String, nullable=False, default="v1.2")
    dependency_ids = Column(Text, nullable=True, default="[]")  # JSON list string
    status = Column(String, default="ARCHIVED", index=True)  # ARCHIVED, PENDING_REPLAY, REPLAYED, BLOCKED, FAILED
    
    # Intentional defect test flags
    is_malformed = Column(Boolean, default=False)
    has_missing_dependency = Column(Boolean, default=False)
    has_transformation_mismatch = Column(Boolean, default=False)
    has_snapshot_conflict = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transformation(Base):
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
    __tablename__ = "dependencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, ForeignKey("events.id"), index=True, nullable=False)
    required_event_id = Column(String, index=True, nullable=False)
    dependency_type = Column(String, default="PREREQUISITE")  # PREREQUISITE, PARENT_ORDER, ENCOUNTER_CONTEXT
    status = Column(String, default="SATISFIED")  # SATISFIED, MISSING, FAILED


class TargetSnapshot(Base):
    __tablename__ = "target_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_reference = Column(String, unique=True, index=True, nullable=False)
    snapshot_hash = Column(String, nullable=False)
    state_data = Column(Text, nullable=False)  # JSON representation of current state
    updated_at = Column(DateTime, default=datetime.utcnow)


class MockTarget(Base):
    __tablename__ = "mock_target"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_reference = Column(String, unique=True, index=True, nullable=False)
    target_state = Column(Text, nullable=False)  # JSON representation of target state
    last_updated_by_event_id = Column(String, nullable=True)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ReplayRecord(Base):
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
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, index=True, nullable=False)
    actor_role = Column(String, nullable=False)
    action = Column(String, index=True, nullable=False)  # DRY_RUN_STARTED, DRY_RUN_COMPLETED, REPLAY_REQUESTED, REPLAY_APPROVED, REPLAY_REJECTED, REPLAY_BLOCKED, REPLAY_COMPLETED, REPLAY_FAILED
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, nullable=False)  # SUCCESS, FAILED, BLOCKED, WARNING
    reason = Column(Text, nullable=True)
    transformation_version = Column(String, nullable=True)
    snapshot_hash = Column(String, nullable=True)
    dry_run_result = Column(Text, nullable=True)  # JSON string
    replay_result = Column(Text, nullable=True)  # JSON string


class ReplayRule(Base):
    __tablename__ = "replay_rules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_key = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    is_enabled = Column(Boolean, default=True)
    category = Column(String, default="SAFETY")  # SAFETY, VALIDATION, PROCESS


class User(Base):
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
    __tablename__ = "benchmark_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    total_events = Column(Integer, nullable=False)
    baseline_metrics_json = Column(Text, nullable=False)
    safe_metrics_json = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)


class PayloadValidationRecord(Base):
    __tablename__ = "payload_validation_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, index=True, nullable=True)
    payload_type = Column(String, nullable=False)  # HL7_ADT, HL7_ORU, FHIR_BUNDLE
    validation_status = Column(String, nullable=False)  # VALID, INVALID, INCOMPLETE, SCHEMA_INCOMPATIBLE, TRANSFORMATION_INCOMPATIBLE
    issues_json = Column(Text, nullable=False)  # JSON string list
    validated_at = Column(DateTime, default=datetime.utcnow)

