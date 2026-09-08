import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Event
from app.services.snapshot_manager import SnapshotManager
from app.services.transformation_engine import TransformationEngine
from app.services.dependency_checker import DependencyChecker
from app.services.audit_service import AuditService

class DryRunEngine:
    @staticmethod
    def execute_dry_run(
        db: Session,
        event_id: str,
        actor_role: str = "Integration Engineer",
        target_transformation_version: str = "v2.0"
    ) -> Dict[str, Any]:
        dry_run_id = f"DRY-{uuid.uuid4().hex[:8].upper()}"
        
        # 1. Fetch event
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event '{event_id}' not found.")

        # Log audit start
        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor_role,
            action="DRY_RUN_STARTED",
            status="IN_PROGRESS",
            reason=f"Dry run initiated with transformation {target_transformation_version}"
        )

        # 2. Dependency Check
        dep_result = DependencyChecker.check_dependencies(db, event_id)

        # 3. Load target snapshot (Non-mutating read)
        original_snapshot, hash_before = SnapshotManager.get_snapshot(db, event.entity_reference)

        # 4. Apply corrected transformation to predict target state
        raw_payload = json.loads(event.payload) if isinstance(event.payload, str) else event.payload
        transformed_payload, applied_ver = TransformationEngine.apply_transformation(
            payload=raw_payload,
            source_system=event.source_system,
            event_type=event.event_type,
            target_version=target_transformation_version
        )

        # Build predicted state snapshot
        predicted_snapshot = json.loads(json.dumps(original_snapshot))
        predicted_snapshot["last_replayed_event_id"] = event_id
        predicted_snapshot["replayed_at"] = datetime.utcnow().isoformat()
        predicted_snapshot["transformed_payload"] = transformed_payload
        predicted_snapshot["status"] = transformed_payload.get("status", "completed")

        hash_after = SnapshotManager.compute_hash(predicted_snapshot)

        # 5. Calculate Diffs
        changed_fields: List[str] = []
        added_fields: List[str] = []
        removed_fields: List[str] = []

        all_keys = set(original_snapshot.keys()).union(set(predicted_snapshot.keys()))
        for k in all_keys:
            if k not in original_snapshot:
                added_fields.append(k)
            elif k not in predicted_snapshot:
                removed_fields.append(k)
            elif original_snapshot[k] != predicted_snapshot[k]:
                changed_fields.append(k)

        # Evaluate risk level
        diff_count = len(changed_fields) + len(added_fields) + len(removed_fields)
        if dep_result["status"] == "BLOCKED":
            risk_level = "CRITICAL"
        elif diff_count > 5:
            risk_level = "HIGH"
        elif diff_count > 2:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        now_time = datetime.utcnow()
        result = {
            "dry_run_id": dry_run_id,
            "event_id": event_id,
            "original_snapshot": original_snapshot,
            "predicted_snapshot": predicted_snapshot,
            "changed_fields": changed_fields,
            "added_fields": added_fields,
            "removed_fields": removed_fields,
            "hash_before": hash_before,
            "hash_after": hash_after,
            "hash_difference": hash_before != hash_after,
            "risk_level": risk_level,
            "dependency_status": dep_result["status"],
            "transformation_version": applied_ver,
            "executed_at": now_time
        }

        # Serializable copy for audit logging
        audit_res = dict(result)
        audit_res["executed_at"] = now_time.isoformat()

        # Log audit completion
        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor_role,
            action="DRY_RUN_COMPLETED",
            status="SUCCESS",
            reason=f"Dry run completed. Risk level: {risk_level}, Diffs: {diff_count}",
            transformation_version=applied_ver,
            snapshot_hash=hash_after,
            dry_run_result=audit_res
        )

        return result
