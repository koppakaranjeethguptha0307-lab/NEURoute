"""
NEURoute Real-Time Event Broadcaster.
Supports Server-Sent Events (SSE) streaming and efficient polling fallback.
Enables real-time operational dashboard updates without full page reloads.
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Set


class EventBroadcaster:
    """In-memory event hub for real-time operational notifications."""

    def __init__(self, history_limit: int = 50) -> None:
        self._subscribers: Set[asyncio.Queue] = set()
        self._history: List[Dict[str, Any]] = []
        self._history_limit = history_limit

    async def subscribe(self) -> AsyncGenerator[str, None]:
        """Subscribe an SSE client connection."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(queue)

        try:
            # Yield initial connection heartbeat
            initial_payload = {
                "event": "CONNECTED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "recent_events": self._history[-5:],
            }
            yield f"data: {json.dumps(initial_payload)}\n\n"

            while True:
                msg = await queue.get()
                yield msg
        finally:
            self._subscribers.discard(queue)

    async def broadcast(self, event_type: str, data: Dict[str, Any]) -> None:
        """Broadcast an event payload to all connected SSE clients."""
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._history.append(payload)
        if len(self._history) > self._history_limit:
            self._history.pop(0)

        message = f"data: {json.dumps(payload)}\n\n"
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(message)
            except Exception:
                self._subscribers.discard(queue)

    def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent events for polling fallback."""
        return self._history[-limit:]


# Global singleton instance
event_broadcaster = EventBroadcaster()
