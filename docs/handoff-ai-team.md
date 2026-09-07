# Handoff Contract: AI / ML Intelligence Layer

**Target Audience:** AI / ML Teammate (Incident NLP Classifier, Multi-Factor Segment Risk Predictor, Terrain/Bottleneck Delay Estimator, Route Optimizer)  
**Author:** Backend Application Core Engineer  
**Status:** READY FOR MODEL INJECTION  

---

## 1. Overview & Architectural Boundaries

In accordance with SIH26002 project architecture and modular boundaries:

1. **Backend Application Core Contains No ML Code**: The backend core has zero training routines, model weights, feature engineering pipelines, algorithmic heuristics, or accuracy claims (satisfying project rules 10 and 25).
2. **Adapter Delegation Architecture**: `AIIntegrationAdapter` in `backend/app/adapters/ai/ai_adapter.py` acts as a pure integration boundary. It implements three standard Python `Protocol` interfaces and delegates execution directly to injected service instances.
3. **Deterministic Fallback**: When no AI model implementation is injected (or when `MOCK_DATA_MODE=True`), calls fall back to `MockAIAdapter` in `backend/app/adapters/ai/mock_ai.py`. Every mock response is explicitly stamped with `is_fallback: True`. Real AI implementations must return `is_fallback: False`.

```
┌────────────────────────────────────────────────────────┐
│                   Backend Core                         │
│  (RouteOrchestrator / IncidentService / RiskService)   │
└──────────────────────────┬─────────────────────────────┘
                           │ calls Protocol
                           ▼
┌────────────────────────────────────────────────────────┐
│                AIIntegrationAdapter                    │
│   (backend/app/adapters/ai/ai_adapter.py)              │
└──────────────┬──────────────────────────┬──────────────┘
               │ if injected              │ if None / error
               ▼                          ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│   Real AI Implementations    │ │     MockAIAdapter     │
│ (Owned by AI Teammate)       │ │  (Fallback / Testing) │
│ - IncidentClassifier         │ │  `is_fallback: True`  │
│ - RiskPredictor              │ └───────────────────────┘
│ - DelayEstimator             │
│ `is_fallback: False`         │
└──────────────────────────────┘
```

---

## 2. AI Service Protocols & Type Contracts

All AI service protocols and return DTO models are defined in `backend/app/adapters/ai/base.py`.

### 2.1 `IncidentClassifierProtocol`

Processes unstructured citizen and field reporter descriptions into structured categories and severities.

```python
class IncidentClassifierProtocol(Protocol):
    async def classify_incident_text(self, text: str) -> ClassifiedIncidentResult:
        """
        Classifies freeform incident text into a category, severity, confidence,
        and extracted keywords.
        """
        ...
```

#### Input
- `text: str`: Raw text report (e.g., `"Massive landslide near Sonapur tunnel, NH06 completely blocked."`).

#### Output Model: `ClassifiedIncidentResult`
```python
class ClassifiedIncidentResult(BaseModel):
    category: IncidentCategory      # Enum (e.g., LANDSLIDE, FLOOD, ROAD_DAMAGE, etc.)
    severity: IncidentSeverity      # Enum (LOW, MEDIUM, HIGH, CRITICAL)
    confidence: float               # Confidence score between 0.0 and 1.0
    extracted_keywords: List[str]   # List of identified domain keywords
    is_fallback: bool = False       # MUST be False for real AI implementations
```

---

### 2.2 `RiskPredictorProtocol`

Evaluates composite environmental and terrain failure risk for a specific road corridor segment.

```python
class RiskPredictorProtocol(Protocol):
    async def predict_segment_risk(
        self,
        segment_id: int,
        rainfall_mm: float,
        active_incidents_count: int,
        historical_failure_rate: float,
        terrain_slope_deg: float,
    ) -> SegmentRiskResult:
        """
        Predicts vulnerability and safety risk score for a road segment.
        """
        ...
```

#### Inputs
- `segment_id: int`: Primary key identifier of the `RoadSegment`.
- `rainfall_mm: float`: 24-hour rainfall observation/forecast in millimeters.
- `active_incidents_count: int`: Number of unresolved incidents currently mapped to this segment.
- `historical_failure_rate: float`: Historical landslide/blockage frequency ratio (0.0 to 1.0).
- `terrain_slope_deg: float`: Average terrain incline angle in degrees (0.0 to 90.0).

