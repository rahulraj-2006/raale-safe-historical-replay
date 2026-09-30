def test_valid_login(client):
    response = client.post("/api/auth/login", json={
        "username": "engineer",
        "password": "engineer123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Integration Engineer"
    assert data["user"]["username"] == "engineer"

def test_clinical_login(client):
    response = client.post("/api/auth/login", json={
        "username": "clinical",
        "password": "clinical123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "Clinical Lead"

def test_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "username": "engineer",
        "password": "wrong_password"
    })
    assert response.status_code == 401

def test_unknown_user(client):
    response = client.post("/api/auth/login", json={
        "username": "unknown_user_99",
        "password": "somepassword"
    })
    assert response.status_code == 401

def test_protected_me_endpoint_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
