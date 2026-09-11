"""
NEURoute — Software-Based Cold-Chain Telemetry Simulator
Simulates realistic time-series temperature degradation for temperature-sensitive cargo
(e.g., Emergency Insulin / Vaccines) during mountain corridor roadblocks.
Exemplary sequence: 4.8°C -> 5.1°C -> 5.4°C -> 8.3°C -> 9.4°C (NORMAL -> WARNING -> CRITICAL).
Explicitly labeled as SIMULATED_TELEMETRY.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from app.adapters.cold_chain.base import (
    ColdChainProviderProtocol,
    ColdChainReading,
    ColdChainSource,
    ColdChainStatus,
)


class SimulatorColdChainProvider(ColdChainProviderProtocol):
    """
    In-memory cold-chain telemetry simulator.
    Tracks thermal degradation curves based on simulated roadblocks or cooling unit strain.
    """

    # Default realistic time-series trajectory (Celsius) for demonstration
    DEFAULT_SERIES: List[float] = [4.8, 5.1, 5.4, 8.3, 9.4]

    def __init__(self) -> None:
        # shipment_id -> current step index in DEFAULT_SERIES
        self._shipment_step: Dict[int, int] = {
            1: 0,  # SHP-2026-MED-01 starts at 4.8°C (NORMAL)
        }
        self._custom_temperatures: Dict[int, float] = {}

    def _determine_status(self, temp: float, min_th: float = 2.0, max_th: float = 8.0) -> ColdChainStatus:
        if temp < min_th or temp > max_th + 0.5:
            return ColdChainStatus.CRITICAL
        elif temp > max_th - 1.0:
            return ColdChainStatus.WARNING
        return ColdChainStatus.NORMAL

    async def get_latest_reading(self, shipment_id: int) -> ColdChainReading:
        min_th = 2.0
        max_th = 8.0
        
        if shipment_id in self._custom_temperatures:
            temp = self._custom_temperatures[shipment_id]
        else:
            step = self._shipment_step.get(shipment_id, 0)
            step = min(step, len(self.DEFAULT_SERIES) - 1)
            temp = self.DEFAULT_SERIES[step]

        status = self._determine_status(temp, min_th, max_th)
        note = None
        if status == ColdChainStatus.CRITICAL:
            note = f"EXCURSION ALERT: Temperature {temp:.1f}°C exceeds safe threshold ({min_th}°C - {max_th}°C). Immediate reroute required."
        elif status == ColdChainStatus.WARNING:
            note = f"THERMAL WARNING: Temperature {temp:.1f}°C approaching critical threshold limit."
        else:
            note = f"Thermal stability maintained at {temp:.1f}°C within optimal range ({min_th}°C - {max_th}°C)."

        return ColdChainReading(
            shipment_id=shipment_id,
            vehicle_id=1 if shipment_id == 1 else None,
            temperature_c=temp,
            humidity_percent=68.0 if temp < 8.0 else 79.5,
            threshold_min_c=min_th,
            threshold_max_c=max_th,
            status=status,
            source=ColdChainSource.SIMULATOR,
            ambient_temp_c=29.5,
            location_lat=25.1120,
            location_lng=92.3680,
            notes=note,
            timestamp=datetime.now(timezone.utc),
        )

    async def get_time_series(self, shipment_id: int) -> List[ColdChainReading]:
        """Generates historical time series leading up to the current simulated state."""
        current_step = self._shipment_step.get(shipment_id, 0)
        readings: List[ColdChainReading] = []
        base_time = datetime.now(timezone.utc) - timedelta(minutes=10 * (current_step + 1))

        for idx in range(current_step + 1):
            t_val = self.DEFAULT_SERIES[min(idx, len(self.DEFAULT_SERIES) - 1)]
            status = self._determine_status(t_val)
            readings.append(
                ColdChainReading(
                    shipment_id=shipment_id,
                    vehicle_id=1,
                    temperature_c=t_val,
                    humidity_percent=65.0 + (idx * 3.0),
                    threshold_min_c=2.0,
                    threshold_max_c=8.0,
                    status=status,
                    source=ColdChainSource.SIMULATOR,
                    ambient_temp_c=26.0 + (idx * 0.8),
                    location_lat=25.1120,
                    location_lng=92.3680,
                    timestamp=base_time + timedelta(minutes=10 * idx),
                )
            )
        return readings

    async def simulate_temperature_step(self, shipment_id: int, target_temp_c: Optional[float] = None) -> ColdChainReading:
        """Advance the simulated temperature step or jump to target."""
        if target_temp_c is not None:
            self._custom_temperatures[shipment_id] = target_temp_c
        else:
            current = self._shipment_step.get(shipment_id, 0)
            self._shipment_step[shipment_id] = min(current + 1, len(self.DEFAULT_SERIES) - 1)
            if shipment_id in self._custom_temperatures:
                del self._custom_temperatures[shipment_id]
        return await self.get_latest_reading(shipment_id)

    async def reset(self, shipment_id: int = 1) -> None:
        self._shipment_step[shipment_id] = 0
        if shipment_id in self._custom_temperatures:
            del self._custom_temperatures[shipment_id]
