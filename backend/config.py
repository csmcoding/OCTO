import os
import json
from pathlib import Path

SETTINGS_PATH: Path = Path.home() / ".config" / "octopus-dashboard" / "settings.json"

_DEFAULTS: dict = {
    "machine_id": "user",
    "scan_roots": [
        "/home/user/projects",
        "/home/user/Desktop",
        "/home/user/Documents",
        "/home/user/.config",
        "/home/user/.ssh",
        "/home/user/.cursor",
    ],
    "active_signals": ["gitDirty", "gitUnpushed", "recentlyModified", "noReadme", "dormant"],
    "signal_priority": ["gitUnpushed", "gitDirty", "noReadme", "recentlyModified", "dormant"],
    "shallow_depth": 2,
    "auto_scan_on_startup": True,
    "dormancy_threshold_days": 60,
    "editor": "cursor",
    "terminal": "konsole",
    "file_manager": "dolphin",
}

SKIP_DIRS: frozenset = frozenset({
    "node_modules", "__pycache__", "dist", "build", "venv",
    "snap", "proc", "sys", "Music", "Pictures", "Movies", "Videos", "Downloads",
    ".git", ".venv", ".npm", ".yarn", ".gradle", ".cargo",
    ".cache", ".local", ".Trash",
    "env", ".next", ".nuxt", "coverage", ".parcel-cache", ".turbo",
    "vendor", "Pods", "target",
})

MAX_CHILDREN: int = 120

API_PORT: int = 7823


def _load_or_create(path: Path) -> dict:
    """Read settings from path; create with defaults if missing."""
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_DEFAULTS, f, indent=2)
    return dict(_DEFAULTS)


# Load on import
SETTINGS: dict = _load_or_create(SETTINGS_PATH)

MACHINE_ID: str = SETTINGS["machine_id"]
SCAN_ROOTS: list[str] = SETTINGS["scan_roots"]
ACTIVE_SIGNALS: list[str] = SETTINGS.get("active_signals", [])
SIGNAL_PRIORITY: list[str] = SETTINGS.get("signal_priority", [])
SHALLOW_DEPTH: int = SETTINGS.get("shallow_depth", 2)
AUTO_SCAN_ON_STARTUP: bool = SETTINGS.get("auto_scan_on_startup", True)
DORMANCY_THRESHOLD_DAYS: int = SETTINGS.get("dormancy_threshold_days", 60)
EDITOR: str = SETTINGS.get("editor", "cursor")
TERMINAL: str = SETTINGS.get("terminal", "konsole")
FILE_MANAGER: str = SETTINGS.get("file_manager", "dolphin")

# Legacy paths kept for backward compat with existing tests
OUTPUT_PATH: str = os.path.join(os.path.dirname(__file__), "tree.json")
FIXTURE_PATH: str = os.path.join(
    os.path.dirname(__file__), "tests", "fixtures", "sample_project"
)
