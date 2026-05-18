import asyncio

import pytest

from backend.api import get_node


def run(coro):
    return asyncio.run(coro)


def test_node_missing():
    result = run(get_node("/nonexistent/path/octo_abc123"))
    assert result.status_code == 404


def test_node_directory(tmp_path):
    result = run(get_node(str(tmp_path)))
    assert result["type"] == "folder"
    assert result["path"] == str(tmp_path)
    assert "name" in result
    assert result["size"] is None


def test_node_file(tmp_path):
    f = tmp_path / "hello.txt"
    f.write_text("hello world")
    result = run(get_node(str(f)))
    assert result["type"] == "file"
    assert result["name"] == "hello.txt"
    assert result["size"] == len("hello world")
    assert "signals" in result
