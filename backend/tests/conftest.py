import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Event, ReplayRecord, TargetSnapshot, MockTarget

@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def reset_demo_event_fixture():
    """Reset EVT-DEMO-001 and target snapshot to clean state before every test."""
    db = SessionLocal()
    try:
        e = db.query(Event).filter(Event.id == "EVT-DEMO-001").first()
        if e:
            e.status = "ARCHIVED"
        db.query(ReplayRecord).filter(ReplayRecord.event_id == "EVT-DEMO-001").delete()
        db.query(TargetSnapshot).filter(TargetSnapshot.entity_reference == "PATIENT-TEST-00001").delete()
        db.query(MockTarget).filter(MockTarget.entity_reference == "PATIENT-TEST-00001").delete()
        db.commit()
    finally:
        db.close()
