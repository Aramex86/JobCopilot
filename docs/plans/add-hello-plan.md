# Plan: add-hello

## Goal

Add a minimal `greet(name)` utility to the `jobcopilot` package and cover it with pytest tests, as requested in `tasks/add-hello.md`.

## Affected layers / files

This task is pure backend Python logic with no UI surface. The FSAA UI mapping files (`agents/where-ui-goes.md`, `AGENTS.md`) were consulted but are not present in this repository, and no UI components are required.

- `src/jobcopilot/hello.py` — new domain utility module (package code)
- `tests/test_hello.py` — new pytest test module
- `pyproject.toml` — add `pytest` to dev dependencies so the test command works consistently

## Step-by-step implementation

### Step 1 — Add `src/jobcopilot/hello.py`

Create the file and implement the function:

```python
def greet(name: str) -> str:
    return f"hello {name}"
```

- Signature: `greet(name: str) -> str`
- Behavior: returns the literal lowercase string `"hello "` followed by the input value (e.g. `greet("Alice") == "hello Alice"`).
- No side effects, no data logic, no feature-to-feature imports.

### Step 2 — Add `tests/test_hello.py`

Create the tests directory and the test module:

```python
from jobcopilot.hello import greet


def test_greet_normal_name():
    assert greet("Alice") == "hello Alice"


def test_greet_empty_name():
    assert greet("") == "hello "
```

- Covers the normal-name case and the empty-name edge case required by the task.
- Import path uses the package name `jobcopilot.hello` (no relative imports).

### Step 3 — Ensure pytest is available

Add `pytest` as a dev dependency in `pyproject.toml` under the uv dev-dependencies section:

```toml
[tool.uv]
dev-dependencies = [
    "pytest>=8.0",
]
```

If the project already uses a different dev-dependency convention, place `pytest` in the equivalent dev group. The exact version pin can follow repo convention; any recent pytest 8.x is acceptable.

## Acceptance checklist (testable)

- [ ] `src/jobcopilot/hello.py` exists and contains `greet(name: str) -> str`.
- [ ] `greet("Alice")` returns `"hello Alice"`.
- [ ] `greet("")` returns `"hello "`.
- [ ] `tests/test_hello.py` exists with two test functions: `test_greet_normal_name` and `test_greet_empty_name`.
- [ ] Running `uv run pytest tests/test_hello.py` passes with both tests green.
- [ ] The change does not introduce cross-feature or UI-layer imports.

## Risks

- **pytest not installed**: if the dev dependency step is skipped, the Tester role may not be able to execute the tests. Mitigated by adding `pytest` in Step 3.
- **Import path mismatch**: importing from `src.jobcopilot.hello` instead of `jobcopilot.hello` can break when tests run against the installed package. The plan uses the package import `jobcopilot.hello`.
- **Empty-name expectation ambiguity**: the task asks for coverage of empty name but does not specify the exact output. The plan interprets `greet("")` as `"hello "` and documents this in the acceptance checklist; confirm at the human gate if a different behavior is desired.

## Assumptions

- The project uses `uv` for dependency management (evidenced by `pyproject.toml` build backend and `uv.lock`).
- No `__init__.py` changes are needed because `src/jobcopilot/__init__.py` already exists and the new module is a sibling.
- The empty-name test should pass the empty string and assert `"hello "`; raising an exception or returning `"hello"` is not requested.
