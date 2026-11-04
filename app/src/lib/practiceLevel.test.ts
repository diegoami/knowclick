import { describe, expect, it } from 'vitest';
import { recommendLevel } from './practiceLevel';
describe('practice recommendations', () => {
	it('does not mistake empty content or partial mastery for success', () => {
		expect(recommendLevel([], [], true)).toBe('guided');
		expect(recommendLevel([3, 2], [], true)).toBe('guided');
	});
	it('recommends recall after repeated guided success', () => {
		expect(recommendLevel([3, 4], [0, 0], true)).toBe('recall');
	});
	it('requires clean recall and authored tasks before Apply', () => {
		expect(recommendLevel([3], [2], true)).toBe('recall');
		expect(recommendLevel([3], [3], true)).toBe('apply');
		expect(recommendLevel([3], [3], false)).toBe('recall');
	});
});
