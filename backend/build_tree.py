import os
import json
import uuid
from pathlib import Path
from backend.git_status import is_git_repo, is_dirty
from backend import config


def build_node(path: str) -> dict:
    """
    Build a single node for a file or folder.
    For folders: recursively build children.
    gitDirty is only True if this folder is itself a dirty git repo.
    Children of a dirty repo are NOT automatically dirty.
    """
    p = Path(path)
    node_type = "folder" if p.is_dir() else "file"
    node = {
        "id": str(p.resolve()),
        "path": str(p.resolve()),
        "type": node_type,
        "gitDirty": is_dirty(str(p)) if node_type == "folder" else False,
        "children": [],
    }
    if node_type == "folder":
        try:
            entries = sorted(p.iterdir(), key=lambda e: (e.is_file(), e.name))
            for entry in entries:
                if entry.name.startswith("."):
                    continue  # skip hidden files and .git folders
                node["children"].append(build_node(str(entry)))
        except PermissionError:
            pass  # skip folders we cannot read
    return node


def build_tree(root: str) -> dict:
    """
    Build the full nested tree starting at root.
    Returns the root node with all descendants.
    """
    return build_node(root)


def write_tree_json(tree: dict, output_path: str) -> None:
    """Write the tree to a JSON file, creating parent dirs if needed."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(tree, f, indent=2)


if __name__ == "__main__":
    print(f"Scanning: {config.ROOT_PATH}")
    tree = build_tree(config.ROOT_PATH)
    write_tree_json(tree, config.OUTPUT_PATH)
    print(f"Written to: {config.OUTPUT_PATH}")
