// A round you are in the middle of, kept while the app is open, so a trip to the
// Overview to look something up doesn't wipe it. Deliberately memory only: a round
// is a sitting, and a player coming back after a reload gets a fresh one (earned
// levels are saved as each answer lands, so nothing earned is lost). The same
// choice as Geoclick2027's quizRound.ts.

import type { QuizSession } from '@knowclick/quiz-engine';

export interface RoundInProgress {
	session: QuizSession;
	hand: string[];
	/** Hand size for the whole round, from how well the unit was known at its start. */
	size: number;
}

const rounds = new Map<string, RoundInProgress>();

const roundKey = (packId: string, unitId: string) => `${packId}/${unitId}`;

export function rememberRound(packId: string, unitId: string, round: RoundInProgress): void {
	rounds.set(roundKey(packId, unitId), round);
}

export function roundInProgress(packId: string, unitId: string): RoundInProgress | undefined {
	return rounds.get(roundKey(packId, unitId));
}

export function forgetRound(packId: string, unitId: string): void {
	rounds.delete(roundKey(packId, unitId));
}
