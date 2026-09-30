from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ReplayRecord, User
from app.schemas import (
    DryRunRequest, DryRunResult,
    ReplayRequestInput, ApprovalRequestInput, ReplayExecutionInput,
    ReplayResponse
)
from app.services.dry_run_engine import DryRunEngine
from app.services.replay_engine import ReplayEngine
from app.services.auth_service import get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/events", tags=["Replay Operations"])

@router.post("/{event_id}/dry-run", response_model=DryRunResult)
def execute_dry_run(
    event_id: str,
    payload: DryRunRequest = DryRunRequest(),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    actor = current_user.role if current_user else payload.actor_role
    try:
        res = DryRunEngine.execute_dry_run(
            db=db,
            event_id=event_id,
            actor_role=actor,
            target_transformation_version=payload.target_transformation_version
        )
        return DryRunResult(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dry run simulation error: {str(e)}")


@router.post("/{event_id}/replay/request", response_model=ReplayResponse)
def request_replay(
    event_id: str,
    payload: ReplayRequestInput = ReplayRequestInput(),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    actor = current_user.role if current_user else payload.actor_role
    try:
        res = ReplayEngine.request_replay(
            db=db,
            event_id=event_id,
            actor_role=actor,
            reason=payload.reason
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{event_id}/replay/approve", response_model=ReplayResponse)
def approve_replay(
    event_id: str,
    payload: ApprovalRequestInput = ApprovalRequestInput(),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    actor = current_user.role if current_user else payload.actor_role

    # RBAC Enforcement: Only Clinical Lead (or Auditor / Clinical Lead) can approve!
    if actor not in ["Clinical Lead", "Auditor / Operations Manager", "System Administrator"]:
        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor,
            action="AUTHORIZATION_DENIED",
            status="BLOCKED",
            reason=f"Role '{actor}' attempted to approve replay for event '{event_id}' without required Clinical Lead permission."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{actor}' is not authorized to approve replays. Requires 'Clinical Lead' role."
        )

    try:
        res = ReplayEngine.approve_replay(
            db=db,
            event_id=event_id,
            actor_role=actor,
            reason=payload.reason or "Approved by Clinical Lead for safe execution"
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{event_id}/replay/reject", response_model=ReplayResponse)
def reject_replay(
    event_id: str,
    payload: ApprovalRequestInput = ApprovalRequestInput(),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    actor = current_user.role if current_user else payload.actor_role

    # RBAC Enforcement: Only Clinical Lead can reject!
    if actor not in ["Clinical Lead", "Auditor / Operations Manager", "System Administrator"]:
        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor,
            action="AUTHORIZATION_DENIED",
            status="BLOCKED",
            reason=f"Role '{actor}' attempted to reject replay for event '{event_id}' without required Clinical Lead permission."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{actor}' is not authorized to reject replays. Requires 'Clinical Lead' role."
        )

    try:
        res = ReplayEngine.reject_replay(
            db=db,
            event_id=event_id,
            actor_role=actor,
            reason=payload.reason or "Rejected by Clinical Lead"
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{event_id}/replay/execute", response_model=ReplayResponse)
def execute_replay(
    event_id: str,
    payload: ReplayExecutionInput = ReplayExecutionInput(),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    actor = current_user.role if current_user else payload.actor_role
    try:
        res = ReplayEngine.execute_replay(
            db=db,
            event_id=event_id,
            actor_role=actor
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.get("/{event_id}/replay-history", response_model=List[Dict[str, Any]])
def get_replay_history(event_id: str, db: Session = Depends(get_db)):
    records = db.query(ReplayRecord).filter(ReplayRecord.event_id == event_id).order_by(ReplayRecord.requested_at.desc()).all()
    return [
        {
            "id": r.id,
            "event_id": r.event_id,
            "status": r.status,
            "requested_by": r.requested_by_role,
            "approved_by": r.approved_by_role,
            "requested_at": r.requested_at,
            "approved_at": r.approved_at,
            "executed_at": r.executed_at,
            "dry_run_id": r.dry_run_id,
            "error_message": r.error_message
        }
        for r in records
    ]
