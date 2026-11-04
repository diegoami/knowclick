import { KNOWN_CLEAN_STREAK } from '@knowclick/srs';
import type { PracticeLevel } from './practiceLevel.svelte';
/** Recommendations never lock levels and never count assisted practice. */
export function recommendLevel(
	guided: readonly number[],
	recall: readonly number[],
	hasTasks: boolean
): PracticeLevel {
	const mastered = (levels: readonly number[]) =>
		levels.length > 0 && levels.every((level) => level >= KNOWN_CLEAN_STREAK);
	if (mastered(recall)) return hasTasks ? 'apply' : 'recall';
	return mastered(guided) ? 'recall' : 'guided';
}
