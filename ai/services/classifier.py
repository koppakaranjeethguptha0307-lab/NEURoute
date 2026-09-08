"""
NEURoute AI Services — Incident Classifier Module
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Converts unstructured incident/field-report text into structured classifications.
Predicts category, severity, and confidence score.
"""

import re
from typing import Dict, Any

# Canonical Database Enums (from schema.sql)
VALID_CATEGORIES = [
    "LANDSLIDE",
    "FLOOD",
    "ROAD_DAMAGE",
    "BRIDGE_ISSUE",
    "HEAVY_RAINFALL",
    "TRAFFIC_CONGESTION",
    "ROAD_BLOCKAGE",
    "OTHER"
]

VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# Keyword dictionary for category detection with weights
CATEGORY_PATTERNS = {
    "LANDSLIDE": [
        (r"\blandslide(s)?\b", 0.95),
        (r"\bmudslide(s)?\b", 0.95),
        (r"\brockfall(s)?\b", 0.90),
        (r"\bslip(s)?\b", 0.70),
        (r"\bhill\s+collapse\b", 0.90),
        (r"\bdebris\s+slide\b", 0.85),
    ],
    "FLOOD": [
        (r"\bflood(ing|s)?\b", 0.95),
        (r"\binundat(ed|ion)\b", 0.90),
        (r"\bsubmerged\b", 0.90),
        (r"\bwaterlogg(ed|ing)\b", 0.85),
        (r"\boverflow(ing)?\b", 0.80),
        (r"\briver\s+breach\b", 0.90),
    ],
    "BRIDGE_ISSUE": [
        (r"\bbridge\b", 0.80),
        (r"\bculvert\b", 0.80),
        (r"\bviaduct\b", 0.80),
        (r"\bspan\s+collapse\b", 0.95),
        (r"\bwashout\b", 0.85),
    ],
    "HEAVY_RAINFALL": [
        (r"\bdownpour\b", 0.90),
        (r"\bcloudburst\b", 0.95),
        (r"\btorrential\s+rain\b", 0.95),
        (r"\bheavy\s+rain(fall)?\b", 0.90),
        (r"\bmonsoon\s+deluge\b", 0.85),
    ],
    "ROAD_BLOCKAGE": [
        (r"\bblock(ed|ade|ing)\b", 0.85),
        (r"\bbarricad(ed|e)\b", 0.85),
        (r"\bcut\s+off\b", 0.85),
        (r"\bimpassable\b", 0.90),
        (r"\bno\s+movement\b", 0.80),
        (r"\bstranded\b", 0.75),
    ],
    "TRAFFIC_CONGESTION": [
        (r"\btraffic\s+jam\b", 0.90),
        (r"\bgridlock\b", 0.90),
        (r"\bcongestion\b", 0.85),
        (r"\bslow\s+traffic\b", 0.75),
        (r"\bqueue\b", 0.70),
        (r"\bsnarled\b", 0.80),
    ],
    "ROAD_DAMAGE": [
        (r"\bpothole(s)?\b", 0.85),
        (r"\bcrack(s)?\b", 0.75),
        (r"\berosion\b", 0.85),
        (r"\bcave-in\b", 0.90),
        (r"\btarmac\s+damage\b", 0.85),
        (r"\bsinkhole\b", 0.95),
        (r"\badverse\s+road\s+condition\b", 0.80),
    ]
}

