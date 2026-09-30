def test_benchmark_experiment_metrics(client):
    res = client.post("/api/experiments/run?sample_size=100")
    assert res.status_code == 200
    data = res.json()
    assert "baseline" in data
    assert "safe_replay" in data
    assert "metric_definitions" in data
    
    safe = data["safe_replay"]
    base = data["baseline"]

    # Verify 14 core metrics are calculated
    assert safe["failure_capture_rate_pct"] == 100.0
    assert safe["data_corruption_risk_pct"] == 0.0
    assert safe["unsafe_operations"] == 0
    assert base["unsafe_operations"] >= 0
    assert len(data["metric_definitions"]) >= 14
