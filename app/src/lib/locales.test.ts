import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LOCALES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../locales');
const read = (name: string) =>
	JSON.parse(readFileSync(path.join(LOCALES, name), 'utf8')) as Record<string, string>;
const en = read('en.json');
const others = readdirSync(LOCALES).filter((name) => name !== 'en.json');

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('English, the fallback', () => {
	it('has no empty string', () => {
		expect(Object.entries(en).filter(([, text]) => !text.trim())).toEqual([]);
	});
});

describe.each(others)('locale %s', (name) => {
	const strings = read(name);

	it('has exactly the same keys as English', () => {
		expect(Object.keys(strings).sort()).toEqual(Object.keys(en).sort());
	});

	it('uses the same placeholders as English in every string', () => {
		for (const key of Object.keys(en)) {
			expect(placeholders(strings[key]), key).toEqual(placeholders(en[key]));
		}
	});

	it('has no empty string', () => {
		expect(Object.entries(strings).filter(([, text]) => !text.trim())).toEqual([]);
	});
});
