from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ReplayRecord
from app.schemas import (
    DryRunRequest, DryRunResult,
    ReplayRequestInput, ApprovalRequestInput, ReplayExecutionInput,
    ReplayResponse
)
from app.services.dry_run_engine import DryRunEngine
from app.services.replay_engine import ReplayEngine

router = APIRouter(prefix="/api/events", tags=["Replay Operations"])

@router.post("/{event_id}/dry-run", response_model=DryRunResult)
def execute_dry_run(
    event_id: str,
    payload: DryRunRequest = DryRunRequest(),
    db: Session = Depends(get_db)
):
    try:
        res = DryRunEngine.execute_dry_run(
            db=db,
            event_id=event_id,
            actor_role=payload.actor_role,
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
    db: Session = Depends(get_db)
):
    try:
        res = ReplayEngine.request_replay(
            db=db,
            event_id=event_id,
            actor_role=payload.actor_role,
            reason=payload.reason
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{event_id}/replay/approve", response_model=ReplayResponse)
def approve_replay(
    event_id: str,
    payload: ApprovalRequestInput = ApprovalRequestInput(),
    db: Session = Depends(get_db)
):
    try:
        res = ReplayEngine.approve_replay(
            db=db,
            event_id=event_id,
            actor_role=payload.actor_role,
            reason=payload.reason or "Approved for safe execution"
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{event_id}/replay/reject", response_model=ReplayResponse)
def reject_replay(
    event_id: str,
    payload: ApprovalRequestInput = ApprovalRequestInput(),
    db: Session = Depends(get_db)
):
    try:
        res = ReplayEngine.reject_replay(
            db=db,
            event_id=event_id,
            actor_role=payload.actor_role,
            reason=payload.reason or "Rejected by auditor"
        )
        return ReplayResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/{event_id}/replay/execute", response_model=ReplayResponse)
def execute_replay(
    event_id: str,
    payload: ReplayExecutionInput = ReplayExecutionInput(),
    db: Session = Depends(get_db)
):
    try:
        res = ReplayEngine.execute_replay(
            db=db,
            event_id=event_id,
            actor_role=payload.actor_role
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
