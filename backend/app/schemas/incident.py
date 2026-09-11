from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.schemas.enums import IncidentCategory, IncidentSeverity, IncidentStatus


class IncidentBase(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    category: IncidentCategory
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    road_segment_id: Optional[Union[str, int]] = None
    district_id: Optional[Union[str, int]] = None
    blocked_lanes: int = Field(default=1, ge=0)
    passable_by_heavy_vehicles: bool = True
    estimated_clearance_hours: Optional[float] = Field(None, ge=0.0)


class IncidentCreate(IncidentBase):
    reported_by_user_id: Optional[Union[str, int]] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[IncidentCategory] = None
    severity: Optional[IncidentSeverity] = None
    description: Optional[str] = None
    road_segment_id: Optional[Union[str, int]] = None
    blocked_lanes: Optional[int] = None
    passable_by_heavy_vehicles: Optional[bool] = None
    estimated_clearance_hours: Optional[float] = None


class IncidentStatusTransition(BaseModel):
    status: IncidentStatus
    resolution_notes: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status_enum(cls, v: Any) -> Any:
        if isinstance(v, str):
            v_upper = v.strip().upper()
            if v_upper in ["CLEARING", "UNDER_INVESTIGATION"]:
                return IncidentStatus.INVESTIGATING
            if v_upper in IncidentStatus.__members__:
                return IncidentStatus[v_upper]
            for member in IncidentStatus:
                if member.value == v_upper:
                    return member
        return v


class IncidentResponse(IncidentBase):
    id: Union[str, int]
    status: IncidentStatus
    reported_by_user_id: Optional[Union[str, int]] = None
    resolution_notes: Optional[str] = None
    reported_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Dual-case compatibility fields for frontend clients
    highway: Optional[str] = None
    locationName: Optional[str] = None
    state: Optional[str] = None
    type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    reportedAt: Optional[str] = None
    aiClassification: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_dual_case(self) -> "IncidentResponse":
        sid = str(self.id).lower()
        if not self.title:
            if "snp" in sid:
                self.title = "Sonapur Mudslide & Heavy Slope Failure"
                self.highway = "NH-06"
                self.locationName = "NH-06 Sonapur Tunnel Section"
                self.state = "Meghalaya"
            elif "kzr" in sid:
                self.title = "Kaziranga Brahmaputra Water Overwash"
                self.highway = "NH-27"
                self.locationName = "NH-27 Bagori Wildlife Corridor"
                self.state = "Assam"
            elif "umi" in sid:
                self.title = "Umiam Gorge Dense Fog & Hydroplaning"
                self.highway = "NH-06"
                self.locationName = "NH-06 Umiam Ridge Ghat Section"
                self.state = "Meghalaya"
            elif "thb" in sid:
                self.title = "Thoubal Scour & Shoulder Scouring"
                self.highway = "NH-102"
                self.locationName = "NH-102 Thoubal Bridge Approach"
                self.state = "Manipur"
            else:
                self.title = f"Corridor Obstruction — {self.category.value if hasattr(self.category, 'value') else str(self.category)}"

        if not self.highway:
            if "snp" in sid or "umi" in sid:
                self.highway = "NH-06"
            elif "kzr" in sid:
                self.highway = "NH-27"
            elif "thb" in sid:
                self.highway = "NH-102"
            else:
                self.highway = "NH-06"

        if not self.locationName:
            self.locationName = self.title or "NER Mountain Corridor"

        if not self.state:
            if "snp" in sid or "umi" in sid:
                self.state = "Meghalaya"
            elif "thb" in sid:
                self.state = "Manipur"
            else:
                self.state = "Assam"

        if not self.type:
            cat_val = self.category.value if hasattr(self.category, "value") else str(self.category)
            self.type = cat_val.lower()

        if self.lat is None:
            self.lat = self.latitude
        if self.lng is None:
            self.lng = self.longitude

        if not self.reportedAt:
            self.reportedAt = (self.reported_at or datetime.now()).isoformat()

        if not self.aiClassification:
            clearance_hrs = self.estimated_clearance_hours or (48.0 if self.severity == IncidentSeverity.CRITICAL else 6.0 if self.severity == IncidentSeverity.HIGH else 2.5)
            detour = "Umrangso Relief Lifeline Bypass (NH-27 / NH-627)" if ("snp" in sid or self.category == IncidentCategory.LANDSLIDE) else "Jowai-Khanduli Ridge Road" if "umi" in sid else "NH-27 Bagori Wildlife Relief Bypass"
            conf = 0.94 if self.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH] else 0.88
            self.aiClassification = {
                "confidence": conf,
                "predictedClearanceHours": clearance_hrs,
                "suggestedDetourName": detour,
                "hazardCategory": self.category.value if hasattr(self.category, "value") else str(self.category),
                "provenance": "SIMULATED AI Risk Predictor Engine (SIH 26002)"
            }

        return self



class FieldReportSync(BaseModel):
    client_report_uuid: str
    title: str
    category: IncidentCategory
    severity: IncidentSeverity
    description: Optional[str] = None
    latitude: float
    longitude: float
    captured_at: datetime
    photos: List[str] = []
