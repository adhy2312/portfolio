"""
Mini-Adhy Supreme AI Ecosystem — Modern Python 3.11+ High-Performance Agent Template
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from enum import Enum
import time
import asyncio
from typing import Any, Dict, List, Optional


class CapabilityLevel(str, Enum):
    READ = "READ"
    ANALYZE = "ANALYZE"
    SAFE_AUTOMATION = "SAFE_AUTOMATION"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    PROHIBITED = "PROHIBITED"


class SeverityLevel(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AgentMessage:
    agent: str
    event_type: str
    severity: str
    summary: str
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)
    confidence: float = 1.0
    recommended_action: str = ""
    requires_approval: bool = False
    status: str = "completed"
    execution_time_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class BasePythonAgent(ABC):
    """
    Abstract Template for Autonomous AI Specialist Agents in Python 3.11+.
    Provides lifecycle hooks, timeout controls, high-resolution telemetry, and schema validation.
    """

    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        category: str = "Specialist",
        permission_level: CapabilityLevel = CapabilityLevel.READ,
        cache_ttl_seconds: float = 60.0
    ):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.category = category
        self.permission_level = permission_level
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, tuple[float, AgentMessage]] = {}
        self.run_count = 0
        self.error_count = 0
        self.last_duration_ms = 0.0

    async def run(self, params: Optional[Dict[str, Any]] = None, timeout_seconds: float = 10.0) -> AgentMessage:
        """Standardized async pipeline with timeout and deduplication"""
        params = params or {}
        cache_key = str(sorted(params.items()))
        now = time.time()

        if cache_key in self._cache:
            ts, cached_msg = self._cache[cache_key]
            if (now - ts) < self.cache_ttl:
                return cached_msg

        self.run_count += 1
        t0 = time.perf_counter()

        try:
            await self.pre_execute(params)
            
            # Execute with asyncio timeout
            async with asyncio.timeout(timeout_seconds):
                raw_result = await self.execute(params)
            
            processed = await self.post_execute(raw_result)
            t1 = time.perf_counter()
            self.last_duration_ms = round((t1 - t0) * 1000, 2)

            msg = AgentMessage(
                agent=self.agent_id,
                event_type=processed.get("event_type", "status_report"),
                severity=processed.get("severity", SeverityLevel.LOW.value),
                summary=processed.get("summary", f"{self.name} completed successfully."),
                evidence=[
                    *(processed.get("evidence", [])),
                    {"metric": "execution_time_ms", "value": self.last_duration_ms}
                ],
                sources=processed.get("sources", ["python://runtime"]),
                confidence=processed.get("confidence", 0.95),
                recommended_action=processed.get("recommended_action", "No action needed."),
                requires_approval=processed.get("requires_approval", False),
                status="completed",
                execution_time_ms=self.last_duration_ms
            )

            self._cache[cache_key] = (now, msg)
            return msg

        except asyncio.TimeoutError:
            self.error_count += 1
            return AgentMessage(
                agent=self.agent_id,
                event_type="timeout_error",
                severity=SeverityLevel.HIGH.value,
                summary=f"[{self.name}] Timed out after {timeout_seconds}s",
                evidence=[{"error": "asyncio.TimeoutError"}],
                confidence=0.0,
                recommended_action="Check network connectivity or backend latency.",
                status="failed"
            )
        except Exception as e:
            self.error_count += 1
            await self.on_error(e, params)
            return AgentMessage(
                agent=self.agent_id,
                event_type="execution_error",
                severity=SeverityLevel.HIGH.value,
                summary=f"[{self.name}] Exception: {str(e)}",
                evidence=[{"error": type(e).__name__, "message": str(e)}],
                confidence=0.0,
                recommended_action="Inspect agent logs.",
                status="failed"
            )

    async def pre_execute(self, params: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Subclasses implement business logic here"""
        pass

    async def post_execute(self, result: Dict[str, Any]) -> Dict[str, Any]:
        return result

    async def on_error(self, error: Exception, params: Dict[str, Any]) -> None:
        pass
