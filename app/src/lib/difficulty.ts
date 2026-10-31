// The tray holds a *hand*: a few slips at a time, refilled as they are placed. Copied
// from LangClick2027 (591043e), itself from Geoclick2027: the hand stays the
// same size, since a unit doesn't need to get harder: new material is what moves a learner
// forward. It is there so that a long unit doesn't crowd the tray.
//
// Pure: no DOM, no storage, no Svelte. QuizView owns when to draw.

import { KNOWN_CLEAN_STREAK } from '@knowclick/srs';

/** How many slips the tray offers, unless the unit deals them all. */
export const HAND_SIZE = 10;

export { KNOWN_CLEAN_STREAK };

/** How many of these earned levels count as known. */
export function knownCount(levels: readonly number[]): number {
	return levels.filter((level) => level >= KNOWN_CLEAN_STREAK).length;
}

/**
 * The hand after a slip was used, before it is refilled. Slips with equal text
 * are interchangeable, so the slip dropped may have filled another slip's cell.
 * If that other slip is in the hand, it is the one that leaves: its cell is gone,
 * and the two looked the same. Otherwise the slip that was dropped leaves.
 */
export function handAfterUse(hand: readonly string[], slipId: string, cellId: string): string[] {
	const leaving = hand.includes(cellId) ? cellId : slipId;
	return hand.filter((id) => id !== leaving);
}

/**
 * The slips on offer after a drop: whatever is still pending and was already on
 * offer, topped back up to `size` with a random pick of the rest. Keeping the
 * survivors means a slip the player has been staring at doesn't vanish
 * mid-thought.
 */
export function refillHand(
	pendingIds: readonly string[],
	hand: readonly string[],
	size: number,
	random: () => number = Math.random
): string[] {
	const pending = new Set(pendingIds);
	const kept = [...new Set(hand)].filter((id) => pending.has(id));
	if (kept.length >= size) return kept.slice(0, size);
	const pool = pendingIds.filter((id) => !kept.includes(id));
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[pool[i], pool[j]] = [pool[j], pool[i]];
	}
	return [...kept, ...pool.slice(0, size - kept.length)];
}
