import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from backend import config
from backend.signals import compute_signals, dominant_color, dominant_signal


def _compute_signals_batch(paths_and_types: list[tuple[str, str]]) -> dict:
    """Compute signals for multiple (path, type) pairs concurrently."""
    if not paths_and_types:
        return {}
    results = {}
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(compute_signals, path, ntype): path
            for path, ntype in paths_and_types
        }
        for future in as_completed(futures):
            path = futures[future]
            try:
                results[path] = future.result(timeout=2)
            except Exception:
                results[path] = {}
    return results


def build_node(
    path: str,
    depth: int = 0,
    max_depth: int = None,
    _precomputed_signals: dict = None,
) -> dict:
    """
    Build a single node. Recurses into folders up to max_depth.
    At max_depth, sets hasChildren without loading children.
    gitDirty is only True if this folder is itself a dirty git repo.
    """
    p = Path(path)
    resolved = str(p.resolve())
    node_type = "folder" if p.is_dir() else "file"
    node = {
        "id": f"{config.MACHINE_ID}::{resolved}",
        "path": resolved,
        "name": p.name,
        "type": node_type,
        "machine_id": config.MACHINE_ID,
        "hasChildren": False,
        "children": [],
    }

    node_signals = (
        _precomputed_signals
        if _precomputed_signals is not None
        else compute_signals(resolved, node_type)
    )
    node["signals"] = node_signals
    node["dominantSignal"] = dominant_signal(node_signals)
    node["dominantColor"] = dominant_color(node_signals)
    node["gitDirty"] = node_signals.get("gitDirty", False)

    if node_type != "folder":
        return node

    if max_depth is not None and depth >= max_depth:
        # Lazy boundary: check for existence of children without loading them
        try:
            node["hasChildren"] = any(
                True for e in p.iterdir()
                if not e.name.startswith(".") and e.name not in config.SKIP_DIRS
            )
        except PermissionError:
            pass
        return node

    try:
        all_entries = list(p.iterdir())
    except PermissionError:
        return node  # cannot list this directory; return stub

    entries = [
        e for e in all_entries
        if not e.name.startswith(".")
        and e.name not in config.SKIP_DIRS
        and not (e.is_symlink() and e.is_dir())
    ]
    entries.sort(key=lambda e: (e.is_file(), e.name))

    original_count = len(entries)
    if original_count > config.MAX_CHILDREN:
        entries = entries[:config.MAX_CHILDREN]

    node["truncated"] = original_count > config.MAX_CHILDREN
    node["skipped"] = max(0, original_count - len(entries))

    # Batch compute signals for all direct children concurrently
    child_signal_map = _compute_signals_batch([
        (str(e.resolve()), "folder" if e.is_dir() else "file")
        for e in entries
    ])

    for entry in entries:
        child_resolved = str(entry.resolve())
        try:
            child = build_node(
                str(entry),
                depth + 1,
                max_depth,
                _precomputed_signals=child_signal_map.get(child_resolved),
            )
            node["children"].append(child)
        except (PermissionError, OSError):
            pass  # skip unreadable entries, continue with siblings

    node["hasChildren"] = len(node["children"]) > 0
    return node


def build_tree(root: str, max_depth: int = None) -> dict:
    """Build the full nested tree starting at root."""
    return build_node(root, depth=0, max_depth=max_depth)


def build_multi_root_tree(max_depth: int = None) -> dict:
    """Build a virtual 'you' root containing all configured scan roots."""
    children = [
        build_tree(root, max_depth)
        for root in config.SCAN_ROOTS
        if Path(root).exists()
    ]
    return {
        "id": f"{config.MACHINE_ID}::root",
        "path": "",
        "name": "you",
        "type": "folder",
        "machine_id": config.MACHINE_ID,
        "gitDirty": False,
        "signals": {},
        "dominantSignal": None,
        "dominantColor": None,
        "hasChildren": True,
        "children": children,
    }


def write_tree_json(tree: dict, output_path: str) -> None:
    """Write the tree to a JSON file, creating parent dirs if needed."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(tree, f, indent=2)


if __name__ == "__main__":
    import sys
    max_d = int(sys.argv[1]) if len(sys.argv) > 1 else config.SHALLOW_DEPTH
    tree = build_multi_root_tree(max_depth=max_d)
    write_tree_json(tree, config.OUTPUT_PATH)
    print(f"Written to: {config.OUTPUT_PATH}")
