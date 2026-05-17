import json
import pytest
from pathlib import Path
from backend import config
from backend.build_tree import build_node, build_tree, build_multi_root_tree


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _all_nodes(node):
    yield node
    for child in node.get("children", []):
        yield from _all_nodes(child)


# ---------------------------------------------------------------------------
# TASK A — settings / config
# ---------------------------------------------------------------------------

def test_settings_created(tmp_path):
    """_load_or_create writes defaults when file is missing."""
    from backend.config import _load_or_create, _DEFAULTS
    settings_file = tmp_path / "settings.json"
    assert not settings_file.exists()
    result = _load_or_create(settings_file)
    assert settings_file.exists(), "settings file should be created"
    on_disk = json.loads(settings_file.read_text())
    assert on_disk["machine_id"] == _DEFAULTS["machine_id"]
    assert "scan_roots" in on_disk
    assert result == on_disk


# ---------------------------------------------------------------------------
# TASK B — new node fields
# ---------------------------------------------------------------------------

def test_node_has_machine_id():
    """Every node id must be prefixed with machine_id::"""
    node = build_node(config.FIXTURE_PATH)
    assert node["id"].startswith(f"{config.MACHINE_ID}::")
    assert node["machine_id"] == config.MACHINE_ID


def test_node_has_name_field():
    """Node 'name' must equal the basename of the path."""
    node = build_node(config.FIXTURE_PATH)
    assert node["name"] == Path(config.FIXTURE_PATH).name


def test_has_children_flag(tmp_path):
    """At max_depth, hasChildren is True for dirs that have non-hidden children."""
    inner = tmp_path / "inner"
    inner.mkdir()
    (inner / "file.txt").write_text("hi")
    # max_depth=0 means we stop at the root immediately
    node = build_node(str(tmp_path), depth=0, max_depth=0)
    assert node["children"] == [], "should not load children at max_depth"
    assert node["hasChildren"] is True, "should detect non-empty dir"


def test_skip_dirs_respected(tmp_path):
    """node_modules, __pycache__, and .git must never appear in the tree."""
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "__pycache__").mkdir()
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text("print('hello')")
    node = build_node(str(tmp_path))
    names = {n["name"] for n in _all_nodes(node)}
    assert "node_modules" not in names
    assert "__pycache__" not in names
    assert "main.py" in names


def test_permission_error_skipped(tmp_path):
    """A child directory with no read permission must not crash the scan."""
    restricted = tmp_path / "restricted"
    restricted.mkdir()
    (restricted / "secret.txt").write_text("secret")
    restricted.chmod(0o000)
    try:
        node = build_node(str(tmp_path))
        assert node["type"] == "folder"
        # Scan must complete without raising
    finally:
        restricted.chmod(0o755)  # restore so pytest cleanup can delete it


def test_multi_root_returns_you_node():
    """build_multi_root_tree must return a virtual root with id '<machine_id>::root'."""
    tree = build_multi_root_tree(max_depth=1)
    assert tree["id"] == f"{config.MACHINE_ID}::root"
    assert tree["name"] == "you"
    assert tree["type"] == "folder"
    assert isinstance(tree["children"], list)
