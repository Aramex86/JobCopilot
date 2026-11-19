# Researcher role — design (short)

date: 2026-11-19 · status: DRAFT for user approval · phase-4 item 1.5

## Intent & why
Factory is hardcoded to pnpm/vitest in 5 places; any non-pnpm project
(npm, Orange, future Java/Python) dies on all five. The RESEARCHER role
turns toolchain knowledge into a PASSPORT the factory reads instead of
assumptions: `docs/factory-profile.md`.

## Decided (user, 19.11)
- Researcher runs **on the user's order** (bootstrap): `pnpm agent researcher`.
- **Gate law**: flow does not start without a profile in the project —
  honest stop with the exact hint; profile missing on a *new* project =
  run researcher once. (variant C)
- **Depth 1** = Node world only (facts, no guessing). Multi-language is
  NOT dropped: detectors are a DATA registry — adding a language later
  means adding a registry entry, not rewriting the engine.

## Profile artifact (single write the researcher is allowed to make)
`docs/factory-profile.md` — human-readable MD with a flat frontmatter
block (machine-parsed, same style as golden answer keys):

```yaml
---
schema: 1
ecosystem: node
package_manager: npm
install: npm ci
lint: npm run lint
typecheck: npm run typecheck
test: npm run test
build: npm run build
lockfile: package-lock.json
commit_rules: none | husky | conventional | (detected)
structure: fsaa-layers | free
unknown: []        # honest list: what could not be detected, human fills
---
# human-readable body: what was seen, evidence per line
```

## Laws
- researcher is READ-ONLY except the profile artifact (tool contract).
- researcher NEVER guesses: an unfilled value goes to `unknown:[]`
  verbatim; the human fills it or the circle fails honestly.
- gate = mechanical (existsSync), zero tokens, <1ms.
- profile present but WRONG (stale commands) = circle fails normally;
  the doctor territory later; the profile carries `schema:` for later
  migrations.

## Approaches considered
1. Bootstrap-only (user runs; factory trusts) — rejected: silent absence.
2. Auto-scan every circle — rejected: extra hop forever, surprise cost.
3. **Chosen: bootstrap + mechanical gate** — one-time scan, then the
   factory simply refuses to start without a passport; hint names the
   one command. Cheap, predictable, no forgetting.

## Scope of v1 build (this doc)
1. `scripts/ecosystems.js` — detector registry v1: node entry
   (lockfile→PM, package.json scripts→commands, layer dirs, husky).
   Extension point documented at the top of the file.
2. `agents/researcher.md` — contract: tools Read|Glob|Write(profile only),
   output path fixed, unknown[] law in the body.
3. flow.mjs gate before the circle: no profile -> honest stop + hint
   (`pnpm agent researcher`), applies to both door and file tasks.
4. self-tests: ST-14 gate (no profile = stop; profile = pass-through),
   ST-15 registry (node entry detects npm from package-lock fixture;
   registry is data, not hardcoded if-ladder).
5. Consumers (roles/5 pnpm sites reading the profile) = NEXT item 1.2 —
   out of scope here; v1 only guarantees the gate + the artifact.

Non-goals: guessing commands, silent pnpm fallback, Windows-specific
scan paths, auto-refresh of stale profiles.
