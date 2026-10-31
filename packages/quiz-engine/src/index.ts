// Pure fill-the-board quiz logic: track slips dropped onto cells and score the
// result. No UI dependency - QuizView in app/ owns the drag and the hit-testing,
// this just tracks outcomes.
//
// Copied from Geoclick2027 (9b449cc), where a slip names exactly one place. On a
// grammar table one form can fill several cells, so here a cell accepts a slip
// when their text is equal, not when their ids are. Slips with equal text are
// interchangeable; a round still has one slip per cell, and a slip's id is the
// id of the cell it was dealt for.

export interface QuizCell {
	id: string;
	text: string;
}

export type QuizItemStatus = 'pending' | 'correct' | 'revealed';

export interface QuizItemState {
	cell: QuizCell;
	status: QuizItemStatus;
	errors: number;
}

export interface QuizSession {
	items: QuizItemState[];
}

/** What a drop did. `ignored` changes nothing: the slip goes back to the tray. */
export type DropOutcome =
	| { kind: 'ignored' }
	/** `cellId` is the cell that was filled, which need not be the slip's own. */
	| { kind: 'correct'; cellId: string }
	/** `cellId` is the slip's own cell, now showing the answer; `droppedOnId` was
	 * the wrong cell, which stays open. */
	| { kind: 'revealed'; cellId: string; droppedOnId: string };

export function createQuizSession(cells: readonly QuizCell[]): QuizSession {
	return { items: cells.map((cell) => ({ cell, status: 'pending', errors: 0 })) };
}

/**
 * One drop of the slip `slipId` onto the cell `droppedOnId`.
 *
 * Equal text fills that cell. Anything else is the slip's one attempt: its own
 * cell resolves as 'revealed', so the miss teaches something instead of inviting
 * more guesses (Geoclick's rule since its v0.6.0). A drop outside the board or
 * on a cell that is already filled is a slip of the hand, not an answer, so it
 * is ignored.
 */
export function attemptMatch(
	session: QuizSession,
	slipId: string,
	droppedOnId: string | undefined
): { session: QuizSession; outcome: DropOutcome } {
	const slip = session.items.find((item) => item.cell.id === slipId);
	const target = session.items.find((item) => item.cell.id === droppedOnId);
	if (!slip || slip.status !== 'pending' || !target || target.status !== 'pending') {
		return { session, outcome: { kind: 'ignored' } };
	}

	if (target.cell.text === slip.cell.text) {
		return {
			session: replaceItem(session, target.cell.id, { ...target, status: 'correct' }),
			outcome: { kind: 'correct', cellId: target.cell.id }
		};
	}
	return {
		session: replaceItem(session, slip.cell.id, {
			...slip,
			status: 'revealed',
			errors: slip.errors + 1
		}),
		outcome: { kind: 'revealed', cellId: slip.cell.id, droppedOnId: target.cell.id }
	};
}

function replaceItem(session: QuizSession, id: string, next: QuizItemState): QuizSession {
	return { items: session.items.map((item) => (item.cell.id === id ? next : item)) };
}

export function pendingIds(session: QuizSession): string[] {
	return session.items.filter((item) => item.status === 'pending').map((item) => item.cell.id);
}

export function isSessionComplete(session: QuizSession): boolean {
	return session.items.every((item) => item.status !== 'pending');
}

export interface QuizScore {
	total: number;
	/** Filled correctly: every 'correct' cell was right first time, because a miss
	 * reveals the cell instead of leaving it open. */
	perfect: number;
	totalErrors: number;
}

export function scoreSession(session: QuizSession): QuizScore {
	return {
		total: session.items.length,
		perfect: session.items.filter((item) => item.status === 'correct').length,
		totalErrors: session.items.reduce((sum, item) => sum + item.errors, 0)
	};
}
