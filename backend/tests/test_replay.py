from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Event, ReplayRecord

client = TestClient(app)

def reset_demo_event():
    """Reset EVT-DEMO-001 state prior to workflow testing."""
    db = SessionLocal()
    try:
        e = db.query(Event).filter(Event.id == "EVT-DEMO-001").first()
        if e:
            e.status = "ARCHIVED"
        db.query(ReplayRecord).filter(ReplayRecord.event_id == "EVT-DEMO-001").delete()
        db.commit()
    finally:
        db.close()

def test_full_replay_workflow_demo_event():
    reset_demo_event()
    event_id = "EVT-DEMO-001"

    # 1. Dependency Check
    res_dep = client.post(f"/api/events/{event_id}/dependencies/check")
    assert res_dep.status_code == 200
    assert res_dep.json()["status"] in ["PASS", "WARNING"]

    # 2. Dry Run
    res_dry = client.post(f"/api/events/{event_id}/dry-run")
    assert res_dry.status_code == 200

    # 3. Request Replay
    res_req = client.post(f"/api/events/{event_id}/replay/request", json={"actor_role": "Integration Engineer", "reason": "Testing demo workflow"})
    assert res_req.status_code == 200
    assert res_req.json()["status"] == "PENDING_APPROVAL"

    # 4. Approve Replay
    res_app = client.post(f"/api/events/{event_id}/replay/approve", json={"actor_role": "Auditor / Operations Manager", "reason": "Approved"})
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "APPROVED"

    # 5. Execute Replay
    res_exc = client.post(f"/api/events/{event_id}/replay/execute", json={"actor_role": "Integration Engineer"})
    assert res_exc.status_code == 200
    assert res_exc.json()["status"] == "EXECUTED"
    assert res_exc.json()["target_updated"] is True

    # 6. Verify Duplicate Replay Blocked
    res_dup = client.post(f"/api/events/{event_id}/replay/execute", json={"actor_role": "Integration Engineer"})
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "BLOCKED"
    assert "already been successfully replayed" in res_dup.json()["message"]

    # 7. Audit log verification
    res_audit = client.get(f"/api/audit-logs?event_id={event_id}")
    assert res_audit.status_code == 200
    logs = res_audit.json()["items"]
    actions = [l["action"] for l in logs]
    assert "REPLAY_COMPLETED" in actions
    assert "REPLAY_BLOCKED" in actions
