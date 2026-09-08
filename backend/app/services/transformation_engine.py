import json
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import Transformation

class TransformationEngine:
    @staticmethod
    def apply_transformation(
        payload: Dict[str, Any],
        source_system: str,
        event_type: str,
        target_version: str = "v2.0"
    ) -> Tuple[Dict[str, Any], str]:
        """
        Applies versioned transformation rules to convert historical payload to target state representation.
        Returns (transformed_payload, applied_version).
        """
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a valid JSON dictionary")

        # Copy payload base
        transformed = json.loads(json.dumps(payload))
        
        # Add metadata & normalized standard structure
        transformed["schema_target"] = "FHIR_R4_SYNTHETIC"
        transformed["transformation_version"] = target_version
        
        # System specific transformation mappings
        if "LAB" in source_system:
            transformed["resource_type"] = "Observation"
            # Normalize legacy field names to standard target representation
            if "val_str" in transformed:
                transformed["value_quantity"] = {
                    "value": float(transformed["val_str"]) if str(transformed.get("val_str", "")).replace('.', '', 1).isdigit() else 98.5,
                    "unit": transformed.get("unit", "mg/dL")
                }
                del transformed["val_str"]
            if "status" in transformed:
                # Corrected transformation v2.0 fixes defect where status remained 'pending'
                transformed["status"] = "completed" if target_version == "v2.0" else transformed["status"]
            transformed["observation_code"] = transformed.get("lab_result_code", "LAB-GLUCOSE-FASTING")
            transformed["interpretation"] = "NORMAL"

        elif "RADIOLOGY" in source_system:
            transformed["resource_type"] = "DiagnosticReport"
            if "rad_status" in transformed:
                transformed["status"] = "final" if target_version == "v2.0" else transformed["rad_status"]
            transformed["modality"] = transformed.get("modality", "CT_SCAN")

        elif "PHARMACY" in source_system:
            transformed["resource_type"] = "MedicationRequest"
            transformed["status"] = "active"
            transformed["dosage"] = transformed.get("dose_mg", "50mg daily")

        elif "ADMISSION" in source_system:
            transformed["resource_type"] = "Encounter"
            transformed["status"] = "finished" if event_type == "DISCHARGE_CREATED" else "in-progress"

        elif "BILLING" in source_system:
            transformed["resource_type"] = "Claim"
            transformed["status"] = "active"

        else:
            transformed["resource_type"] = "GenericObservation"
            transformed["status"] = "processed"

        return transformed, target_version
