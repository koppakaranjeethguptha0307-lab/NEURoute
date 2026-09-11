"""
NEURoute — Telematics & External Intelligence Router.
Provides endpoints for Cold-Chain Telemetry and Government Regulatory Advisories.
All responses explicitly report their data source (SIMULATED / NOT_CONFIGURED / LIVE).
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from app.adapters.cold_chain.simulator import SimulatorColdChainProvider
from app.adapters.government.simulator import SimulatorGovernmentAdapter

router = APIRouter(prefix="/api/v1", tags=["Telematics & External Intelligence"])

_cold_chain_provider = SimulatorColdChainProvider()
_government_provider = SimulatorGovernmentAdapter()


@router.get("/telematics/cold-chain", summary="Get active cold-chain telemetry readings")
@router.get("/cold-chain", summary="Get active cold-chain telemetry readings alias")
async def get_cold_chain_list() -> List[Dict[str, Any]]:
    reading = await _cold_chain_provider.get_latest_reading(1)
    return [reading.model_dump(mode="json")]


@router.post("/telematics/cold-chain", summary="Ingest software cold-chain temperature telemetry")
async def ingest_cold_chain_telemetry(
    shipment_id: int = 1,
    target_temp_c: Optional[float] = None,
) -> Dict[str, Any]:
    reading = await _cold_chain_provider.simulate_temperature_step(shipment_id, target_temp_c)
    return reading.model_dump(mode="json")


@router.get("/telematics/cold-chain/{shipment_id}", summary="Get latest cold-chain telemetry for shipment")
@router.get("/cold-chain/{shipment_id}", summary="Get latest cold-chain telemetry reading")
async def get_cold_chain_reading(shipment_id: int) -> Dict[str, Any]:
    reading = await _cold_chain_provider.get_latest_reading(shipment_id)
    return reading.model_dump(mode="json")


@router.get("/cold-chain/{shipment_id}/series", summary="Get historical cold-chain temperature time-series")
async def get_cold_chain_series(shipment_id: int) -> List[Dict[str, Any]]:
    readings = await _cold_chain_provider.get_time_series(shipment_id)
    return [r.model_dump(mode="json") for r in readings]


@router.get("/government/advisories", summary="List official and simulated government disaster/road advisories")
async def get_government_advisories(state: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    advisories = await _government_provider.get_active_advisories(state=state)
    return [a.model_dump(mode="json") for a in advisories]
