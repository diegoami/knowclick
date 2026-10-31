import { describe, expect, it } from 'vitest';
import {
	attemptMatch,
	createQuizSession,
	isSessionComplete,
	pendingIds,
	scoreSession,
	type QuizCell
} from './index.js';

const cells: QuizCell[] = [
	{ id: 'dat', text: 'кімнаті' },
	{ id: 'loc', text: 'кімнаті' },
	{ id: 'acc', text: 'кімнату' }
];

const statusOf = (session: ReturnType<typeof createQuizSession>, id: string) =>
	session.items.find((item) => item.cell.id === id)?.status;

describe('createQuizSession', () => {
	it('creates one pending item per cell, in board order', () => {
		const session = createQuizSession(cells);
		expect(session.items.map((item) => item.cell.id)).toEqual(['dat', 'loc', 'acc']);
		expect(session.items.every((item) => item.status === 'pending' && item.errors === 0)).toBe(
			true
		);
	});
});

describe('attemptMatch', () => {
	it('fills the cell a slip belongs to', () => {
		const { session, outcome } = attemptMatch(createQuizSession(cells), 'acc', 'acc');
		expect(outcome).toEqual({ kind: 'correct', cellId: 'acc' });
		expect(statusOf(session, 'acc')).toBe('correct');
	});

	it.each([
		['dat', 'dat'],
		['dat', 'loc'],
		['loc', 'dat'],
		['loc', 'loc']
	])('accepts the shared form: slip %s on cell %s', (slip, cell) => {
		const { session, outcome } = attemptMatch(createQuizSession(cells), slip, cell);
		expect(outcome).toEqual({ kind: 'correct', cellId: cell });
		expect(statusOf(session, cell)).toBe('correct');
	});

	it('leaves the other cell of a shared form open for the slip still pending', () => {
		const first = attemptMatch(createQuizSession(cells), 'dat', 'loc');
		expect(pendingIds(first.session)).toEqual(['dat', 'acc']);
		const second = attemptMatch(first.session, 'dat', 'dat');
		expect(second.outcome).toEqual({ kind: 'correct', cellId: 'dat' });
		expect(statusOf(second.session, 'dat')).toBe('correct');
		expect(statusOf(second.session, 'loc')).toBe('correct');
	});

	it('ignores a slip whose own cell another equal slip has already filled', () => {
		const first = attemptMatch(createQuizSession(cells), 'dat', 'loc');
		expect(attemptMatch(first.session, 'loc', 'dat').outcome).toEqual({ kind: 'ignored' });
	});

	it("reveals the slip's own cell on a wrong drop and leaves the wrong cell open", () => {
		const { session, outcome } = attemptMatch(createQuizSession(cells), 'acc', 'dat');
		expect(outcome).toEqual({ kind: 'revealed', cellId: 'acc', droppedOnId: 'dat' });
		expect(statusOf(session, 'acc')).toBe('revealed');
		expect(statusOf(session, 'dat')).toBe('pending');
	});

	it.each([
		['outside the board', undefined],
		['an unknown cell', 'nowhere']
	])('ignores a drop on %s', (_name, target) => {
		const start = createQuizSession(cells);
		const { session, outcome } = attemptMatch(start, 'acc', target);
		expect(outcome).toEqual({ kind: 'ignored' });
		expect(session).toBe(start);
	});

	it('ignores a drop on a cell that is already filled', () => {
		const { session: filled } = attemptMatch(createQuizSession(cells), 'acc', 'acc');
		const { session, outcome } = attemptMatch(filled, 'dat', 'acc');
		expect(outcome).toEqual({ kind: 'ignored' });
		expect(statusOf(session, 'dat')).toBe('pending');
	});

	it('ignores a slip that is already resolved', () => {
		const { session: revealed } = attemptMatch(createQuizSession(cells), 'acc', 'dat');
		const { outcome } = attemptMatch(revealed, 'acc', 'dat');
		expect(outcome).toEqual({ kind: 'ignored' });
	});
});

describe('a whole round', () => {
	it('completes and scores', () => {
		let session = createQuizSession(cells);
		expect(pendingIds(session)).toEqual(['dat', 'loc', 'acc']);
		({ session } = attemptMatch(session, 'dat', 'loc'));
		({ session } = attemptMatch(session, 'dat', 'dat'));
		expect(isSessionComplete(session)).toBe(false);
		({ session } = attemptMatch(session, 'acc', 'acc'));
		expect(isSessionComplete(session)).toBe(true);
		expect(scoreSession(session)).toEqual({ total: 3, perfect: 3, totalErrors: 0 });
	});

	it('counts a revealed cell as an error, not as perfect', () => {
		let session = createQuizSession(cells);
		({ session } = attemptMatch(session, 'acc', 'dat'));
		({ session } = attemptMatch(session, 'dat', 'dat'));
		({ session } = attemptMatch(session, 'loc', 'loc'));
		expect(isSessionComplete(session)).toBe(true);
		expect(scoreSession(session)).toEqual({ total: 3, perfect: 2, totalErrors: 1 });
	});
});
