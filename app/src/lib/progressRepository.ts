// Local persistence: everything is keyed to the device or browser, never a user.
// The interface is deliberately backend-agnostic, so the SQLite implementations
// desktop and Android builds would need can replace the localStorage one without
// touching call sites. Copied from LangClick2027 (591043e): progress is per item
// across a whole pack, since a fact can recur in several units.

import type { CardState as SchedulerState } from '@knowclick/srs';

/** What a card measures. Recognising an answer, producing it, and doing a task by
 * hand are different knowledge, so an item has one card per skill. `produce` waits
 * for typed answers; having it in the key now needs no migration then. */
export const SKILLS = ['recognise', 'produce', 'practise'] as const;
export type Skill = (typeof SKILLS)[number];

export interface Card extends SchedulerState {
	itemId: string;
	skill: Skill;
}

export interface ProgressRepository {
	getCards(packId: string): Promise<Card[]>;
	saveCard(packId: string, card: Card): Promise<void>;
	/** The lessons the learner has marked as studied. */
	getStudied(packId: string): Promise<string[]>;
	saveStudied(packId: string, lessonIds: string[]): Promise<void>;
}

const STORAGE_PREFIX = 'knowclick:progress:v1';

function cardsKey(packId: string): string {
	return `${STORAGE_PREFIX}:${packId}:cards`;
}

function studiedKey(packId: string): string {
	return `${STORAGE_PREFIX}:${packId}:studied`;
}

// Local calendar date, not `toISOString().slice(0, 10)`: that is UTC, which flips
// to "tomorrow" hours before local midnight in some timezones.
export function todayLocalDate(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isCard(value: unknown): value is Card {
	if (typeof value !== 'object' || value === null) return false;
	const card = value as Record<string, unknown>;
	return (
		typeof card.itemId === 'string' &&
		SKILLS.includes(card.skill as Skill) &&
		typeof card.easeFactor === 'number' &&
		typeof card.interval === 'number' &&
		typeof card.repetitions === 'number' &&
		typeof card.cleanStreak === 'number' &&
		typeof card.dueDate === 'string' &&
		typeof card.lastReviewedAt === 'string'
	);
}

/**
 * Stored data is validated, not cast. The whole access is inside the try, because
 * a disabled or sandboxed localStorage throws on getItem itself. Any failure - a
 * throw, unparseable text, a value of the wrong shape - reads as nothing saved
 * yet, never as a card that crashes the scheduler later.
 */
function readCards(packId: string): Card[] {
	try {
		const raw = localStorage.getItem(cardsKey(packId));
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isCard) : [];
	} catch {
		return [];
	}
}

export class LocalStorageProgressRepository implements ProgressRepository {
	async getCards(packId: string): Promise<Card[]> {
		return readCards(packId);
	}

	async getStudied(packId: string): Promise<string[]> {
		try {
			const parsed: unknown = JSON.parse(localStorage.getItem(studiedKey(packId)) ?? '[]');
			return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
		} catch {
			return [];
		}
	}

	async saveStudied(packId: string, lessonIds: string[]): Promise<void> {
		try {
			localStorage.setItem(studiedKey(packId), JSON.stringify(lessonIds));
		} catch {
			// As with a card: this just isn't remembered.
		}
	}

	async saveCard(packId: string, card: Card): Promise<void> {
		const others = readCards(packId).filter(
			(other) => other.itemId !== card.itemId || other.skill !== card.skill
		);
		try {
			localStorage.setItem(cardsKey(packId), JSON.stringify([...others, card]));
		} catch {
			// A full or blocked localStorage must not break a round in progress: this
			// answer simply isn't remembered.
		}
	}
}
