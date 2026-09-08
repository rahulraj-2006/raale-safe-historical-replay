import json
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models import Event, ReplayRecord, ReplayRule
from app.services.dependency_checker import DependencyChecker
from app.services.dry_run_engine import DryRunEngine
from app.services.snapshot_manager import SnapshotManager
from app.services.audit_service import AuditService

class ReplayEngine:
    @staticmethod
    def request_replay(
        db: Session,
        event_id: str,
        actor_role: str = "Integration Engineer",
        reason: str = "Defect corrected"
    ) -> Dict[str, Any]:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event '{event_id}' not found.")

        # Check existing replay records
        existing = db.query(ReplayRecord).filter(
            ReplayRecord.event_id == event_id,
            ReplayRecord.status.in_(["PENDING_APPROVAL", "APPROVED", "EXECUTED"])
        ).first()

        if existing and existing.status == "EXECUTED":
            # Idempotency check block
            msg = "Replay blocked: event has already been successfully replayed."
            AuditService.log(
                db=db,
                event_id=event_id,
                actor_role=actor_role,
                action="REPLAY_BLOCKED",
                status="BLOCKED",
                reason=msg
            )
            return {
                "event_id": event_id,
                "replay_record_id": existing.id,
                "status": "BLOCKED",
                "message": msg,
                "target_updated": False
            }

        rec = ReplayRecord(
            event_id=event_id,
            requested_by_role=actor_role,
            status="PENDING_APPROVAL",
            requested_at=datetime.utcnow()
        )
        db.add(rec)
        event.status = "PENDING_REPLAY"
        db.commit()
        db.refresh(rec)

        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor_role,
            action="REPLAY_REQUESTED",
            status="PENDING_APPROVAL",
            reason=reason
        )

        return {
            "event_id": event_id,
            "replay_record_id": rec.id,
            "status": "PENDING_APPROVAL",
            "message": "Replay request submitted and pending approval.",
            "target_updated": False
        }

    @staticmethod
    def approve_replay(
        db: Session,
        event_id: str,
        actor_role: str = "Auditor / Operations Manager",
        reason: str = "Approved by auditor"
    ) -> Dict[str, Any]:
        rec = db.query(ReplayRecord).filter(
            ReplayRecord.event_id == event_id,
            ReplayRecord.status == "PENDING_APPROVAL"
        ).order_by(ReplayRecord.id.desc()).first()

        if not rec:
            # Create approved record if not existing
            rec = ReplayRecord(
                event_id=event_id,
                requested_by_role="Integration Engineer",
                approved_by_role=actor_role,
                status="APPROVED",
                requested_at=datetime.utcnow(),
                approved_at=datetime.utcnow()
            )
            db.add(rec)
        else:
            rec.status = "APPROVED"
            rec.approved_by_role = actor_role
            rec.approved_at = datetime.utcnow()

        db.commit()
        db.refresh(rec)

        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor_role,
            action="REPLAY_APPROVED",
            status="APPROVED",
            reason=reason
        )

        return {
            "event_id": event_id,
            "replay_record_id": rec.id,
            "status": "APPROVED",
            "message": "Replay request approved.",
            "target_updated": False
        }

    @staticmethod
    def reject_replay(
        db: Session,
        event_id: str,
        actor_role: str = "Auditor / Operations Manager",
        reason: str = "Rejected by auditor"
    ) -> Dict[str, Any]:
        rec = db.query(ReplayRecord).filter(
            ReplayRecord.event_id == event_id,
            ReplayRecord.status == "PENDING_APPROVAL"
        ).order_by(ReplayRecord.id.desc()).first()

        if rec:
            rec.status = "REJECTED"
            db.commit()

        event = db.query(Event).filter(Event.id == event_id).first()
        if event:
            event.status = "BLOCKED"
            db.commit()

        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor_role,
            action="REPLAY_REJECTED",
            status="REJECTED",
            reason=reason
        )

        return {
            "event_id": event_id,
            "replay_record_id": rec.id if rec else 0,
            "status": "REJECTED",
            "message": f"Replay rejected: {reason}",
            "target_updated": False
        }

    @staticmethod
    def execute_replay(
        db: Session,
        event_id: str,
        actor_role: str = "Integration Engineer"
    ) -> Dict[str, Any]:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise ValueError(f"Event '{event_id}' not found.")

        # Load rules
        rules = db.query(ReplayRule).all()
        rule_map = {r.rule_key: r.is_enabled for r in rules}

        # 1. Idempotency duplicate check
        if event.status == "REPLAYED":
            msg = "Replay blocked: event has already been successfully replayed."
            AuditService.log(
                db=db,
                event_id=event_id,
                actor_role=actor_role,
                action="REPLAY_BLOCKED",
                status="BLOCKED",
                reason=msg
            )
            return {
                "event_id": event_id,
                "replay_record_id": 0,
                "status": "BLOCKED",
                "message": msg,
                "target_updated": False
            }

        # 2. Dependency Check
        dep_result = DependencyChecker.check_dependencies(db, event_id)
        if dep_result["status"] == "BLOCKED":
            reason_msg = f"Replay blocked due to safety violations: {'; '.join(dep_result['block_reasons'])}"
            event.status = "BLOCKED"
            db.commit()

            AuditService.log(
                db=db,
                event_id=event_id,
                actor_role=actor_role,
                action="REPLAY_BLOCKED",
                status="BLOCKED",
                reason=reason_msg
            )
            return {
                "event_id": event_id,
                "replay_record_id": 0,
                "status": "BLOCKED",
                "message": reason_msg,
                "target_updated": False
            }

        # 3. Require approval check
        if rule_map.get("require_approval", True):
            rec = db.query(ReplayRecord).filter(
                ReplayRecord.event_id == event_id,
                ReplayRecord.status == "APPROVED"
            ).first()
            if not rec:
                msg = "Replay blocked: Approval is required from an Auditor before execution."
                AuditService.log(
                    db=db,
                    event_id=event_id,
                    actor_role=actor_role,
                    action="REPLAY_BLOCKED",
                    status="BLOCKED",
                    reason=msg
                )
                return {
                    "event_id": event_id,
                    "replay_record_id": 0,
                    "status": "BLOCKED",
                    "message": msg,
                    "target_updated": False
                }

        # 4. Require dry run check
        dry_run = DryRunEngine.execute_dry_run(db, event_id, actor_role)
        if rule_map.get("require_dry_run", True):
            if dry_run["risk_level"] == "CRITICAL":
                msg = "Replay blocked: Dry run evaluated CRITICAL risk level."
                audit_dr = dict(dry_run)
                if isinstance(audit_dr.get("executed_at"), datetime):
                    audit_dr["executed_at"] = audit_dr["executed_at"].isoformat()
                AuditService.log(
                    db=db,
                    event_id=event_id,
                    actor_role=actor_role,
                    action="REPLAY_BLOCKED",
                    status="BLOCKED",
                    reason=msg,
                    dry_run_result=audit_dr
                )
                return {
                    "event_id": event_id,
                    "replay_record_id": 0,
                    "status": "BLOCKED",
                    "message": msg,
                    "target_updated": False
                }

        # 5. Execute Safe Mutation on Mock Target
        new_hash = SnapshotManager.update_snapshot(
            db=db,
            entity_reference=event.entity_reference,
            new_state=dry_run["predicted_snapshot"],
            event_id=event_id
        )

        # Update event and record
        event.status = "REPLAYED"
        rec = db.query(ReplayRecord).filter(ReplayRecord.event_id == event_id).order_by(ReplayRecord.id.desc()).first()
        if not rec:
            rec = ReplayRecord(
                event_id=event_id,
                requested_by_role=actor_role,
                approved_by_role=actor_role,
                status="EXECUTED",
                executed_at=datetime.utcnow()
            )
            db.add(rec)
        else:
            rec.status = "EXECUTED"
            rec.executed_at = datetime.utcnow()

        db.commit()

        audit_dr = dict(dry_run)
        if isinstance(audit_dr.get("executed_at"), datetime):
            audit_dr["executed_at"] = audit_dr["executed_at"].isoformat()

        AuditService.log(
            db=db,
            event_id=event_id,
            actor_role=actor_role,
            action="REPLAY_COMPLETED",
            status="SUCCESS",
            reason="Safe replay successfully executed.",
            transformation_version=dry_run["transformation_version"],
            snapshot_hash=new_hash,
            dry_run_result=audit_dr,
            replay_result={"target_updated": True, "new_hash": new_hash}
        )

        return {
            "event_id": event_id,
            "replay_record_id": rec.id,
            "status": "EXECUTED",
            "message": "Event successfully replayed to mock target.",
            "target_updated": True,
            "new_snapshot_hash": new_hash,
            "executed_at": rec.executed_at
        }
