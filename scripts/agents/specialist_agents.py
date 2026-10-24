"""
Mini-Adhy Specialist Agents — Modular Python 3.11+ Implementations
Re-exports each dedicated agent module for seamless ecosystem orchestration.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'specialists'))

from jarvis_agent import JarvisPythonAgent
from friday_agent import FridayPythonAgent
from dume_agent import DumEPythonAgent
from u_agent import UPythonAgent
from edith_agent import EdithPythonAgent
from ultron_agent import UltronPythonAgent
from jocasta_agent import JocastaPythonAgent
from jim_agent import JimPythonAgent
from karen_agent import KarenPythonAgent
from veronica_agent import VeronicaPythonAgent

__all__ = [
    "JarvisPythonAgent",
    "FridayPythonAgent",
    "DumEPythonAgent",
    "UPythonAgent",
    "EdithPythonAgent",
    "UltronPythonAgent",
    "JocastaPythonAgent",
    "JimPythonAgent",
    "KarenPythonAgent",
    "VeronicaPythonAgent",
]
