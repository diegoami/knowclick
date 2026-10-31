// Reads one pack from packs/<id>/ as plain data, for the scripts that work on packs.
// The app reads packs through its own PackSource, and the gate through packs.test.ts.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const readIf = (file, fallback) => (existsSync(file) ? readJson(file) : fallback);
const jsonIn = (dir) =>
	existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.json')) : [];

export function packDir(packId) {
	return path.join(ROOT, 'packs', packId);
}

export function readPack(packId) {
	const dir = packDir(packId);
	if (!existsSync(path.join(dir, 'pack.json'))) {
		throw new Error(`No pack "${packId}" in packs/`);
	}
	const layers = {};
	for (const name of readdirSync(path.join(dir, 'layers'))) {
		const layerDir = path.join(dir, 'layers', name);
		layers[name] = {
			course: readIf(path.join(layerDir, 'course.json'), {}),
			tasks: readIf(path.join(layerDir, 'tasks.json'), {}),
			units: Object.fromEntries(
				jsonIn(path.join(layerDir, 'units')).map((file) => [
					file.replace(/\.json$/, ''),
					readJson(path.join(layerDir, 'units', file))
				])
			)
		};
	}
	return {
		manifest: readJson(path.join(dir, 'pack.json')),
		units: jsonIn(path.join(dir, 'units')).map((file) => readJson(path.join(dir, 'units', file))),
		tasks: readIf(path.join(dir, 'tasks.json'), []),
		coverage: jsonIn(path.join(dir, 'coverage')).map((file) =>
			readJson(path.join(dir, 'coverage', file))
		),
		layers
	};
}
