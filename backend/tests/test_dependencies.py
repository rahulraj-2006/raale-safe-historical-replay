from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_check_demo_event_dependencies():
    response = client.post("/api/events/EVT-DEMO-001/dependencies/check", json={"actor_role": "Integration Engineer"})
    assert response.status_code == 200
    data = response.json()
    assert data["event_id"] == "EVT-DEMO-001"
    assert data["status"] in ["PASS", "WARNING"]
    assert len(data["block_reasons"]) == 0

def test_check_missing_dependency_event():
    response = client.post("/api/events/EVT-TEST-MIS-DEP/dependencies/check", json={"actor_role": "Integration Engineer"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "BLOCKED"
    assert len(data["block_reasons"]) > 0
    assert any("Missing mandatory" in r for r in data["block_reasons"])
