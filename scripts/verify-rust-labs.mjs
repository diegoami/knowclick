#!/usr/bin/env node
// Execute the original lab solutions directly from their Markdown source.
// Optional verify-rust JSON comments describe expected diagnostics or CLI I/O.
// Run with rustc 1.99.1 on PATH. No network, dependencies or cloud accounts.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = spawnSync('rustc', ['--version'], { encoding: 'utf8' });
if (version.status !== 0 || !version.stdout.startsWith('rustc 1.99.1 ')) {
	throw new Error('Lab verification requires rustc 1.99.1 on PATH');
}
let passed = 0;
for (const file of ['rust-labs.md', 'rust-depth-labs.md', 'rust-core-labs.md']) {
	const markdown = readFileSync(path.join(root, 'docs/courses', file), 'utf8');
	const blocks = [
		...markdown.matchAll(/(?:<!-- verify-rust: (.*?) -->\s*)?```rust\n([\s\S]*?)\n```/g)
	];
	if (blocks.length === 0) throw new Error(`${file}: no Rust solutions found`);
	for (const [index, match] of blocks.entries()) {
		const options = JSON.parse(match[1] ?? '{}');
		const code = match[2];
		const dir = mkdtempSync(path.join(tmpdir(), 'knowclick-lab-'));
		const label = `${file} solution ${index + 1}`;
		const tests = /#\[test\]/.test(code);
		const binary = path.join(dir, 'solution');
		function run(command, args, input) {
			const result = spawnSync(command, args, {
				cwd: dir,
				encoding: 'utf8',
				input,
				timeout: 30_000,
				maxBuffer: 1024 * 1024
			});
			if (result.error) throw result.error;
			return result;
		}
		function compile(asTests) {
			return run('rustc', [
				'--edition=2024',
				'-D',
				'warnings',
				...(asTests ? ['--test'] : []),
				'solution.rs',
				'-o',
				binary
			]);
		}
		function execute(input) {
			const result = run(binary, [], input);
			if (result.status !== 0) throw new Error(`${label}: ${result.stdout}${result.stderr}`);
			return result.stdout;
		}
		try {
			writeFileSync(path.join(dir, 'solution.rs'), code);
			const compiled = compile(tests);
			if (options.error) {
				if (compiled.status === 0 || !compiled.stderr.includes(`error[${options.error}]`)) {
					throw new Error(`${label}: expected compiler error ${options.error}; ${compiled.stderr}`);
				}
			} else {
				if (compiled.status !== 0) throw new Error(`${label}: ${compiled.stderr}`);
				const output = execute();
				if (tests && !/test result: ok\. [1-9]\d* passed/.test(output)) {
					throw new Error(`${label}: no passing tests reported`);
				}
				if (options.stdin !== undefined) {
					// A CLI solution can contain tests; verify its executable too.
					const cli = compile(false);
					if (cli.status !== 0) throw new Error(`${label}: ${cli.stderr}`);
					const actual = execute(options.stdin);
					if (actual !== options.stdout)
						throw new Error(`${label}: unexpected CLI output ${JSON.stringify(actual)}`);
				}
			}
			if (options.cargo) {
				if (options.cargo !== 'bin' || options.error) {
					throw new Error(`${label}: Cargo verification supports successful binary projects`);
				}
				const initialized = run('cargo', [
					'init',
					'--offline',
					'--vcs',
					'none',
					'--edition',
					'2024',
					'--bin',
					'--name',
					'knowclick_lab',
					'.'
				]);
				if (initialized.status !== 0) throw new Error(`${label}: ${initialized.stderr}`);
				writeFileSync(path.join(dir, 'src', 'main.rs'), code);
				for (const command of ['check', 'build', 'test', 'run']) {
					const result = run('cargo', [command, '--offline', '--quiet'], options.stdin);
					if (result.status !== 0)
						throw new Error(`${label}: cargo ${command}: ${result.stdout}${result.stderr}`);
					if (command === 'test' && !/test result: ok\. [1-9]\d* passed/.test(result.stdout)) {
						throw new Error(`${label}: Cargo reported no passing tests`);
					}
					if (
						command === 'run' &&
						options.stdout !== undefined &&
						result.stdout !== options.stdout
					) {
						throw new Error(
							`${label}: unexpected Cargo executable output ${JSON.stringify(result.stdout)}`
						);
					}
				}
			}
			console.log(`PASS  ${label}${options.error ? ` (expected ${options.error})` : ''}`);
			passed += 1;
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}
}
console.log(`${passed} lab solutions verified against ${version.stdout.trim()}`);
