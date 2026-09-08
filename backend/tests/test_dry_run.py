from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dry_run_demo_event():
    response = client.post("/api/events/EVT-DEMO-001/dry-run", json={"actor_role": "Integration Engineer", "target_transformation_version": "v2.0"})
    assert response.status_code == 200
    data = response.json()
    assert data["event_id"] == "EVT-DEMO-001"
    assert data["hash_difference"] is True
    assert (len(data["changed_fields"]) + len(data["added_fields"])) > 0
    assert data["predicted_snapshot"]["status"] == "completed"
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
