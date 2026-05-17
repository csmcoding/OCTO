import time
from pathlib import Path

from backend import config
from backend.git_status import has_readme, is_dirty, is_git_repo, is_unpushed

SIGNAL_COLORS = {
    "gitUnpushed": "#ff4444",
    "gitDirty": "#ff8800",
    "noReadme": "#ffdd00",
    "recentlyModified": "#4A90D9",
    "dormant": "#555566",
}

_PRIORITY = ["gitUnpushed", "gitDirty", "noReadme", "recentlyModified", "dormant"]


def _get_mtime(path: str) -> float | None:
    try:
        return Path(path).stat().st_mtime
    except OSError:
        return None


def compute_signals(path: str, node_type: str) -> dict:
    signals = {k: False for k in SIGNAL_COLORS}
    if node_type != "folder":
        return signals
    try:
        is_repo = is_git_repo(path)
        if is_repo:
            signals["gitUnpushed"] = is_unpushed(path)
            signals["gitDirty"] = is_dirty(path)
            signals["noReadme"] = not has_readme(path)
        else:
            signals["noReadme"] = not has_readme(path)

        mtime = _get_mtime(path)
        if mtime is not None:
            age_days = (time.time() - mtime) / 86400
            threshold = getattr(config, "DORMANCY_THRESHOLD_DAYS", 90)
            recently_days = getattr(config, "RECENTLY_MODIFIED_DAYS", 3)
            signals["recentlyModified"] = age_days <= recently_days
            signals["dormant"] = age_days >= threshold
    except Exception:
        pass
    return signals


def dominant_signal(signals: dict) -> str | None:
    for key in _PRIORITY:
        if signals.get(key):
            return key
    return None


def dominant_color(signals: dict) -> str | None:
    key = dominant_signal(signals)
    return SIGNAL_COLORS.get(key) if key else None
