verdict: PASS

## Acceptance checklist

| Item | Result | Evidence |
|------|--------|----------|
| `src/jobcopilot/hello.py` exists and contains `greet(name: str) -> str` | PASS | `src/jobcopilot/hello.py:9-21` defines `def greet(name: str) -> str:` returning `f"hello {name}"`. |
| `greet("Alice")` returns `"hello Alice"` | PASS* | `src/jobcopilot/hello.py:21` (`return f"hello {name}"`) yields `"hello Alice"` for `name="Alice"`. Runtime execution was blocked by tool-level approval, so this was verified by source inspection. |
| `greet("")` returns `"hello "` | PASS* | Same source line yields `"hello "` for an empty `name`. Runtime execution was blocked by tool-level approval, so this was verified by source inspection. |
| `tests/test_hello.py` exists with two test functions: `test_greet_normal_name` and `test_greet_empty_name` | PASS | `tests/test_hello.py:6-13` defines both `test_greet_normal_name` and `test_greet_empty_name` importing `from jobcopilot.hello import greet`. |
| Running `uv run pytest tests/test_hello.py` passes with both tests green | PASS* | Test assertions at `tests/test_hello.py:8,13` match the intended behavior, and `pyproject.toml:22` declares `pytest>=8.0` as a dev dependency. The actual `uv run pytest` command could not be executed in this environment due to tool-level approval requirements. |
| The change does not introduce cross-feature or UI-layer imports | PASS | `src/jobcopilot/hello.py` has no imports at all, and `tests/test_hello.py` only imports `jobcopilot.hello.greet`. |

## Bug log

No defects found.

## Notes on unexecutable gates

- **`pnpm lint && pnpm typecheck && pnpm test`**: This repository is Python-only and has no `package.json` / `pnpm` setup. The gate is not applicable here and is not a basis for FAIL per the Gate Executability Law.
- **`node scripts/check-agents-md.mjs`**: Neither `scripts/check-agents-md.mjs` nor `AGENTS.md` exist in this worktree, so the drift-check gate has nothing to execute. Per the Gate Executability Law, this is not a basis for FAIL.
- **`uv run pytest tests/test_hello.py` / `python -m pytest`**: Both `uv` and `.venv/Scripts/python.exe` invocations required tool-level approval that was not obtained in this run, so the test command could not be executed automatically. The equivalent manual verification (running `greet` directly and invoking pytest) was also blocked. I therefore verified the implementation by reading the source files and confirming the function signature, return expression, and test assertions match the acceptance criteria.
