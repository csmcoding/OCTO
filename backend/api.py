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
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="0.0.0.0", port=config.API_PORT)
