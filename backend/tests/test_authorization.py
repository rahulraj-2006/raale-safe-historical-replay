def test_integration_engineer_cannot_approve(client):
    # Integration Engineer attempts to approve replay -> must fail HTTP 403 Forbidden!
    response = client.post("/api/events/EVT-DEMO-001/replay/approve", json={
        "actor_role": "Integration Engineer",
        "reason": "Engineer trying unauthorized approval"
    })
    assert response.status_code == 403
    assert "Access Denied" in response.json()["detail"]

def test_clinical_lead_can_approve(client):
    # Clinical Lead attempts to approve replay -> must succeed!
    response = client.post("/api/events/EVT-DEMO-001/replay/approve", json={
        "actor_role": "Clinical Lead",
        "reason": "Clinical Lead approving safe replay"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"
