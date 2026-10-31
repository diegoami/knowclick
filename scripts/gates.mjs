#!/usr/bin/env node
// The four quality gates: typecheck, tests, lint, build. The pre-push hook and
// the milestone steps run this, and there is no CI: it is the gate.
//
//   node scripts/gates.mjs            # stream everything
//   node scripts/gates.mjs --quiet    # PASS lines, or the tail of what failed
//
// A failing gate's whole output goes to rendered/gates-last-failure.log.

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GATES = ['check', 'test', 'lint', 'build'];
const TAIL_CHARS = 4000;
const quiet = process.argv.includes('--quiet');

for (const gate of GATES) {
	const started = Date.now();
	const run = spawnSync(`npm run ${gate}`, {
		cwd: REPO_ROOT,
		// npm is npm.cmd on Windows, which only a shell can start.
		shell: true,
		encoding: 'utf8',
		maxBuffer: 256 * 1024 * 1024,
		stdio: quiet ? 'pipe' : 'inherit'
	});
	const seconds = Math.round((Date.now() - started) / 1000);
	if (run.status === 0) {
		console.log(`PASS  ${gate}  (${seconds}s)`);
		continue;
	}
	console.log(`FAIL  ${gate}  (${seconds}s)`);
	if (quiet) {
		const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
		const log = path.join(REPO_ROOT, 'rendered', 'gates-last-failure.log');
		mkdirSync(path.dirname(log), { recursive: true });
		writeFileSync(log, output);
		console.log(output.slice(-TAIL_CHARS));
		console.log(`Full output: ${path.relative(REPO_ROOT, log)}`);
	}
	process.exit(1);
}
