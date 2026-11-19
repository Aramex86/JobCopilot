#!/usr/bin/env node
// self-tests.mjs - the engine examines itself. Phase-4 item #1 (board law).
// NO model calls, NO network, NO git needed: every exhibit tests the REAL
// engine source (behavioral where the code is extractable, source-law
// assertions where the code is wired into a spawn tree only a live circle
// can reach). Runs anywhere node runs, in seconds.
//
// Usage: node scripts/self-tests.mjs [ST-1] [...]
// Exit:  0 all green · 1 any red · PENDING exhibits never count as red.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = dirname(dirname(fileURLToPath(import.meta.url)));
const src = (p) => {
  const s = readFileSync(join(KIT, p), 'utf8').replace(/\r\n/g, '\n'); // CRLF-immune: win git autocrlf must not red the exhibits
  if (!s) throw new Error(`empty source: ${p}`);
  return s;
};
/** slice source BETWEEN two unique-ish markers, including both ends */
const snap = (text, from, to) => {
  const a = text.indexOf(from);
  if (a < 0) throw new Error(`anchor not found: ${from.slice(0, 40)}`);
  const b = text.indexOf(to, a + from.length);
  if (b < 0) throw new Error(`end anchor not found: ${to.slice(0, 40)}`);
  return text.slice(a, b + to.length);
};
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const results = [];
async function exhibit(id, title, fn, opts = {}) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ id, title, ok: true, ms: Date.now() - t0, pending: false });
  } catch (e) {
    const msg = e?.message || String(e);
    const skip = msg.startsWith('SKIP');
    const pending = !!opts.pending;
    results.push({ id, title, ok: false, ms: Date.now() - t0, pending, skip, err: msg });
  }
}

// ------------------------------------------------------------------
// ST-1 VERDICT WINDOW - flow.mjs verdict(): whole-file, top-down,
// own-line only (<=48 chars), first hit wins; 5-line head word-search
// fallback; default FAIL (honest stop). Regression root: 17.11 escape bug.
// ------------------------------------------------------------------
await exhibit('ST-1', 'verdict window (flow own-line law)', () => {
  const s = src('scripts/flow.mjs');
  const fn = snap(s, 'const verdict = (file, cwd) => {', 'return (head.match(/\\b(PASS|FAIL)\\b/i)?.[1] || "FAIL").toUpperCase();\n};');
  const verdict = new Function('readFileSync', `${fn}; return verdict;`)(
    (_f, _e) => CONTENT,
  );
  let CONTENT;
  const call = (lines) => { CONTENT = lines.join('\n'); return verdict('docs/plans/x-report.md'); };

  // a) top-down: first own-line hit wins (FAIL before PASS)
  assert(call(['FAIL - nope', 'PASS - all green']) === 'FAIL', 'a: top-down first-hit lost');
  // b) narrative sentence (>48) containing FAIL is NOT a verdict
  assert(call(['l'.repeat(80) + ' FAIL', 'PASS - all gates green']) === 'PASS', 'b: long line leaked into verdict');
  // c) fallback: word-search only in the first 5 lines
  assert(call(['Verdict: PASS', '', '', '', '', 'PASS - line6']) === 'PASS', 'c: fallback missed head word');
  // d) fallback does NOT scan beyond head: own-line absent (PASS too deep
  //    inside a >48 narrative) -> honest FAIL
  assert(call(['', '', '', '', '', 'x'.repeat(60) + ' PASS deep']) === 'FAIL', 'd: fallback scanned past head');
  // e) unreadable/empty report = FAIL (honest stop law)
  assert(call([]) === 'FAIL', 'e: empty report not FAIL');
  // f) short own-line tail allowed: "PASS - all gates green"
  assert(call(['PASS - all gates green']) === 'PASS', 'f: short tail rejected');
  // g) narrative FAIL within the head, no own-line verdict anywhere -> FAIL
  assert(call(['ok', 'x'.repeat(60) + ' FAIL', 'nothing here']) === 'FAIL', 'g: narrative FAIL ignored by fallback');
  // h) \b boundary: "PASSED 3 gates" is NOT an own-line verdict (word-boundary law:
  //    the 17.11 escape bug made \b eat itself -> "PASSED..." would flip the verdict)
  assert(call(['PASSED 3 gates', 'FAIL - real bug']) === 'FAIL', 'h: PASSED-prefix line hijacked verdict');
});

