#!/usr/bin/env node
// Prints how a pack covers each curriculum it maps: every domain and competency, with
// the units and tasks that cover it, and what nothing covers yet.
//
//   node scripts/coverage.mjs kubernetes

import { readPack } from './read-pack.mjs';

const [packId] = process.argv.slice(2);
if (!packId) {
	console.error('Usage: node scripts/coverage.mjs <pack>');
	process.exit(1);
}

for (const curriculum of readPack(packId).coverage) {
	const competencies = curriculum.domains.flatMap((domain) => domain.competencies);
	const covered = competencies.filter((c) => c.units.length + c.tasks.length > 0);
	console.log(
		`${curriculum.title} ${curriculum.version}: ${covered.length} of ${competencies.length} competencies covered`
	);
	for (const domain of curriculum.domains) {
		const done = domain.competencies.filter((c) => c.units.length + c.tasks.length > 0).length;
		const weight = Array.isArray(domain.weight) ? domain.weight.join('–') : domain.weight;
		console.log(`\n${weight}%  ${domain.title}  (${done} of ${domain.competencies.length})`);
		for (const c of domain.competencies) {
			const by = [...c.units.map((id) => `board ${id}`), ...c.tasks.map((id) => `task ${id}`)];
			console.log(
				`  ${by.length ? '✓' : '·'} ${c.title}${by.length ? `\n      ${by.join(', ')}` : ''}`
			);
		}
	}
}
