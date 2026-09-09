"""
End-to-End AI/Prediction Integration & Database Persistence Tests.
Verifies the complete flow:
API Request -> Backend Service (AIService) -> AI Adapter -> Prediction Result -> Database Persistence -> API Response.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.dependencies import get_db
from app.models.prediction import Prediction
from app.services.ai_service import AIService
from app.repositories.prediction_repository import PredictionRepository
from app.adapters.ai.ai_adapter import AIIntegrationAdapter


@pytest.mark.asyncio
async def test_ai_adapter_callable():
    """Verify AI adapter is callable and returns structured output."""
    adapter = AIIntegrationAdapter()
    res = await adapter.classify_incident_text("Landslide on highway")
    assert res.category is not None
    assert res.severity is not None
    assert 0.0 <= res.confidence <= 1.0


def test_ai_service_persistence(db_session: Session):
    """Verify AIService computes predictions and persists them in DB."""
    service = AIService(db=db_session)
    
    # 1. Incident Classification
    class_res = service.classify_incident_text("Landslide blocking NH-06 near Sonapur")
    assert class_res["category"] == "LANDSLIDE"
    
    # 2. Risk Prediction
    risk_res = service.predict_risk(
        segment_id="101",
        rainfall_mm=120.0,
        hazard_severity="HIGH",
        hazard_distance_km=2.0
    )
    assert risk_res["risk_score"] > 0.0
    
    # 3. Delay Estimation
    delay_res = service.estimate_delay(
        distance_km=80.0,
        base_speed_kmh=50.0,
        impaired_speed_kmh=20.0,
        current_status="RISKY",
        risk_score=0.75
    )
    assert delay_res["delay_minutes"] >= 0
    
    # 4. Route Optimization
    opt_res = service.optimize_routes(
        candidate_routes=[
            {"id": "route_A", "distance_km": 100, "risk_score": 0.2},
            {"id": "route_B", "distance_km": 80, "risk_score": 0.8}
        ]
    )
    assert opt_res["recommended_route_id"] is not None

    # Check persistence in database
    db_session.commit()
    repo = PredictionRepository(db_session)
    predictions = repo.get_all(limit=10)
    
    assert len(predictions) >= 4
    types = [p.prediction_type for p in predictions]
    assert "INCIDENT_CLASSIFICATION" in types
    assert "RISK_SCORE" in types
    assert "DELAY_MINUTES" in types
    assert "ROUTE_OPTIMIZATION" in types


def test_e2e_ai_api_flow(db_session: Session):
    """
    Test End-to-End Flow:
    FastAPI API Request -> AIService -> AI Adapter -> Prediction Model -> Database Persistence -> API Response
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    try:
        # 1. Classify incident API call
        resp = client.post(
            "/api/v1/ai/classify-incident",
            json={"text": "Massive rockfall blocking arterial lifeline road"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["category"] == "LANDSLIDE"
        assert data["severity"] in ["HIGH", "CRITICAL"]
        assert "confidence" in data

        # 2. Risk prediction API call
        resp = client.post(
            "/api/v1/ai/risk",
            json={
                "segment_id": "seg-nh-44",
                "rainfall_mm": 95.0,
                "visibility_meters": 1200.0,
                "hazard_type": "LANDSLIDE",
                "hazard_severity": "HIGH"
            }
        )
        assert resp.status_code == 200
        risk_data = resp.json()
        assert "risk_score" in risk_data
        assert "risk_level" in risk_data
        assert "components" in risk_data

        # 3. Delay estimation API call
        resp = client.post(
            "/api/v1/ai/delay",
            json={
                "distance_km": 150.0,
                "base_speed_kmh": 60.0,
                "impaired_speed_kmh": 25.0,
                "current_status": "DISRUPTED",
                "risk_score": 0.82
            }
        )
        assert resp.status_code == 200
        delay_data = resp.json()
        assert "normal_travel_minutes" in delay_data
        assert "estimated_travel_minutes" in delay_data
        assert "delay_minutes" in delay_data

        # 4. Route optimization API call
        resp = client.post(
            "/api/v1/ai/optimize-route",
            json={
                "candidate_routes": [
                    {"id": "r1", "distance_km": 120.0, "risk_score": 0.15},
                    {"id": "r2", "distance_km": 90.0, "risk_score": 0.70}
                ],
                "cargo_priority": "CRITICAL",
                "preference": "SAFEST"
            }
        )
        assert resp.status_code == 200
        opt_data = resp.json()
        assert "recommended_route_id" in opt_data

        # 5. Query stored predictions via API GET endpoint
        get_resp = client.get("/api/v1/ai/predictions")
        assert get_resp.status_code == 200
        stored_preds = get_resp.json()
        assert len(stored_preds) >= 4
        
        # Verify stored items match model structure and predictions in DB
        db_preds = db_session.query(Prediction).all()
        assert len(db_preds) >= 4
        
        # Ensure database fields are populated correctly
        for pred in db_preds:
            assert pred.id is not None
            assert pred.prediction_type in [
                "INCIDENT_CLASSIFICATION",
                "RISK_SCORE",
                "DELAY_MINUTES",
                "ROUTE_OPTIMIZATION"
            ]
            assert pred.target_entity_type is not None
            assert pred.predicted_value is not None
            assert pred.created_at is not None

    finally:
        app.dependency_overrides.clear()
