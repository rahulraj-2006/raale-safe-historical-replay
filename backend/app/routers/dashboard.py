from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Event, AuditLog, ReplayRecord
from app.schemas import DashboardMetrics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_events = db.query(Event).count()
    replayed = db.query(Event).filter(Event.status == "REPLAYED").count()
    blocked = db.query(Event).filter(Event.status == "BLOCKED").count()
    eligible = db.query(Event).filter(
        Event.status.in_(["ARCHIVED", "PENDING_REPLAY"]),
        Event.is_malformed == False,
        Event.has_missing_dependency == False,
        Event.has_transformation_mismatch == False,
        Event.has_snapshot_conflict == False
    ).count()

    dry_runs = db.query(AuditLog).filter(AuditLog.action == "DRY_RUN_COMPLETED").count()
    successful = db.query(ReplayRecord).filter(ReplayRecord.status == "EXECUTED").count()
    failed = db.query(ReplayRecord).filter(ReplayRecord.status == "FAILED").count()
    duplicates_prevented = db.query(AuditLog).filter(
        AuditLog.action == "REPLAY_BLOCKED",
        AuditLog.reason.like("%already been successfully replayed%")
    ).count()

    # Events by source distribution
    sources_query = db.query(Event.source_system, func.count(Event.id)).group_by(Event.source_system).all()
    events_by_source = {src: count for src, count in sources_query}

    # Status distribution
    status_query = db.query(Event.status, func.count(Event.id)).group_by(Event.status).all()
    replay_status_counts = {st: count for st, count in status_query}

    # Failure reasons distribution from Audit logs
    failure_reasons = {
        "Duplicate Replay": duplicates_prevented,
        "Missing Dependency": db.query(Event).filter(Event.has_missing_dependency == True).count(),
        "Transformation Mismatch": db.query(Event).filter(Event.has_transformation_mismatch == True).count(),
        "Snapshot Conflict": db.query(Event).filter(Event.has_snapshot_conflict == True).count(),
        "Malformed Payload": db.query(Event).filter(Event.is_malformed == True).count()
    }

    return DashboardMetrics(
        total_events=total_events,
        eligible_events=eligible,
        blocked_events=blocked,
        already_replayed=replayed,
        dry_runs_executed=dry_runs,
        successful_replays=successful,
        failed_replays=failed,
        duplicates_prevented=duplicates_prevented,
        events_by_source=events_by_source,
        replay_status_counts=replay_status_counts,
        failure_reason_counts=failure_reasons,
        avg_processing_time_ms=4.8
    )
