import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuizSession, attemptTyped } from '@knowclick/quiz-engine';
import { forgetRound, rememberRound, roundInProgress, roundSignature } from './quizRound';
import type { LocalUnit } from '@knowclick/pack-format';
const unit: LocalUnit = {
	id: 'u',
	title: '',
	summary: '',
	sources: [],
	layout: { type: 'grid', size: 1 },
	cells: [{ id: 'a', item: 'fact:a', text: 'answer', clue: 'Question', conceptDetails: [] }]
};
const key = 'knowclick:round:v2:p:u';
const round = () => ({
	session: createQuizSession([{ id: 'a', text: 'answer' }]),
	hand: ['a'],
	size: 10,
	signature: roundSignature(unit),
	choiceOrder: ['wrong', 'answer']
});
beforeEach(() => {
	const data = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => data.set(k, v),
		removeItem: (k: string) => data.delete(k)
	});
	forgetRound('p', 'u');
});
describe('durable quiz rounds', () => {
	it('restores validated state, exact choices and completed rounds', () => {
		const r = round();
		r.session = attemptTyped(r.session, 'a', 'answer').session;
		r.hand = [];
		rememberRound('p', 'u', r);
		expect(roundInProgress('p', 'u', r.signature)).toEqual(r);
		expect(JSON.parse(localStorage.getItem(key)!).session.items[0].status).toBe('correct');
	});
	it('separates packs and modes and supports an explicit restart', () => {
		rememberRound('p', 'u', round());
		rememberRound('p', 'u#type', { ...round(), hand: [], draft: 'ans', askedId: 'a' });
		expect(roundInProgress('another', 'u')).toBeUndefined();
		forgetRound('p', 'u');
		expect(roundInProgress('p', 'u')).toBeUndefined();
		expect(roundInProgress('p', 'u#type')?.draft).toBe('ans');
	});
	it('rejects corrupt snapshots and facts that changed', () => {
		localStorage.setItem(key, '{bad');
		expect(roundInProgress('p', 'u')).toBeUndefined();
		localStorage.setItem(key, JSON.stringify({ ...round(), hand: ['missing'] }));
		expect(roundInProgress('p', 'u')).toBeUndefined();
		rememberRound('p', 'u', round());
		expect(
			roundInProgress(
				'p',
				'u',
				roundSignature({ ...unit, cells: [{ ...unit.cells[0], text: 'changed' }] })
			)
		).toBeUndefined();
		const bad = round();
		bad.session.items[0].cell.text = 'wrong';
		localStorage.setItem(key, JSON.stringify(bad));
		expect(roundInProgress('p', 'u', roundSignature(unit))).toBeUndefined();
	});
	it('keeps a volatile round if writes fail but reads are available', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => null,
			setItem: () => {
				throw Error('quota');
			},
			removeItem: () => {}
		});
		rememberRound('quota', 'u', round());
		expect(roundInProgress('quota', 'u')?.choiceOrder).toEqual(['wrong', 'answer']);
		forgetRound('quota', 'u');
	});

	it('returns copies so callers cannot mutate saved rounds accidentally', () => {
		rememberRound('p', 'u', round());
		roundInProgress('p', 'u')!.session.items[0].status = 'revealed';
		expect(roundInProgress('p', 'u')!.session.items[0].status).toBe('pending');
	});
	it('keeps navigation working when storage is blocked', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw Error('blocked');
			},
			setItem: () => {
				throw Error('blocked');
			},
			removeItem: () => {
				throw Error('blocked');
			}
		});
		rememberRound('p', 'u', round());
		expect(roundInProgress('p', 'u')?.hand).toEqual(['a']);
		forgetRound('p', 'u');
		expect(roundInProgress('p', 'u')).toBeUndefined();
	});
});
