from backend.api import preview_file, git_diff_summary, _detect_language
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
