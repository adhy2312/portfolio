"""
Mini-Adhy Autonomous Ecosystem Runner (Python 3.11+)
Uses asyncio.TaskGroup for high-performance concurrent agent execution.
"""

import asyncio
import json
import time
import sys
from typing import List

# Ensure UTF-8 stdout encoding on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
from base_agent import AgentMessage
from specialist_agents import (
    JarvisPythonAgent,
    FridayPythonAgent,
    DumEPythonAgent,
    UPythonAgent,
    EdithPythonAgent,
    UltronPythonAgent,
    JocastaPythonAgent,
    JimPythonAgent,
    KarenPythonAgent,
    VeronicaPythonAgent
)


async def main():
    agents = [
        JarvisPythonAgent(),
        FridayPythonAgent(),
        DumEPythonAgent(),
        UPythonAgent(),
        EdithPythonAgent(),
        UltronPythonAgent(),
        JocastaPythonAgent(),
        JimPythonAgent(),
        KarenPythonAgent(),
        VeronicaPythonAgent()
    ]

    print("=================================================================")
    print(" ⚡ MINI-ADHY AUTONOMOUS AI ECOSYSTEM — PYTHON 3.11 RUNNER")
    print(f" Initializing {len(agents)} Specialist Agents...")
    print("=================================================================\n")

    t_start = time.perf_counter()
    results: List[AgentMessage] = []

    # Modern Python 3.11 TaskGroup for concurrent execution
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(agent.run()) for agent in agents]

    for task in tasks:
        results.append(task.result())

    total_time = round((time.perf_counter() - t_start) * 1000, 2)

    for res in results:
        status_icon = "🟢" if res.status == "completed" else "🔴"
        print(f"{status_icon} [{res.agent:<8}] ({res.execution_time_ms:>6.2f}ms) : {res.summary}")

    print("\n" + "=" * 65)
    print(f" ✅ ALL {len(results)} AGENTS COMPLETED IN {total_time}ms")
    print("=================================================================")

    # Write output to json
    report = {
        "timestamp": time.time(),
        "total_duration_ms": total_time,
        "agents_count": len(results),
        "results": [r.to_dict() for r in results]
    }
    with open("scripts/agents/latest_audit_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(" 📄 Saved telemetry report to scripts/agents/latest_audit_report.json\n")


if __name__ == "__main__":
    asyncio.run(main())
