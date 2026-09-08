"""
NEURoute AI Services — Risk Predictor & Disruption Engine
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Implements multi-factor road-segment risk score calculation:
  R_seg = min(1.0, w1 * W_norm + w2 * H_prox + w3 * I_active + w4 * F_hist + w5 * T_slope)

Provides transparent, evidence-based explainable reasons and disruption prediction.
"""

from typing import Dict, Any, List, Optional

# Standard weights
W_WEATHER = 0.25
W_HAZARD = 0.25
W_INCIDENT = 0.30
W_HISTORICAL = 0.10
W_TREND = 0.10

SEVERITY_WEIGHTS = {
    "LOW": 0.25,
    "MEDIUM": 0.50,
    "HIGH": 0.80,
    "CRITICAL": 1.00
}


class RiskPredictor:
    """
    Multi-factor risk predictor and disruption scoring engine for road segments and corridors.
    """

    def __init__(self):
        pass

    def compute_weather_norm(
        self,
        rainfall_mm: float = 0.0,
        visibility_meters: float = 10000.0,
        weather_advisory: Optional[str] = None
    ) -> tuple[float, Optional[str]]:
        """
        Calculate normalized weather risk component W_norm in [0.0, 1.0].
        """
        w_score = 0.0
        reason = None

        # Rainfall factor
        if rainfall_mm >= 100.0:
            w_score += 0.90
            reason = f"Extreme rainfall detected ({rainfall_mm:.1f} mm)"
        elif rainfall_mm >= 50.0:
            w_score += 0.70
            reason = f"Heavy rainfall detected ({rainfall_mm:.1f} mm)"
        elif rainfall_mm >= 25.0:
            w_score += 0.45
            reason = f"Moderate rainfall recorded ({rainfall_mm:.1f} mm)"
        elif rainfall_mm > 5.0:
            w_score += 0.20

        # Visibility factor
        if visibility_meters < 500:
            w_score += 0.35
            if not reason:
                reason = f"Severe fog/low visibility ({visibility_meters:.0f} m)"
        elif visibility_meters < 2000:
            w_score += 0.20

        # Advisory keyword check
        if weather_advisory:
            adv_lower = weather_advisory.lower()
            if any(k in adv_lower for k in ["storm", "cyclone", "cloudburst", "rain", "monsoon", "hazard", "landslide", "flood"]):
                w_score += 0.35
                if not reason:
                    reason = f"Severe weather advisory: {weather_advisory}"

        w_norm = min(1.0, w_score)
        return w_norm, reason

    def compute_hazard_prox(
        self,
        hazard_type: Optional[str] = None,
        hazard_severity: str = "LOW",
        distance_km: float = 0.0
    ) -> tuple[float, Optional[str]]:
        """
        Calculate hazard proximity component H_prox in [0.0, 1.0].
        """
        if not hazard_type:
            return 0.0, None

        sev_factor = SEVERITY_WEIGHTS.get(hazard_severity.upper(), 0.30)
        # Decay with distance (max radius 10km)
        prox_decay = max(0.0, 1.0 - (distance_km / 10.0))
        h_prox = min(1.0, sev_factor * prox_decay)

        if h_prox > 0.10:
            h_name = hazard_type.replace("_", " ").title()
            reason = f"{h_name} zone nearby ({distance_km:.1f} km, {hazard_severity.upper()} severity)"
            return h_prox, reason

        return 0.0, None

    def compute_incident_active(
        self,
        active_incidents: Optional[List[Dict[str, Any]]] = None
    ) -> tuple[float, Optional[str]]:
        """
        Calculate active incident component I_active in [0.0, 1.0].
        """
        if not active_incidents:
            return 0.0, None

        max_i_score = 0.0
        primary_reason = None

        for inc in active_incidents:
            category = inc.get("category", "OTHER").upper()
            severity = inc.get("severity", "LOW").upper()
            distance_km = float(inc.get("distance_km", 0.0))
            status = inc.get("status", "ACTIVE").upper()

            if status in ["RESOLVED", "REJECTED"]:
                continue

            sev_factor = SEVERITY_WEIGHTS.get(severity, 0.50)

            # Direct on-segment vs proximity decay (max radius 5km)
            if distance_km <= 0.1:
                inc_score = min(1.0, sev_factor * 1.0)
                if severity in ["HIGH", "CRITICAL"]:
                    inc_score = max(inc_score, 0.90 if severity == "HIGH" else 1.0)
            else:
                prox_decay = max(0.0, 1.0 - (distance_km / 5.0))
                inc_score = min(1.0, sev_factor * prox_decay)

            if inc_score > max_i_score:
                max_i_score = inc_score
                cat_display = category.replace("_", " ").title()
                primary_reason = f"Active {cat_display} detected ({severity} severity, {distance_km:.1f} km away)"

        return max_i_score, primary_reason

    def predict_risk(
        self,
        segment_id: str,
        rainfall_mm: float = 0.0,
        visibility_meters: float = 10000.0,
        weather_advisory: Optional[str] = None,
        hazard_type: Optional[str] = None,
        hazard_severity: str = "LOW",
        hazard_distance_km: float = 0.0,
        active_incidents: Optional[List[Dict[str, Any]]] = None,
        historical_frequency: float = 0.10,
        trend: str = "STABLE"
    ) -> Dict[str, Any]:
        """
        Calculate road segment composite risk score, risk level, reasons, and disruption status.
        """
        reasons = []

        # Component 1: Weather (W_norm)
        w_norm, w_reason = self.compute_weather_norm(rainfall_mm, visibility_meters, weather_advisory)
        if w_reason and w_norm >= 0.20:
            reasons.append(w_reason)

        # Component 2: Hazard Proximity (H_prox)
        h_prox, h_reason = self.compute_hazard_prox(hazard_type, hazard_severity, hazard_distance_km)
        if h_reason and h_prox >= 0.20:
            reasons.append(h_reason)

        # Component 3: Active Incidents (I_active)
        i_active, i_reason = self.compute_incident_active(active_incidents)
        if i_reason and i_active >= 0.20:
            reasons.append(i_reason)

        # Component 4: Historical Frequency (F_hist)
        f_hist = min(1.0, max(0.0, float(historical_frequency)))
        if f_hist >= 0.50:
            reasons.append("High historical incident frequency recorded on segment")

        # Component 5: Trend Slope (T_slope)
        trend_upper = trend.upper()
        if trend_upper == "INCREASING":
            t_slope = 0.85
            reasons.append("Increasing risk trend observed")
        elif trend_upper == "DECREASING":
            t_slope = 0.15
        else:
            t_slope = 0.40  # STABLE

        # Composite Risk Formula
        risk_score = min(
            1.0,
            W_WEATHER * w_norm
            + W_HAZARD * h_prox
            + W_INCIDENT * i_active
            + W_HISTORICAL * f_hist
            + W_TREND * t_slope
        )

        risk_score = round(risk_score, 2)

        # Categorize Risk Level
        if risk_score >= 0.80:
            risk_level = "CRITICAL"
        elif risk_score >= 0.60:
            risk_level = "HIGH"
        elif risk_score >= 0.30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if not reasons:
            reasons.append("Normal operational conditions, no major environmental or physical hazards detected")

        # Disruption Prediction
        # A segment is disrupted if risk_score >= 0.70 or if there is a severe active incident (e.g. blockage/landslide)
        is_disrupted = risk_score >= 0.70
        if active_incidents:
            for inc in active_incidents:
                if inc.get("severity", "").upper() in ["HIGH", "CRITICAL"] and inc.get("status", "").upper() not in ["RESOLVED", "REJECTED"]:
                    is_disrupted = True
                    break

        return {
            "segment_id": segment_id,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "is_disrupted": is_disrupted,
            "components": {
                "weather_norm": round(w_norm, 2),
                "hazard_prox": round(h_prox, 2),
                "incident_active": round(i_active, 2),
                "historical_freq": round(f_hist, 2),
                "trend_slope": round(t_slope, 2)
            }
        }


def predict_road_risk(
    segment_id: str,
    rainfall_mm: float = 0.0,
    visibility_meters: float = 10000.0,
    weather_advisory: Optional[str] = None,
    hazard_type: Optional[str] = None,
    hazard_severity: str = "LOW",
    hazard_distance_km: float = 0.0,
    active_incidents: Optional[List[Dict[str, Any]]] = None,
    historical_frequency: float = 0.10,
    trend: str = "STABLE"
) -> Dict[str, Any]:
    """Helper function to predict road risk."""
    predictor = RiskPredictor()
    return predictor.predict_risk(
        segment_id=segment_id,
        rainfall_mm=rainfall_mm,
        visibility_meters=visibility_meters,
        weather_advisory=weather_advisory,
        hazard_type=hazard_type,
        hazard_severity=hazard_severity,
        hazard_distance_km=hazard_distance_km,
        active_incidents=active_incidents,
        historical_frequency=historical_frequency,
        trend=trend
    )