# Severity indicator signals
SEVERITY_PATTERNS = {
    "CRITICAL": [
        (r"\bcompletely\s+blocked\b", 0.90),
        (r"\btotal\s+collapse\b", 0.95),
        (r"\bwashed\s+away\b", 0.95),
        (r"\bcut\s+off\b", 0.85),
        (r"\bcritical\b", 0.85),
        (r"\bfatal(ity)?\b", 0.95),
        (r"\bemergency\b", 0.80),
        (r"\bimpassable\b", 0.85),
        (r"\bsevere\s+damage\b", 0.85),
    ],
    "HIGH": [
        (r"\bheavy\b", 0.80),
        (r"\bmajor\b", 0.80),
        (r"\bblocking\b", 0.75),
        (r"\bhigh\s+risk\b", 0.80),
        (r"\bextensiv(e|ely)\b", 0.80),
        (r"\bserious\b", 0.75),
        (r"\bdangerous\b", 0.75),
    ],
    "MEDIUM": [
        (r"\bmoderate\b", 0.80),
        (r"\bpartial(ly)?\b", 0.75),
        (r"\bone\s+lane\b", 0.80),
        (r"\bslow\b", 0.70),
        (r"\bminor\s+delay\b", 0.70),
        (r"\bcaution\b", 0.70),
    ],
    "LOW": [
        (r"\bslight\b", 0.80),
        (r"\bminor\b", 0.80),
        (r"\bsmall\b", 0.75),
        (r"\bclearing\b", 0.75),
        (r"\bpassing\b", 0.70),
    ]
}


class IncidentClassifier:
    """
    NLP and rule-based classifier for field incident reports.
    Categorizes text into canonical incident categories and assigns severity & confidence.
    """

    def __init__(self):
        pass

    def classify(self, text: str) -> Dict[str, Any]:
        """
        Classify incident report text.

        Returns:
            dict: {
                "category": str,
                "severity": str,
                "confidence": float
            }
        """
        if not text or not isinstance(text, str) or not text.strip():
            return {
                "category": "OTHER",
                "severity": "LOW",
                "confidence": 0.50
            }

        norm_text = text.lower().strip()

        # 1. Category Detection
        category_scores: Dict[str, float] = {}

        for cat, patterns in CATEGORY_PATTERNS.items():
            max_score = 0.0
            for pattern, weight in patterns:
                if re.search(pattern, norm_text):
                    if weight > max_score:
                        max_score = weight
            if max_score > 0:
                category_scores[cat] = max_score

        # Determine predicted category
        if category_scores:
            predicted_category = max(category_scores.items(), key=lambda x: x[1])[0]
            category_confidence = category_scores[predicted_category]
        else:
            predicted_category = "OTHER"
            category_confidence = 0.45

        # Special priority handling if bridge + damage/collapse
        if "bridge" in norm_text or "culvert" in norm_text:
            if re.search(r"\b(collapse|damaged|broken|washed)\b", norm_text):
                predicted_category = "BRIDGE_ISSUE"
                category_confidence = max(category_confidence, 0.90)

        # 2. Severity Detection
        severity_scores: Dict[str, float] = {}
        for sev, patterns in SEVERITY_PATTERNS.items():
            for pattern, weight in patterns:
                if re.search(pattern, norm_text):
                    severity_scores[sev] = max(severity_scores.get(sev, 0.0), weight)

        if "CRITICAL" in severity_scores:
            predicted_severity = "CRITICAL"
        elif "HIGH" in severity_scores:
            predicted_severity = "HIGH"
        elif "MEDIUM" in severity_scores:
            predicted_severity = "MEDIUM"
        elif "LOW" in severity_scores:
            predicted_severity = "LOW"
        else:
            # Default fallback severity based on category
            if predicted_category in ["LANDSLIDE", "FLOOD", "BRIDGE_ISSUE"]:
                predicted_severity = "HIGH"
            elif predicted_category in ["ROAD_BLOCKAGE", "HEAVY_RAINFALL"]:
                predicted_severity = "MEDIUM"
            else:
                predicted_severity = "LOW"

        # Final confidence calculation (bounded 0.0 to 1.0)
        confidence = round(min(1.0, max(0.40, category_confidence)), 2)

        return {
            "category": predicted_category,
            "severity": predicted_severity,
            "confidence": confidence
        }


def classify_incident(text: str) -> Dict[str, Any]:
    """Helper function to classify incident text."""
    classifier = IncidentClassifier()
    return classifier.classify(text)