// ------------------------------------------------------------------
// ST-2 DOOR STDOUT CONTRACT - notion-door ends stdout with exactly
// `door resolved: <path>`; flow.mjs parses that pipe: strip prefix,
// keep only lines starting tasks/, LAST one wins (pop).
// ------------------------------------------------------------------
await exhibit('ST-2', 'door stdout contract (pipe both sides)', () => {
  const door = src('scripts/notion-door.mjs');
  // exactly one console.log writer of the contract line (docstring mentions excluded)
  assert((door.match(/console\.log\(`door resolved:/g) || []).length === 1, 'door: contract writer not unique');
  // ...and it is the LAST console.log of main (after any status moves)
  const lastLog = door.lastIndexOf('console.log');
  assert(door.slice(lastLog).startsWith("console.log(`door resolved:"), 'door: resolved line not last stdout');
  assert(door.indexOf('console.log(`door resolved:') > door.indexOf('door: dry'), 'door: contract before dry branch?');

  // flow side: parse logic exercised as extracted code, both call sites
  const flow = src('scripts/flow.mjs');
  const parse = (block) => new Function('r', `let task=''; ${block}; return task;`);
  const fakeR = (lines) => ({ stdout: { toString: () => lines.join('\n') } });
  const expect = (block, lines, want) => {
    const got = parse(block)(fakeR(lines));
    assert((got ?? '') === want, `parse produced ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  };
  const b1 = snap(flow, 'const out = r.stdout', 'task = out.pop();');
  const b2start = flow.indexOf('const outn = r.stdout');
  const b2 = flow.slice(b2start, flow.indexOf('task = outn.pop();', b2start) + 'task = outn.pop();'.length);
  assert(b2.includes('outn.pop()'), 'next-mode block missing (flow --next parse not found)');
  for (const [tag, block] of [['id-mode', b1], ['next-mode', b2]]) {
    expect(block, ['door: card = "X" (To Do)', 'door resolved: tasks/a.md'], 'tasks/a.md');
    // junk noise must not become the task; only tasks/ lines pass
    expect(block, ['door resolved: tasks/a.md', 'door: noise tasks/wrong', 'door resolved: tasks/b.md'], 'tasks/b.md');
    // empty parse -> empty task -> usage stop (honest)
    expect(block, ['door: card = "X"'], '');
  }
  // stale-residue guard: pop() semantics = LAST resolved, not first
  assert(b2.length > 0, 'next-mode block missing');
});

// ------------------------------------------------------------------
// ST-3 .mcp.json -> SANDBOX - MCP config is untracked: flow copies it
// into a fresh worktree (never silent-loss), WITHOUT overwriting an
// existing one, and only when the source exists.
// ------------------------------------------------------------------
await exhibit('ST-3', '.mcp.json copied into sandbox (no overwrite)', () => {
  const flow = src('scripts/flow.mjs');
  const block = snap(flow, '// MCP: .mcp.json is untracked', 'console.log("mcp config copied into sandbox");');
  assert(block.includes('existsSync(mcpSrc)'), 'guard: must check source exists');
  assert(block.includes("if (!existsSync(dstM))") , 'no-overwrite law missing (existing sandbox config must win)');
  assert(block.includes('copyFileSync(mcpSrc, dstM)'), 'copy action missing');
  assert(block.includes('console.log("mcp config copied into sandbox")'), 'no copy evidence line');
});

// ------------------------------------------------------------------
// ST-4 TOOL WALL - git mutations denied for EVERY role on BOTH rails;
// tester keeps its Write right (report) while the wall stands.
// ------------------------------------------------------------------
await exhibit('ST-4', 'tool wall (git mutations denied) + tester Write right', () => {
  const run = src('scripts/run-agent.mjs');
  for (const verb of ['commit', 'push', 'merge', 'checkout', 'reset', 'rebase'])
    assert(run.includes(`Bash(git ${verb}:*)`) || run.includes(`'shell(git ${verb}:*)'`),
      `claude DENY lacks git ${verb}`);
  for (const verb of ['commit', 'push', 'merge'])
    assert(run.includes(`'shell(git ${verb}:*)'`), `rail #2 DENY lacks git ${verb}`);
  // tester right: contract frontmatter grants Write (report writing)
  const tester = src('agents/tester.md');
  const toolsLine = tester.split('\n').find((l) => l.startsWith('tools:'));
  assert(!!toolsLine && /\bWrite\b/.test(toolsLine), 'tester.md frontmatter lost the Write right');
  // committer is mechanical: the TOOL runs git, never the hop (flow side)
  const flow = src('scripts/flow.mjs');
  const csFlat = snap(flow, 'async function committerStep', 'FINISH (human)').replace(/\s/g, '');
  assert(csFlat.includes('spawnSync("git"'), 'TOOL must hold the git spawn');
  assert(csFlat.includes('"commit","-m",msg'), 'TOOL commit lost');
  assert(csFlat.includes('hop(["committer","-i",report]'), 'committer hop missing (proposal only)');
});

// ------------------------------------------------------------------
// ST-5 ARTIFACT CONTRACT - run-agent derives the expected artifact per
// role (planner -plan / tester -report with -plan stripped / committer
// -commit) and the machine gate exits 2 when it is missing after a hop.
// ------------------------------------------------------------------
await exhibit('ST-5', 'artifact contract + machine gate (missing = exit 2)', () => {
  const run = src('scripts/run-agent.mjs');
  assert(run.includes("role === 'planner' && baseName ? `docs/plans/${baseName}-plan.md`"), 'planner autoOut lost');
  assert(run.includes("role === 'tester'  && baseName ? `docs/plans/${baseName}-report.md`"), 'tester autoOut lost');
  assert(run.includes(".replace(/-plan$/, '')"), '-plan strip lost (tester would get -plan-report)');
  assert(run.includes('exit(2, `machine gate: expected artifact missing: ${out}`)'), 'machine gate no longer exits 2');
  // mkdir law: artifact dir pre-created before the hop spawns
  assert(run.includes('mkdirSync(path.dirname(path.join(process.cwd(), out)'), 'mkdir law lost');
});

// ------------------------------------------------------------------
// ST-6 RAILS - model routing rail facts: agents frontmatter (rail #1)
// must NEVER override the copilot table (rail #2) - first combat
// incident 17.11 (unknown glm id on rail #2).
// ------------------------------------------------------------------
await exhibit('ST-6', 'rail routing: frontmatter loses to copilot table', () => {
  const run = src('scripts/run-agent.mjs');
  const sel = snap(run, 'const model = process.env.RUN_MODEL', 'rail: ${cliEarly})`);'.replace('R', ''));
  assert(sel.includes("cliEarly === 'copilot' ? null : contractModel(role)"), 'frontmatter must NOT resolve on rail #2');
  assert(sel.includes('table[role]'), 'rail table lost');
  // both rails reachable: PIPELINE_CLI switch exists
  assert(run.includes("process.env.PIPELINE_CLI || ") !== false, 'rail switch lost');
});

// ------------------------------------------------------------------
// ST-7 DOCS/PLANS COPY-TO-MAIN LAW - artifact copy back to main after
// merge. QUEUED (board 4.6): the law is not implemented yet. The
// exhibit is honest PENDING: it turns green the day flow.mjs learns
// copy-to-main (TDD style - red now, green when built).
// ------------------------------------------------------------------
await exhibit('ST-7', 'copy-to-main law: artifacts survive worktree removal', () => {
  const flow = src('scripts/flow.mjs');
  assert(flow.includes('copy-to-main'), 'law not implemented in flow.mjs');
  const block = snap(flow, 'COPY-TO-MAIN LAW', 'copied to the main checkout');
  assert(block.includes('String(cwd) !== process.cwd()'), 'copy must fire only out of the sandbox');
  assert(block.includes('copyFileSync'), 'the TOOL must do the copy (agents never move artifacts)');
  assert(block.includes('readdirSync(plansSrc)'), 'full docs/plans copy, not cherry-pick');
});

// ------------------------------------------------------------------
// ST-8 IDENTITY LAW - repo-local user.name/email set BEFORE committer
// (enterprise rails hijack authorship, 17.11: amend --reset-author
// caught the hijack). Documented in README-INSTALL, NOT enforced by
// the engine yet -> honest PENDING; green the day flow.mjs asserts
// git config user identity before the committer Y.
// ------------------------------------------------------------------
await exhibit('ST-8', 'identity law: committer pinned to repo identity', () => {
  const flow = src('scripts/flow.mjs');
  const block = snap(flow, 'IDENTITY LAW', 'git commit failed');
  assert(block.includes('user.name') && block.includes('user.email'), 'identity lookup lost');
  assert(block.includes('-c') && block.includes('user.name=${identName}'), 'commit must PIN identity via -c (hijack-proof)');
  assert(block.includes('IDENTITY LAW: set repo git config'), 'honest missing-identity stop lost');
  // the commit itself is spawned by the TOOL, never by an agent hop
  const flat = block.replace(/\s/g, '');
  assert(flat.includes('spawnSync("git"'), 'TOOL must hold the identity-pinned commit');
  assert(flat.includes('"-c",`user.name=${identName}`') && flat.includes('"-c",`user.email=${identMail}`'), '-c pinning lost');
});

// ------------------------------------------------------------------
// BEHAVIORAL SANDBOX HELPERS - real run-agent, fake CLI binary.
// Works where PATH-stub executables work (Linux/macOS); on Windows
// spawn without shell cannot run a fake .cmd -> honest SKIP there.
// ------------------------------------------------------------------
import { mkdtempSync, writeFileSync as wf, existsSync as ex, mkdirSync as mkdirSync2, chmodSync, readdirSync, copyFileSync as copyFile } from 'node:fs';
import { spawn, spawnSync as ss } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const SKIP = process.platform === 'win32';

const makeSandbox = (cliName, stub) => {
  const root = mkdtempSync(join(tmpdir(), 'factory-st-'));
  const bin = join(root, 'bin');
  mkdirSync2(bin);
  wf(join(bin, cliName), stub, { mode: 0o755 });
  chmodSync(join(bin, cliName), 0o755);
  // the run-agent tree: scripts + agents (contract frontmatter is read live)
  for (const d of ['scripts', 'agents']) {
    mkdirSync2(join(root, d));
    for (const f of readdirSync(join(KIT, d)))
      if (f.endsWith('.mjs') || f.endsWith('.md')) copyFile(join(KIT, d, f), join(root, d, f));
  }
  mkdirSync2(join(root, 'tasks'));
  return root;
};
const runAgent = async (root, extraEnv = {}, args = ['tester', '-i', 'tasks/x.md'], cwd = root) => {
  const env = {
    ...process.env,
    PATH: join(root, 'bin') + ':' + process.env.PATH,
    PIPELINE_CLI: 'copilot',
    RUN_MODEL: 'stub-model',
    STUB_ARTIFACT: '1',
    ...extraEnv,
  };
  const child = spawn(process.execPath, [join(root, 'scripts', 'run-agent.mjs'), ...args], { cwd, env });
  const stdout = [], stderr = [];
  child.stdout.on('data', (d) => stdout.push(d.toString()));
  child.stderr.on('data', (d) => stderr.push(d.toString()));
  const code = await new Promise((res) => child.on('exit', res));
  return { code, out: stdout.join('') + '\n[stderr]\n' + stderr.join(''), child };
};

const COPILOT_STUB = `#!/bin/sh
# records argv, proves stdin EOF state, optional delay, writes the artifact
printf '%s\n' "$@" > "$STUB_DIR/argv.txt"
n=\$(dd if=/dev/stdin count=1 2>/dev/null | wc -c || echo err)
printf '%s' "\$n" > "\$STUB_DIR/eof.txt"
if [ -n "\$STUB_DELAY" ]; then sleep "\$STUB_DELAY"; fi
if [ -n "\$STUB_ARTIFACT" ]; then
  mkdir -p docs/plans
  printf 'PASS - stub artifact\n' > docs/plans/x-report.md
fi
exit 0`;

const spawnStubEnv = (root) => {
  const dir = join(root, 'stub-ctl');
  mkdirSync2(dir);
  return {
    dir,
    env: { STUB_DIR: dir },
    argvTxt: () => readFileSync(join(dir, 'argv.txt'), 'utf8'),
    eofTxt: () => (ex(join(dir, 'eof.txt')) ? readFileSync(join(dir, 'eof.txt'), 'utf8') : null),
  };
};

// ------------------------------------------------------------------
// ST-9 RAIL #2 TRANSPORT - direct spawn (no cmd.exe wrapper), argv
// prompt joins -p (multiline survives), stdin reaches EOF instantly,
// honest 30k guard BEFORE any spawn. Combat roots 17.11: cmd multiline
// argv hang + stdin without EOF blocked forever.
// ------------------------------------------------------------------
await exhibit('ST-9', 'rail #2 transport: direct spawn, argv multiline, EOF, 30k guard', async () => {
  if (SKIP) throw new Error('SKIP (win32): fake CLI stub needs POSIX spawn - verified on POSIX runs');
  const root = makeSandbox('copilot', COPILOT_STUB);
  const sdb = spawnStubEnv(root);
  wf(join(root, 'tasks', 'x.md'), 'MULTILINE_BODY_TEST\nsecond line of the task\n');
  const r = await runAgent(root, sdb.env);
  assert(r.code === 0, `run-agent exited ${r.code}: ${r.out.slice(-400)}`);
  assert(r.out.includes('artifact ok'), 'artifact gate did not pass on stub run');
  const argvTxt = sdb.argvTxt();
  assert(argvTxt.includes('-p') && argvTxt.includes('MULTILINE_BODY_TEST') && argvTxt.includes('second line'),
    'multiline prompt LOST in argv transport');
  assert(sdb.eofTxt() === '0', `stdin did not EOF immediately (stub read ${sdb.eofTxt()} bytes)`);
  // 30k honest guard: fires BEFORE spawn (no stub evidence), exit 3
  const big = 'z'.repeat(31000);
  wf(join(root, 'tasks', 'x.md'), big);
  const r2 = await runAgent(root, { ...sdb.env }, ['tester', '-i', 'tasks/x.md']);
  assert(r2.code === 3 && r2.out.includes('prompt too long'), '30k guard missing or silent truncation risk');
});

// ------------------------------------------------------------------
// ST-10 KILL-SWITCH - .pipeline-stop in repo root kills the live hop
// within seconds, exit 130, and the switch file is cleaned up.
// ------------------------------------------------------------------
await exhibit('ST-10', 'kill-switch: .pipeline-stop kills hop (exit 130)', async () => {
  if (SKIP) throw new Error('SKIP (win32): behavioral kill test needs POSIX stub');
  const root = makeSandbox('copilot', COPILOT_STUB);
  const sdb = spawnStubEnv(root);
  wf(join(root, 'tasks', 'x.md'), 'kill me\n');
  const env = { ...process.env, ...sdb.env, PATH: join(root, 'bin') + ':' + process.env.PATH, PIPELINE_CLI: 'copilot', RUN_MODEL: 'stub-model', STUB_DELAY: '25' };
  const child = spawn(process.execPath, [join(root, 'scripts', 'run-agent.mjs'), 'tester', '-i', 'tasks/x.md'], { cwd: root, env });
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, 1500)); // let the hop go live
  wf(join(root, '.pipeline-stop'), 'stop');
  const code = await new Promise((res) => child.on('exit', res));
  const took = Date.now() - t0;
  assert(code === 130, `kill-switch exit ${code}, want 130`);
  assert(took < 6000, `kill too slow: ${took}ms`);
  assert(!ex(join(root, '.pipeline-stop')), 'switch file not cleaned up');
});

// ------------------------------------------------------------------
// ST-11 HOP TIMEOUT - PIPELINE_HOP_TIMEOUT(seconds) bounds every hop,
// exit 124: an orphan can never burn again (the minimax incident law).
// ------------------------------------------------------------------
await exhibit('ST-11', 'hop timeout bounds live hop (exit 124)', async () => {
  if (SKIP) throw new Error('SKIP (win32): behavioral timeout test needs POSIX stub');
  const root = makeSandbox('copilot', COPILOT_STUB);
  const sdb = spawnStubEnv(root);
  wf(join(root, 'tasks', 'x.md'), 'too slow\n');
  const t0 = Date.now();
  const r = await runAgent(root, { ...sdb.env, STUB_DELAY: '20', PIPELINE_HOP_TIMEOUT: '1' });
  const took = Date.now() - t0;
  assert(r.code === 124, `timeout exit ${r.code}, want 124`);
  assert(r.out.includes('HOP TIMEOUT'), 'honest message lost');
  assert(took < 8000, `timeout enforcement too slow: ${took}ms`);
});

// ------------------------------------------------------------------
// ST-12 STALE WORKTREE - eval never trusts a reused sandbox: unregister
// + force-remove the worktree AND the zombie dir on disk before the run
// (combat: junction-without-.bin and dirty history drag). If the dir
// survives -> honest stop naming the cure (close editors).
// ------------------------------------------------------------------
await exhibit('ST-12', 'stale sandbox: zombie worktree removed, honest stop if held', () => {
  const ev = src('scripts/eval.mjs');
  assert(ev.includes("['worktree', 'prune']"), 'worktree prune lost');
  assert(ev.includes("'remove', '--force', '--force'"), 'double-force unregister lost');
  assert(ev.includes('rmSync(') && ev.includes('recursive: true, force: true'), 'zombie-dir removal lost');
  assert(ev.includes('EVAL WARN') && ev.includes('removed stale sandbox dir'), 'no evidence lines for the removal');
  assert(ev.includes('cannot delete stale sandbox dir - close editors holding it'), 'honest hold-stop lost');
});

// ------------------------------------------------------------------
// ST-13 QUIP BANK - second slot under the spinner: rotates ~7s, lives
// only while the hop is alive, NEVER displaces the tail/timer line.
// ------------------------------------------------------------------
await exhibit('ST-13', 'quip bank: same-line slot, ~7s rotation, no cursor juggling', () => {
  const run = src('scripts/run-agent.mjs');
  assert(run.includes('const QUIPS') && run.includes('untangling spaghetti'), 'quip bank lost');
  for (const role of ['planner', 'developer', 'tester', 'committer'])
    assert(run.includes(`${role}:`), `bank empty for ${role}`);
  assert(run.includes('/ 7000'), '7s rotation law lost');
  assert(run.includes('quip: "${quip}"'), 'quip segment lost');
  // anti-jump law: single-line render, no 1A cursor dance (19.11 win32 artifact)
  assert(!run.includes('\x1b[1A'), 'two-line cursor return RETURNED (jump artifact)');
  // data law: tail + timer keep their own segment; tail trims to width
  assert(run.includes('last: ') && run.includes('/ 400) % frames.length'), 'spinner/tail law drifted');
  assert(run.includes('tailBudget'), 'width-aware tail trim lost');
});

// ------------------------------------------------------------------
// ST-15 ECOSYSTEMS REGISTRY - detectors are DATA; detection reads facts
// only; anything unfindable goes to unknown[] (never guessed).
// ------------------------------------------------------------------
await exhibit('ST-15', 'ecosystems registry: facts only, unknown law, data-not-ladders', async () => {
  const ecosystems = src('scripts/ecosystems.js');
  assert(ecosystems.includes('export const DETECTORS'), 'registry export lost');
  assert(!/===\s*'(?:node|npm|java)'\s*\)/.test(ecosystems), 'detector ladder inside engine (registry must be data)');
  const { DETECTORS, detect } = await import(pathToFileURL(join(KIT, 'scripts', 'ecosystems.js')).href);
  assert(Object.keys(DETECTORS).includes('node'), 'node entry missing from registry');
  // fixture A: npm repo with lint+test, no build script
  const fa = mkdtempSync(join(tmpdir(), 'eco-a-'));
  wf(join(fa, 'package.json'), JSON.stringify({ scripts: { lint: 'eslint .', test: 'vitest run' } }));
  wf(join(fa, 'package-lock.json'), '{}');
  const a = detect(fa, { existsSync: ex, readFileSync: readFileSync, join });
  assert(a.ecosystem === 'node' && a.package_manager === 'npm', 'fixture A: pm misdetected');
  assert(a.install === 'npm ci', 'npm install template lost');
  assert(a.lint === 'npm run lint' && a.test === 'npm run test', 'script commands lost');
  assert((a.unknown || []).includes('build'), 'missing build script must land in unknown[]');
  assert((a.unknown || []).includes('typecheck'), 'missing typecheck script must land in unknown[]');
  // fixture B: pnpm repo
  const fb = mkdtempSync(join(tmpdir(), 'eco-b-'));
  wf(join(fb, 'package.json'), JSON.stringify({ scripts: { build: 'vite build' } }));
  wf(join(fb, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0\n');
  const b = detect(fb, { existsSync: ex, readFileSync: readFileSync, join });
  assert(b.package_manager === 'pnpm' && b.install.includes('pnpm'), 'pnpm detection/template lost');
  // fixture C: no match at all -> null (honest), never a guess
  const fc = mkdtempSync(join(tmpdir(), 'eco-c-'));
  assert(detect(fc, { existsSync: ex, readFileSync: readFileSync, join }) === null, 'no-match must be null, not a guess');
});

// ------------------------------------------------------------------
// ST-16 RESEARCHER CONTRACT - read-only role, single artifact, exact
// finish line; facts come from the detector, never from the model.
// ------------------------------------------------------------------
await exhibit('ST-16', 'researcher contract: read-only + one artifact + finish line', () => {
  const md = src('agents/researcher.md');
  const toolsLine = md.split('\n').find((l) => l.startsWith('tools:'));
  assert(!!toolsLine, 'researcher.md: no tools line');
  assert(toolsLine.includes('Bash(node scripts:*)'), 'researcher must run the detector CLI only');
  assert(!/Bash\((?!node)/.test(toolsLine), 'researcher has non-node Bash rights (read-only law broken)');
  assert((md.match(/^output:\s*docs\/factory-profile\.md$/m) || []).length === 1, 'output path not pinned');
  const writes = (md.match(/factory-profile\.md/g) || []).length;
  assert(writes >= 3, 'artifact path mentions lost');
  assert(!/git (commit|push|merge)/.test(md), 'researcher must not touch git mutations');
  assert(md.includes('NEVER'), 'no-guessing law not stated in the contract');
  assert(md.includes('profile written: docs/factory-profile.md'), 'finish line lost');
});

// ------------------------------------------------------------------
// ST-14 PROFILE GATE - the factory refuses to start without a passport:
// honest exit BEFORE any hop/spawn/cost, with the exact rescue command.
// ------------------------------------------------------------------
await exhibit('ST-14', 'profile gate: no passport = honest stop before hops', async () => {
  const flow = src('scripts/flow.mjs');
  assert(flow.includes('PROFILE GATE'), 'gate missing in flow.mjs (law not built or renamed)');
  // behavioral: real flow, no profile -> stop with hint, zero worktrees
  if (process.platform === 'win32') throw new Error('SKIP (win32): behavioral flow gate verified on POSIX runs');
  const root = mkdtempSync(join(tmpdir(), 'gate-smoke-'));
  for (const d of ['scripts', 'agents']) {
    mkdirSync2(join(root, d));
    for (const f of readdirSync(join(KIT, d)))
      if (/\.(mjs|md|js)$/.test(f)) copyFile(join(KIT, d, f), join(root, d, f));
  }
  mkdirSync2(join(root, 'tasks'));
  wf(join(root, 'tasks', 'x.md'), 't\n');
  const run = () => {
    const r = ss(process.execPath, ['scripts/flow.mjs', 'tasks/x.md'], { cwd: root, encoding: 'utf8' });
    return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
  };
  let r = run();
  assert(r.code === 1 && r.out.includes('PROFILE GATE') && r.out.includes('run-agent.mjs researcher'), `no-profile stop wrong: ${r.out.slice(-200)}`);
  assert(!ex(join(root, 'work')), 'gate must fire BEFORE sandbox creation (no work dir)');
  // passport present -> gate passes (flow proceeds to its next law, NOT the gate)
  mkdirSync2(join(root, 'docs'));
  wf(join(root, 'docs', 'factory-profile.md'), '---\nschema: 1\n---\n# passport\n');
  r = run();
  assert(!r.out.includes('PROFILE GATE'), 'gate fired WITH valid passport (blocked wrongly)');
});

// ------------------------------------------------------------------
// ST-17 PM FROM PASSPORT - package manager and commands come from the
// passport, not from habit; no passport = pnpm defaults (backward compat).
// ------------------------------------------------------------------
await exhibit('ST-17', 'passport-driven PM: npm world works, absence = pnpm default', async () => {
  assert(src('scripts/profile.mjs').includes('export function getProfile'), 'profile module missing');
  const { getProfile } = await import(pathToFileURL(join(KIT, 'scripts', 'profile.mjs')).href);
  const fsT = { readFileSync, existsSync: ex, join };
  // fixture: npm passport present
  const fa = mkdtempSync(join(tmpdir(), 'pm-a-'));
  mkdirSync2(join(fa, 'docs'));
  wf(join(fa, 'docs', 'factory-profile.md'), '---\nschema: 1\npackage_manager: npm\ninstall: npm ci\nlint: npm run lint\ntest: npm run test\ntypecheck: npm run typecheck\nbuild: npm run build\nlockfile: package-lock.json\n---\n# x\n');
  const a = getProfile(fa, fsT);
  assert(a.package_manager === 'npm' && a.install === 'npm ci', 'passport npm fields lost');
  assert(a.lint === 'npm run lint' && a._source === 'profile', 'passport commands/flag lost');
  // fixture: no passport -> pnpm defaults (backward compat law)
  const fb = mkdtempSync(join(tmpdir(), 'pm-b-'));
  const b = getProfile(fb, fsT);
  assert(b.package_manager === 'pnpm' && b.install.includes('pnpm install'), 'pnpm defaults lost');
  assert(b.lint === 'pnpm lint' && b._source === 'default', 'default flag lost');
  // engine wiring: the 5 consumers now read the profile (source law)
  const flow = src('scripts/flow.mjs');
  assert(flow.includes('getProfile') && !flow.includes('spawnSync(\n    "pnpm",'), 'flow install still hardcoded pnpm');
  assert(src('scripts/eval.mjs').includes('getProfile'), 'eval not passport-driven');
  assert(src('scripts/trace.mjs').includes('getProfile'), 'GATE_RE not passport-driven');
  assert(src('scripts/check-agents-md.mjs').includes('getProfile'), 'lockfile law not passport-driven');
  const run = src('scripts/run-agent.mjs');
  assert(run.includes('getProfile') && run.includes('rewriteTools'), 'allowedTools not passport-driven');
});

// ------------------------------------------------------------------
// ST-18 PYTHON WORLD: uv/poetry/pip facts from lockfiles, tool-section
// command facts only, honest unknown for the rest (JobCopilot crash test).
// ------------------------------------------------------------------
await exhibit('ST-18', 'python detect: uv/poetry/pip lockfile facts, tool-section commands, honest unknown', async () => {
  const reg = await import(pathToFileURL(join(KIT, 'scripts', 'ecosystems.js')).href);
  const fsT = { readFileSync, existsSync: ex, join };
  // uv world (JobCopilot shape): uv.lock + pyproject with uv_build, no py tools
  const fa = mkdtempSync(join(tmpdir(), 'py-a-'));
  wf(join(fa, 'pyproject.toml'), '[project]\nname = "x"\n[build-system]\nrequires = ["uv_build>=0.12.11,<0.13.0"]\n');
  wf(join(fa, 'uv.lock'), '');
  const a = reg.detect(fa, fsT);
  assert(a && a.ecosystem === 'python' && a.package_manager === 'uv', 'uv world missed');
  assert(a.install === 'uv sync --frozen' && a.build === 'uv build', 'uv install/build facts lost');
  assert(a.unknown.includes('lint') && a.unknown.includes('test'), 'honest unknown lost for absent tool sections');
  // poetry + pytest/mypy sections
  const fb = mkdtempSync(join(tmpdir(), 'py-b-'));
  wf(join(fb, 'pyproject.toml'), '[tool.poetry]\n[tool.pytest.ini_options]\n[tool.mypy]\n');
  wf(join(fb, 'poetry.lock'), '');
  const b = reg.detect(fb, fsT);
  assert(b.package_manager === 'poetry' && b.test === 'pytest' && b.typecheck === 'mypy', 'poetry/tool facts lost');
  assert(b.unknown.includes('build'), 'build honesty lost');
  // bare requirements.txt = pip, commands all unknown
  const fc = mkdtempSync(join(tmpdir(), 'py-c-'));
  wf(join(fc, 'requirements.txt'), 'langgraph>=1.2.11\n');
  const c = reg.detect(fc, fsT);
  assert(c.package_manager === 'pip' && c.install === 'pip install -r requirements.txt', 'pip fallback lost');
  // unknown world: no manifest at all -> detect null / package manager never guessed
  const fd = mkdtempSync(join(tmpdir(), 'py-d-'));
  assert(reg.detect(fd, fsT) === null, 'empty world must be null');
});

// ------------------------------------------------------------------
// report: honest board style
// ------------------------------------------------------------------
const green = results.filter((r) => r.ok);
const red = results.filter((r) => !r.ok && !r.pending && !r.skip);
const pend = results.filter((r) => !r.ok && r.pending);
const skip = results.filter((r) => r.skip);
const ms = results.reduce((a, r) => a + r.ms, 0);
console.log('\n# Self-tests (engine examines itself, no models)');
const bar = '='.repeat(62);
console.log(bar);
for (const r of results) {
  const mark = r.ok ? '\u2705' : (r.pending ? '\u23f3' : (r.skip ? '\u23ed' : '\u274c'));
  console.log(` ${mark} ${r.id}  ${r.title}  (${r.ms}ms)`);
  if (!r.ok) console.log(`     ${r.err}`);
}
console.log(bar);
console.log(` green: ${green.length}/${results.length}${pend.length ? `  pending: ${pend.length}` : ''}${skip.length ? `  skip: ${skip.length}` : ''}${red.length ? `  RED: ${red.length}` : ''}  · ${(ms / 1000).toFixed(2)}s total`);
if (red.length) {
  console.log(' DRIFT against the laws - engine code moved, exhibits caught it.');
  process.exit(1);
}
