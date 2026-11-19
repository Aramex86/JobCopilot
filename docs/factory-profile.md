---
schema: 1
ecosystem: python
package_manager: uv
install: uv sync --frozen
lint: ruff check .
typecheck: unknown
test: pytest
build: uv build
lockfile: uv.lock
commit_rules: unknown
structure: free
unknown:
  - typecheck
  - commit_rules
---

# Project passport
## Evidence
- `pyproject.toml`: project name `jobcopilot`, requires-python `>=3.14`, dependencies listed; `[tool.ruff]` present → lint is `ruff check .`; `[tool.pytest.ini_options]` present with `testpaths = ["tests"]` → test is `pytest`; `[build-system]` uses `uv_build` → build is `uv build`.
- `uv.lock`: present at repo root → package manager is `uv` and lockfile is `uv.lock`.
- `.python-version`: contains `3.14` → confirms Python 3.14 runtime target.
- `src/jobcopilot/__init__.py`: only project source file found; no `src/app/`, `src/pages/`, `src/features/`, or `src/shared/` directories → structure is `free`, not `fsaa-layers`.

## Unknown (human fills)
- `typecheck`: no `[tool.mypy]` or other type-checker tool section found in `pyproject.toml`.
- `commit_rules`: no `.husky/`, `commitlint`, `conventional` commit config, or pre-commit hooks found in the repo.
