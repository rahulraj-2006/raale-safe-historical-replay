import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Event
from app.services.transformation_engine import TransformationEngine
from app.services.snapshot_manager import SnapshotManager

class BaselineEngine:
    """
    Unsafe baseline replay engine representing standard legacy replay implementations:
    - Direct write to target without dry run
    - No dependency checks
    - Weak duplicate prevention
    - High error rate and target corruption risk
    """
    @staticmethod
    def replay_event_unsafe(db: Session, event: Event) -> Dict[str, Any]:
        # Weak check: simple string status check without lock
        if event.status == "REPLAYED_BASELINE":
            return {
                "success": False,
                "status": "DUPLICATE_UNCHECKED",
                "error": "Weak duplicate detection triggered"
            }

        try:
            # Direct parse payload without schema validation
            payload = json.loads(event.payload) if isinstance(event.payload, str) else event.payload
            
            # Apply transformation directly
            transformed, ver = TransformationEngine.apply_transformation(
                payload=payload,
                source_system=event.source_system,
                event_type=event.event_type,
                target_version="v2.0"
            )

            # Unsafe direct snapshot fetch without conflict detection
            snapshot, _ = SnapshotManager.get_snapshot(db, event.entity_reference)
            snapshot["last_replayed_event_id"] = event.id
            snapshot["transformed_payload"] = transformed

            # Unsafe write to mock target
            new_hash = SnapshotManager.update_snapshot(
                db=db,
                entity_reference=event.entity_reference,
                new_state=snapshot,
                event_id=event.id
            )

            return {
                "success": True,
                "status": "SUCCESS",
                "hash": new_hash
            }

        except Exception as e:
            return {
                "success": False,
                "status": "FAILED",
                "error": str(e)
            }
