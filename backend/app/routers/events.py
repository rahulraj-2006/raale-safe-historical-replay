import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Event, Dependency, ReplayRecord
from app.schemas import EventListResponse, EventDetailResponse, EventBase
from app.services.snapshot_manager import SnapshotManager

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    source_system: Optional[str] = None,
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Event)

    if source_system:
        query = query.filter(Event.source_system == source_system)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if status:
        query = query.filter(Event.status == status)
    if search:
        query = query.filter(
            or_(
                Event.id.ilike(f"%{search}%"),
                Event.entity_reference.ilike(f"%{search}%"),
                Event.source_system.ilike(f"%{search}%"),
                Event.event_type.ilike(f"%{search}%")
            )
        )

    total = query.count()
    pages = (total + size - 1) // size
    items_raw = query.order_by(Event.event_timestamp.desc()).offset((page - 1) * size).limit(size).all()

    items = []
    for e in items_raw:
        try:
            p_dict = json.loads(e.payload) if isinstance(e.payload, str) else e.payload
        except Exception:
            p_dict = {"raw": e.payload}

        try:
            dep_list = json.loads(e.dependency_ids) if isinstance(e.dependency_ids, str) else (e.dependency_ids or [])
        except Exception:
            dep_list = []

        items.append(EventBase(
            id=e.id,
            source_system=e.source_system,
            event_type=e.event_type,
            event_timestamp=e.event_timestamp,
            entity_reference=e.entity_reference,
            payload=p_dict,
            schema_version=e.schema_version,
            transformation_version=e.transformation_version,
            dependency_ids=dep_list,
            status=e.status,
            is_malformed=e.is_malformed,
            has_missing_dependency=e.has_missing_dependency,
            has_transformation_mismatch=e.has_transformation_mismatch,
            has_snapshot_conflict=e.has_snapshot_conflict
        ))

    return EventListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{event_id}", response_model=EventDetailResponse)
def get_event_details(event_id: str, db: Session = Depends(get_db)):
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found.")

    try:
        p_dict = json.loads(e.payload) if isinstance(e.payload, str) else e.payload
    except Exception:
        p_dict = {"raw": e.payload}

    try:
        dep_ids = json.loads(e.dependency_ids) if isinstance(e.dependency_ids, str) else (e.dependency_ids or [])
    except Exception:
        dep_ids = []

    # Get dependencies detail
    deps_raw = db.query(Dependency).filter(Dependency.event_id == event_id).all()
    deps_detail = [
        {"id": d.id, "required_event_id": d.required_event_id, "type": d.dependency_type, "status": d.status}
        for d in deps_raw
    ]
    if not deps_detail and e.has_missing_dependency:
        deps_detail = [{"id": 0, "required_event_id": "EVT-MISSING-PARENT-999", "type": "PREREQUISITE", "status": "MISSING"}]

    # Get target snapshot
    snap, s_hash = SnapshotManager.get_snapshot(db, e.entity_reference)

    # Get replay history
    records_raw = db.query(ReplayRecord).filter(ReplayRecord.event_id == event_id).order_by(ReplayRecord.requested_at.desc()).all()
    history = [
        {
            "id": r.id,
            "status": r.status,
            "requested_by": r.requested_by_role,
            "approved_by": r.approved_by_role,
            "requested_at": r.requested_at,
            "approved_at": r.approved_at,
            "executed_at": r.executed_at,
            "error_message": r.error_message
        }
        for r in records_raw
    ]

    return EventDetailResponse(
        id=e.id,
        source_system=e.source_system,
        event_type=e.event_type,
        event_timestamp=e.event_timestamp,
        entity_reference=e.entity_reference,
        payload=p_dict,
        schema_version=e.schema_version,
        transformation_version=e.transformation_version,
        dependency_ids=dep_ids,
        status=e.status,
        is_malformed=e.is_malformed,
        has_missing_dependency=e.has_missing_dependency,
        has_transformation_mismatch=e.has_transformation_mismatch,
        has_snapshot_conflict=e.has_snapshot_conflict,
        dependencies_detail=deps_detail,
        target_snapshot={"state": snap, "hash": s_hash},
        replay_history=history
    )
