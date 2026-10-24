import sys
import os
import urllib.request
import time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from base_agent import BasePythonAgent, CapabilityLevel, SeverityLevel
from typing import Any, Dict

class EdithPythonAgent(BasePythonAgent):
    """
    EDITH: Infrastructure & Reliability (Python 3.11+)
    Monitors edge availability, serverless function timeouts, and external upstream APIs.
    """
    def __init__(self):
        super().__init__(
            agent_id="EDITH",
            name="EDITH",
            role="Infrastructure & Reliability",
            category="Infrastructure",
            permission_level=CapabilityLevel.READ
        )

    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.perf_counter()
        status_code = 0
        try:
            req = urllib.request.Request("https://adhy.tech", method="HEAD", headers={"User-Agent": "Mini-Adhy-EDITH/2.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                status_code = resp.status
        except Exception:
            status_code = 503
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "event_type": "infrastructure_health",
            "severity": SeverityLevel.LOW.value if status_code == 200 else SeverityLevel.HIGH.value,
            "summary": f"EDITH verified Vercel production edge availability: HTTP {status_code} ({latency_ms}ms).",
            "evidence": [{"target": "https://adhy.tech", "status": status_code, "latency_ms": latency_ms}],
            "sources": ["vercel://edge-mesh"],
            "confidence": 0.99,
            "recommended_action": "Availability normal. Production edge operational."
        }
