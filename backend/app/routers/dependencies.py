from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DependencyCheckResult, DependencyCheckRequest
from app.services.dependency_checker import DependencyChecker

router = APIRouter(prefix="/api/events", tags=["Dependencies"])

@router.post("/{event_id}/dependencies/check", response_model=DependencyCheckResult)
def check_event_dependencies(
    event_id: str,
    payload: DependencyCheckRequest = DependencyCheckRequest(),
    db: Session = Depends(get_db)
):
    result = DependencyChecker.check_dependencies(db, event_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")
    return DependencyCheckResult(**result)
