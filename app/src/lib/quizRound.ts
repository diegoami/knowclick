// Quiz rounds survive navigation and reloads. Learned cards are stored separately;
// starting a new round never erases earned progress.
import type { QuizSession } from '@knowclick/quiz-engine';
import type { LocalUnit } from '@knowclick/pack-format';

export interface RoundInProgress {
	session: QuizSession;
	hand: string[];
	size: number;
	assisted?: boolean;
	signature?: string;
	choiceOrder?: string[];
	askedId?: string;
	draft?: string;
}
const rounds = new Map<string, { round: RoundInProgress; persisted: boolean }>();
const keyOf = (pack: string, unit: string) =>
	`knowclick:round:v2:${encodeURIComponent(pack)}:${encodeURIComponent(unit)}`;
const copy = (round: RoundInProgress): RoundInProgress => JSON.parse(JSON.stringify(round));

/** Bind a snapshot to facts and board structure, not an app release or language. */
export function roundSignature(unit: LocalUnit): string {
	return JSON.stringify({
		layout: unit.layout,
		cells: unit.cells.map(({ id, item, text, line }) => ({ id, item, text, line })),
		distractors: unit.distractors,
		caseInsensitive: unit.caseInsensitive,
		answerFormat: unit.answerFormat
	});
}
function valid(value: unknown): value is RoundInProgress {
	if (!value || typeof value !== 'object') return false;
	const r = value as RoundInProgress;
	if (
		!r.session ||
		!Array.isArray(r.session.items) ||
		!Array.isArray(r.hand) ||
		!Number.isInteger(r.size) ||
		r.size < 0
	)
		return false;
	const ids = new Set<string>();
	for (const item of r.session.items) {
		if (
			!item ||
			!item.cell ||
			typeof item.cell.id !== 'string' ||
			typeof item.cell.text !== 'string' ||
			ids.has(item.cell.id) ||
			!['pending', 'correct', 'revealed'].includes(item.status) ||
			!Number.isInteger(item.errors) ||
			item.errors < 0
		)
			return false;
		ids.add(item.cell.id);
	}
	if (
		!r.hand.every(
			(id) =>
				typeof id === 'string' &&
				r.session.items.some((item) => item.cell.id === id && item.status === 'pending')
		) ||
		new Set(r.hand).size !== r.hand.length
	)
		return false;
	return (
		(r.assisted === undefined || typeof r.assisted === 'boolean') &&
		(r.signature === undefined || typeof r.signature === 'string') &&
		(r.choiceOrder === undefined ||
			(Array.isArray(r.choiceOrder) && r.choiceOrder.every((text) => typeof text === 'string'))) &&
		(r.askedId === undefined || (typeof r.askedId === 'string' && ids.has(r.askedId))) &&
		(r.draft === undefined || typeof r.draft === 'string')
	);
}
export function rememberRound(packId: string, unitId: string, round: RoundInProgress): void {
	const key = keyOf(packId, unitId);
	const snapshot = copy(round);
	let persisted = false;
	try {
		localStorage.setItem(key, JSON.stringify(snapshot));
		persisted = true;
	} catch {
		/* Memory fallback keeps navigation playable. */
	}
	rounds.set(key, { round: snapshot, persisted });
}
export function roundInProgress(
	packId: string,
	unitId: string,
	signature?: string
): RoundInProgress | undefined {
	const key = keyOf(packId, unitId);
	let value: unknown;
	let raw: string | null;
	try {
		raw = localStorage.getItem(key);
	} catch {
		raw = null;
		value = rounds.get(key)?.round;
	}
	if (raw !== null) {
		try {
			value = JSON.parse(raw);
		} catch {
			return undefined;
		}
	} else if (!value)
		value = rounds.get(key)?.persisted === false ? rounds.get(key)?.round : undefined;
	if (!valid(value) || (signature !== undefined && value.signature !== signature)) return undefined;
	if (signature !== undefined) {
		const expected = JSON.parse(signature).cells as { id: string; text: string }[];
		if (
			expected.length !== value.session.items.length ||
			!value.session.items.every((item) =>
				expected.some((cell) => cell.id === item.cell.id && cell.text === item.cell.text)
			)
		)
			return undefined;
	}
	return copy(value);
}
export function forgetRound(packId: string, unitId: string): void {
	const key = keyOf(packId, unitId);
	rounds.delete(key);
	try {
		localStorage.removeItem(key);
	} catch {
		/* Storage can be unavailable. */
	}
}
