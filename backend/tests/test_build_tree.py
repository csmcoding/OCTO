import json
import pytest
from pathlib import Path
from backend.build_tree import build_tree, write_tree_json
from backend import config


@pytest.fixture
def tree():
    return build_tree(config.FIXTURE_PATH)


def _all_nodes(node):
    """Yield node and all descendants recursively."""
    yield node
    for child in node.get("children", []):
        yield from _all_nodes(child)


def test_root_node_shape(tree):
    for key in ("id", "path", "type", "gitDirty", "children"):
        assert key in tree, f"missing key: {key}"
    assert tree["type"] == "folder"
    assert isinstance(tree["id"], str)
    assert isinstance(tree["children"], list)


def test_gitDirty_true_for_dirty_repo(tree):
    dirty = next(c for c in tree["children"] if "dirty_repo" in c["path"])
    assert dirty["gitDirty"] == True


def test_gitDirty_false_for_clean_repo(tree):
    clean = next(c for c in tree["children"] if "clean_repo" in c["path"])
    assert clean["gitDirty"] == False


def test_gitDirty_false_for_plain_folder(tree):
    plain = next(c for c in tree["children"] if "plain_folder" in c["path"])
    assert plain["gitDirty"] == False


def test_file_nodes_never_dirty(tree):
    file_nodes = [n for n in _all_nodes(tree) if n["type"] == "file"]
    assert len(file_nodes) > 0, "fixture should contain at least one file node"
    for node in file_nodes:
        assert node["gitDirty"] == False, f"file node should not be dirty: {node['path']}"


def test_hidden_files_excluded(tree):
    for node in _all_nodes(tree):
        parts = Path(node["path"]).parts
        assert not any(p.startswith(".") for p in parts), (
            f"hidden path found in tree: {node['path']}"
        )


def test_write_tree_json(tree, tmp_path):
    out = tmp_path / "test.json"
    write_tree_json(tree, str(out))
    assert out.exists()
    assert json.loads(out.read_text()) == tree
