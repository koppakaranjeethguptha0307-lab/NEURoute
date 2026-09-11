# NEURoute — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER

> **SIH Problem Statement:** SIH 26002 — AI-Based Smart Logistics and Accessibility Intelligence Platform for North Eastern Region (NER)  
> **Team:** Nexara  
> **Architecture Mandate:** 100% SOFTWARE-ONLY (Hardware Dependency = ZERO)

---

## 1. Executive Summary

**NEURoute** is an operational logistics intelligence and accessibility platform engineered specifically for the rugged terrain and extreme monsoon vulnerabilities of India's North Eastern Region (Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, and Sikkim).

The platform transforms raw meteorological data, geo-tagged field disruption reports, and corridor elevation topologies into real-time operational risk scores, clearance delay projections, and multi-criteria lifeline rerouting recommendations.

---

## 2. 100% Software-Only Mandate (Zero Hardware Dependency)

NEURoute is intentionally and strictly **100% SOFTWARE-ONLY**. It requires **ZERO** physical devices, sensors, or hardware components to execute:

- **NO** physical GPS trackers or AIS-140 vehicle hardware.
- **NO** physical IoT temperature sensors or probes.
- **NO** Raspberry Pi, Arduino, ESP32, or microcontrollers.
- **NO** physical weather stations or barometers.
- **NO** physical checkpoints, RFID gates, or hardware dongles.
- **NO** serial ports, USB controllers, Bluetooth/BLE, CAN bus, OBD, or NMEA devices.

The platform executes entirely on a standard laptop through modern web browsers, FastAPI REST services, SQLite/PostgreSQL relational storage, and standardized software telemetry adapters.

### Data Source Transparency

NEURoute never misleads operators or evaluators. Every telemetry metric and external data feed carries an explicit, visible provenance badge:

| Domain | Active Provider | Status Label | Fallback Mode |
| :--- | :--- | :--- | :--- |
| **GPS Vehicle Tracking** | `SimulatorGPSProvider` | `SIMULATED` | In-memory corridor interpolation |
| **Weather / Monsoon** | `OpenMeteoWeatherAdapter` | `LIVE_API` / `FALLBACK` | Deterministic seasonal weather model |
| **Cold-Chain Telemetry** | `SimulatorColdChainProvider` | `SIMULATED_TELEMETRY` | Software thermal degradation curves |
| **Government Integration** | `SimulatorGovernmentAdapter` | `NOT_CONFIGURED (SIMULATED)` | Standardized NDMA/SDMA schema stubs |

---

## 3. Positioning vs. PM Gati Shakti

> **Official Positioning:**  
> *"NEURoute complements national infrastructure-planning platforms by adding operational, disruption-aware logistics intelligence for the North Eastern Region."*

NEURoute does not duplicate or compete with national infrastructure planning systems like PM Gati Shakti:
- **PM Gati Shakti** focuses on multi-modal infrastructure planning, master planning GIS layers, and long-term capital connectivity investments.
- **NEURoute** operates dynamically in the field during the monsoon season, providing day-to-day tactical logistics intelligence: live route impassability, active landslide holds, temperature-controlled vaccine rerouting, offline field responder synchronization, and multilingual alerts for drivers.

---

## 4. Explainable Multi-Factor AI Risk Engine

NEURoute rejects unverifiable black-box neural networks in favor of a mathematically rigorous, fully explainable risk engine:

$$R_{\text{seg}} = \min\left(1.0, \, 0.25 W_{\text{norm}} + 0.25 H_{\text{prox}} + 0.30 I_{\text{active}} + 0.10 F_{\text{hist}} + 0.10 T_{\text{slope}}\right)$$

Where:
- $W_{\text{norm}} \in [0, 1]$: Normalized precipitation ($>50\text{ mm}$ rain, $<500\text{ m}$ fog visibility).
- $H_{\text{prox}} \in [0, 1]$: Proximity decay factor to mapped geological hazard hotspots within $10\text{ km}$.
- $I_{\text{active}} \in [0, 1]$: Active reported incidents weighted by blocked lane severity.
- $F_{\text{hist}} \in [0, 1]$: Historical multi-year landslide recurrence frequency for the sector.
- $T_{\text{slope}} \in [0, 1]$: Topographic slope gradient and elevation descent index.

