import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rate } from '@knowclick/srs';
import { LocalStorageProgressRepository, todayLocalDate, type Card } from './progressRepository';

const KEY = 'knowclick:progress:v1:test:cards';

function fakeStorage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => void values.set(key, value)
	};
}

const card = (itemId: string, skill: Card['skill'] = 'recognise'): Card => ({
	...rate(undefined, 'good', '2026-10-31'),
	itemId,
	skill
});

describe('LocalStorageProgressRepository', () => {
	const repository = new LocalStorageProgressRepository();

	beforeEach(() => {
		vi.stubGlobal('localStorage', fakeStorage());
	});

	it('reads nothing when nothing is saved', async () => {
		expect(await repository.getCards('test')).toEqual([]);
	});

	it('saves a card, and a new instance reads it back as after a reload', async () => {
		await repository.saveCard('test', card('a'));
		expect(await new LocalStorageProgressRepository().getCards('test')).toEqual([card('a')]);
	});

	it('replaces the card for the same item and skill, and keeps the rest', async () => {
		await repository.saveCard('test', card('a'));
		await repository.saveCard('test', card('b'));
		await repository.saveCard('test', { ...card('a'), cleanStreak: 2 });
		const cards = await repository.getCards('test');
		expect(cards).toHaveLength(2);
		expect(cards.find((c) => c.itemId === 'a')?.cleanStreak).toBe(2);
	});

	it('keeps one card per skill for the same item', async () => {
		await repository.saveCard('test', card('a', 'recognise'));
		await repository.saveCard('test', card('a', 'produce'));
		expect(await repository.getCards('test')).toHaveLength(2);
	});

	it('keeps packs apart', async () => {
		await repository.saveCard('test', card('a'));
		expect(await repository.getCards('other')).toEqual([]);
	});

	it.each([
		['unparseable text', '{not json'],
		['the wrong shape', '{"itemId":"a"}']
	])('reads %s as nothing saved', async (_name, stored) => {
		localStorage.setItem(KEY, stored);
		expect(await repository.getCards('test')).toEqual([]);
	});

	it('drops a malformed card and keeps the good one', async () => {
		localStorage.setItem(KEY, JSON.stringify([card('a'), { itemId: 'b' }]));
		expect(await repository.getCards('test')).toEqual([card('a')]);
	});

	it('survives a localStorage that throws', async () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('full');
			}
		});
		expect(await repository.getCards('test')).toEqual([]);
		await expect(repository.saveCard('test', card('a'))).resolves.toBeUndefined();
	});
});

describe('studied lessons', () => {
	const repository = new LocalStorageProgressRepository();

	beforeEach(() => {
		vi.stubGlobal('localStorage', fakeStorage());
	});

	it('reads none when none are saved, and reads back what was saved', async () => {
		expect(await repository.getStudied('test')).toEqual([]);
		await repository.saveStudied('test', ['l1', 'l2']);
		expect(await new LocalStorageProgressRepository().getStudied('test')).toEqual(['l1', 'l2']);
		expect(await repository.getStudied('other')).toEqual([]);
	});

	it('reads junk as none, and survives a localStorage that throws', async () => {
		localStorage.setItem('knowclick:progress:v1:test:studied', '{not json');
		expect(await repository.getStudied('test')).toEqual([]);
		localStorage.setItem('knowclick:progress:v1:test:studied', '"text"');
		expect(await repository.getStudied('test')).toEqual([]);
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('full');
			}
		});
		expect(await repository.getStudied('test')).toEqual([]);
		await expect(repository.saveStudied('test', ['l1'])).resolves.toBeUndefined();
	});
});

describe('todayLocalDate', () => {
	it('is a calendar date', () => {
		expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
