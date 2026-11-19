# Researcher role (phase-4.1.5) — Implementation Plan

> **For agentic workers:** steps use checkbox syntax. Native execution in-session (VPS kit).

**Goal:** factory cannot start without a project passport; researcher role writes the passport from FACTS (node v1), registry-based so any language can be added as data.

**Architecture:** small data registry (`scripts/ecosystems.js`) → read-only hop contract (`agents/researcher.md`) → mechanical gate in `flow.mjs` before any circle → two new exhibits (ST-14 gate, ST-15 registry).

**Tech stack:** plain Node (zero-npm-deps law), kit scripts.

**Spec:** `docs/design/2026-11-19-researcher-design.md` (approved by user 19.11).

## Global Constraints
- researcher NEVER guesses: undetected values go to `unknown: []` verbatim.
- researcher write-rights: ONLY `docs/factory-profile.md`.
- zero npm dependencies; engine scripts stay `node:*` imports only.
- gate = `existsSync('docs/factory-profile.md')` before circle; honest stop text must contain the exact hint `pnpm agent researcher`.
- profile frontmatter must parse with the same flat yaml-ish parser style used by eval.mjs (`schema:` first line).

## Review Focus
1. A project WITHOUT profile → factory must stop BEFORE hop spawn (no trace run, no cost). Pin: ST-14.
2. Registry must be data (add language = add entry) — assert no `if (lang ===` ladders; `node` entry is data. Pin: ST-15.
3. `unknown` law: a package.json WITHOUT lint script must produce `unknown` in the map, not a fallback `npm run lint`. Pin: ST-15 fixture.
4. Gate must not block when profile exists. Pin: ST-14 second case.
5. Researcher contract cannot Write outside docs/factory-profile.md. Pin: ST-15 tools-line assertion.

---

### Task 1: detector registry
**Files:** Create `scripts/ecosystems.js`; Test: self-tests.mjs ST-15.
- [ ] Step 1: write ST-15 (failing): fixtures package-lock.json + package.json WITH scripts → registry detects npm + commands; package.json WITHOUT lint → `unknown`; registry object is data (no `=== 'node'` ladders in detector code).
- [ ] Step 2: run self-tests → ST-15 RED.
- [ ] Step 3: implement `scripts/ecosystems.js`: exports `DETECTORS` (registry object) + `detect(root, fs)`: scans lockfiles (pnpm-lock.yaml → pnpm, package-lock.json → npm, yarn.lock → yarn), reads package.json scripts, maps install/lint/typecheck/test/build; missing → unknown; writes nothing.
- [ ] Step 4: run self-tests → ST-15 GREEN.
- [ ] Step 5: commit `feat(researcher): ecosystems registry v1 (facts, no guessing)`.

### Task 2: researcher contract
**Files:** Create `agents/researcher.md`.
- [ ] Step 1: write contract: frontmatter (model: rail-1 default deepseek-v4.1-flash; tools: Read,Glob,Write — write limited by OUTPUT PATH law to docs/factory-profile.md; body: instruction to run detectors via `node scripts/ecosystems.js` (print-only) and write ONE file with the artifact shape from the design doc, evidence lines, unknown law).
- [ ] Step 2: add assertions to ST-13-style source-law block (new ST-16): contract exists, tools line has no Bash, output path present.
- [ ] Step 3: self-tests GREEN; commit `feat(researcher): role contract (read-only + single artifact)`.

### Task 3: the gate
**Files:** Modify `scripts/flow.mjs` (top of main flow, before door resolution? — after task resolution, BEFORE planner hop and BEFORE sandbox creation); Test: ST-14.
- [ ] Step 1: ST-14 failing: extract gate block; behavioral: root without docs/factory-profile.md → `pnpm flow tasks/x.md` exits 1 BEFORE worktree creation (assert no `work/` dir); with profile → proceeds to planner hop attempt (stubby check optional; POSIX only, skip on win32 like ST-9).
- [ ] Step 2: run → RED (gate absent on gym-app-like flow).
- [ ] Step 3: implement gate: after `exit(1, usage...)` check `if (!existsSync(join(process.cwd(), 'docs', 'factory-profile.md'))) exit(1, 'PROFILE GATE: no docs/factory-profile.md - run: pnpm agent researcher (factory starts only with a project passport)');` — BEFORE sandbox/worktree, applies to door + file + --next paths (place before task-file existence check).
- [ ] Step 4: self-tests GREEN (kit flow gets profile? — kit dir has no docs/plans; add `docs/factory-profile.md` fixture check in runAgent helper + to kit repo as DEFAULT profile marked `ecosystem: node, unknown: []` so kit runs).
- [ ] Step 5: commit `feat(researcher): profile gate (factory refuses without passport)`.

### Task 4: default profile + board + sync
**Files:** Create `docs/factory-profile.md` (kit default: node/pnpm facts from kit reality); modify HANDOFF.md + roadmap board lines (researcher 1.5 → 🔧 IN FLIGHT → ✅ on green).
- [ ] Step 1: write default profile (kit = pnpm/vitest facts — from routing reality, no unknown).
- [ ] Step 2: full self-tests run → 13+3 GREEN; syntax check all changed scripts.
- [ ] Step 3: commit + push to `Aramex86/agentic-factory-kit` main; verify commit sha read-back.
- [ ] Step 4: update boards (kit + canonical) + HANDOFF queue line; user drops run-agent-independent files (flow + new files) to gym-app on next sync.
