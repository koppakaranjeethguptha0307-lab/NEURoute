"""
NEURoute AI Services — Route Optimizer Module
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Multi-criteria route optimization and selection support engine:
- Evaluates candidate routes for risk, travel time, delay, and blocked segment status.
- Supports recommendation strategies: SAFEST, FASTEST, PRIORITY_LIFELINE.
- Dynamically increases safety weighting to 0.50 for CRITICAL cargo priority shipments.
- Provides transparent explainable recommendation rationale.
"""

from typing import Dict, Any, List, Optional


class RouteOptimizer:
    """
    Multi-criteria route optimization engine comparing candidate routes for cargo logistics.
    """

    def __init__(self):
        pass

    def evaluate_route_candidate(
        self,
        route_id: str,
        route_name: str,
        distance_km: float,
        base_travel_time_minutes: float,
        composite_risk_score: float,
        segments_info: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a single candidate route's metrics.
        """
        risk = min(1.0, max(0.0, float(composite_risk_score)))
        travel_min = max(1.0, float(base_travel_time_minutes))

        has_blocked_segment = False
        blocked_segment_names = []
        risky_segment_count = 0
        unknown_segment_count = 0

        if segments_info:
            for seg in segments_info:
                status = seg.get("status", "OPEN").upper()
                name = seg.get("name", seg.get("id", "Unknown Segment"))
                if status == "BLOCKED":
                    has_blocked_segment = True
                    blocked_segment_names.append(name)
                elif status == "RISKY" or seg.get("risk_score", 0.0) >= 0.60:
                    risky_segment_count += 1
                elif status == "UNKNOWN":
                    unknown_segment_count += 1

        # Calculate estimated delay
        if has_blocked_segment:
            delay_minutes = 120 + int(risk * 60)
        else:
            delay_minutes = int(risk * 30) + (risky_segment_count * 15) + (unknown_segment_count * 10)

        total_estimated_minutes = int(round(travel_min + delay_minutes))

        return {
            "route_id": route_id,
            "route_name": route_name,
            "distance_km": round(distance_km, 1),
            "risk_score": round(risk, 2),
            "travel_time_minutes": int(round(travel_min)),
            "estimated_travel_minutes": total_estimated_minutes,
            "delay_minutes": delay_minutes,
            "has_blocked_segment": has_blocked_segment,
            "blocked_segments": blocked_segment_names,
            "risky_segment_count": risky_segment_count,
            "unknown_segment_count": unknown_segment_count
        }

    def optimize_routes(
        self,
        candidate_routes: List[Dict[str, Any]],
        cargo_priority: str = "STANDARD",
        preference: str = "SAFEST"
    ) -> Dict[str, Any]:
        """
        Compare candidate routes and select optimal route.

        Args:
            candidate_routes: List of dicts representing routes.
            cargo_priority: STANDARD, HIGH, CRITICAL.
            preference: SAFEST, FASTEST, PRIORITY_LIFELINE.

        Returns:
            dict: {
                "recommended_route_id": str,
                "recommendation_type": str,
                "routes": list[dict],
                "reason": str
            }
        """
        if not candidate_routes:
            return {
                "recommended_route_id": None,
                "recommendation_type": preference.upper(),
                "routes": [],
                "reason": "No candidate routes provided for optimization."
            }

        evaluated_routes = []
        for r in candidate_routes:
            eval_r = self.evaluate_route_candidate(
                route_id=r.get("route_id", r.get("id", "route_unknown")),
                route_name=r.get("route_name", r.get("name", "Unnamed Route")),
                distance_km=r.get("distance_km", r.get("total_distance_km", 10.0)),
                base_travel_time_minutes=r.get("travel_time_minutes", r.get("estimated_time_min", 30.0)),
                composite_risk_score=r.get("risk_score", r.get("composite_risk_score", 0.10)),
                segments_info=r.get("segments", [])
            )
            evaluated_routes.append(eval_r)

        priority_upper = (cargo_priority or "STANDARD").upper()
        pref_upper = (preference or "SAFEST").upper()

        # Dynamic weighting formula
        if priority_upper == "CRITICAL" or pref_upper == "PRIORITY_LIFELINE":
            w_safety = 0.50
            w_time = 0.50
            rec_type = "PRIORITY_LIFELINE"
        elif pref_upper == "FASTEST":
            w_safety = 0.20
            w_time = 0.80
            rec_type = "FASTEST"
        else:
            w_safety = 0.70
            w_time = 0.30
            rec_type = "SAFEST"

        # Find min/max for normalization
        max_time = max(r["estimated_travel_minutes"] for r in evaluated_routes) or 1.0

        for r in evaluated_routes:
            norm_risk = r["risk_score"]
            norm_time = r["estimated_travel_minutes"] / max_time

            # Penalty score for blocked segments
            blocked_penalty = 10.0 if r["has_blocked_segment"] else 0.0
            # Small conservative penalty for unknown segments
            unknown_penalty = 0.20 * r.get("unknown_segment_count", 0)

            # Score = lower is better
            r["composite_score"] = round(
                (w_safety * norm_risk) + (w_time * norm_time) + blocked_penalty + unknown_penalty,
                3
            )

        # Sort routes by composite score (lowest cost first)
        sorted_routes = sorted(evaluated_routes, key=lambda x: x["composite_score"])
        best_route = sorted_routes[0]

        # Generate explainable rationale
        reasons = []
        if best_route["has_blocked_segment"]:
            reasons.append(f"All available routes contain blocked segments; selected {best_route['route_name']} as best available option.")
        else:
            blocked_others = [r["route_name"] for r in sorted_routes if r["has_blocked_segment"]]
            if blocked_others:
                reasons.append(f"Recommends {best_route['route_name']} because it avoids blocked route(s): {', '.join(blocked_others)}.")

        if priority_upper == "CRITICAL":
            reasons.append(f"Applied CRITICAL cargo safety weighting (0.50 safety / 0.50 time). Route has a low risk score of {best_route['risk_score']}.")
        else:
            reasons.append(f"Route offers lowest composite cost with risk score {best_route['risk_score']} and travel time {best_route['estimated_travel_minutes']} mins.")

        explanation = " ".join(reasons)

        return {
            "recommended_route_id": best_route["route_id"],
            "recommendation_type": rec_type,
            "routes": sorted_routes,
            "reason": explanation
        }


def optimize_routes(
    candidate_routes: List[Dict[str, Any]],
    cargo_priority: str = "STANDARD",
    preference: str = "SAFEST"
) -> Dict[str, Any]:
    """Helper function to optimize routes."""
    optimizer = RouteOptimizer()
    return optimizer.optimize_routes(
        candidate_routes=candidate_routes,
        cargo_priority=cargo_priority,
        preference=preference
    )
