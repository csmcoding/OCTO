import asyncio
import concurrent.futures
import json
import os
import shutil
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from backend import config
from backend.build_tree import build_tree, build_multi_root_tree


def _count_nodes(node: dict, count: int = 0) -> int:
    count += 1
    for child in node.get("children", []):
        count = _count_nodes(child, count)
    return count


def _resolve_cmd(preferred: str) -> str:
    candidates = {
        "cursor": [
            "/opt/cursor/cursor",
            "/opt/Cursor/cursor",
            os.path.expanduser("~/.local/bin/cursor"),
            "/usr/bin/cursor",
            "/usr/local/bin/cursor",
        ],
        "dolphin": ["/usr/bin/dolphin"],
        "konsole": ["/usr/bin/konsole"],
    }
    for path in candidates.get(preferred, []):
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    return shutil.which(preferred) or preferred


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        tree = await loop.run_in_executor(
            pool,
            lambda: build_multi_root_tree(max_depth=config.SHALLOW_DEPTH),
        )
    app.state.tree = tree
    print(f"[octo] startup scan complete — {_count_nodes(tree)} nodes indexed")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "machine_id": config.MACHINE_ID}


@app.get("/tree")
def get_tree(depth: int = 2) -> dict:
    tree = getattr(app.state, "tree", None)
    if tree is not None and depth == config.SHALLOW_DEPTH:
        return tree
    return build_multi_root_tree(max_depth=depth)


@app.get("/subtree")
def get_subtree(path: str, depth: int = 3) -> dict:
    return build_tree(path, max_depth=depth)


