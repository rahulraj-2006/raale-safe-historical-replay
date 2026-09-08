import json
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Event, Dependency, TargetSnapshot, MockTarget, ReplayRule, Transformation
from app.services.snapshot_manager import SnapshotManager

def seed_database(db: Session, target_count: int = 10000):
    """Seed SQLite database with 10,000+ synthetic historical events and default rules."""
    existing_count = db.query(Event).count()
    if existing_count >= target_count:
        return

    print(f"Seeding database with {target_count}+ synthetic historical events...")
    random.seed(42)

    # 1. Seed Default Replay Safety Rules
    default_rules = [
        {"rule_key": "block_duplicate_replay", "name": "Block Duplicate Replay", "description": "Prevent re-executing an event that has already been successfully replayed to the target system.", "is_enabled": True, "category": "SAFETY"},
        {"rule_key": "require_dependency_success", "name": "Require Dependency Validation", "description": "Block replay if any prerequisite event or parent entity dependency is missing or failed.", "is_enabled": True, "category": "SAFETY"},
        {"rule_key": "require_dry_run", "name": "Require Dry Run Simulation", "description": "Mandate non-mutating dry run calculation before approving or executing target mutation.", "is_enabled": True, "category": "PROCESS"},
        {"rule_key": "require_approval", "name": "Require Auditor Approval", "description": "Require explicit approval from an Auditor role prior to safe replay execution.", "is_enabled": True, "category": "PROCESS"},
        {"rule_key": "block_snapshot_conflict", "name": "Block Target Snapshot Conflicts", "description": "Block replay if the target entity state has experienced un-reconciled concurrent mutations.", "is_enabled": True, "category": "SAFETY"},
        {"rule_key": "allow_schema_upgrade", "name": "Allow Legacy Schema Upgrades", "description": "Allow legacy v1.0 schema events to upgrade directly to v2.0 target schema.", "is_enabled": False, "category": "VALIDATION"},
    ]

    for r in default_rules:
        existing = db.query(ReplayRule).filter(ReplayRule.rule_key == r["rule_key"]).first()
        if not existing:
            db.add(ReplayRule(**r))
    db.commit()

    # 2. Seed Default Transformation Catalog
    transformations = [
        {"id": "TRF-LAB-V2", "source_system": "LAB_V1", "target_system": "FHIR_CORE_TARGET", "source_version": "v1.2", "target_version": "v2.0", "rules_json": json.dumps({"map": "legacy_lab_to_fhir_observation"}), "description": "Corrected Lab Result Transformation v2.0", "is_active": True},
        {"id": "TRF-RAD-V2", "source_system": "RADIOLOGY_LEGACY", "target_system": "FHIR_CORE_TARGET", "source_version": "v1.0", "target_version": "v2.0", "rules_json": json.dumps({"map": "legacy_rad_to_fhir_report"}), "description": "Corrected Radiology Report Transformation v2.0", "is_active": True},
        {"id": "TRF-PHARM-V2", "source_system": "PHARMACY_LEGACY", "target_system": "FHIR_CORE_TARGET", "source_version": "v1.1", "target_version": "v2.0", "rules_json": json.dumps({"map": "legacy_pharm_to_fhir_medication"}), "description": "Corrected Pharmacy Medication Transformation v2.0", "is_active": True},
    ]
    for t in transformations:
        existing = db.query(Transformation).filter(Transformation.id == t["id"]).first()
        if not existing:
            db.add(Transformation(**t))
    db.commit()

    # 3. Create Clean Demonstration Event (EVT-DEMO-001) & Dependency (EVT-DEMO-000)
    demo_parent = Event(
        id="EVT-DEMO-000",
        source_system="LAB_V1",
        event_type="ORDER_CREATED",
        event_timestamp=datetime.utcnow() - timedelta(days=2),
        entity_reference="PATIENT-TEST-00001",
        payload=json.dumps({"order_id": "ORD-0001", "lab_code": "LAB-GLUCOSE-FASTING", "patient_id": "PATIENT-TEST-00001"}),
        schema_version="v1.2",
        transformation_version="v1.2",
        status="REPLAYED"
    )
    db.add(demo_parent)

    demo_event = Event(
        id="EVT-DEMO-001",
        source_system="LAB_V1",
        event_type="RESULT_UPDATED",
        event_timestamp=datetime.utcnow() - timedelta(days=1),
        entity_reference="PATIENT-TEST-00001",
        payload=json.dumps({
            "lab_result_code": "LAB-GLUCOSE-FASTING",
            "val_str": "105.4",
            "unit": "mg/dL",
            "status": "pending",
            "patient_id": "PATIENT-TEST-00001",
            "specimen": "blood_plasma"
        }),
        schema_version="v1.2",
        transformation_version="v1.2",
        dependency_ids=json.dumps(["EVT-DEMO-000"]),
        status="ARCHIVED"
    )
    db.add(demo_event)

    db.add(Dependency(
        event_id="EVT-DEMO-001",
        required_event_id="EVT-DEMO-000",
        dependency_type="PREREQUISITE",
        status="SATISFIED"
    ))

    # Initial snapshot for PATIENT-TEST-00001
    SnapshotManager.get_snapshot(db, "PATIENT-TEST-00001")

    # 4. Intentional Defect Edge Cases
    edge_cases = [
        # Duplicate Replay Candidate
        Event(
            id="EVT-TEST-DUP-001",
            source_system="LAB_V2",
            event_type="RESULT_CREATED",
            event_timestamp=datetime.utcnow() - timedelta(hours=12),
            entity_reference="PATIENT-TEST-00002",
            payload=json.dumps({"test_code": "CBC", "val": "14.2", "patient_id": "PATIENT-TEST-00002"}),
            schema_version="v1.2",
            transformation_version="v2.0",
            status="REPLAYED"
        ),
        # Missing Dependency Candidate
        Event(
            id="EVT-TEST-MIS-DEP",
            source_system="RADIOLOGY_LEGACY",
            event_type="REPORT_CREATED",
            event_timestamp=datetime.utcnow() - timedelta(hours=10),
            entity_reference="PATIENT-TEST-00003",
            payload=json.dumps({"report_code": "RAD-CHEST-XRAY", "impression": "Normal chest x-ray", "patient_id": "PATIENT-TEST-00003"}),
            schema_version="v1.0",
            transformation_version="v1.2",
            dependency_ids=json.dumps(["EVT-MISSING-PARENT-999"]),
            has_missing_dependency=True,
            status="ARCHIVED"
        ),
        # Transformation Mismatch Candidate
        Event(
            id="EVT-TEST-TRF-MIS",
            source_system="PHARMACY_LEGACY",
            event_type="MEDICATION_UPDATED",
            event_timestamp=datetime.utcnow() - timedelta(hours=8),
            entity_reference="PATIENT-TEST-00004",
            payload=json.dumps({"med_code": "AMOX-500", "dose": "500mg", "patient_id": "PATIENT-TEST-00004"}),
            schema_version="v0.8_UNSUPPORTED",
            transformation_version="v1.0",
            has_transformation_mismatch=True,
            status="ARCHIVED"
        ),
        # Snapshot Conflict Candidate
        Event(
            id="EVT-TEST-SNP-CNF",
            source_system="ADMISSION_V1",
            event_type="ADMISSION_CREATED",
            event_timestamp=datetime.utcnow() - timedelta(hours=6),
            entity_reference="PATIENT-TEST-00005",
            payload=json.dumps({"ward": "ICU_EAST", "bed": "ICU-04", "patient_id": "PATIENT-TEST-00005"}),
            schema_version="v1.2",
            transformation_version="v2.0",
            has_snapshot_conflict=True,
            status="ARCHIVED"
        ),
        # Malformed Payload Candidate
        Event(
            id="EVT-TEST-MAL-PLD",
            source_system="BILLING_V1",
            event_type="ORDER_CREATED",
            event_timestamp=datetime.utcnow() - timedelta(hours=4),
            entity_reference="PATIENT-TEST-00006",
            payload="{malformed_json: missing_quotes_and_brackets",
            schema_version="v1.2",
            transformation_version="v1.2",
            is_malformed=True,
            status="ARCHIVED"
        )
    ]

    for ec in edge_cases:
        db.add(ec)
    db.commit()

    # 5. Generate Synthetic Archive (up to target_count + 15 events)
    sources = ["LAB_V1", "LAB_V2", "RADIOLOGY_LEGACY", "RADIOLOGY_V2", "PHARMACY_LEGACY", "ADMISSION_V1", "BILLING_V1"]
    event_types = [
        "RESULT_CREATED", "RESULT_UPDATED", "ORDER_CREATED", "ORDER_UPDATED",
        "REPORT_CREATED", "MEDICATION_UPDATED", "ADMISSION_CREATED", "DISCHARGE_CREATED"
    ]
    schemas = ["v1.0", "v1.2", "v2.0"]

    batch: List[Event] = []
    start_idx = 10
    total_target = target_count + 15

    for i in range(start_idx, total_target):
        evt_id = f"EVT-{i:05d}"
        source = random.choice(sources)
        etype = random.choice(event_types)
        entity_num = (i % 500) + 1
        entity_ref = f"PATIENT-TEST-{entity_num:05d}"
        
        is_mal = (i % 100 == 15)
        has_mis_dep = (i % 100 == 35)
        has_trf_mis = (i % 100 == 55)
        has_snp_cnf = (i % 100 == 75)

        if is_mal:
            p_str = f"{{malformed_payload_event_{i}: unclosed"
        else:
            p_data = {
                "event_ref": evt_id,
                "patient_id": entity_ref,
                "source": source,
                "val_str": str(round(random.uniform(50.0, 150.0), 1)),
                "unit": "mg/dL" if "LAB" in source else "units",
                "status": "pending" if random.random() < 0.7 else "completed",
                "recorded_at": (datetime.utcnow() - timedelta(minutes=i)).isoformat()
            }
            p_str = json.dumps(p_data)

        evt = Event(
            id=evt_id,
            source_system=source,
            event_type=etype,
            event_timestamp=datetime.utcnow() - timedelta(minutes=i),
            entity_reference=entity_ref,
            payload=p_str,
            schema_version=random.choice(schemas),
            transformation_version="v1.2",
            dependency_ids=json.dumps([f"EVT-{(i-1):05d}"]) if (i > 10 and i % 5 == 0) else "[]",
            status="ARCHIVED",
            is_malformed=is_mal,
            has_missing_dependency=has_mis_dep,
            has_transformation_mismatch=has_trf_mis,
            has_snapshot_conflict=has_snp_cnf
        )
        batch.append(evt)

        if len(batch) >= 1000:
            db.bulk_save_objects(batch)
            db.commit()
            batch = []

    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    print(f"Successfully seeded {db.query(Event).count()} synthetic historical events into SQLite database!")
