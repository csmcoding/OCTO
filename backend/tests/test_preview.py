from unittest.mock import patch
from backend.api import preview_file, git_diff_summary, _detect_language, api_preview_file, api_open_in_editor
import asyncio


def run(coro):
    return asyncio.run(coro)


def test_detect_language():
    assert _detect_language(".py") == "python"
    assert _detect_language(".tsx") == "typescript"
    assert _detect_language(".md") == "markdown"
    assert _detect_language(".xyz") == "text"


def test_preview_text_file(tmp_path):
    f = tmp_path / "hello.py"
    f.write_text("print('hello')\n" * 5)
    data = run(preview_file(path=str(f)))
    assert data["lines"][0] == "print('hello')"
    assert data["language"] == "python"
    assert not data["truncated"]


def test_preview_truncates(tmp_path):
    f = tmp_path / "big.txt"
    f.write_text("\n".join(str(i) for i in range(200)))
    data = run(preview_file(path=str(f), lines=10))
    assert len(data["lines"]) == 10
    assert data["truncated"]
    assert data["total"] == 200


def test_preview_missing():
    response = run(preview_file(path="/nonexistent/file.py"))
    assert response.status_code == 404


# ── /api/preview tests ──────────────────────────────────────────────────────

def test_api_preview_returns_content_for_valid_file(tmp_path):
    f = tmp_path / "app.js"
    f.write_text("const x = 1;\nconst y = 2;\n")
    data = run(api_preview_file(path=str(f)))
    assert "content" in data
    assert "const x = 1;" in data["content"]


def test_api_preview_returns_404_for_nonexistent_file():
    response = run(api_preview_file(path="/no/such/file.py"))
    assert response.status_code == 404


def test_api_preview_truncates_at_n_lines(tmp_path):
    f = tmp_path / "big.txt"
    f.write_text("\n".join(f"line {i}" for i in range(50)) + "\n")
    data = run(api_preview_file(path=str(f), lines=5))
    assert data["truncated"] is True
    assert data["total_lines"] == 50


def test_api_preview_detects_language_from_extension(tmp_path):
    f = tmp_path / "script.py"
    f.write_text("print('hello')\n")
    data = run(api_preview_file(path=str(f)))
    assert data["language"] == "python"


def test_api_open_returns_ok_with_mocked_popen(tmp_path):
    with patch("subprocess.Popen"):
        data = run(api_open_in_editor(path=str(tmp_path)))
    assert data.get("ok") is True
