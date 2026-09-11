"""
NEURoute Backend Routes — GIS, Geospatial Layers & District Accessibility API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List
from fastapi import APIRouter, Depends

from app.dependencies import get_gis_service
from app.schemas.road import DistrictAccessibilityScore, GeoJSONFeatureCollection
from app.services.gis_service import GISService

router = APIRouter(prefix="/api/v1/gis", tags=["GIS & Spatial Infrastructure"])


@router.get("/roads", response_model=GeoJSONFeatureCollection, summary="Get road network as GeoJSON FeatureCollection")
def get_road_segments_geojson(
    service: GISService = Depends(get_gis_service),
) -> GeoJSONFeatureCollection:
    """
    Returns full North Eastern Region highway lifelines as standard GeoJSON LineStrings,
    including real-time status (OPEN/RISKY/BLOCKED), speed limits, and risk scores.
    """
    return service.get_road_segments_geojson()


@router.get("/incidents", response_model=GeoJSONFeatureCollection, summary="Get active road incidents as GeoJSON FeatureCollection")
def get_incidents_geojson(
    service: GISService = Depends(get_gis_service),
) -> GeoJSONFeatureCollection:
    """Returns active road blockages and disruptions as GeoJSON Points."""
    return service.get_incidents_geojson()


@router.get("/district-accessibility/{district_id}", response_model=DistrictAccessibilityScore, summary="Compute district accessibility index")
def get_district_accessibility(
    district_id: int,
    service: GISService = Depends(get_gis_service),
) -> DistrictAccessibilityScore:
    """
    Computes dynamic accessibility index for a target district based on total vs blocked road kilometers
    and active disruption hazards.
    """
    return service.calculate_district_accessibility_index(district_id)


@router.get("/hazards", summary="Get active regional hazard zones")
def get_hazards(
    service: GISService = Depends(get_gis_service),
):
    """Returns active regional hazard hotspots from the central database."""
    from app.models.hazard import Hazard
    hazards = service.db.query(Hazard).filter(Hazard.is_active.is_(True)).all()
    return [
        {
            "id": f"haz-{h.id}",
            "name": h.name,
            "type": h.hazard_type,
            "severity": h.severity,
            "state": h.state,
            "lat": h.latitude,
            "lng": h.longitude,
            "radius_km": h.radius_km,
            "is_active": h.is_active,
        }
        for h in hazards
    ]


@router.get("/hubs", summary="Get strategic logistics hubs")
def get_hubs(
    service: GISService = Depends(get_gis_service),
):
    """Returns strategic regional distribution hubs and relief supply depots."""
    from app.models.hub import LogisticsHub
    hubs = service.db.query(LogisticsHub).all()
    return [
        {
            "id": f"hub-{h.id}",
            "name": h.name,
            "hub_type": h.hub_type,
            "state": h.state,
            "lat": h.latitude,
            "lng": h.longitude,
            "capacity_tonnes": h.capacity_tonnes,
            "is_emergency_depot": h.is_emergency_depot,
            "contact_phone": h.contact_phone,
        }
        for h in hubs
    ]
