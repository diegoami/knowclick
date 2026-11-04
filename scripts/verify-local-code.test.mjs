import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const helper = fileURLToPath(new URL('./verify-local-code.mjs', import.meta.url));
function verify(mode, input) {
	return spawnSync(process.execPath, [helper, mode], { input, encoding: 'utf8' });
}

test('compiles Rust and executes its assertions', () => {
	const passed = verify('rust', 'fn main() { assert_eq!(2 + 2, 4); }');
	assert.equal(passed.status, 0, passed.stderr);
	assert.equal(passed.stdout.trim(), 'verified');
	const failed = verify('rust', 'fn main() { assert_eq!(2 + 2, 5); }');
	assert.notEqual(failed.status, 0);
});

test('rejects a Rust ownership error rather than recording a pass', () => {
	const result = verify(
		'rust',
		'fn main() { let a = String::from("x"); let b = a; println!("{a}{b}"); }'
	);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /E0382/);
});

test('Bicep must compile and expose the expected parameter reference', () => {
	const passed = verify(
		'bicep',
		'param location string = resourceGroup().location\noutput selectedLocation string = location'
	);
	assert.equal(passed.status, 0, passed.stderr);
	assert.equal(passed.stdout.trim(), 'compiled');
	const wrongOutput = verify(
		'bicep',
		"param location string\noutput selectedLocation string = 'x'"
	);
	assert.notEqual(wrongOutput.status, 0);
	assert.match(wrongOutput.stderr, /Expected a location parameter/);
});

test('rejects an unsupported compiler mode', () => {
	assert.notEqual(verify('unknown', '').status, 0);
});
