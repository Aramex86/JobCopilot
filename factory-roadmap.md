# Factory Roadmap — phases & work items

> The structured board so nothing is forgotten. Narrative history lives in factory-changelog-*.md.
> CANON BOARD lives with the project (notes/gym-app/factory-roadmap.md); this kit copy mirrors it.
> Legend: ✅ done · 🔧 in flight · ⏳ queued · ⏳P pending-law (self-test red until built) · ❄ parked

## PHASE 1 — skeleton (✅ CLOSED)
- ✅ run-agent.mjs · AGENTS.md dispatcher · role contracts · trace black box · flow v1 · eval v1

## PHASE 2 — exam & honesty (✅ CLOSED)
- ✅ machine gates · verdict law · fix loop · golden task · SCOPE/plan-contract/secrets laws · escalation ladder

## PHASE 3 — senses, board, costs, docs (✅ CLOSED 17.11)
- ✅ trace v3 · telemetry · pnpm commands · HTML/auto report · committer in-console · flow-kit
- ✅ planner tournament · MCP transport (Stitch read · Notion read · sandbox copy)
- ✅ Notion door v2 · board descriptions · docs layer
- ✅ Copilot provider: rail #2 live, first full circle boarded-to-push (18 premium, opus 15x)
- ✅ tails CLOSED 18.11: Stitch advisory PATCH · DONE hygiene · door --next opener · f2e INSTALL dry-run (kit bugs fixed: .gitignore .env hole, idempotent append)

## PHASE 4 — self-service (🔧 OPEN, priority order)
- 1. ✅ self-tests #1 — CLOSED 19.11 on kit: scripts/self-tests.mjs
      (12/12 green · <4s · no models; source-law + behavioral stubs;
      copy-to-main + identity laws built to close the last two reds;
      transfer to owner machine pending)
- 1.5 ✅ RESEARCHER v1 — CLOSED 19.11 (design+plan in docs/design/):
      ecosystems.js registry (node facts, unknown[], data-not-ladders,
      detector CLI) · agents/researcher.md (read-only, one artifact) ·
      PROFILE GATE in flow (no passport = honest stop before hops);
      self-tests 16/16; any language later = new registry entry.
      Gym-app engine sync needed (flow.mjs + 2 new files).
- 1.2 ✅ PM-PROFILE CARD — CLOSED 19.11 (native): scripts/profile.mjs
        (passport reader, flat frontmatter, _source flag, pnpm defaults
        law = backward compat) · 5 consumers passport-driven:
        role allowedTools rewrite (pnpm-grammar tokens -> project PM
        grammar, identity on pnpm) · flow install · eval install ·
        trace GATE_RE (dynamic from passport commands) · check-agents-md
        lockfile laws (profile lockfile, other locks must be absent);
        ST-17 (npm fixture detects npm world + no-passport default +
        consumer source law); 17/17 green. Windows sync pending.
- 1.3 ⏳ INSTALL-GUARD — adopt-not-stomp (INSTALL v0 cpSync-overwrites foreign
        AGENTS.md/agents): inventory → conflict report → Y per conflict
        (adopt-theirs/factory-owns/merge); factory into .factory/; commit rules =
        project's own via profile.
        ⚠ CRASH TEST #1 19.11 (VPS leg, JobCopilot python/uv): БАГ найден —
        INSTALL.mjs молча умирает при неинтерактивном stdin (createInterface
        на readableEnded stdin крушит IIFE до единственной копии). Устойчивый
        обход: `printf '\n' | node INSTALL.mjs <target>` (VPS verify) / GUI-пайпы
        юзера = тот же риск. Фикс: readableEnded-проверка первой + argv --name;
        copy-закон вшивается в тот же PR.
- 1.5 ⏳ RESEARCHER agent (new-project bootstrap): read-only scan →
       docs/factory-profile.md (lang/toolchain/PM/test/lint/commit rules) → Y;
       profile schema shared with 1.2 + 1.3
- 2. ⏳ doctor agent (report-only) + door-factory (presets: notion → openproject/github)
       └ lessons: per-project docs/factory-lessons.md; global only on user command;
          every closed bug → lesson + self-test exhibit
- 2.5 ⏳ AUTO-ADLC loop (LangSmith pattern, ported LOCALLY): trace → issues clustering,
       regression watch, closed bug auto-экспонат + scoreboard row
- 2.5 ⏳ DESIGN SKINS: designer exports Figma frames PNG → tasks/<name>/design/*.png
- 3. ⏳ unified Y-gate · remote TG Y-gate · batch mode
       └ TUI TERMINAL PRESENCE: V1 mini status-bar (~1h) · V2 4-pane (~3-4h) ·
          V3 TG-mirror (~2h); pure ANSI (zero-npm-deps law)
- 4. ⏳ RESUME flag · 5. ⏳ sandbox autosync + artifact copy-to-main (⏳P ST-7)
- 6. ⏳ eval:run-all in kit · skins cycle into circles

## BUDGET LAW (hard)
- development budget: $100/month (~$3.3/day)
- rail #1 circle ≈ $3-7 · rail #2: sonnet circle ≈ 4 premium, opus circle = 18 premium
- plans via sonnet/deepseek by default; opus only for complex plans (≤2-3/mo)
- ✅ FALLBACK PLANNER PROVEN 19.11: deepseek dies on weekly credits →
  planner = kimi-k2.7-code (golden PASS 274s, 0 fixes, $0.41 plan leg;
  kimi-k3.1-pro rejected: $2/$10 per 1M too expensive)
- ✅ FULL CIRCLE on kimi-k2.7-code (all roles) = PASS 274s · $1.14 —
  cheapest proven circle; benchmark «rail #1 circle ≈ $3-7» → kimi ≈ $1.1

## PARKED (❄)
- PLAN-SCORE in eval (parked by user 19.11): mechanical answer-key
  grade of the plan -> scoreboard column; A/B legs may revive it
- PLANNER ROUTER — tiered planner routing (user idea 19.11, from GPT-6.2
  Astra/Sol two-model-router pattern): L0 routine → deepseek rail #1 ·
  L1 default → sonnet (4 premium) · L2 complex → opus (18 premium, ≤2-3/mo);
  tier field on task card (human sets, researcher may propose read-only
  later); agents-pipeline.yaml 3 planner profiles + flow.mjs reads tier;
  default L0 backward-compat; ~2-4h when scheduled
- CLI independence (user idea 18.11): 3-path spike card (opencode rail /
  own minimal runner / hybrid); own runner honest but harness-risk on
  flash models; revisit if Anthropic/VS Code dependency actually bites
- designer role (read-only Stitch consult) · parallel reviewers ·
  Playwright e2e hop · durable sessions · Graphify spike (zero-network)
- identity law enforcement (⏳P ST-8): committer must run with repo-local
  user.name/email — documented in README-INSTALL, engine guard pending
