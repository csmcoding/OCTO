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


def test_open_reveal_file_uses_select_flag():
    with patch("subprocess.Popen") as mock_popen, \
         patch("os.path.isfile", return_value=True):
        result = open_path(OpenRequest(path="/tmp/test.py", action="reveal"))
    assert result["ok"] is True
    assert result["action"] == "reveal"
    cmd = mock_popen.call_args[0][0]
    assert "--select" in cmd
    assert "/tmp/test.py" in cmd


def test_open_reveal_folder_uses_select_flag():
    with patch("subprocess.Popen") as mock_popen:
        result = open_path(OpenRequest(path="/tmp", action="reveal"))
    assert result["ok"] is True
    cmd = mock_popen.call_args[0][0]
    assert "--select" in cmd
    assert "/tmp" in cmd
