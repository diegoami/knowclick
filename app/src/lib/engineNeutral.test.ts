// A rule about one subject belongs in its pack, so engine code may not name a
// subject. The names come from every pack's own `keywords`, so a new pack is covered
// by being there (LangClick2027's fixed list missed things: its #16), and from the
// subjects already planned. Test files are exempt: their fixtures may be real content.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
// Every package is scanned without being listed, so a new one can't escape.
const ENGINE_DIRS = [
	'app/src',
	...readdirSync(path.join(ROOT, 'packages')).map((name) => `packages/${name}/src`)
];

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const file = path.join(dir, name);
		if (statSync(file).isDirectory()) return sourceFiles(file);
		return /\.(ts|svelte|css|html)$/.test(name) && !/\.test\.ts$/.test(name) ? [file] : [];
	});
}

const PLANNED = [
	'azure',
	'aws',
	'gcp',
	'rust',
	'cargo',
	'powershell',
	'python',
	'neo4j',
	'cypher',
	'kafka',
	'langchain',
	'docker',
	'helm'
];
const fromPacks = readdirSync(path.join(ROOT, 'packs'))
	.filter((name) => statSync(path.join(ROOT, 'packs', name)).isDirectory())
	.flatMap(
		(name) =>
			(
				JSON.parse(readFileSync(path.join(ROOT, 'packs', name, 'pack.json'), 'utf8')) as {
					keywords: string[];
				}
			).keywords
	);
const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NAMED = new RegExp(`\\b(?:${[...PLANNED, ...fromPacks].map(escape).join('|')})\\b`, 'i');

describe('the check itself', () => {
	it('has every pack keyword in it', () => {
		expect(fromPacks.length).toBeGreaterThan(0);
		for (const word of fromPacks) expect(word.match(NAMED)?.[0]).toBe(word);
	});

	it.each(['Kubernetes', "'kubectl'", 'Azure', 'PowerShell', 'run on AWS'])(
		'catches %s',
		(text) => {
			expect(text.match(NAMED)).not.toBeNull();
		}
	);

	it.each(['package', 'trust', 'awesome', 'pythonic', 'lang="en"'])('leaves %s alone', (text) => {
		expect(text.match(NAMED)).toBeNull();
	});
});

describe('the engine', () => {
	const files = ENGINE_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir)));

	it('has source files to scan', () => {
		expect(files.length).toBeGreaterThan(10);
	});

	it.each(files.map((file) => [path.relative(ROOT, file), file]))(
		'%s names no subject',
		(_name, file) => {
			expect(readFileSync(file, 'utf8').match(NAMED)?.[0]).toBeUndefined();
		}
	);
});
