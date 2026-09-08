import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        event_id: str,
        actor_role: str,
        action: str,
        status: str,
        reason: Optional[str] = None,
        transformation_version: Optional[str] = None,
        snapshot_hash: Optional[str] = None,
        dry_run_result: Optional[Dict[str, Any]] = None,
        replay_result: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        entry = AuditLog(
            event_id=event_id,
            actor_role=actor_role,
            action=action,
            timestamp=datetime.utcnow(),
            status=status,
            reason=reason,
            transformation_version=transformation_version,
            snapshot_hash=snapshot_hash,
            dry_run_result=json.dumps(dry_run_result) if dry_run_result else None,
            replay_result=json.dumps(replay_result) if replay_result else None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
