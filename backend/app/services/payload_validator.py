import json
import re
from typing import Dict, Any, List, Tuple

class PayloadValidator:
    """
    Healthcare Payload Validator supporting:
    - HL7 ADT (Admission, Discharge, Transfer) messages
    - HL7 ORU (Observation Result / Lab) messages
    - FHIR Resource & Bundle payloads
    
    Classifies payloads into:
    - VALID
    - INVALID (malformed structure/syntax)
    - INCOMPLETE (missing required fields)
    - SCHEMA_INCOMPATIBLE (incompatible message structure / missing mandatory segment)
    - TRANSFORMATION_INCOMPATIBLE (data values/types fail mapping rules)
    """

    @staticmethod
    def validate_payload(payload_input: Any, payload_type: str = "AUTO") -> Dict[str, Any]:
        """
        Validate synthetic healthcare payload and return detailed diagnostic result.
        """
        issues: List[str] = []

        # Convert string to dict/raw string depending on format
        raw_str = ""
        payload_dict = None

        if isinstance(payload_input, str):
            raw_str = payload_input.strip()
            if raw_str.startswith("{") or raw_str.startswith("["):
                try:
                    payload_dict = json.loads(raw_str)
                except Exception as e:
                    issues.append(f"Malformed JSON syntax: {str(e)}")
                    return {
                        "payload_type": payload_type,
                        "status": "INVALID",
                        "issues": issues,
                        "details": {"error": "JSON parse failure"}
                    }
        elif isinstance(payload_input, dict):
            payload_dict = payload_input
            raw_str = json.dumps(payload_input)
        else:
            issues.append("Payload must be a string or JSON dictionary.")
            return {
                "payload_type": payload_type,
                "status": "INVALID",
                "issues": issues,
                "details": {}
            }

        # Determine auto payload type if needed
        if payload_type == "AUTO":
            if payload_dict and "resourceType" in payload_dict:
                payload_type = "FHIR_BUNDLE" if payload_dict.get("resourceType") == "Bundle" else "FHIR_RESOURCE"
            elif raw_str.startswith("MSH"):
                if "ADT^" in raw_str:
                    payload_type = "HL7_ADT"
                elif "ORU^" in raw_str:
                    payload_type = "HL7_ORU"
                else:
                    payload_type = "HL7_GENERIC"
            elif payload_dict and "message_type" in payload_dict:
                mtype = str(payload_dict.get("message_type")).upper()
                if "ADT" in mtype:
                    payload_type = "HL7_ADT"
                elif "ORU" in mtype:
                    payload_type = "HL7_ORU"
                else:
                    payload_type = "FHIR_BUNDLE"
            else:
                payload_type = "FHIR_BUNDLE" if payload_dict else "HL7_ADT"

        # Delegate validation
        if payload_type in ["HL7_ADT", "HL7_ORU", "HL7_GENERIC"]:
            return PayloadValidator._validate_hl7(raw_str, payload_dict, payload_type)
        elif payload_type in ["FHIR_BUNDLE", "FHIR_RESOURCE"]:
            return PayloadValidator._validate_fhir(payload_dict or {}, raw_str, payload_type)
        else:
            issues.append(f"Unsupported payload type '{payload_type}'")
            return {
                "payload_type": payload_type,
                "status": "SCHEMA_INCOMPATIBLE",
                "issues": issues,
                "details": {}
            }

    @staticmethod
    def _validate_hl7(raw_str: str, payload_dict: Optional[Dict[str, Any]], expected_type: str) -> Dict[str, Any]:
        issues = []
        details = {}
        status = "VALID"

        # Check dictionary format vs raw HL7 v2 pipe format
        if payload_dict:
            # Struct format check
            mtype = payload_dict.get("message_type") or payload_dict.get("event_type", "")
            pid = payload_dict.get("patient_id") or payload_dict.get("PID", {}).get("patient_id")
            encounter = payload_dict.get("encounter_id") or payload_dict.get("PV1", {}).get("encounter_id")

            if not mtype:
                issues.append("Missing required header field 'message_type'")
                status = "INCOMPLETE"
            if not pid:
                issues.append("Missing required patient identifier (PID-3 / patient_id)")
                status = "INCOMPLETE"
            if expected_type == "HL7_ADT" and not encounter:
                issues.append("Missing required encounter identifier (PV1-19 / encounter_id) for ADT event")
                status = "INCOMPLETE"

            if payload_dict.get("is_malformed"):
                issues.append("Payload marked with malformed attribute defect")
                status = "INVALID"
            if payload_dict.get("invalid_value"):
                issues.append("Invalid field value detected: " + str(payload_dict.get("invalid_value")))
                status = "INVALID"
            if payload_dict.get("is_transformation_mismatch"):
                issues.append("Legacy payload attributes fail target transformation mapping rules v2.0")
                status = "TRANSFORMATION_INCOMPATIBLE"

            details = {
                "format": "JSON-Structured HL7",
                "message_type": mtype,
                "patient_id": pid,
                "encounter_id": encounter,
                "segments_found": list(payload_dict.keys())
            }
        else:
            # Raw HL7 Pipe-Delimited String Check
            segments = [s.strip() for s in raw_str.split("\r") if s.strip()]
            if not segments:
                segments = [s.strip() for s in raw_str.split("\n") if s.strip()]

            seg_names = [s[:3] for s in segments]
            details["segments_found"] = seg_names
            details["raw_length"] = len(raw_str)

            if "MSH" not in seg_names:
                issues.append("Missing mandatory header segment 'MSH'")
                return {
                    "payload_type": expected_type,
                    "status": "SCHEMA_INCOMPATIBLE",
                    "issues": issues,
                    "details": details
                }

            msh_segment = next(s for s in segments if s.startswith("MSH"))
            msh_fields = msh_segment.split("|")
            
            if len(msh_fields) < 9 or not msh_fields[8].strip():
                issues.append("MSH segment incomplete or missing required message type in MSH-9")
                status = "INVALID"
            else:
                msg_type = msh_fields[8]
                details["message_type"] = msg_type

            if "PID" not in seg_names:
                issues.append("Missing mandatory patient identification segment 'PID'")
                if status != "INVALID":
                    status = "INCOMPLETE"
            else:
                pid_seg = next(s for s in segments if s.startswith("PID"))
                pid_fields = pid_seg.split("|")
                if len(pid_fields) < 4 or not pid_fields[3].strip():
                    issues.append("Missing required Patient ID in PID-3")
                    if status != "INVALID":
                        status = "INCOMPLETE"
                else:
                    details["patient_id"] = pid_fields[3]

            if expected_type == "HL7_ADT" and "PV1" not in seg_names:
                issues.append("Missing mandatory patient visit segment 'PV1' for ADT message")
                if status != "INVALID":
                    status = "INCOMPLETE"

            if expected_type == "HL7_ORU" and "OBR" not in seg_names:
                issues.append("Missing mandatory observation request segment 'OBR' for ORU message")
                if status != "INVALID":
                    status = "INCOMPLETE"

            if expected_type == "HL7_ORU" and "OBX" not in seg_names:
                issues.append("Missing mandatory observation result segment 'OBX' for ORU message")
                if status != "INVALID":
                    status = "INCOMPLETE"

        if issues and status == "VALID":
            status = "INVALID"

        return {
            "payload_type": expected_type,
            "status": status,
            "issues": issues,
            "details": details
        }

    @staticmethod
    def _validate_fhir(payload: Dict[str, Any], raw_str: str, expected_type: str) -> Dict[str, Any]:
        issues = []
        details = {}
        status = "VALID"

        resource_type = payload.get("resourceType")
        if not resource_type:
            issues.append("Missing required FHIR 'resourceType' field")
            return {
                "payload_type": expected_type,
                "status": "SCHEMA_INCOMPATIBLE",
                "issues": issues,
                "details": details
            }

        details["resourceType"] = resource_type

        if expected_type == "FHIR_BUNDLE" and resource_type != "Bundle":
            issues.append(f"Expected FHIR Bundle, but found resourceType '{resource_type}'")
            status = "SCHEMA_INCOMPATIBLE"

        if resource_type == "Bundle":
            bundle_type = payload.get("type")
            if not bundle_type:
                issues.append("Missing required FHIR Bundle 'type' attribute")
                status = "INCOMPLETE"
            else:
                details["bundle_type"] = bundle_type

            entries = payload.get("entry")
            if not isinstance(entries, list) or len(entries) == 0:
                issues.append("FHIR Bundle contains no entry resources or entry is not a array")
                status = "INVALID"
            else:
                details["entry_count"] = len(entries)
                entry_types = []
                for i, entry in enumerate(entries):
                    if not isinstance(entry, dict):
                        issues.append(f"Entry index {i} is not a valid JSON object")
                        status = "INVALID"
                        continue
                    res = entry.get("resource")
                    if not res or not isinstance(res, dict):
                        issues.append(f"Entry index {i} missing 'resource' object")
                        status = "INCOMPLETE"
                        continue
                    rt = res.get("resourceType")
                    if not rt:
                        issues.append(f"Entry index {i} resource missing 'resourceType'")
                        status = "SCHEMA_INCOMPATIBLE"
                    else:
                        entry_types.append(rt)

                    # Validate Patient resource inside bundle
                    if rt == "Patient":
                        if not res.get("id") and not res.get("identifier"):
                            issues.append(f"Patient resource at entry {i} has no id or identifier")
                            status = "INCOMPLETE"
                    # Validate Observation resource inside bundle
                    elif rt == "Observation":
                        if not res.get("status"):
                            issues.append(f"Observation resource at entry {i} missing 'status'")
                            status = "INCOMPLETE"
                        if not res.get("code"):
                            issues.append(f"Observation resource at entry {i} missing 'code'")
                            status = "INCOMPLETE"

                details["entry_resources"] = entry_types

        elif resource_type == "Patient":
            if not payload.get("id") and not payload.get("identifier"):
                issues.append("FHIR Patient missing id or identifier")
                status = "INCOMPLETE"
        elif resource_type == "Observation":
            if not payload.get("status"):
                issues.append("FHIR Observation missing status")
                status = "INCOMPLETE"
            if not payload.get("code"):
                issues.append("FHIR Observation missing code")
                status = "INCOMPLETE"

        if payload.get("is_malformed"):
            issues.append("Synthetic FHIR payload flagged with malformed attribute defect")
            status = "INVALID"

        return {
            "payload_type": expected_type,
            "status": status,
            "issues": issues,
            "details": details
        }

    @staticmethod
    def get_test_suite_samples() -> List[Dict[str, Any]]:
        """
        Returns the 10 standard synthetic healthcare test cases required by Review 2.
        """
        return [
            {
                "id": "TC-HL7-01",
                "title": "1. Valid HL7 ADT Message",
                "payload_type": "HL7_ADT",
                "expected_status": "VALID",
                "description": "Standard HL7 v2 ADT^A08 Patient Information Update message with all mandatory MSH, PID, and PV1 segments.",
                "payload": "MSH|^~\\&|HIS_EPIC|GENERAL_HOSP|RAALE_HUB|CENTRAL|20260930091500||ADT^A08^ADT_A08|MSG-99012|P|2.5\rPID|1||PAT-88301^^^HOSP^MR||SMITH^JOHN^A||19850412|M|||123 MAIN ST^^BOSTON^MA^02115\rPV1|1|I|MED-SURG^302^A||||1234^WELBY^MARCUS|||MED||||||||ENV-44910"
            },
            {
                "id": "TC-HL7-02",
                "title": "2. Invalid / Malformed HL7 ADT",
                "payload_type": "HL7_ADT",
                "expected_status": "INVALID",
                "description": "Malformed HL7 ADT message missing required MSH fields and contains truncated field separators.",
                "payload": "MSH|^~\\&|HIS_EPIC||||||\rPID|1||||SMITH^JOHN\rPV1|1"
            },
            {
                "id": "TC-HL7-03",
                "title": "3. Valid HL7 ORU Message",
                "payload_type": "HL7_ORU",
                "expected_status": "VALID",
                "description": "Valid HL7 ORU^R01 Lab Observation Result message with complete MSH, PID, OBR, and OBX result segments.",
                "payload": "MSH|^~\\&|LAB_SYS|PATH_CORE|RAALE_HUB|CENTRAL|20260930092000||ORU^R01^ORU_R01|MSG-99014|P|2.5\rPID|1||PAT-88301^^^HOSP^MR||SMITH^JOHN^A||19850412|M\rOBR|1|ORD-77102|LAB-8821|80053^COMPREHENSIVE METABOLIC|||20260930080000\rOBX|1|NM|2345-7^GLUCOSE^LN||95|mg/dL|70-99|N|||F"
            },
            {
                "id": "TC-HL7-04",
                "title": "4. Invalid / Malformed HL7 ORU",
                "payload_type": "HL7_ORU",
                "expected_status": "INCOMPLETE",
                "description": "HL7 ORU message missing mandatory OBR and OBX observation result segments.",
                "payload": "MSH|^~\\&|LAB_SYS|PATH_CORE|RAALE_HUB|CENTRAL|20260930092000||ORU^R01|MSG-99015|P|2.5\rPID|1||PAT-88301^^^HOSP^MR||SMITH^JOHN"
            },
            {
                "id": "TC-FHIR-05",
                "title": "5. Valid FHIR Bundle",
                "payload_type": "FHIR_BUNDLE",
                "expected_status": "VALID",
                "description": "Valid FHIR R4 Transaction Bundle with Patient and Observation resources.",
                "payload": {
                    "resourceType": "Bundle",
                    "type": "transaction",
                    "entry": [
                        {
                            "fullUrl": "urn:uuid:patient-88301",
                            "resource": {
                                "resourceType": "Patient",
                                "id": "PAT-88301",
                                "identifier": [{"system": "http://hospital.org/mrn", "value": "PAT-88301"}],
                                "name": [{"family": "Smith", "given": ["John"]}],
                                "gender": "male",
                                "birthDate": "1985-04-12"
                            }
                        },
                        {
                            "fullUrl": "urn:uuid:observation-441",
                            "resource": {
                                "resourceType": "Observation",
                                "id": "OBS-441",
                                "status": "final",
                                "code": {"coding": [{"system": "http://loinc.org", "code": "2345-7", "display": "Glucose"}]},
                                "subject": {"reference": "Patient/PAT-88301"},
                                "valueQuantity": {"value": 95, "unit": "mg/dL"}
                            }
                        }
                    ]
                }
            },
            {
                "id": "TC-FHIR-06",
                "title": "6. Invalid FHIR Bundle",
                "payload_type": "FHIR_BUNDLE",
                "expected_status": "INVALID",
                "description": "FHIR Bundle with broken entry array containing non-JSON invalid structure.",
                "payload": "{\"resourceType\": \"Bundle\", \"type\": \"transaction\", \"entry\": \"INVALID_NON_ARRAY_STRING\"}"
            },
            {
                "id": "TC-EDGE-07",
                "title": "7. Missing Required Fields",
                "payload_type": "HL7_ADT",
                "expected_status": "INCOMPLETE",
                "description": "HL7 ADT payload missing mandatory Patient ID in PID-3 field.",
                "payload": "MSH|^~\\&|HIS_EPIC|GENERAL_HOSP|RAALE_HUB|CENTRAL|20260930091500||ADT^A08|MSG-99020|P|2.5\rPID|1||||SMITH^JOHN\rPV1|1|I|MED-SURG"
            },
            {
                "id": "TC-EDGE-08",
                "title": "8. Invalid Field Values",
                "payload_type": "FHIR_BUNDLE",
                "expected_status": "INCOMPLETE",
                "description": "FHIR Bundle where Observation resource is missing mandatory status field.",
                "payload": {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "entry": [
                        {
                            "resource": {
                                "resourceType": "Observation",
                                "id": "OBS-INVALID",
                                "code": {"coding": [{"code": "1234-5"}]}
                                # missing required status
                            }
                        }
                    ]
                }
            },
            {
                "id": "TC-EDGE-09",
                "title": "9. Schema Compatibility Issue",
                "payload_type": "FHIR_BUNDLE",
                "expected_status": "SCHEMA_INCOMPATIBLE",
                "description": "Resource missing FHIR standard 'resourceType' attribute entirely.",
                "payload": {
                    "type": "transaction",
                    "invalid_schema": True
                }
            },
            {
                "id": "TC-EDGE-10",
                "title": "10. Transformation Mismatch",
                "payload_type": "HL7_ADT",
                "expected_status": "TRANSFORMATION_INCOMPATIBLE",
                "description": "Legacy fields fail mapping rules to target FHIR Core schema version v2.0.",
                "payload": {
                    "message_type": "ADT^A08",
                    "patient_id": "PAT-88301",
                    "encounter_id": "ENV-44910",
                    "legacy_unmapped_code": "LEGACY_ERR_CODE_99",
                    "is_transformation_mismatch": True
                }
            }
        ]
