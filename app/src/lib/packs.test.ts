// The gate on pack content: every pack on disk must pass the validator, its recorded
// checks and its recorded verification. Data-driven, so a new pack is covered by
// being there.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	checkTargets,
	localizeUnit,
	validateChecks,
	validateCoverage,
	validatePack,
	validateVerified,
	verifyJobs,
	type ContentCheck,
	type Coverage,
	type CourseText,
	type Layers,
	type PackManifest,
	type Task,
	type TaskText,
	type Unit,
	type UnitText,
	type VerifyRecord
} from '@knowclick/pack-format';
import { attemptMatch, createQuizSession } from '@knowclick/quiz-engine';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PACKS = path.join(ROOT, 'packs');

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const readIf = <T>(file: string): T | undefined =>
	existsSync(file) ? readJson<T>(file) : undefined;

function readDir<T>(dir: string): T[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((name) => name.endsWith('.json'))
		.map((name) => readJson<T>(path.join(dir, name)));
}

function readLayers(packDir: string): Layers {
	const dir = path.join(packDir, 'layers');
	const layers: Layers = {};
	for (const name of existsSync(dir) ? readdirSync(dir) : []) {
		const unitsDir = path.join(dir, name, 'units');
		layers[name] = {
			course: readIf<CourseText>(path.join(dir, name, 'course.json')) ?? {},
			tasks: readIf<Record<string, TaskText>>(path.join(dir, name, 'tasks.json')) ?? {},
			units: Object.fromEntries(
				(existsSync(unitsDir) ? readdirSync(unitsDir) : []).map((file) => [
					file.replace(/\.json$/, ''),
					readJson<UnitText>(path.join(unitsDir, file))
				])
			)
		};
	}
	return layers;
}

const packIds = readdirSync(PACKS).filter((name) => statSync(path.join(PACKS, name)).isDirectory());

describe('the packs folder', () => {
	it('has at least one pack', () => {
		expect(packIds.length).toBeGreaterThan(0);
	});
});

describe.each(packIds)('pack %s', (packId) => {
	const packDir = path.join(PACKS, packId);
	const manifest = readJson<PackManifest>(path.join(packDir, 'pack.json'));
	const units = readDir<Unit>(path.join(packDir, 'units'));
	const tasks = readIf<Task[]>(path.join(packDir, 'tasks.json')) ?? [];
	const layers = readLayers(packDir);
	const coverage = readDir<Coverage>(path.join(packDir, 'coverage'));
	const checks = readDir<ContentCheck>(path.join(packDir, 'checks'));
	const verified = readIf<VerifyRecord>(path.join(packDir, 'verified.json'));

	it('is named for its folder', () => {
		expect(manifest.id).toBe(packId);
	});

	it('passes the validator', () => {
		expect(validatePack(manifest, units, tasks, layers)).toEqual([]);
	});

	it.each(coverage.map((entry) => [entry.id, entry] as const))(
		'maps curriculum %s to units and tasks that exist',
		(_id, entry) => {
			expect(validateCoverage(entry, units, tasks)).toEqual([]);
		}
	);

	it('has all its content passed by the required independent checks', () => {
		expect(validateChecks(checkTargets(manifest, units, tasks, layers, coverage), checks)).toEqual(
			[]
		);
	});

	it('has every runnable answer verified as it now stands', () => {
		expect(validateVerified(verifyJobs(units), verified)).toEqual([]);
	});

	it('fails the validator when a unit file goes missing', () => {
		expect(validatePack(manifest, units.slice(1), tasks, layers)).not.toEqual([]);
	});

	it('fails the validator when a task goes missing', () => {
		if (tasks.length === 0) return;
		expect(validatePack(manifest, units, tasks.slice(1), layers)).not.toEqual([]);
	});

	it.each(units.map((unit) => [unit.id, unit] as const))(
		'unit %s fails the validator when a cell is removed',
		(_id, unit) => {
			const holed = { ...unit, cells: unit.cells.slice(1) };
			expect(
				validatePack(manifest, [holed, ...units.filter((u) => u !== unit)], tasks, layers)
			).not.toEqual([]);
		}
	);

	it.each(units.map((unit) => [unit.id, unit] as const))(
		'unit %s fails verification once an answer changes',
		(_id, unit) => {
			const jobs = verifyJobs(units);
			if (!jobs.some((job) => job.key.startsWith(`verify/${unit.id}`))) return;
			const changed = {
				...unit,
				cells: unit.cells.map((cell, i) => (i === 0 ? { ...cell, text: `${cell.text}x` } : cell))
			};
			const others = units.filter((u) => u !== unit);
			expect(validateVerified(verifyJobs([changed, ...others]), verified)).not.toEqual([]);
		}
	);

	it.each(units.map((unit) => [unit.id, unit] as const))(
		'unit %s accepts either slip of an answer shared by two cells',
		(_id, unit) => {
			for (const a of unit.cells) {
				for (const b of unit.cells) {
					if (a === b || a.text !== b.text) continue;
					const session = createQuizSession(
						unit.cells.map((cell) => ({ id: cell.id, text: cell.text }))
					);
					expect(attemptMatch(session, a.id, b.id).outcome).toEqual({
						kind: 'correct',
						cellId: b.id
					});
				}
			}
			expect(unit.cells.length).toBeGreaterThan(0);
		}
	);

	it.each(manifest.explanations)('explained in %s, no grid or line cell lacks a clue', (name) => {
		for (const unit of units) {
			const local = localizeUnit(unit, layers[name].units[unit.id], layers[name].course);
			if (local.layout.type !== 'grid' && local.layout.type !== 'lines') continue;
			expect(local.cells.filter((cell) => !cell.clue).map((cell) => cell.id)).toEqual([]);
		}
	});
});
