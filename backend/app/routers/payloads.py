from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PayloadValidationRecord
from app.services.payload_validator import PayloadValidator
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/payloads", tags=["Healthcare Payload Validation"])

class ValidatePayloadInput(BaseModel):
    event_id: Optional[str] = None
    payload: Any
    payload_type: str = "AUTO"  # AUTO, HL7_ADT, HL7_ORU, FHIR_BUNDLE

@router.post("/validate", response_model=Dict[str, Any])
def validate_payload_endpoint(
    payload_input: ValidatePayloadInput,
    db: Session = Depends(get_db)
):
    """Validate a healthcare payload (HL7 ADT, HL7 ORU, FHIR Bundle) and audit the result."""
    res = PayloadValidator.validate_payload(
        payload_input=payload_input.payload,
        payload_type=payload_input.payload_type
    )

    # Persist validation record
    rec = PayloadValidationRecord(
        event_id=payload_input.event_id,
        payload_type=res.get("payload_type", "UNKNOWN"),
        validation_status=res.get("status", "INVALID"),
        issues_json=str(res.get("issues", []))
    )
    db.add(rec)
    db.commit()

    # Log in audit trail
    AuditService.log(
        db=db,
        event_id=payload_input.event_id or "PAYLOAD_VAL",
        actor_role="Validation Engine",
        action="PAYLOAD_VALIDATED",
        status=res.get("status"),
        reason=f"Payload type {res.get('payload_type')} evaluated to {res.get('status')}. Issues: {len(res.get('issues', []))}"
    )

    return res

@router.get("/test-suite", response_model=List[Dict[str, Any]])
def get_test_suite():
    """Retrieve the 10 standard synthetic healthcare test cases."""
    return PayloadValidator.get_test_suite_samples()

@router.post("/test-suite/run-all", response_model=Dict[str, Any])
def run_full_test_suite(db: Session = Depends(get_db)):
    """Run automated validation on all 10 synthetic healthcare edge cases."""
    samples = PayloadValidator.get_test_suite_samples()
    results = []
    status_counts = {
        "VALID": 0,
        "INVALID": 0,
        "INCOMPLETE": 0,
        "SCHEMA_INCOMPATIBLE": 0,
        "TRANSFORMATION_INCOMPATIBLE": 0
    }

    for sample in samples:
        val_res = PayloadValidator.validate_payload(
            payload_input=sample["payload"],
            payload_type=sample["payload_type"]
        )
        st = val_res.get("status", "INVALID")
        status_counts[st] = status_counts.get(st, 0) + 1
        
        matches_expected = (st == sample["expected_status"])
        
        results.append({
            "id": sample["id"],
            "title": sample["title"],
            "payload_type": sample["payload_type"],
            "expected_status": sample["expected_status"],
            "actual_status": st,
            "status_match": matches_expected,
            "issues": val_res.get("issues", []),
            "details": val_res.get("details", {})
        })

    return {
        "total_test_cases": len(samples),
        "passed_tests": sum(1 for r in results if r["status_match"]),
        "status_distribution": status_counts,
        "results": results
    }
