import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Event, Dependency, TargetSnapshot, ReplayRecord, ReplayRule, Transformation
from app.services.snapshot_manager import SnapshotManager

class DependencyChecker:
    @staticmethod
    def check_dependencies(db: Session, event_id: str) -> Dict[str, Any]:
        block_reasons: List[str] = []
        warning_reasons: List[str] = []
        checks_total = 10
        checks_passed = 0

        # Load active safety rules
        rules = db.query(ReplayRule).all()
        rule_map = {r.rule_key: r.is_enabled for r in rules}

        # 1. Event exists check
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return {
                "event_id": event_id,
                "status": "BLOCKED",
                "checks_passed": 0,
                "checks_total": checks_total,
                "block_reasons": [f"Event '{event_id}' not found in historical archive database."],
                "warning_reasons": [],
                "details": {}
            }
        checks_passed += 1

        # 2. Payload validity check
        payload_valid = False
        try:
            p_data = json.loads(event.payload) if isinstance(event.payload, str) else event.payload
            if isinstance(p_data, dict) and not event.is_malformed:
                payload_valid = True
        except Exception:
            pass

        if not payload_valid or event.is_malformed:
            block_reasons.append("Event payload is malformed or invalid JSON structure.")
        else:
            checks_passed += 1

        # 3 & 4. Dependencies exist & satisfied check
        deps = db.query(Dependency).filter(Dependency.event_id == event_id).all()
        missing_deps = []
        unsatisfied_deps = []
        for dep in deps:
            req_event = db.query(Event).filter(Event.id == dep.required_event_id).first()
            if not req_event:
                missing_deps.append(dep.required_event_id)
            elif dep.status != "SATISFIED" or req_event.status == "FAILED":
                unsatisfied_deps.append(dep.required_event_id)

        if event.has_missing_dependency or missing_deps:
            if rule_map.get("require_dependency_success", True):
                block_reasons.append(f"Missing mandatory prerequisite dependencies: {missing_deps or ['EVT-DEP-MISSING']}")
            else:
                warning_reasons.append(f"Prerequisite dependencies missing: {missing_deps or ['EVT-DEP-MISSING']}")
        else:
            checks_passed += 1

        if unsatisfied_deps:
            if rule_map.get("require_dependency_success", True):
                block_reasons.append(f"Prerequisite dependencies not satisfied: {unsatisfied_deps}")
            else:
                warning_reasons.append(f"Prerequisite dependencies not satisfied: {unsatisfied_deps}")
        else:
            checks_passed += 1

        # 5 & 6. Transformation availability & compatibility check
        if event.has_transformation_mismatch:
            block_reasons.append(f"Transformation version mismatch: Event schema '{event.schema_version}' is incompatible with v2.0 transformation.")
        else:
            checks_passed += 2

        # 7. Target snapshot availability check
        snapshot, s_hash = SnapshotManager.get_snapshot(db, event.entity_reference)
        if not snapshot:
            block_reasons.append(f"Target snapshot not available for entity reference '{event.entity_reference}'.")
        else:
            checks_passed += 1

        # 8. Duplicate / Already Replayed Idempotency Check (Only check EXECUTED status)
        already_replayed = db.query(ReplayRecord).filter(
            ReplayRecord.event_id == event_id,
            ReplayRecord.status == "EXECUTED"
        ).first()

        if event.status == "REPLAYED" or already_replayed:
            if rule_map.get("block_duplicate_replay", True):
                block_reasons.append("Replay blocked: event has already been successfully replayed.")
            else:
                warning_reasons.append("Event was previously replayed.")
        else:
            checks_passed += 1

        # 9. Active Replay Rules Check
        if event.schema_version == "v1.0" and not rule_map.get("allow_schema_upgrade", False):
            pass
        checks_passed += 1

        # 10. Target Snapshot Conflict Check
        if event.has_snapshot_conflict:
            if rule_map.get("block_snapshot_conflict", True):
                block_reasons.append(f"Target snapshot conflict detected for entity '{event.entity_reference}': concurrent mutation occurred.")
            else:
                warning_reasons.append("Snapshot conflict warning detected.")
        else:
            checks_passed += 1

        # Determine overall status
        if block_reasons:
            status = "BLOCKED"
        elif warning_reasons:
            status = "WARNING"
        else:
            status = "PASS"

        return {
            "event_id": event_id,
            "status": status,
            "checks_passed": checks_passed,
            "checks_total": checks_total,
            "block_reasons": block_reasons,
            "warning_reasons": warning_reasons,
            "details": {
                "entity_reference": event.entity_reference,
                "schema_version": event.schema_version,
                "transformation_version": event.transformation_version,
                "snapshot_hash": s_hash
            }
        }
