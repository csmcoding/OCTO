import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend import config
from backend.build_tree import build_tree, build_multi_root_tree

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# In-memory tree cache; updated by /scan
_tree_cache: dict = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "machine_id": config.MACHINE_ID}


@app.get("/tree")
def get_tree(depth: int = 2) -> dict:
    return build_multi_root_tree(max_depth=depth)


@app.get("/subtree")
def get_subtree(path: str, depth: int = 3) -> dict:
    return build_tree(path, max_depth=depth)


@app.get("/scan")
def scan() -> StreamingResponse:
    def _generate():
        global _tree_cache
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
                # Prune in-place so os.walk skips these subtrees
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

        # Guarantee at least one progress event
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

        # Rebuild in-memory cache after scan
        _tree_cache = build_multi_root_tree(max_depth=config.SHALLOW_DEPTH)

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


@app.get("/settings")
def get_settings() -> dict:
    return config.SETTINGS


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api:app", host="0.0.0.0", port=config.API_PORT)
