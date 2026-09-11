"""
NEURoute — Simulation Control Center API Router.
Endpoints driving the complete software-only SIH demonstration scenarios.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/api/v1/simulation", tags=["Simulation Control Center"])


class RainfallSimulationRequest(BaseModel):
    segment_code: str = Field(default="seg-nh06-03", description="Target road segment code")
    rainfall_mm: float = Field(default=92.5, ge=0.0)
    visibility_meters: float = Field(default=280.0, ge=0.0)


class LandslideSimulationRequest(BaseModel):
    segment_code: str = Field(default="seg-nh06-03")
    title: str = Field(default="Sonapur Tunnel Mudslide Blockage")
    description: str = Field(default="Massive slope failure 800m south of Sonapur tunnel. Debris covering all lanes. Heavy rocks still falling.")


class GpsStepRequest(BaseModel):
    vehicle_id: int = Field(default=1)
    step_fraction: float = Field(default=0.5, ge=0.05, le=5.0)


class ColdChainSimulationRequest(BaseModel):
    shipment_id: int = Field(default=1)
    target_temp_c: Optional[float] = None


class EmergencyModeRequest(BaseModel):
    enabled: Optional[bool] = None


@router.get("/status", summary="Get overall simulation control center state")
async def get_simulation_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.get_simulation_status()


@router.post("/rainfall", summary="Simulate heavy rainfall event")
async def simulate_rainfall(
    req: RainfallSimulationRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.simulate_heavy_rainfall(
        segment_code=req.segment_code,
        rainfall_mm=req.rainfall_mm,
        visibility_meters=req.visibility_meters,
    )


@router.post("/landslide", summary="Simulate landslide corridor blockage")
async def simulate_landslide(
    req: LandslideSimulationRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.simulate_landslide_blockage(
        segment_code=req.segment_code,
        title=req.title,
        description=req.description,
    )


@router.post("/gps-step", summary="Advance simulated vehicle along GIS highway")
async def simulate_gps_step(
    req: GpsStepRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.simulate_gps_step(
        vehicle_id=req.vehicle_id,
        step_fraction=req.step_fraction,
    )


@router.post("/cold-chain", summary="Advance cold-chain temperature excursion")
async def simulate_cold_chain(
    req: ColdChainSimulationRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.simulate_cold_chain_excursion(
        shipment_id=req.shipment_id,
        target_temp_c=req.target_temp_c,
    )


@router.post("/emergency-mode", summary="Toggle Emergency Mission Control mode")
async def toggle_emergency_mode(
    req: EmergencyModeRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.toggle_emergency_mode(enabled=req.enabled)


@router.post("/reset", summary="Reset simulation states to baseline")
async def reset_simulation(db: Session = Depends(get_db)) -> Dict[str, Any]:
    service = SimulationService(db)
    return await service.reset_simulation()


@router.post("/demo-scenario", summary="Execute complete SIH Judge Demonstration Scenario pipeline")
async def execute_demo_scenario(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Triggers end-to-end 25-step SIH demonstration workflow."""
    service = SimulationService(db)
    return await service.execute_demo_scenario()
