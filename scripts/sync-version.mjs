#!/usr/bin/env node
// Single source of truth for the project version: the root package.json.
// Propagates it to the app's manifest and the lockfile. Desktop and Android builds
// will add their manifests, as Geoclick2027's version of this script does.
//
//   node scripts/sync-version.mjs --check    # exit 1 if any file disagrees
//   node scripts/sync-version.mjs            # propagate the root version
//   node scripts/sync-version.mjs 0.2.0      # set the root version, then propagate
//   node scripts/sync-version.mjs 0.2.0-beta.1

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION_RE = /^\d+\.\d+\.\d+(?:-(?:alpha|beta)\.\d+)?$/;

const argv = process.argv.slice(2);
const check = argv.includes('--check');
const explicit = argv.find((a) => !a.startsWith('--'));
if (explicit && !VERSION_RE.test(explicit)) {
	console.error(`"${explicit}" is not a version: use X.Y.Z, X.Y.Z-alpha.N or X.Y.Z-beta.N.`);
	process.exit(1);
}

const read = (file) => JSON.parse(readFileSync(path.join(REPO_ROOT, file), 'utf8'));
const version = explicit ?? read('package.json').version;

// Each entry: the file, and the objects inside it that carry the version.
const TARGETS = [
	['package.json', (json) => [json]],
	['app/package.json', (json) => [json]],
	['package-lock.json', (json) => [json, json.packages[''], json.packages.app]]
];

let disagreements = 0;
for (const [file, holders] of TARGETS) {
	const json = read(file);
	const carriers = holders(json);
	const stale = carriers.filter((holder) => holder.version !== version);
	if (stale.length === 0) continue;
	if (check) {
		console.error(`${file}: ${stale[0].version}, expected ${version}`);
		disagreements++;
		continue;
	}
	for (const holder of carriers) holder.version = version;
	const indent = file === 'package-lock.json' ? 2 : '\t';
	writeFileSync(path.join(REPO_ROOT, file), `${JSON.stringify(json, null, indent)}\n`);
	console.log(`${file} -> ${version}`);
}

if (disagreements > 0) process.exit(1);
if (check) console.log(`All manifests at ${version}.`);
