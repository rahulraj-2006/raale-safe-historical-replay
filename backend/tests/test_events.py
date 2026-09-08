from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert data["database"] == "CONNECTED"
    assert data["synthetic_event_count"] >= 10000

def test_get_dashboard():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] >= 10000
    assert "LAB_V1" in data["events_by_source"]

def test_list_events():
    response = client.get("/api/events?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] >= 10000

def test_get_demo_event():
    response = client.get("/api/events/EVT-DEMO-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "EVT-DEMO-001"
    assert data["entity_reference"] == "PATIENT-TEST-00001"