#### Output Model: `SegmentRiskResult`
```python
class SegmentRiskResult(BaseModel):
    segment_id: int
    risk_score: float                   # Normalized composite risk [0.0 - 1.0]
    risk_level: str                     # "LOW", "MEDIUM", "HIGH", or "CRITICAL"
    contributing_factors: Dict[str, float]  # Feature attribution (e.g., {"rainfall": 0.8, "slope": 0.6})
    recommendations: List[str]          # Actionable mitigations for dispatchers
    is_fallback: bool = False           # MUST be False for real AI implementations
```

---

### 2.3 `DelayEstimatorProtocol`

Calculates expected transit delays taking into account segment risk degradation and mountain pass bottlenecks.

```python
class DelayEstimatorProtocol(Protocol):
    async def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float,
        segment_risk_scores: List[float],
        active_bottlenecks_count: int,
    ) -> EstimatedDelayResult:
        """
        Estimates nominal transit time, delay buffers, and total expected duration.
        """
        ...
```

#### Inputs
- `distance_km: float`: Total corridor route distance in kilometers.
- `base_speed_kmh: float`: Legal/baseline average vehicle speed in km/h.
- `segment_risk_scores: List[float]`: Array of normalized risk scores for all traversed segments.
- `active_bottlenecks_count: int`: Number of active high-risk points or single-lane constrictions.

#### Output Model: `EstimatedDelayResult`
```python
class EstimatedDelayResult(BaseModel):
    nominal_duration_hours: float       # distance_km / base_speed_kmh
    estimated_delay_hours: float        # AI-predicted delay additive
    total_expected_duration_hours: float # nominal + delay
    bottleneck_buffer_hours: float = 0.0 # Buffer allocated to physical bottlenecks
    is_fallback: bool = False           # MUST be False for real AI implementations
```

---

## 3. Baseline Mock Behavior (`MockAIAdapter`)

For test execution and offline demo runs, `MockAIAdapter` (`backend/app/adapters/ai/mock_ai.py`) provides deterministic baseline calculations. **These are simple rule-based approximations and must be replaced by your ML models:**

1. **Classification Baseline**:
   - Matches keywords from a static dictionary against lowercase text.
   - Sets `confidence = min(0.65 + 0.10 * len(keywords), 0.95)`.
   - Explicitly sets `is_fallback = True`.

2. **Risk Prediction Baseline**:
   - Calculates weighted sum: `0.25*(rainfall/50) + 0.25*(incidents/3) + 0.15*historical + 0.15*(slope/45) + 0.20*hazard_proximity`.
   - Categorizes risk score into `LOW` (<0.25), `MEDIUM` (<0.50), `HIGH` (<0.75), `CRITICAL` (>=0.75).
   - Explicitly sets `is_fallback = True`.

3. **Delay Estimation Baseline**:
   - Calculates nominal duration `distance_km / base_speed`.
   - Applies speed degradation `impaired_speed = base_speed * (1.0 - 0.40 * avg_risk)`.
   - Adds bottleneck buffer of `1.5` hours per active bottleneck.
   - Explicitly sets `is_fallback = True`.

---

## 4. How to Inject Real AI Implementations

To wire your trained scikit-learn, PyTorch, HuggingFace, or ONNX models into backend core:

1. Implement classes conforming to the protocols:
   ```python
   # Example: in ai/models/classifier.py
   from app.adapters.ai.base import IncidentClassifierProtocol, ClassifiedIncidentResult

   class RealIncidentClassifier(IncidentClassifierProtocol):
       def __init__(self, model_path: str):
           # Load your model / pipeline here
           pass

       async def classify_incident_text(self, text: str) -> ClassifiedIncidentResult:
           # Run inference
           return ClassifiedIncidentResult(
               category=predicted_category,
               severity=predicted_severity,
               confidence=model_confidence,
               extracted_keywords=tokens,
               is_fallback=False,  # <--- MUST be False
           )
   ```

2. Register your real instances in `backend/app/dependencies.py`:
   ```python
   def get_ai_adapter() -> AIIntegrationAdapter:
       return AIIntegrationAdapter(
           classifier=get_real_classifier(),
           risk_predictor=get_real_risk_predictor(),
           delay_estimator=get_real_delay_estimator(),
       )
   ```

---

## 5. Compliance & Verification Checklist

- [x] Zero ML algorithms or training code in Backend Core.
- [x] `AIIntegrationAdapter` has zero heuristic override logic and delegates 100% to injected protocols.
- [x] Mock fallback clearly marked with `is_fallback: True`.
- [x] Unit test `test_ai_adapter_delegation_to_injected_services` verifies that injected mocks receive exact parameters.
