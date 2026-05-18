import asyncio
import pathlib

import pytest

from backend.api import (
    browse_dirs, get_recents, add_recent, validate_path, get_config,
    RecentRequest,
)


def run(coro):
    return asyncio.run(coro)


def test_browse_home():
    home = str(pathlib.Path.home())
    result = run(browse_dirs(home))
    assert "entries" in result
    assert "parent" in result
    assert isinstance(result["entries"], list)


def test_browse_invalid():
    result = run(browse_dirs("/nonexistent/xyz/octo_abc"))
    assert result.status_code == 400


def test_validate_valid_dir(tmp_path):
    result = run(validate_path(str(tmp_path)))
    assert result["valid"] is True
    assert result["isDir"] is True


def test_validate_nonexistent():
    result = run(validate_path("/fake/path/octo_xyz_123"))
    assert result["valid"] is False


def test_recents_shape():
    result = run(get_recents())
    assert "recents" in result
    assert isinstance(result["recents"], list)


def test_add_recent(tmp_path):
    result = run(add_recent(RecentRequest(path=str(tmp_path))))
    assert result["ok"] is True
