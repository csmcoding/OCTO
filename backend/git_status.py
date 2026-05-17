import subprocess
from pathlib import Path


def is_git_repo(path: str) -> bool:
    """Return True if path contains a .git directory."""
    return (Path(path) / ".git").is_dir()


def is_dirty(path: str) -> bool:
    """
    Return True if the git repo at path has uncommitted changes.
    Runs: git -C <path> status --porcelain
    Any non-empty output means the repo is dirty.
    Returns False (not dirty) if path is not a git repo.
    """
    if not is_git_repo(path):
        return False
    result = subprocess.run(
        ["git", "-C", path, "status", "--porcelain"],
        capture_output=True,
        text=True,
        timeout=5,
    )
    return bool(result.stdout.strip())


def is_unpushed(path: str) -> bool:
    """
    Returns True if the folder is a git repo with commits that exist
    locally but not on the tracked remote branch.
    Uses local ref comparison only — no network calls.
    Returns False if no upstream is configured.
    Silent on all exceptions.
    """
    if not is_git_repo(path):
        return False
    try:
        result = subprocess.run(
            ["git", "-C", path, "log", "@{u}..HEAD", "--oneline"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            return False  # no upstream configured
        return bool(result.stdout.strip())
    except Exception:
        return False


def has_readme(path: str) -> bool:
    """
    Returns True if the folder contains a file matching README*
    (case-insensitive) at the top level.
    Only meaningful when the folder is a git repo.
    """
    try:
        return any(
            e.is_file() and e.name.lower().startswith("readme")
            for e in Path(path).iterdir()
        )
    except OSError:
        return False
