// How the learner answers on a board: by dragging slips or by typing. Remembered per
// browser, as a convenience only: losing it just means starting on drag.

import type { AnswerSkill } from './progress.svelte';

export type AnswerMode = 'drag' | 'type';

const STORAGE_KEY = 'knowclick:answer-mode:v1';

function readSaved(): AnswerMode {
	try {
		return localStorage.getItem(STORAGE_KEY) === 'type' ? 'type' : 'drag';
	} catch {
		return 'drag';
	}
}

let mode = $state<AnswerMode>(typeof localStorage === 'undefined' ? 'drag' : readSaved());

export function answerMode(): AnswerMode {
	return mode;
}

export function setAnswerMode(next: AnswerMode): void {
	mode = next;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		// Blocked storage only means it isn't remembered.
	}
}

/** The card a mode's answers are saved to. */
export function skillOf(next: AnswerMode): AnswerSkill {
	return next === 'type' ? 'produce' : 'recognise';
}
