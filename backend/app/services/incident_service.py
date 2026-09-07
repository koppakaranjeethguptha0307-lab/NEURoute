"""
Incident Business Service.
Handles incident lifecycle transitions, road segment binding, operational impact calculations,
and downstream alert event triggers.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BusinessRuleError,
    ResourceNotFoundError,
    ValidationError,
)
from app.core.logging import logger
from app.models.incident import Incident
from app.models.road import RoadSegment
from app.repositories.incident_repository import IncidentRepository
from app.repositories.road_repository import RoadRepository
from app.schemas.enums import (
    AlertSeverity,
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    RoadStatus,
)
from app.schemas.incident import IncidentCreate, IncidentStatusTransition, IncidentUpdate
from app.services.alert_service import AlertService


class IncidentService:
    """Business service governing incident reporting, road impact calculations, and alert triggers."""

    VALID_TRANSITIONS = {
        IncidentStatus.REPORTED: {IncidentStatus.INVESTIGATING, IncidentStatus.CONFIRMED, IncidentStatus.ACTIVE, IncidentStatus.RESOLVED},
        IncidentStatus.INVESTIGATING: {IncidentStatus.CONFIRMED, IncidentStatus.ACTIVE, IncidentStatus.RESOLVED},
        IncidentStatus.CONFIRMED: {IncidentStatus.ACTIVE, IncidentStatus.RESOLVED},
        IncidentStatus.ACTIVE: {IncidentStatus.RESOLVED},
        IncidentStatus.RESOLVED: {IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING},  # Re-opening allowed
    }

    def __init__(
        self,
        db: Session,
        incident_repo: Optional[IncidentRepository] = None,
        road_repo: Optional[RoadRepository] = None,
        alert_service: Optional[AlertService] = None,
    ) -> None:
        self.db = db
        self.incident_repo = incident_repo or IncidentRepository(db)
        self.road_repo = road_repo or RoadRepository(db)
        self.alert_service = alert_service or AlertService(db)

    def get_incident(self, incident_id: int) -> Incident:
        """Fetch incident by primary key or raise ResourceNotFoundError."""
        incident = self.incident_repo.get_by_id(incident_id)
        if not incident:
            raise ResourceNotFoundError("Incident", incident_id)
        return incident

    def list_incidents(
        self,
        active_only: bool = False,
        category: Optional[IncidentCategory] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Incident]:
        """List incidents with optional filters."""
        if active_only:
            return self.incident_repo.get_active_incidents()
        if category:
            return self.incident_repo.get_by_category(category.value)
        return self.incident_repo.get_all(skip=skip, limit=limit)

    def report_incident(self, data: IncidentCreate) -> Incident:
        """
        Report a new incident, bind to road segment, evaluate roadway impact,
        and trigger operational alerts.
        """
        self._validate_coordinates(data.latitude, data.longitude)

        # Spatial binding to closest road segment if not provided
        road_segment = None
        if data.road_segment_id:
            road_segment = self.road_repo.get_by_id(data.road_segment_id)
        if not road_segment:
            road_segment = self._find_nearest_road_segment(data.latitude, data.longitude)

        incident = Incident(
            title=data.title,
            category=data.category.value,
            severity=data.severity.value,
            status=IncidentStatus.REPORTED.value,
            description=data.description,
            latitude=data.latitude,
            longitude=data.longitude,
            road_segment_id=road_segment.id if road_segment else None,
            district_id=data.district_id or (road_segment.district_id if road_segment else None),
            blocked_lanes=data.blocked_lanes,
            passable_by_heavy_vehicles=data.passable_by_heavy_vehicles,
            estimated_clearance_hours=data.estimated_clearance_hours,
            reported_by_user_id=data.reported_by_user_id,
        )

        self.incident_repo.create(incident)
        
        # Calculate impact on the road segment
        if road_segment:
            self._update_road_segment_status(road_segment)

        # Trigger downstream operational alert
        self._trigger_incident_alert(incident, road_segment)

        self.db.commit()
        self.db.refresh(incident)

        logger.info(
            f"Incident '{incident.title}' reported ({incident.category}, {incident.severity}) on segment {incident.road_segment_id}",
            extra={"service": "incident_service", "operation": "CREATE", "entity_id": incident.id}
        )
        return incident

    def transition_status(self, incident_id: int, transition: IncidentStatusTransition) -> Incident:
        """
        Execute incident status transition and update road operational status.
        """
        incident = self.get_incident(incident_id)
        current_status = IncidentStatus(incident.status)
        target_status = transition.status

        allowed_targets = self.VALID_TRANSITIONS.get(current_status, set())
        if target_status not in allowed_targets:
            raise BusinessRuleError(
                f"Invalid incident transition: Cannot transition from '{current_status.value}' to '{target_status.value}'. "
                f"Allowed: {[s.value for s in allowed_targets]}"
            )

        now = datetime.now(timezone.utc)
        incident.status = target_status.value

        if target_status == IncidentStatus.RESOLVED:
            incident.resolved_at = now
            if transition.resolution_notes:
                incident.resolution_notes = transition.resolution_notes
        elif target_status in [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING]:
            incident.resolved_at = None

        self.db.flush()

        # Re-evaluate road segment impact
        if incident.road_segment_id:
            road_segment = self.road_repo.get_by_id(incident.road_segment_id)
            if road_segment:
                self._update_road_segment_status(road_segment)

        self.db.commit()
        self.db.refresh(incident)

        logger.info(
            f"Incident '{incident.id}' transitioned from {current_status.value} to {target_status.value}",
            extra={"service": "incident_service", "operation": "STATUS_TRANSITION", "entity_id": incident.id}
        )
        return incident

    def _update_road_segment_status(self, road_segment: RoadSegment) -> None:
        """Calculate and apply road segment status based on active incidents."""
        active_incidents = self.incident_repo.get_by_road_segment(road_segment.id, active_only=True)
        
        if not active_incidents:
            road_segment.current_status = RoadStatus.OPEN.value
            road_segment.risk_score = 0.05
            return

        # Check for blocking conditions
        has_blockage = any(
            inc.severity == IncidentSeverity.CRITICAL.value
            or not inc.passable_by_heavy_vehicles
            or (inc.category in [IncidentCategory.LANDSLIDE.value, IncidentCategory.FLOOD.value, IncidentCategory.BRIDGE_DAMAGE.value] and inc.blocked_lanes >= 2)
            for inc in active_incidents
        )

        if has_blockage:
            road_segment.current_status = RoadStatus.BLOCKED.value
            road_segment.risk_score = 0.95
        else:
            road_segment.current_status = RoadStatus.RISKY.value
            max_severity = max(inc.severity for inc in active_incidents)
            road_segment.risk_score = 0.65 if max_severity == IncidentSeverity.HIGH.value else 0.40

    def _trigger_incident_alert(self, incident: Incident, road_segment: Optional[RoadSegment]) -> None:
        """Generate operational alerts based on incident severity."""
        severity_map = {
            IncidentSeverity.CRITICAL.value: AlertSeverity.CRITICAL,
            IncidentSeverity.HIGH.value: AlertSeverity.WARNING,
            IncidentSeverity.MEDIUM.value: AlertSeverity.INFORMATIONAL,
            IncidentSeverity.LOW.value: AlertSeverity.INFORMATIONAL,
        }
        alert_sev = severity_map.get(incident.severity, AlertSeverity.INFORMATIONAL)
        
        loc_desc = road_segment.name if road_segment else f"Lat: {incident.latitude:.4f}, Lng: {incident.longitude:.4f}"
        
        self.alert_service.create_alert(
            title=f"Road Incident Alert: {incident.category} on {loc_desc}",
            message=f"{incident.severity} severity incident: {incident.title}. {incident.description or ''}",
            severity=alert_sev,
            category="ROAD_DISRUPTION",
            entity_type="Incident",
            entity_id=incident.id,
            metadata={"latitude": incident.latitude, "longitude": incident.longitude, "segment_id": incident.road_segment_id},
        )

    def _find_nearest_road_segment(self, lat: float, lng: float) -> Optional[RoadSegment]:
        """Find the geographically nearest road segment in the network."""
        all_segments = self.road_repo.get_all(limit=200)
        if not all_segments:
            return None

        def dist(seg: RoadSegment) -> float:
            mid_lat = (seg.start_lat + seg.end_lat) / 2.0
            mid_lng = (seg.start_lng + seg.end_lng) / 2.0
            return (lat - mid_lat) ** 2 + (lng - mid_lng) ** 2

        return min(all_segments, key=dist)

    def _validate_coordinates(self, lat: float, lng: float) -> None:
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            raise ValidationError(f"Invalid incident coordinates: lat={lat}, lng={lng}")
