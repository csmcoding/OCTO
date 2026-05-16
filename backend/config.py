import os

ROOT_PATH: str = os.path.expanduser("~/projects")
OUTPUT_PATH: str = os.path.join(os.path.dirname(__file__), "tree.json")
FIXTURE_PATH: str = os.path.join(
    os.path.dirname(__file__), "tests", "fixtures", "sample_project"
)
