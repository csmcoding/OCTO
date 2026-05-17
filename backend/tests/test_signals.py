import pytest
from unittest.mock import patch
from backend.signals import (
    SIGNAL_COLORS,
    _get_mtime,
    compute_signals,
    dominant_color,
    dominant_signal,
)


def test_signal_colors_has_all_keys():
    expected = {"gitUnpushed", "gitDirty", "noReadme", "recentlyModified", "dormant"}
    assert set(SIGNAL_COLORS.keys()) == expected


def test_compute_signals_returns_all_keys(tmp_path):
    signals = compute_signals(str(tmp_path), "folder")
    assert set(signals.keys()) == set(SIGNAL_COLORS.keys())


def test_compute_signals_file_node_all_false(tmp_path):
    f = tmp_path / "file.txt"
    f.write_text("hello")
    signals = compute_signals(str(f), "file")
    assert all(v is False for v in signals.values())


def test_compute_signals_gitdirty_true(tmp_path):
    with patch("backend.signals.is_git_repo", return_value=True), \
         patch("backend.signals.is_dirty", return_value=True), \
         patch("backend.signals.is_unpushed", return_value=False), \
         patch("backend.signals.has_readme", return_value=True):
        signals = compute_signals(str(tmp_path), "folder")
    assert signals["gitDirty"] is True


def test_compute_signals_gitunpushed_true(tmp_path):
    with patch("backend.signals.is_git_repo", return_value=True), \
         patch("backend.signals.is_dirty", return_value=False), \
         patch("backend.signals.is_unpushed", return_value=True), \
         patch("backend.signals.has_readme", return_value=True):
        signals = compute_signals(str(tmp_path), "folder")
    assert signals["gitUnpushed"] is True


def test_compute_signals_noreadme_true(tmp_path):
    with patch("backend.signals.is_git_repo", return_value=False), \
         patch("backend.signals.has_readme", return_value=False):
        signals = compute_signals(str(tmp_path), "folder")
    assert signals["noReadme"] is True


def test_dominant_signal_priority_order():
    signals = {
        "gitUnpushed": True,
        "gitDirty": True,
        "noReadme": True,
        "recentlyModified": True,
        "dormant": True,
    }
    assert dominant_signal(signals) == "gitUnpushed"


def test_dominant_signal_none_when_all_false():
    signals = {k: False for k in SIGNAL_COLORS}
    assert dominant_signal(signals) is None


def test_dominant_color_returns_hex(tmp_path):
    signals = {k: False for k in SIGNAL_COLORS}
    signals["gitDirty"] = True
    color = dominant_color(signals)
    assert color == SIGNAL_COLORS["gitDirty"]
    assert color.startswith("#")
