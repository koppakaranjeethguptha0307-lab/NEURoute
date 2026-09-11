"""
NEURoute — Real-Time Events API Router.
Provides Server-Sent Events (SSE) streaming and efficient polling fallback.
"""

from typing import Any, Dict, List
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.event_broadcaster import event_broadcaster

router = APIRouter(prefix="/api/v1/events", tags=["Real-Time Events"])


@router.get("/stream", summary="Subscribe to real-time Server-Sent Events stream")
async def event_stream():
    """
    Subscribes to live operational updates:
    - Weather alerts
    - Road blockage and risk recalculations
    - Vehicle GPS telemetry updates
    - Cold-chain temperature excursions
    - Emergency mode state transitions
    """
    return StreamingResponse(
        event_broadcaster.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/poll", response_model=List[Dict[str, Any]], summary="Fetch recent events for polling fallback")
def poll_recent_events(limit: int = 15) -> List[Dict[str, Any]]:
    """Polling fallback for environments where persistent SSE is restricted."""
    return event_broadcaster.get_recent_events(limit=limit)
