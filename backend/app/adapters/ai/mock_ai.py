"""
Mock AI Integration Adapter for unit tests and deterministic offline demo mode.
Provides deterministic baseline calculations clearly marked with `is_fallback = True`.
DOES NOT replace or duplicate the AI teammate's production ML algorithms.
"""

from typing import List, Optional, Union
from app.adapters.ai.base import (
    ClassifiedIncidentResult,
    DelayEstimatorProtocol,
    EstimatedDelayResult,
    IncidentClassifierProtocol,
    RiskPredictorProtocol,
    SegmentRiskResult,
)
from app.schemas.enums import IncidentCategory, IncidentSeverity


class MockAIAdapter(
    IncidentClassifierProtocol,
    RiskPredictorProtocol,
    DelayEstimatorProtocol,
):
    """Deterministic test mock simulating the AI teammate's model outputs."""

    KEYWORD_MAPPINGS = {
        "landslide": (IncidentCategory.LANDSLIDE, IncidentSeverity.HIGH),
        "mudslide": (IncidentCategory.LANDSLIDE, IncidentSeverity.HIGH),
        "rockfall": (IncidentCategory.LANDSLIDE, IncidentSeverity.HIGH),
        "flood": (IncidentCategory.FLOOD, IncidentSeverity.HIGH),
        "waterlogging": (IncidentCategory.FLOOD, IncidentSeverity.MEDIUM),
        "submerged": (IncidentCategory.FLOOD, IncidentSeverity.CRITICAL),
        "bridge": (IncidentCategory.BRIDGE_DAMAGE, IncidentSeverity.CRITICAL),
        "collapse": (IncidentCategory.BRIDGE_DAMAGE, IncidentSeverity.CRITICAL),
        "pothole": (IncidentCategory.ROAD_DAMAGE, IncidentSeverity.LOW),
        "crack": (IncidentCategory.ROAD_DAMAGE, IncidentSeverity.MEDIUM),
        "subsidence": (IncidentCategory.ROAD_DAMAGE, IncidentSeverity.HIGH),
        "snow": (IncidentCategory.SNOWFALL_AVALANCHE, IncidentSeverity.MEDIUM),
        "avalanche": (IncidentCategory.SNOWFALL_AVALANCHE, IncidentSeverity.CRITICAL),
        "rain": (IncidentCategory.HEAVY_RAIN, IncidentSeverity.MEDIUM),
        "monsoon": (IncidentCategory.HEAVY_RAIN, IncidentSeverity.MEDIUM),
        "protest": (IncidentCategory.ROADBLOCK, IncidentSeverity.HIGH),
        "strike": (IncidentCategory.ROADBLOCK, IncidentSeverity.MEDIUM),
        "blockade": (IncidentCategory.ROADBLOCK, IncidentSeverity.HIGH),
        "accident": (IncidentCategory.ACCIDENT, IncidentSeverity.HIGH),
        "collision": (IncidentCategory.ACCIDENT, IncidentSeverity.HIGH),
        "repair": (IncidentCategory.CONSTRUCTION, IncidentSeverity.LOW),
        "widening": (IncidentCategory.CONSTRUCTION, IncidentSeverity.LOW),
    }

    async def classify_incident_text(self, text: str) -> ClassifiedIncidentResult:
        lower_text = text.lower()
        extracted_keywords: List[str] = []
        matched_category = IncidentCategory.ROAD_DAMAGE
        matched_severity = IncidentSeverity.MEDIUM
        confidence = 0.55

        for keyword, (cat, sev) in self.KEYWORD_MAPPINGS.items():
            if keyword in lower_text:
                extracted_keywords.append(keyword)
                matched_category = cat
                matched_severity = sev
                confidence = min(0.65 + 0.10 * len(extracted_keywords), 0.95)

        return ClassifiedIncidentResult(
            category=matched_category,
            severity=matched_severity,
            confidence=round(confidence, 2),
            extracted_keywords=extracted_keywords,
            is_fallback=True,
        )

    async def predict_segment_risk(
        self,
        segment_id: Union[str, int],
        rainfall_mm: float,
        active_incidents_count: int,
        historical_failure_rate: float,
        terrain_slope_deg: float,
    ) -> SegmentRiskResult:
        w_norm = min(rainfall_mm / 50.0, 1.0)
        i_active = min(active_incidents_count / 3.0, 1.0)
        f_hist = min(historical_failure_rate, 1.0)
        t_slope = min(terrain_slope_deg / 45.0, 1.0)
        h_prox = 0.3 if rainfall_mm > 20.0 else 0.1

        composite_risk = (
            0.25 * w_norm
            + 0.25 * i_active
            + 0.15 * f_hist
            + 0.15 * t_slope
            + 0.20 * h_prox
        )
        composite_risk = round(min(max(composite_risk, 0.05), 1.0), 2)

        if composite_risk >= 0.75:
            level = "CRITICAL"
        elif composite_risk >= 0.50:
            level = "HIGH"
        elif composite_risk >= 0.25:
            level = "MEDIUM"
        else:
            level = "LOW"

        recommendations = []
        if w_norm > 0.5:
            recommendations.append("High monsoon rainfall detected; exercise caution on hillside passes.")
        if i_active > 0:
            recommendations.append(f"{active_incidents_count} active incident(s) reported on this segment.")
        if composite_risk >= 0.75:
            recommendations.append("Severe risk: Reroute critical shipments via alternate corridor.")

        return SegmentRiskResult(
            segment_id=segment_id,
            risk_score=composite_risk,
            risk_level=level,
            contributing_factors={
                "weather_rainfall": round(w_norm, 2),
                "active_incidents": round(i_active, 2),
                "historical_failure": round(f_hist, 2),
                "terrain_slope": round(t_slope, 2),
            },
            recommendations=recommendations,
            is_fallback=True,
        )

    async def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float,
        segment_risk_scores: List[float],
        active_bottlenecks_count: int,
    ) -> EstimatedDelayResult:
        base_speed = max(base_speed_kmh, 10.0)
        nominal_hours = round(distance_km / base_speed, 2)

        avg_risk = sum(segment_risk_scores) / len(segment_risk_scores) if segment_risk_scores else 0.1
        speed_degradation = avg_risk * 0.40
        impaired_speed = base_speed * (1.0 - speed_degradation)
        slowdown_delay = max((distance_km / impaired_speed) - nominal_hours, 0.0)
        bottleneck_buffer = active_bottlenecks_count * 1.5

        total_delay = round(slowdown_delay + bottleneck_buffer, 2)
        total_expected = round(nominal_hours + total_delay, 2)

        return EstimatedDelayResult(
            nominal_duration_hours=nominal_hours,
            estimated_delay_hours=total_delay,
            total_expected_duration_hours=total_expected,
            bottleneck_buffer_hours=bottleneck_buffer,
            is_fallback=True,
        )
