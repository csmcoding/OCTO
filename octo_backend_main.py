"""PyInstaller entry point for the octo backend sidecar.

Pass the app object directly (not a string) so uvicorn does not try
to import-by-string, which does not work in a frozen binary.
"""
import sys

if getattr(sys, "frozen", False):
    sys.path.insert(0, sys._MEIPASS)

import uvicorn
from backend.api import app
from backend import config

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=config.API_PORT)
