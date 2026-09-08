"""
NEURoute AI Services — Travel Delay Estimator Module
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Estimates travel time and delays for road segments and trips:
- Normal travel time
- Expected impaired travel time
- Delay (minutes)
- Delay percentage
"""

from typing import Dict, Any, List, Optional


class DelayEstimator:
    """
    Travel delay estimation engine considering distance, base speed, impaired speed,
    road condition, active incidents, and road blockage status.
    """

    def __init__(self):
        pass

    def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float = 50.0,
        impaired_speed_kmh: Optional[float] = None,
        current_status: str = "OPEN",
        incident_severity: Optional[str] = None,
        bottleneck_clearance_minutes: float = 0.0,
        risk_score: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculate travel delay metrics.

        Returns:
            dict: {
                "normal_travel_minutes": int,
                "estimated_travel_minutes": int,
                "delay_minutes": int,
                "delay_percentage": float,
                "is_blocked": bool,
                "causes": list[str]
            }
        """
        # Input validation & sanitization
        dist = max(0.1, float(distance_km))
        base_speed = max(5.0, float(base_speed_kmh)) if base_speed_kmh else 50.0

        normal_travel_min = (dist / base_speed) * 60.0

        status_upper = (current_status or "OPEN").upper()
        is_blocked = status_upper == "BLOCKED"
        causes = []

        if is_blocked:
            causes.append("Road segment is completely BLOCKED due to severe disruption/landslide")
            # For a blocked segment, speed drops to near 0, imposing heavy clearance delay
            effective_speed = 5.0
            clearance_buffer = max(120.0, float(bottleneck_clearance_minutes) or 120.0)
        else:
            clearance_buffer = max(0.0, float(bottleneck_clearance_minutes))
            if impaired_speed_kmh is not None and float(impaired_speed_kmh) > 0:
                effective_speed = min(base_speed, max(5.0, float(impaired_speed_kmh)))
                if effective_speed < base_speed:
                    causes.append(f"Reduced travel speed ({effective_speed:.1f} km/h vs normal {base_speed:.1f} km/h)")
            else:
                # Calculate impaired speed from status & risk score
                if status_upper == "RISKY" or risk_score >= 0.60:
                    speed_factor = max(0.35, 1.0 - (0.5 * risk_score))
                    causes.append(f"High segment risk factor ({risk_score:.2f}) causing speed slowdown")
                elif status_upper == "UNKNOWN":
                    speed_factor = max(0.55, 1.0 - (0.35 * max(risk_score, 0.40)))
                    causes.append("Unknown road segment condition; applying conservative speed reduction")
                elif risk_score >= 0.30:
                    speed_factor = max(0.60, 1.0 - (0.3 * risk_score))
                else:
                    speed_factor = 1.0

                effective_speed = base_speed * speed_factor

        # Add clearance time if incident present
        if incident_severity and not is_blocked:
            sev_upper = incident_severity.upper()
            if sev_upper == "CRITICAL":
                clearance_buffer += 60.0
                causes.append("Critical active incident clearance delay")
            elif sev_upper == "HIGH":
                clearance_buffer += 30.0
                causes.append("High severity incident bottleneck")
            elif sev_upper == "MEDIUM":
                clearance_buffer += 15.0
                causes.append("Active incident bottleneck")

        estimated_travel_min = (dist / effective_speed) * 60.0 + clearance_buffer

        # Calculate delay and ensure non-negative
        delay_min = max(0.0, estimated_travel_min - normal_travel_min)

        if normal_travel_min > 0:
            delay_pct = (delay_min / normal_travel_min) * 100.0
        else:
            delay_pct = 0.0

        if not causes and delay_min <= 1.0:
            causes.append("Normal travel conditions, no delay anticipated")

        return {
            "normal_travel_minutes": int(round(normal_travel_min)),
            "estimated_travel_minutes": int(round(estimated_travel_min)),
            "delay_minutes": int(round(delay_min)),
            "delay_percentage": round(delay_pct, 2),
            "is_blocked": is_blocked,
            "causes": causes
        }


def estimate_travel_delay(
    distance_km: float,
    base_speed_kmh: float = 50.0,
    impaired_speed_kmh: Optional[float] = None,
    current_status: str = "OPEN",
    incident_severity: Optional[str] = None,
    bottleneck_clearance_minutes: float = 0.0,
    risk_score: float = 0.0
) -> Dict[str, Any]:
    """Helper function to estimate travel delay."""
    estimator = DelayEstimator()
    return estimator.estimate_delay(
        distance_km=distance_km,
        base_speed_kmh=base_speed_kmh,
        impaired_speed_kmh=impaired_speed_kmh,
        current_status=current_status,
        incident_severity=incident_severity,
        bottleneck_clearance_minutes=bottleneck_clearance_minutes,
        risk_score=risk_score
    )
