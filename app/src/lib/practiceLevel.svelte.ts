import { answerMode, setAnswerMode } from './answerMode.svelte';
export type PracticeLevel = 'guided' | 'recall' | 'apply';
const key = 'knowclick:practice-level:v1';
function initial(): PracticeLevel {
	try {
		const saved = localStorage.getItem(key);
		if (saved === 'guided' || saved === 'recall' || saved === 'apply') return saved;
	} catch {
		/* Storage is optional. */
	}
	return answerMode() === 'type' ? 'recall' : 'guided';
}
let level = $state<PracticeLevel>(initial());
export function practiceLevel(): PracticeLevel {
	return level;
}
export function setPracticeLevel(next: PracticeLevel): void {
	level = next;
	if (next !== 'apply') setAnswerMode(next === 'recall' ? 'type' : 'drag');
	try {
		localStorage.setItem(key, next);
	} catch {
		/* Storage is optional. */
	}
}
