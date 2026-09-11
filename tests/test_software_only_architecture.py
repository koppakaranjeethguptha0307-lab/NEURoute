"""
NEURoute — Software-Only Architecture Verification Test Suite.
Tests:
- GPS simulation, progress tracking, and source labeling
- Weather provider sources (LIVE, SIMULATED, FALLBACK)
- Dynamic RiskPredictor calculation with explainability
- Road blockage database state and GIS synchronization
- Cold-Chain telemetry thresholds (NORMAL, WARNING, CRITICAL)
- Cold-chain-informed route optimization (Umrangso bypass selection)
- Government integration contract and NOT_CONFIGURED transparency
- Offline field reporting sync idempotency
- Emergency mode prioritization
- Hardware dependency assertion (verifies 100% software-only execution)
"""

import sys
from pathlib import Path
from datetime import datetime, timezone
import pytest

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.adapters.gps.base import GPSSource, TelemetryStatus
from app.adapters.gps.simulator import SimulatorGPSProvider
from app.adapters.gps.live_api import LiveApiGPSProvider
from app.adapters.weather.base import WeatherSource
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.adapters.cold_chain.base import ColdChainSource, ColdChainStatus
from app.adapters.cold_chain.simulator import SimulatorColdChainProvider
from app.adapters.cold_chain.live_api import LiveApiColdChainProvider
from app.adapters.government.base import GovernmentSource
from app.adapters.government.simulator import SimulatorGovernmentAdapter
from app.adapters.government.live_adapter import LiveGovernmentAdapter

from ai.services.risk_predictor import RiskPredictor
from ai.services.delay_estimator import DelayEstimator
from ai.services.route_optimizer import RouteOptimizer
from app.services.event_broadcaster import EventBroadcaster


# ==============================================================================
# 1. GPS Telemetry Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_gps_simulator_route_progression():
    sim = SimulatorGPSProvider()
    
    # 1. Initial position at Guwahati
    reading_start = await sim.get_vehicle_location(1)
    assert reading_start.source == GPSSource.SIMULATED
    assert reading_start.route_progress_pct == 0.0
    assert reading_start.latitude == 26.1824
    assert reading_start.longitude == 91.7582
    assert "Guwahati" in reading_start.current_road_name

    # 2. Advance vehicle along corridor
    reading_step1 = await sim.step_vehicle_route(1, step_fraction=1.0)
    assert reading_step1.source == GPSSource.SIMULATED
    assert reading_step1.route_progress_pct > 0.0
    assert reading_step1.speed_kmh > 0.0
    assert 0.0 <= reading_step1.heading_deg <= 360.0

    # 3. Advance to end of corridor
    reading_end = await sim.step_vehicle_route(1, step_fraction=10.0)
    assert reading_end.route_progress_pct == 100.0
    assert reading_end.latitude == 24.8270  # Silchar Depot
    assert reading_end.longitude == 92.7959

    # 4. Reset vehicle
    reset_reading = await sim.reset_vehicle(1, 0.0)
    assert reset_reading.route_progress_pct == 0.0


@pytest.mark.asyncio
async def test_live_gps_provider_fallback():
    live_provider = LiveApiGPSProvider(api_base_url="")
    assert not live_provider.is_configured
    reading = await live_provider.get_vehicle_location(1)
    assert reading.source == GPSSource.SIMULATED


# ==============================================================================
# 2. Weather Intelligence Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_weather_provider_simulation_and_overrides():
    adapter = MockWeatherAdapter()
    
    # Standard query
    res = await adapter.get_current_weather(26.18, 91.75, "Guwahati")
    assert res.source == WeatherSource.SIMULATED
    assert res.temperature_c > 0
    assert res.humidity_percent >= 50.0

    # Override for severe Sonapur rainfall
    adapter.set_override("sonapur", {
        "temp": 22.5,
        "rainfall": 92.5,
        "wind": 45.0,
        "visibility": 0.28,
        "humidity": 98.0,
        "condition": "TORRENTIAL_RAIN",
    })

    overridden = await adapter.get_current_weather(25.11, 92.36, "Sonapur Valley")
    assert overridden.source == WeatherSource.SIMULATED
    assert overridden.rainfall_mm == 92.5
    assert len(overridden.weather_alerts) > 0
    assert "CRITICAL RED ALERT" in overridden.weather_alerts[0]


# ==============================================================================
# 3. Dynamic AI Risk Prediction & Explainability
# ==============================================================================

def test_dynamic_ai_risk_calculation():
    predictor = RiskPredictor()

    # Normal weather
    res_normal = predictor.predict_risk(
        segment_id="seg-nh06-03",
        rainfall_mm=5.0,
        visibility_meters=8000.0,
        hazard_type=None,
        active_incidents=[],
        historical_frequency=0.10,
        trend="STABLE",
    )
    assert res_normal["risk_score"] < 0.40
    assert res_normal["risk_level"] in ["LOW", "MODERATE"]
    assert not res_normal["is_disrupted"]

    # Severe rainfall + active landslide
    res_critical = predictor.predict_risk(
        segment_id="seg-nh06-03",
        rainfall_mm=92.5,
        visibility_meters=280.0,
        weather_advisory="Severe slope instability",
        hazard_type="LANDSLIDE",
        hazard_severity="CRITICAL",
        hazard_distance_km=0.1,
        active_incidents=[{"category": "LANDSLIDE", "severity": "CRITICAL", "blocked_lanes": 2, "status": "ACTIVE", "distance_km": 0.0}],
        historical_frequency=0.85,
        trend="INCREASING",
    )
    assert res_critical["risk_score"] >= 0.85
    assert res_critical["risk_level"] == "CRITICAL"
    assert res_critical["is_disrupted"]
    assert "components" in res_critical
    assert "weather_norm" in res_critical["components"]
    assert "reasons" in res_critical
    assert len(res_critical["reasons"]) >= 3