Every risk score outputs a transparent list of plain-English operational reasons (e.g., *"Heavy rainfall detected (92.5 mm)", "Active rockfall chokepoint on NH-06"*).

---

## 5. End-to-End Operational Flow

```
Heavy Monsoon Rainfall / Landslide
              ↓
  AI Risk Engine Recalculation
              ↓
  Highway Segment Marked BLOCKED
              ↓
 AI Delay Estimator Computes Stranded Hold
              ↓
 Cold-Chain Telemetry Detects Excursion Risk
              ↓
 RouteOptimizer Evaluates Candidate Lifelines
              ↓
 Umrangso Relief Bypass Selected & Dispatched
              ↓
  Emergency Mode Prioritizes Medical Cargo
              ↓
 Multilingual Alerts Dispatched (EN, HI, AS, BN)
              ↓
 Real-Time SSE Updates Visualized Across GIS Map
```

---

## 6. SIH Judge Defense & Technical FAQ

### "Is this really AI? Where is the AI?"
> NEURoute utilizes an **Explainable Multi-Factor AI Risk Engine** and a **Multi-Criteria Route Optimization Engine**. Rather than an opaque deep neural network with hallucination risks, our engine calculates risk and delay using weighted multi-criteria decision models ($R = \min(1.0, \sum w_i x_i)$) that output transparent mathematical justifications for government authorities.

### "Where does GPS tracking come from without hardware?"
> Tracking is powered by our software `SimulatorGPSProvider`, which interpolates vehicle coordinates along validated GIS highway lifelines. The system architecture defines a standardized `GPSProviderProtocol` that allows zero-code-change drop-in integration with live commercial telematics APIs (e.g., fleet telematics or smartphone apps) when available.

### "How does the system work without internet in remote mountain passes?"
> Field responders run a local-first buffer via `offlineQueue.ts` (LocalStorage/IndexedDB). When cell signal drops, reports are geo-tagged and stored with client UUIDs. Upon network restoration, an auto-sync daemon submits the batch to `/api/v1/incidents/field-reports/sync` where the backend processes them idempotently with zero duplicate records.

---

## 7. Quickstart & Local Demonstration

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd d:\NEURote\backend

# Install dependencies (pure software)
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/api/v1/docs`

### 2. Frontend Setup & Startup
```powershell
# Open a new terminal and navigate to frontend
cd d:\NEURote\frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser to: `http://localhost:5173`

### 3. Run Automated 23-Point SIH Demonstration Scenario
```powershell
# In workspace root
python scripts/sih_demo_scenario.py
```

### 4. Run Automated Test Suite
```powershell
# Backend tests (68 tests)
pytest

# Frontend compilation & type validation
cd frontend
npm run build
```

---

## 8. Verified SIH Requirement Coverage Matrix

| SIH Requirement | Implementation Component | Status |
| :--- | :--- | :--- |
| **A) Real-Time Road & Bridge Status** | GIS LineStrings, OPEN/RISKY/BLOCKED states, District accessibility index | **PASS** |
| **B) Disruption Prediction** | Rainfall, hazard proximity, slope instability scoring | **PASS** |
| **C) Alternate Route & Delay Estimation** | RouteOptimizer + DelayEstimator avoiding blocked chokepoints | **PASS** |
| **D) GPS Vehicle Tracking** | Software Simulator with explicit `SIMULATED` transparency badges | **PASS** |
| **E) Essential Commodity Logistics** | Medicine/Vaccine cold-chain prioritizations | **PASS** |
| **F) Automated Alerts** | Real-time SSE dispatch and database audit logging | **PASS** |
| **G) Geo-Tagged Field Reporting** | Mobile-friendly reporting modal with lat/lng extraction | **PASS** |
| **H) Centralized Command Dashboard** | Real-time KPI cards, strategic corridors, live alerts | **PASS** |
| **I) Multilingual Notifications** | English, Hindi, Assamese, and Bengali alerts | **PASS** |
| **J) Resilient Offline Operation** | Local buffer queue with idempotent UUID deduplication | **PASS** |

---

## 9. License & Team
Developed for **Smart India Hackathon 2026** by **Team Nexara**.  
MIT License.