@app.get("/scan")
def scan() -> StreamingResponse:
    def _generate():
        scanned = 0
        emitted_progress = False
        last_path = ""

        yield (
            "data: "
            + json.dumps({
                "event": "start",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            + "\n\n"
        )

        for root_path in config.SCAN_ROOTS:
            p = Path(root_path)
            if not p.exists():
                continue
            for dirpath, dirnames, _ in os.walk(root_path, followlinks=False):
                dirnames[:] = [
                    d for d in dirnames
                    if not d.startswith(".") and d not in config.SKIP_DIRS
                ]
                scanned += 1
                last_path = dirpath
                if scanned % 25 == 0:
                    emitted_progress = True
                    yield (
                        "data: "
                        + json.dumps({
                            "event": "progress",
                            "scanned": scanned,
                            "path": dirpath,
                        })
                        + "\n\n"
                    )

        if not emitted_progress and scanned > 0:
            yield (
                "data: "
                + json.dumps({
                    "event": "progress",
                    "scanned": scanned,
                    "path": last_path,
                })
                + "\n\n"
            )

        app.state.tree = build_multi_root_tree(max_depth=config.SHALLOW_DEPTH)

        yield (
            "data: "
            + json.dumps({
                "event": "complete",
                "total": scanned,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            + "\n\n"
        )

    return StreamingResponse(_generate(), media_type="text/event-stream")


class OpenRequest(BaseModel):
    path: str
    action: str


@app.post("/open")
def open_path(req: OpenRequest) -> dict:
    action_map = {
        "editor":   lambda p: [_resolve_cmd(config.EDITOR), p],
        "files":    lambda p: [_resolve_cmd(config.FILE_MANAGER), p],
        "terminal": lambda p: [_resolve_cmd(config.TERMINAL), "--workdir", p],
        "reveal":   lambda p: [_resolve_cmd(config.FILE_MANAGER), "--select", p],
    }
    if req.action not in action_map:
        return {"ok": False, "error": f"unknown action: {req.action}"}

    cmd = action_map[req.action](req.path)
    try:
        subprocess.Popen(
            cmd,
            env=os.environ.copy(),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return {"ok": True, "action": req.action, "path": req.path}
    except Exception as e:
        return {"ok": False, "error": str(e), "cmd": cmd}


@app.get("/settings")
def get_settings() -> dict:
    return config.SETTINGS


def _detect_language(suffix: str) -> str:
    return {
        ".py": "python", ".js": "javascript", ".jsx": "javascript",
        ".ts": "typescript", ".tsx": "typescript", ".json": "json",
        ".md": "markdown", ".html": "html", ".css": "css",
        ".sh": "bash", ".yaml": "yaml", ".yml": "yaml",
        ".toml": "toml", ".rs": "rust", ".go": "go",
        ".rb": "ruby", ".java": "java", ".c": "c", ".cpp": "cpp",
        ".sql": "sql", ".graphql": "graphql",
    }.get(suffix.lower(), "text")


@app.get("/preview")
async def preview_file(path: str, lines: int = 60):
    import mimetypes
    p = Path(path)
    if not p.exists() or not p.is_file():
        return JSONResponse({"error": "not found"}, status_code=404)
    if p.stat().st_size > 512_000:
        return JSONResponse({"error": "file too large"})
    mime, _ = mimetypes.guess_type(str(p))
    if mime and not (mime.startswith("text") or
                     mime in {"application/json", "application/javascript",
                              "application/typescript", "application/xml"}):
        return JSONResponse({"error": "binary file"})
    try:
        text = p.read_text(errors="replace")
        file_lines = text.splitlines()
        truncated = len(file_lines) > lines
        return {
            "lines": file_lines[:lines],
            "total": len(file_lines),
            "truncated": truncated,
            "language": _detect_language(p.suffix),
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/git-diff")
async def git_diff_summary(path: str):
    p = Path(path)
    if not p.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    try:
        result = subprocess.run(
            ["git", "-C", str(p if p.is_dir() else p.parent),
             "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0:
            return JSONResponse({"error": "not a git repo"})
        git_root = result.stdout.strip()

        stat_result = subprocess.run(
            ["git", "-C", git_root, "diff", "HEAD", "--stat", "--", str(p)],
            capture_output=True, text=True, timeout=10,
        )
        diff_result = subprocess.run(
            ["git", "-C", git_root, "diff", "HEAD", "--", str(p)],
            capture_output=True, text=True, timeout=10,
        )
        diff_lines = diff_result.stdout.splitlines()[:80]

        stat_text = stat_result.stdout.strip().splitlines()
        summary_line = next(
            (l for l in reversed(stat_text)
             if "changed" in l or "insertion" in l or "deletion" in l),
            None,
        )

        return {
            "summary": summary_line,
            "stat": stat_text,
            "diff": diff_lines,
            "truncated": len(diff_result.stdout.splitlines()) > 80,
        }
    except subprocess.TimeoutExpired:
        return JSONResponse({"error": "git timeout"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/scan-info")
async def scan_info(path: str):
    from backend.config import SKIP_DIRS, MAX_CHILDREN
    p = Path(path)
    if not p.is_dir():
        return JSONResponse({"error": "not a dir"}, status_code=400)
    try:
        names = [e.name for e in p.iterdir()]
        total = len(names)
        skipped = sum(1 for n in names if n in SKIP_DIRS or n.startswith("."))
        visible = total - skipped
        return {
            "total": total,
            "skipped": skipped,
            "visible": visible,
            "capped": visible > MAX_CHILDREN,
        }
    except PermissionError:
        return JSONResponse({"error": "permission denied"}, status_code=403)


@app.get("/node")
async def get_node(path: str):
    from backend.signals import compute_signals
    p = Path(path)
    if not p.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    node_type = "folder" if p.is_dir() else "file"
    try:
        signals = compute_signals(str(p), node_type)
    except Exception:
        signals = {}
    stat = p.stat()
    return {
        "name": p.name,
        "path": str(p),
        "type": node_type,
        "size": stat.st_size if not p.is_dir() else None,
        "signals": signals,
    }


class RecentRequest(BaseModel):
    path: str


@app.get("/api/browse")
async def browse_dirs(path: str = None):
    p = Path(path).resolve() if path else Path.home()
    if not p.exists() or not p.is_dir():
        return JSONResponse({"error": "not a directory"}, status_code=400)
    try:
        entries = []
        for e in sorted(p.iterdir(), key=lambda x: x.name.lower()):
            if not e.is_dir():
                continue
            if e.name.startswith('.') and e.name not in {'.config'}:
                continue
            try:
                child_count = sum(1 for _ in e.iterdir() if not _.name.startswith('.'))
            except PermissionError:
                child_count = 0
            entries.append({
                "name": e.name,
                "path": str(e),
                "childCount": child_count,
                "hasChildren": child_count > 0,
            })
        return {
            "path": str(p),
            "parent": str(p.parent) if p != p.parent else None,
            "entries": entries,
        }
    except PermissionError:
        return JSONResponse({"error": "permission denied"}, status_code=403)


_RECENTS_PATH = Path.home() / ".octo" / "recents.json"


@app.get("/api/recents")
async def get_recents():
    if not _RECENTS_PATH.exists():
        return {"recents": []}
    try:
        data = json.loads(_RECENTS_PATH.read_text())
        valid = [r for r in data.get("recents", []) if Path(r["path"]).exists()]
        return {"recents": valid[:5]}
    except Exception:
        return {"recents": []}


@app.post("/api/recents")
async def add_recent(req: RecentRequest):
    p = Path(req.path)
    if not p.exists() or not p.is_dir():
        return JSONResponse({"error": "invalid path"}, status_code=400)
    _RECENTS_PATH.parent.mkdir(exist_ok=True)
    try:
        existing = json.loads(_RECENTS_PATH.read_text()) if _RECENTS_PATH.exists() else {"recents": []}
    except Exception:
        existing = {"recents": []}
    entries = [r for r in existing["recents"] if r["path"] != req.path]
    entries.insert(0, {
        "path": req.path,
        "name": p.name,
        "openedAt": datetime.now().isoformat(),
    })
    _RECENTS_PATH.write_text(json.dumps({"recents": entries[:5]}, indent=2))
    return {"ok": True}


@app.get("/api/validate")
async def validate_path(path: str):
    p = Path(path)
    return {
        "valid": p.exists() and p.is_dir(),
        "exists": p.exists(),
        "isDir": p.is_dir() if p.exists() else False,
        "name": p.name if p.exists() else None,
    }


@app.get("/api/config")
async def get_config():
    octo_root = os.environ.get("OCTO_ROOT", "")
    existing_roots = [r for r in config.SCAN_ROOTS if Path(r).exists()]
    has_roots = bool(octo_root) or bool(existing_roots)
    return {
        "rootPath": octo_root,
        "hasConfiguredRoots": has_roots,
        "version": "0.1.0",
    }


@app.get("/api/preview")
async def api_preview_file(path: str, lines: int = 20):
    """Return first N lines of a file as a single content string for panel preview."""
    p = Path(path)
    if not p.exists() or not p.is_file():
        return JSONResponse({"detail": "File not found"}, status_code=404)
    if p.stat().st_size > 10 * 1024 * 1024:
        return {"content": "# File too large to preview", "truncated": True, "total_lines": 0, "language": "text"}
    try:
        all_lines = p.read_text(errors="replace").splitlines(keepends=True)
        truncated = len(all_lines) > lines
        content = "".join(all_lines[:lines])
        return {
            "content": content,
            "truncated": truncated,
            "total_lines": len(all_lines),
            "language": _detect_language(p.suffix),
        }
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=500)


@app.get("/api/open")
async def api_open_in_editor(path: str):
    """Open a file or folder in the system default editor."""
    p = Path(path)
    if not p.exists():
        return JSONResponse({"detail": "Not found"}, status_code=404)
    try:
        for cmd in [["code", str(p)], ["open", str(p)], ["xdg-open", str(p)]]:
            try:
                subprocess.Popen(
                    cmd,
                    env=os.environ.copy(),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                return {"ok": True}
            except FileNotFoundError:
                continue
        return {"ok": False, "reason": "No editor found"}
    except Exception as e:
        return {"ok": False, "reason": str(e)}


@app.get("/api/activity")
async def api_activity(path: str):
    """Return git activity data (commits, churn) for files under path."""
    from datetime import timedelta

    root = Path(path).expanduser()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    def _git(*args):
        return subprocess.run(
            ["git", "-C", str(root), *args],
            capture_output=True, text=True, timeout=10,
        )

    # Verify path is inside a git repo
    try:
        r = _git("rev-parse", "--is-inside-work-tree")
        if r.returncode != 0:
            return {"root": path, "generatedAt": now_iso, "items": [], "unavailable": "not_git_repo"}
    except Exception:
        return {"root": path, "generatedAt": now_iso, "items": [], "unavailable": "not_git_repo"}

    seven_days_ago = now - timedelta(days=7)

    # Get commits from last 31 days with file names relative to root
    try:
        log_r = _git(
            "log",
            "--since=31.days ago",
            "--format=COMMIT\x01%H\x01%ae\x01%aI\x01%s",
            "--name-only",
            "--relative",
            "--diff-filter=ACDMRT",
            "--", ".",
        )
        log_output = log_r.stdout or ""
    except subprocess.TimeoutExpired:
        return {"root": path, "generatedAt": now_iso, "items": [], "unavailable": "git_timeout"}
    except Exception:
        return {"root": path, "generatedAt": now_iso, "items": []}

    # Get dirty file list
    dirty_set: set = set()
    try:
        st_r = _git("status", "--porcelain=v1", "--", ".")
        for line in (st_r.stdout or "").splitlines():
            if len(line) >= 4:
                fname = line[3:].split(" -> ")[-1].strip()
                dirty_set.add(fname)
    except Exception:
        pass

    # Parse log output — git emits newest commit first
    file_data: dict = {}
    file_first_seen: set = set()
    current_commit = None

    for raw in log_output.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("COMMIT\x01"):
            parts = line.split("\x01", 4)
            sha  = parts[1] if len(parts) > 1 else ""
            email = parts[2] if len(parts) > 2 else ""
            at   = parts[3] if len(parts) > 3 else ""
            msg  = parts[4] if len(parts) > 4 else ""
            try:
                dt = datetime.fromisoformat(at)
            except Exception:
                dt = None
            current_commit = {"sha": sha, "email": email, "at": at, "msg": msg, "dt": dt}
        elif current_commit is not None:
            rel_path = line
            if rel_path not in file_data:
                file_data[rel_path] = {
                    "count_30d": 0, "count_7d": 0,
                    "last_sha": None, "last_at": None,
                    "last_msg": None, "author": None,
                }
            fd = file_data[rel_path]
            fd["count_30d"] += 1
            if current_commit["dt"] and current_commit["dt"] >= seven_days_ago:
                fd["count_7d"] += 1
            # First occurrence = most recent (log is reverse-chron)
            if rel_path not in file_first_seen:
                file_first_seen.add(rel_path)
                fd["last_sha"]  = current_commit["sha"][:7] if current_commit["sha"] else None
                fd["last_at"]   = current_commit["at"]
                fd["last_msg"]  = current_commit["msg"]
                fd["author"]    = current_commit["email"]

    items = [
        {
            "path": str(root / rel_path),
            "relPath": rel_path,
            "lastCommitAt": fd["last_at"],
            "lastCommitSha": fd["last_sha"],
            "lastCommitMessage": fd["last_msg"],
            "author": fd["author"],
            "commitCount30d": fd["count_30d"],
            "commitCount7d": fd["count_7d"],
            "isDirty": rel_path in dirty_set,
        }
        for rel_path, fd in file_data.items()
    ]

    return {"root": path, "generatedAt": now_iso, "items": items}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="0.0.0.0", port=config.API_PORT)