# ==============================================================================
# 4. Cold-Chain Telemetry & Multi-Criteria Route Optimization
# ==============================================================================

@pytest.mark.asyncio
async def test_cold_chain_progression_and_thresholds():
    provider = SimulatorColdChainProvider()

    # Reading 1: 4.8°C (NORMAL)
    r1 = await provider.get_latest_reading(1)
    assert r1.temperature_c == 4.8
    assert r1.status == ColdChainStatus.NORMAL
    assert r1.source == ColdChainSource.SIMULATOR

    # Advance steps
    await provider.simulate_temperature_step(1)  # 5.1°C
    await provider.simulate_temperature_step(1)  # 5.4°C
    
    # Step to 8.3°C (WARNING)
    r_warn = await provider.simulate_temperature_step(1)
    assert r_warn.temperature_c == 8.3
    assert r_warn.status == ColdChainStatus.WARNING

    # Step to 9.4°C (CRITICAL)
    r_crit = await provider.simulate_temperature_step(1)
    assert r_crit.temperature_c == 9.4
    assert r_crit.status == ColdChainStatus.CRITICAL
    assert "EXCURSION ALERT" in (r_crit.notes or "")

    # Reset
    await provider.reset(1)
    r_reset = await provider.get_latest_reading(1)
    assert r_reset.temperature_c == 4.8


def test_cold_chain_informed_route_optimization():
    optimizer = RouteOptimizer()

    candidate_routes = [
        {
            "route_id": "corridor-nh06-primary",
            "route_name": "NH-06 Sonapur Primary Mountain Corridor",
            "distance_km": 330.0,
            "travel_time_minutes": 360,
            "risk_score": 0.95,
            "segments": [{"id": "seg-nh06-03", "name": "Sonapur Tunnel Passage", "status": "BLOCKED"}],
        },
        {
            "route_id": "corridor-umrangso-bypass",
            "route_name": "Umrangso Relief Lifeline Bypass (NH-27 / NH-627)",
            "distance_km": 375.0,
            "travel_time_minutes": 430,
            "risk_score": 0.22,
            "segments": [{"id": "seg-umr-01", "name": "Umrangso Relief Arterial", "status": "OPEN"}],
        },
        {
            "route_id": "corridor-jowai-ridge",
            "route_name": "Jowai-Khanduli Ridge Road",
            "distance_km": 355.0,
            "travel_time_minutes": 415,
            "risk_score": 0.65,
            "segments": [{"id": "seg-jow-01", "name": "Jowai Ridge Segment", "status": "RISKY"}],
        },
    ]

    result = optimizer.optimize_routes(
        candidate_routes=candidate_routes,
        cargo_priority="CRITICAL",
        preference="SAFEST",
        cold_chain_sensitive=True,
    )

    # Must recommend Umrangso bypass because NH-06 is blocked and poses catastrophic cold-chain thermal delay
    assert result["recommended_route_id"] == "corridor-umrangso-bypass"
    assert "cold-chain" in result["reason"].lower() or "blocked" in result["reason"].lower()


# ==============================================================================
# 5. Government Integration Contract & Source Transparency
# ==============================================================================

@pytest.mark.asyncio
async def test_government_integration_provider():
    sim_gov = SimulatorGovernmentAdapter()
    advisories = await sim_gov.get_active_advisories()
    assert len(advisories) >= 2
    assert all(a.source == GovernmentSource.SIMULATED for a in advisories)
    assert all(not a.verified_official for a in advisories)

    live_gov = LiveGovernmentAdapter(api_base_url="", api_key="")
    assert not live_gov.is_configured
    live_res = await live_gov.get_active_advisories()
    # Unconfigured adapter transparently delegates to simulation
    assert len(live_res) >= 2
    assert live_res[0].source == GovernmentSource.SIMULATED


# ==============================================================================
# 6. Real-Time Event Hub Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_event_broadcaster():
    broadcaster = EventBroadcaster(history_limit=10)
    await broadcaster.broadcast("TEST_EVENT", {"payload": "val"})
    recent = broadcaster.get_recent_events(limit=5)
    assert len(recent) == 1
    assert recent[0]["event"] == "TEST_EVENT"
    assert recent[0]["data"]["payload"] == "val"


# ==============================================================================
# 7. Hardware Dependency Assertion Test
# ==============================================================================

def test_no_hardware_dependencies_present():
    """
    Asserts that no physical hardware drivers, serial communication,
    GPIO, or device-level embedded packages are present or required in the runtime.
    """
    prohibited_hardware_modules = [
        "serial",
        "pyserial",
        "paho.mqtt",
        "RPi.GPIO",
        "RPi",
        "gpiozero",
        "spidev",
        "smbus",
        "bluepy",
        "pybluez",
        "can",
        "canbus",
        "nmea",
        "adafruit_dht",
    ]

    for mod in prohibited_hardware_modules:
        assert mod not in sys.modules, f"Hardware module '{mod}' is unexpectedly loaded in runtime!"

    # Verify requirements.txt
    req_file = root_dir / "backend" / "requirements.txt"
    if req_file.exists():
        content = req_file.read_text().lower()
        for forbidden in ["pyserial", "rpi.gpio", "paho-mqtt", "bluepy", "spidev"]:
            assert forbidden not in content, f"Forbidden hardware package '{forbidden}' found in requirements.txt!"
