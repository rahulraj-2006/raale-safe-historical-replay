import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models import TargetSnapshot, MockTarget

class SnapshotManager:
    @staticmethod
    def compute_hash(data: Dict[str, Any]) -> str:
        """Compute deterministic SHA256 hash of dict payload."""
        serialized = json.dumps(data, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @staticmethod
    def get_snapshot(db: Session, entity_reference: str) -> Tuple[Dict[str, Any], str]:
        """Fetch snapshot or create initial mock state for entity reference."""
        snapshot = db.query(TargetSnapshot).filter(TargetSnapshot.entity_reference == entity_reference).first()
        if snapshot:
            return json.loads(snapshot.state_data), snapshot.snapshot_hash
        
        # Default snapshot template for synthetic entities
        default_state = {
            "entity_id": entity_reference,
            "status": "initial_registered",
            "last_updated": datetime.utcnow().isoformat(),
            "active": True,
            "records": []
        }
        h = SnapshotManager.compute_hash(default_state)
        new_snap = TargetSnapshot(
            entity_reference=entity_reference,
            snapshot_hash=h,
            state_data=json.dumps(default_state),
            updated_at=datetime.utcnow()
        )
        db.add(new_snap)
        db.commit()
        return default_state, h

    @staticmethod
    def update_snapshot(db: Session, entity_reference: str, new_state: Dict[str, Any], event_id: str) -> str:
        """Update both TargetSnapshot and MockTarget upon successful replay."""
        new_hash = SnapshotManager.compute_hash(new_state)
        state_str = json.dumps(new_state)
        
        # Update TargetSnapshot
        snap = db.query(TargetSnapshot).filter(TargetSnapshot.entity_reference == entity_reference).first()
        if not snap:
            snap = TargetSnapshot(entity_reference=entity_reference)
            db.add(snap)
        snap.state_data = state_str
        snap.snapshot_hash = new_hash
        snap.updated_at = datetime.utcnow()

        # Update MockTarget
        target = db.query(MockTarget).filter(MockTarget.entity_reference == entity_reference).first()
        if not target:
            target = MockTarget(
                entity_reference=entity_reference,
                target_state=state_str,
                last_updated_by_event_id=event_id,
                version=1,
                updated_at=datetime.utcnow()
            )
            db.add(target)
        else:
            target.target_state = state_str
            target.last_updated_by_event_id = event_id
            target.version += 1
            target.updated_at = datetime.utcnow()

        db.commit()
        return new_hash
