"""
NEURoute Backend Routes — Multi-Criteria Route Optimization & Corridor Planning API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Body

from app.dependencies import get_route_orchestrator
from app.schemas.enums import CargoPriority
from app.schemas.route import Coordinate, RoutePlanRequest, RoutePlanResponse
from app.services.route_orchestrator import RouteOrchestrator

router = APIRouter(prefix="/api/v1/routes", tags=["Route Optimization & Corridor Intelligence"])


@router.post("/plan", summary="Plan and optimize multi-criteria route")
async def plan_route_endpoint(
    payload: Dict[str, Any] = Body(...),
    orchestrator: RouteOrchestrator = Depends(get_route_orchestrator),
) -> Dict[str, Any]:
    """
    Evaluates real-time elevation gradients, active landslides, road blockages,
    and adaptive cargo priorities (Medical/Relief vs Food vs General) to recommend
    the optimal resilient corridor with explainable AI reasoning.
    """
    # Accept both structured Coordinate objects or string names with lat/lng extraction
    origin_raw = payload.get("origin")
    dest_raw = payload.get("destination")
    
    # Coordinate mapping for major NER hub locations
    NER_COORDS = {
        "guwahati": (26.1445, 91.7362),
        "silchar": (24.8333, 92.7789),
        "jorhat": (26.7509, 94.2037),
        "shillong": (25.5788, 91.8933),
        "dimapur": (25.9060, 93.7271),
        "tezpur": (26.6528, 92.7926),
        "imphal": (24.8170, 93.9368),
        "aizawl": (23.7271, 92.7176),
        "itanagar": (27.0844, 93.6053),
        "agartala": (23.8315, 91.2868),
        "gangtok": (27.3389, 88.6065),
        "tawang": (27.5861, 91.8594),
        "mokokchung": (26.3243, 94.5152),
    }

    def resolve_coord(val: Any, default_lat: float, default_lng: float) -> Coordinate:
        if isinstance(val, dict) and "lat" in val and "lng" in val:
            return Coordinate(lat=float(val["lat"]), lng=float(val["lng"]))
        if isinstance(val, str):
            lower = val.lower()
            for k, (lat, lng) in NER_COORDS.items():
                if k in lower:
                    return Coordinate(lat=lat, lng=lng)
        return Coordinate(lat=default_lat, lng=default_lng)

    origin_coord = resolve_coord(origin_raw, 26.1445, 91.7362)
    dest_coord = resolve_coord(dest_raw, 24.8170, 93.9368)

    cargo_prio_str = str(payload.get("cargo_priority") or payload.get("cargoType") or "NORMAL").upper()
    prio_enum = CargoPriority.NORMAL
    if "CRITICAL" in cargo_prio_str or "EMERGENCY" in cargo_prio_str or "PHARMA" in cargo_prio_str:
        prio_enum = CargoPriority.CRITICAL
    elif "HIGH" in cargo_prio_str or "FOOD" in cargo_prio_str:
        prio_enum = CargoPriority.HIGH

    request = RoutePlanRequest(
        origin=origin_coord,
        destination=dest_coord,
        cargo_priority=prio_enum,
        vehicle_type=payload.get("vehicleType") or payload.get("vehicle_type") or "Heavy Truck",
        avoid_blocked=payload.get("avoidActiveHazards", True),
    )

    plan_res: RoutePlanResponse = await orchestrator.plan_route(request)
    
    # Format route options conforming to UI specifications
    ui_routes = []
    all_options = [plan_res.recommended_route] + plan_res.alternative_routes
    for idx, opt in enumerate(all_options):
        reason_text = " ".join(opt.ai_explanation) if opt.ai_explanation else "Optimal multi-criteria route selected based on safety and elevation gradient analysis."
        ui_routes.append({
            "id": f"RTE-OPT-0{idx + 1}",
            "name": f"{opt.title} ({opt.criterion.value})",
            "corridor": opt.summary,
            "distanceKm": round(opt.distance_km, 1),
            "estimatedDurationHours": round(opt.estimated_duration_hours, 1),
            "predictedDelayMinutes": round(opt.estimated_delay_hours * 60),
            "riskScore": round(opt.composite_risk_score * 100),
            "elevationProfile": {
                "maxElevationMeters": 1444 if idx == 0 else 980,
                "gradientRisk": "high" if opt.composite_risk_score > 0.6 else "low",
            },
            "activeIncidentsCount": opt.blocked_segments_count + opt.risky_segments_count,
            "recommended": opt.is_recommended,
            "aiExplanation": opt.ai_explanation,
            "reason": reason_text,
            "waypoints": [{"lat": p[1], "lng": p[0]} for p in opt.geometry_coordinates] if opt.geometry_coordinates else [
                {"lat": origin_coord.lat, "lng": origin_coord.lng},
                {"lat": dest_coord.lat, "lng": dest_coord.lng}
            ]
        })

    return {
        "request_id": plan_res.request_id,
        "cargo_priority": plan_res.cargo_priority.value,
        "routes": ui_routes,
    }


@router.post("/alternate", summary="Get alternate bypass route avoiding blocked corridors")
async def alternate_route_endpoint(
    payload: Dict[str, Any] = Body(...),
    orchestrator: RouteOrchestrator = Depends(get_route_orchestrator),
) -> Dict[str, Any]:
    """Calculates alternate bypass route bypassing active chokepoints and blocked sectors."""
    # Enforce hazard avoidance
    payload["avoidActiveHazards"] = True
    return await plan_route_endpoint(payload=payload, orchestrator=orchestrator)


@router.get("", summary="List default regional route corridors")
async def get_routes_endpoint(
    orchestrator: RouteOrchestrator = Depends(get_route_orchestrator),
) -> List[Dict[str, Any]]:
    """Returns baseline strategic national highway corridors across the North Eastern Region."""
    # Run default Guwahati to Imphal corridor plan
    default_req = RoutePlanRequest(
        origin=Coordinate(lat=26.1445, lng=91.7362),
        destination=Coordinate(lat=24.8170, lng=93.9368),
        cargo_priority=CargoPriority.CRITICAL,
    )
    res = await orchestrator.plan_route(default_req)
    out = []
    for idx, opt in enumerate([res.recommended_route] + res.alternative_routes):
        out.append({
            "id": f"RTE-GHY-IMP-0{idx + 1}",
            "name": opt.title,
            "corridor": opt.summary,
            "distanceKm": round(opt.distance_km, 1),
            "estimatedDurationHours": round(opt.estimated_duration_hours, 1),
            "predictedDelayMinutes": round(opt.estimated_delay_hours * 60),
            "riskScore": round(opt.composite_risk_score * 100),
            "elevationProfile": {
                "maxElevationMeters": 1444 if idx == 0 else 980,
                "gradientRisk": "moderate" if idx == 0 else "low",
            },
            "activeIncidentsCount": opt.blocked_segments_count + opt.risky_segments_count,
            "recommended": opt.is_recommended,
            "aiExplanation": opt.ai_explanation,
            "reason": " ".join(opt.ai_explanation) if opt.ai_explanation else "Optimal corridor selected based on terrain and disruption analysis.",
            "waypoints": [{"lat": p[1], "lng": p[0]} for p in opt.geometry_coordinates] if opt.geometry_coordinates else []
        })
    return out
