#!/usr/bin/env node
// Compile pack-supplied code in a fresh temporary directory. No deployment,
// package downloads or account access. Run from the repository root.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const mode = process.argv[2];
if (mode === 'guard') {
	console.log('local-only');
} else {
	if (!['rust', 'bicep'].includes(mode)) throw new Error('Expected rust, bicep or guard');
	const dir = mkdtempSync(path.join(tmpdir(), 'knowclick-code-'));
	function run(command, args) {
		const result = spawnSync(command, args, {
			cwd: dir,
			encoding: 'utf8',
			timeout: 30_000,
			maxBuffer: 1024 * 1024
		});
		if (result.error || result.status !== 0) {
			throw new Error(`${command}: ${result.error ?? result.stderr ?? result.stdout}`);
		}
		return result.stdout;
	}
	try {
		const input = readFileSync(0, 'utf8');
		if (mode === 'rust') {
			writeFileSync(path.join(dir, 'main.rs'), input);
			run('rustc', ['--edition=2024', '-D', 'warnings', 'main.rs', '-o', 'example']);
			run(path.join(dir, 'example'), []);
			console.log('verified');
		} else {
			writeFileSync(path.join(dir, 'main.bicep'), input);
			run('bicep', ['build', 'main.bicep', '--outfile', 'main.json']);
			const template = JSON.parse(readFileSync(path.join(dir, 'main.json'), 'utf8'));
			if (
				template.parameters?.location?.type !== 'string' ||
				template.outputs?.selectedLocation?.value !== "[parameters('location')]"
			) {
				throw new Error('Expected a location parameter and an output referencing it');
			}
			console.log('compiled');
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
