import pytest

from backend.config import MAX_CHILDREN, SKIP_DIRS
from backend.build_tree import build_tree


def test_max_children_constant():
    assert isinstance(MAX_CHILDREN, int)
    assert 50 <= MAX_CHILDREN <= 200


def test_skip_dirs_contains_expected():
    assert 'node_modules' in SKIP_DIRS
    assert '.git' in SKIP_DIRS
    assert '__pycache__' in SKIP_DIRS


def test_scan_caps_children(tmp_path):
    for i in range(MAX_CHILDREN + 20):
        (tmp_path / f"file_{i:04d}.txt").write_text("x")
    result = build_tree(str(tmp_path), max_depth=1)
    children = result.get("children", [])
    assert len(children) <= MAX_CHILDREN
    assert result.get("truncated") is True


def test_skip_dirs_excluded(tmp_path):
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "src").mkdir()
    (tmp_path / "app.py").write_text("x")
    result = build_tree(str(tmp_path), max_depth=1)
    names = [c["name"] for c in result.get("children", [])]
    assert "node_modules" not in names
    assert "src" in names
