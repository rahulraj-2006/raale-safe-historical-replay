def test_valid_hl7_adt_validation(client):
    valid_hl7 = "MSH|^~\\&|HIS_EPIC|GENERAL_HOSP|RAALE_HUB|CENTRAL|20260930091500||ADT^A08|MSG-99012|P|2.5\rPID|1||PAT-88301^^^HOSP^MR||SMITH^JOHN^A||19850412|M\rPV1|1|I|MED-SURG"
    res = client.post("/api/payloads/validate", json={
        "payload": valid_hl7,
        "payload_type": "HL7_ADT"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VALID"

def test_invalid_hl7_adt_validation(client):
    invalid_hl7 = "MSH|^~\\&|HIS_EPIC\rPID|1"
    res = client.post("/api/payloads/validate", json={
        "payload": invalid_hl7,
        "payload_type": "HL7_ADT"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["INVALID", "INCOMPLETE"]

def test_valid_fhir_bundle_validation(client):
    valid_bundle = {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": "PAT-001"
                }
            }
        ]
    }
    res = client.post("/api/payloads/validate", json={
        "payload": valid_bundle,
        "payload_type": "FHIR_BUNDLE"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "VALID"

def test_full_test_suite_run(client):
    res = client.post("/api/payloads/test-suite/run-all")
    assert res.status_code == 200
    data = res.json()
    assert data["total_test_cases"] == 10
    assert data["passed_tests"] == 10
