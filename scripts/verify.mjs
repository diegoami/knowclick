#!/usr/bin/env node
// Runs every runnable answer in a pack and records the result in
// packs/<id>/verified.json, so that a check that runs content backs up the checks
// that read it. The gates read the record; only this script needs the sandbox.
//
//   node scripts/verify.mjs kubernetes             # run everything, write the record
//   node scripts/verify.mjs kubernetes --stale     # only what changed since the record
//
// The commands are the pack's data. Before anything else, the pack's guard must
// succeed and match, which keeps this off anything but a disposable sandbox.

import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { verifyJobs, verifySeen } from '../packages/pack-format/src/index.ts';
import { packDir, readJson, readPack } from './read-pack.mjs';

const [packId, flag] = process.argv.slice(2);
if (!packId) {
	console.error('Usage: node scripts/verify.mjs <pack> [--stale]');
	process.exit(1);
}

const { manifest, units } = readPack(packId);
if (!manifest.verify) {
	console.log(`${packId}: nothing to verify`);
	process.exit(0);
}

function run(command, stdin) {
	const result = spawnSync(command, {
		shell: '/bin/sh',
		input: stdin,
		encoding: 'utf8',
		timeout: 60_000
	});
	return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

const guard = run(manifest.verify.guard.run);
if (!guard.ok || !new RegExp(manifest.verify.guard.expect, 'm').test(guard.output)) {
	console.error(
		`Refusing to run: the guard "${manifest.verify.guard.run}" said "${guard.output}".`
	);
	console.error(`It must match ${manifest.verify.guard.expect}. See packs/README.md.`);
	process.exit(1);
}

const file = path.join(packDir(packId), 'verified.json');
const previous = existsSync(file) ? readJson(file) : { entries: [] };
const old = new Map(previous.entries.map((entry) => [entry.key, entry]));
const jobs = verifyJobs(units);
const todo =
	flag === '--stale' ? jobs.filter((job) => old.get(job.key)?.seen !== verifySeen(job)) : jobs;

// Nothing changed since the record: leave it as it is, so its date stays the date of a
// real run.
if (todo.length === 0) {
	console.log(`${packId}: nothing changed since the run of ${previous.ranOn}`);
	process.exit(0);
}

for (const command of manifest.verify.setup ?? []) {
	const result = run(command);
	if (!result.ok) {
		console.error(`Setup failed: ${command}\n${result.output}`);
		process.exit(1);
	}
}

const results = new Map();
for (const job of todo) {
	const result = run(job.run, job.stdin);
	const matched = job.expect === undefined || new RegExp(job.expect, 'm').test(result.output);
	const ok = result.ok && matched;
	results.set(job.key, {
		key: job.key,
		seen: verifySeen(job),
		ok,
		output: ok ? undefined : result.output
	});
	console.log(
		`${ok ? 'PASS' : 'FAIL'}  ${job.key}${ok ? '' : `\n      ${job.run}\n      ${result.output.split('\n').join('\n      ')}`}`
	);
}

for (const command of manifest.verify.teardown ?? []) run(command);

const server = run(manifest.verify.version ?? 'true');
const entries = jobs.map((job) => results.get(job.key) ?? old.get(job.key)).filter(Boolean);
const record = {
	ranAgainst: [guard.output, server.output].filter(Boolean).join(', '),
	ranOn: new Date().toISOString().slice(0, 10),
	entries
};
writeFileSync(file, `${JSON.stringify(record, null, '\t')}\n`);

const failed = [...results.values()].filter((entry) => !entry.ok);
console.log(
	`${packId}: ${results.size} run, ${failed.length} failed, against ${record.ranAgainst}`
);
process.exit(failed.length ? 1 : 0);
