from unittest.mock import patch, MagicMock
from backend.api import api_activity
import asyncio


def run(coro):
    return asyncio.run(coro)


# ── unavailable / error paths ────────────────────────────────────────────────

def test_activity_non_git_path_returns_unavailable(tmp_path):
    """Non-git directory returns unavailable: not_git_repo without crashing."""
    data = run(api_activity(path=str(tmp_path)))
    assert data.get("unavailable") == "not_git_repo"
    assert data.get("items") == []


def test_activity_git_exception_does_not_crash(tmp_path):
    """If subprocess.run raises, endpoint returns gracefully."""
    with patch("subprocess.run", side_effect=Exception("no git")):
        data = run(api_activity(path=str(tmp_path)))
    assert "items" in data


def test_activity_git_failure_returncode(tmp_path):
    """If git rev-parse fails (returncode != 0), returns not_git_repo."""
    mock_r = MagicMock()
    mock_r.returncode = 128
    mock_r.stdout = ""
    with patch("subprocess.run", return_value=mock_r):
        data = run(api_activity(path=str(tmp_path)))
    assert data.get("unavailable") == "not_git_repo"


# ── happy path with mocked log output ───────────────────────────────────────

_LOG_OUTPUT = (
    "COMMIT\x01abc1234def\x01dev@example.com\x012026-05-17T10:00:00+00:00\x01refactor search\n"
    "\n"
    "src/app.js\n"
    "src/utils.js\n"
    "\n"
    "COMMIT\x01bbb5678ccc\x01alice@example.com\x012026-05-10T10:00:00+00:00\x01fix bug\n"
    "\n"
    "src/app.js\n"
)


def _make_fake_run(log_output=_LOG_OUTPUT, dirty_output=""):
    def fake_run(cmd, **kwargs):
        m = MagicMock()
        m.returncode = 0
        m.stdout = ""
        if "rev-parse" in cmd and "--is-inside-work-tree" in cmd:
            pass  # returncode 0, stdout ""
        elif "status" in cmd and "--porcelain=v1" in cmd:
            m.stdout = dirty_output
        elif "log" in cmd:
            m.stdout = log_output
        return m
    return fake_run


def test_activity_returns_items_from_mocked_log(tmp_path):
    with patch("subprocess.run", side_effect=_make_fake_run()):
        data = run(api_activity(path=str(tmp_path)))

    assert data.get("unavailable") is None
    paths = {item["relPath"] for item in data["items"]}
    assert "src/app.js" in paths
    assert "src/utils.js" in paths


def test_activity_commit_counts_are_correct(tmp_path):
    """app.js appears in 2 commits; utils.js in 1."""
    with patch("subprocess.run", side_effect=_make_fake_run()):
        data = run(api_activity(path=str(tmp_path)))

    app_item = next(i for i in data["items"] if i["relPath"] == "src/app.js")
    assert app_item["commitCount30d"] == 2
    utils_item = next(i for i in data["items"] if i["relPath"] == "src/utils.js")
    assert utils_item["commitCount30d"] == 1


def test_activity_last_commit_is_most_recent(tmp_path):
    """Most recent commit (first in log output) is stored as lastCommitSha."""
    with patch("subprocess.run", side_effect=_make_fake_run()):
        data = run(api_activity(path=str(tmp_path)))

    app_item = next(i for i in data["items"] if i["relPath"] == "src/app.js")
    assert app_item["lastCommitSha"] == "abc1234"  # first 7 chars of abc1234def


def test_activity_dirty_flag_set_from_status(tmp_path):
    with patch("subprocess.run", side_effect=_make_fake_run(dirty_output=" M src/app.js\n")):
        data = run(api_activity(path=str(tmp_path)))

    app_item = next(i for i in data["items"] if i["relPath"] == "src/app.js")
    assert app_item["isDirty"] is True
    utils_item = next(i for i in data["items"] if i["relPath"] == "src/utils.js")
    assert utils_item["isDirty"] is False
