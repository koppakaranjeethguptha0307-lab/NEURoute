"""
GIS and Spatial Business Service.
Handles road status calculation, GeoJSON transformation utilities, coordinate/bounding box validation,
and district accessibility scoring.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.models.district import District
from app.models.incident import Incident
from app.models.road import RoadSegment
from app.repositories.district_repository import DistrictRepository
from app.repositories.incident_repository import IncidentRepository
from app.repositories.road_repository import RoadRepository
from app.schemas.enums import RoadStatus
from app.schemas.road import (
    DistrictAccessibilityScore,
    DistrictResponse,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
    RoadSegmentResponse,
)


class GISService:
    """Business service governing geospatial data processing, GeoJSON transformation, and accessibility."""

    # Approximate North Eastern Region bounding box
    NER_BBOX = {
        "min_lat": 21.5,
        "max_lat": 29.5,
        "min_lng": 89.5,
        "max_lng": 97.5,
    }

    def __init__(
        self,
        db: Session,
        road_repo: Optional[RoadRepository] = None,
        district_repo: Optional[DistrictRepository] = None,
        incident_repo: Optional[IncidentRepository] = None,
    ) -> None:
        self.db = db
        self.road_repo = road_repo or RoadRepository(db)
        self.district_repo = district_repo or DistrictRepository(db)
        self.incident_repo = incident_repo or IncidentRepository(db)

    def validate_ner_bounds(self, lat: float, lng: float) -> bool:
        """Check if coordinates lie inside North Eastern Region bounding box."""
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            raise ValidationError(f"Invalid geographical coordinates: lat={lat}, lng={lng}")
        return (
            self.NER_BBOX["min_lat"] <= lat <= self.NER_BBOX["max_lat"]
            and self.NER_BBOX["min_lng"] <= lng <= self.NER_BBOX["max_lng"]
        )

    def get_road_segments_geojson(self) -> GeoJSONFeatureCollection:
        """Transform all road segments into a standard GeoJSON FeatureCollection."""
        segments = self.road_repo.get_all(limit=500)
        features: List[GeoJSONFeature] = []

        for seg in segments:
            # Coordinates in GeoJSON are [lng, lat]
            geojson_coords = [[p[1], p[0]] for p in seg.coordinates]
            
            feature = GeoJSONFeature(
                id=seg.id,
                geometry=GeoJSONGeometry(
                    type="LineString",
                    coordinates=geojson_coords,
                ),
                properties={
                    "segment_id": seg.id,
                    "segment_code": seg.segment_code,
                    "name": seg.name,
                    "highway_number": seg.highway_number,
                    "length_km": seg.length_km,
                    "current_status": seg.current_status,
                    "risk_score": seg.risk_score,
                    "is_critical_lifeline": seg.is_critical_lifeline,
                    "speed_limit_kmh": seg.speed_limit_kmh,
                },
            )
            features.append(feature)

        return GeoJSONFeatureCollection(features=features)

    def get_incidents_geojson(self) -> GeoJSONFeatureCollection:
        """Transform active incidents into a standard GeoJSON FeatureCollection."""
        incidents = self.incident_repo.get_active_incidents()
        features: List[GeoJSONFeature] = []

        for inc in incidents:
            feature = GeoJSONFeature(
                id=inc.id,
                geometry=GeoJSONGeometry(
                    type="Point",
                    coordinates=[inc.longitude, inc.latitude],
                ),
                properties={
                    "incident_id": inc.id,
                    "title": inc.title,
                    "category": inc.category,
                    "severity": inc.severity,
                    "status": inc.status,
                    "blocked_lanes": inc.blocked_lanes,
                    "passable_by_heavy_vehicles": inc.passable_by_heavy_vehicles,
                    "reported_at": inc.reported_at.isoformat() if inc.reported_at else None,
                },
            )
            features.append(feature)

        return GeoJSONFeatureCollection(features=features)

    def calculate_district_accessibility_index(self, district_id: int) -> DistrictAccessibilityScore:
        """
        Orchestrate accessibility score for a district:
        Score = 1.0 - (blocked_km / total_km * 0.7) - min(active_incidents * 0.05, 0.3)
        """
        district = self.district_repo.get_by_id(district_id)
        if not district:
            raise ValidationError(f"District {district_id} not found")

        segments = self.road_repo.get_by_district(district_id)
        total_km = sum(s.length_km for s in segments)
        blocked_km = sum(s.length_km for s in segments if s.current_status == RoadStatus.BLOCKED.value)
        open_count = sum(1 for s in segments if s.current_status == RoadStatus.OPEN.value)
        blocked_count = sum(1 for s in segments if s.current_status == RoadStatus.BLOCKED.value)

        active_incidents = self.incident_repo.get_by_district(district_id)
        active_inc_count = len([i for i in active_incidents if i.status in ["REPORTED", "ACTIVE", "CONFIRMED"]])

        # Accessibility score formula
        if total_km > 0:
            block_penalty = (blocked_km / total_km) * 0.7
        else:
            block_penalty = 0.0
            
        incident_penalty = min(active_inc_count * 0.05, 0.3)
        raw_score = 1.0 - block_penalty - incident_penalty
        score = round(max(0.0, min(1.0, raw_score)), 2)

        # Update district model record
        district.accessibility_score = score
        district.total_road_km = total_km
        district.blocked_road_km = blocked_km
        district.active_incidents_count = active_inc_count
        self.db.flush()

        status = "ACCESSIBLE"
        if score < 0.4:
            status = "SEVERELY_ISOLATED"
        elif score < 0.7:
            status = "VULNERABLE"

        return DistrictAccessibilityScore(
            district_id=district.id,
            district_name=district.name,
            state=district.state,
            accessibility_score=score,
            status=status,
            blocked_segments=blocked_count,
            open_segments=open_count,
            isolated_hubs=0,
        )
