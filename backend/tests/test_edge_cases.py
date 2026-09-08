from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_edge_case_duplicate_replay_blocked():
    event_id = "EVT-TEST-DUP-001"
    response = client.post(f"/api/events/{event_id}/replay/execute")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert "already been successfully replayed" in data["message"]
    assert data["target_updated"] is False

def test_edge_case_missing_dependency_blocked():
    event_id = "EVT-TEST-MIS-DEP"
    response = client.post(f"/api/events/{event_id}/replay/execute")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert "Missing mandatory" in data["message"]
    assert data["target_updated"] is False

def test_edge_case_transformation_mismatch_blocked():
    event_id = "EVT-TEST-TRF-MIS"
    response = client.post(f"/api/events/{event_id}/replay/execute")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert "Transformation version mismatch" in data["message"]
    assert data["target_updated"] is False

def test_edge_case_snapshot_conflict_blocked():
    event_id = "EVT-TEST-SNP-CNF"
    response = client.post(f"/api/events/{event_id}/replay/execute")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert "Target snapshot conflict" in data["message"]
    assert data["target_updated"] is False

def test_edge_case_malformed_payload_blocked():
    event_id = "EVT-TEST-MAL-PLD"
    response = client.post(f"/api/events/{event_id}/replay/execute")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert "malformed or invalid JSON" in data["message"]
    assert data["target_updated"] is False
