from unittest.mock import patch

from backend.api import OpenRequest, open_path


def test_open_endpoint_returns_ok_structure():
    with patch("subprocess.Popen"):
        result = open_path(OpenRequest(path="/tmp", action="files"))
    assert "ok" in result
    assert result["ok"] is True
    assert result["action"] == "files"
    assert result["path"] == "/tmp"


def test_open_invalid_action_handled():
    result = open_path(OpenRequest(path="/tmp", action="invalid"))
    assert result["ok"] is False
    assert "error" in result
