import json
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogListResponse, AuditLogResponse

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Trail"])

@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    event_id: Optional[str] = None,
    action: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if event_id:
        query = query.filter(AuditLog.event_id == event_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if status:
        query = query.filter(AuditLog.status == status)
    if search:
        query = query.filter(
            or_(
                AuditLog.event_id.ilike(f"%{search}%"),
                AuditLog.actor_role.ilike(f"%{search}%"),
                AuditLog.action.ilike(f"%{search}%"),
                AuditLog.reason.ilike(f"%{search}%")
            )
        )

    logs_raw = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    items = []

    for l in logs_raw:
        try:
            dr_res = json.loads(l.dry_run_result) if l.dry_run_result else None
        except Exception:
            dr_res = None

        try:
            rp_res = json.loads(l.replay_result) if l.replay_result else None
        except Exception:
            rp_res = None

        items.append(AuditLogResponse(
            id=l.id,
            event_id=l.event_id,
            actor_role=l.actor_role,
            action=l.action,
            timestamp=l.timestamp,
            status=l.status,
            reason=l.reason,
            transformation_version=l.transformation_version,
            snapshot_hash=l.snapshot_hash,
            dry_run_result=dr_res,
            replay_result=rp_res
        ))

    return AuditLogListResponse(items=items, total=len(items))
