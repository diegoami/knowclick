#!/usr/bin/env node
// Prepares one checker's record for a pack: every piece of content, with the exact
// text it has now, so a checker fills in verdicts and copies nothing by hand. A
// verdict survives only while the content it judged is unchanged. Copied from
// LangClick2027 (591043e).
//
//   node scripts/pack-check.mjs kubernetes claude-sonnet-5-5           # write or update the record
//   node scripts/pack-check.mjs kubernetes claude-sonnet-5-5 --pending # list what still needs a verdict

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { checkTargets } from '../packages/pack-format/src/index.ts';
import { packDir, readJson, readPack } from './read-pack.mjs';

const [packId, checker, flag] = process.argv.slice(2);
if (!packId || !checker) {
	console.error('Usage: node scripts/pack-check.mjs <pack> <checker> [--pending]');
	process.exit(1);
}

const { manifest, units, tasks, layers, coverage } = readPack(packId);
const file = path.join(packDir(packId), 'checks', `${checker}.json`);
const previous = existsSync(file) ? readJson(file) : { entries: [] };
const byKey = new Map(previous.entries.map((entry) => [entry.key, entry]));

const entries = checkTargets(manifest, units, tasks, layers, coverage).map(({ key, seen }) => {
	const old = byKey.get(key);
	if (old?.seen === seen) return old;
	return { key, seen, verdict: 'pending' };
});

mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, `${JSON.stringify({ checker, entries }, null, '\t')}\n`);

const pending = entries.filter((entry) => entry.verdict === 'pending');
const problems = entries.filter((entry) => entry.verdict === 'problem');
console.log(
	`${checker}: ${entries.length} entries, ${pending.length} pending, ${problems.length} problems`
);
if (flag === '--pending') for (const entry of pending) console.log(entry.key);
