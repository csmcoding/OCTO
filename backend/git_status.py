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
