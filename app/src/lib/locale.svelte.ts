// The language the interface and the packs are read in. Interface strings live in
// locales/, outside the engine, so nothing here names a subject. Only English exists
// so far; the browser's language is used once a locale file for it is there.

import en from '../../../locales/en.json';

type Key = keyof typeof en;
type Strings = Record<Key, string>;

const FALLBACK = 'en';

const localeFiles = import.meta.glob<Strings>('../../../locales/*.json', {
	eager: true,
	import: 'default'
});
const locales: Record<string, Strings> = Object.fromEntries(
	Object.entries(localeFiles).map(([file, strings]) => [
		file.replace(/^.*\/(.+)\.json$/, '$1'),
		strings
	])
);

function browserLocale(): string {
	const wanted = typeof navigator === 'undefined' ? FALLBACK : navigator.language.split('-')[0];
	return locales[wanted] ? wanted : FALLBACK;
}

let current = $state<string>(browserLocale());

export function locale(): string {
	return current;
}

/** Interface text in the current language, with English behind any gap. */
export function t(key: Key, values: Record<string, string | number> = {}): string {
	const text = locales[current]?.[key] ?? en[key];
	return text.replace(/\{(\w+)\}/g, (whole, name: string) => `${values[name] ?? whole}`);
}

/** Tests only. */
export function useLocale(next: string = FALLBACK): void {
	current = next;
}
