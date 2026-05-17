import asyncio
import concurrent.futures
import json
import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend import config
from backend.build_tree import build_tree, build_multi_root_tree


def _count_nodes(node: dict, count: int = 0) -> int:
    count += 1
    for child in node.get("children", []):
        count = _count_nodes(child, count)
    return count


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        tree = await loop.run_in_executor(
            pool,
            lambda: build_multi_root_tree(max_depth=config.SHALLOW_DEPTH),
        )
    app.state.tree = tree
    print(
        f"[octopus] startup scan complete — {_count_nodes(tree)} nodes indexed"
    )
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


_ACTION_MAP = {
    "editor":   lambda path: [config.EDITOR, path],
    "files":    lambda path: [config.FILE_MANAGER, path],
    "terminal": lambda path: [config.TERMINAL, "--workdir", path],
}


@app.post("/open")
def open_path(req: OpenRequest) -> dict:
    builder = _ACTION_MAP.get(req.action)
    if builder is None:
        return {"ok": False, "error": f"Unknown action: {req.action}"}
    try:
        subprocess.Popen(builder(req.path))
        return {"ok": True, "action": req.action, "path": req.path}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/settings")
def get_settings() -> dict:
    return config.SETTINGS


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="0.0.0.0", port=config.API_PORT)
