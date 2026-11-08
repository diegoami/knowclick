import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PackManifest } from '@knowclick/pack-format';

const mocks = vi.hoisted(() => ({
	listPacks: vi.fn(),
	loadCourseText: vi.fn(),
	findPack: vi.fn(),
	loadCourse: vi.fn(),
	loadProgress: vi.fn()
}));
vi.mock('$lib/packs', () => mocks);
vi.mock('$lib/locale.svelte', () => ({ locale: () => 'en' }));
vi.mock('$lib/progress.svelte', () => ({ loadProgress: mocks.loadProgress }));

import { load as loadChooser } from '../routes/+page';
import { load as loadCoursePage } from '../routes/course/[pack]/+page';

const pack: PackManifest = {
	id: 'sample',
	category: 'language',
	licence: 'CC-BY-SA-4.0',
	formatVersion: 1,
	version: '1.0.0',
	holdsFor: [],
	checkedOn: '2026-11-08',
	explanations: ['en'],
	keywords: ['sample'],
	sections: ['intro'],
	lessons: [
		{ id: 'first', section: 'intro', units: ['one', 'two'], tasks: ['task'], study: [] },
		{ id: 'second', section: 'intro', units: ['three'], study: [] }
	]
};

beforeEach(() => {
	vi.resetAllMocks();
	mocks.listPacks.mockReturnValue([pack]);
	mocks.findPack.mockImplementation((id: string) => (id === pack.id ? pack : undefined));
	mocks.loadCourseText.mockResolvedValue({ title: 'Sample course' });
	mocks.loadCourse.mockResolvedValue({
		title: 'Sample course',
		summary: 'Study first.',
		lessons: []
	});
});

describe('course navigation loaders', () => {
	it('loads only course text and manifest counts for the chooser', async () => {
		const data = await loadChooser();
		expect(data.courses).toEqual([
			{
				id: 'sample',
				category: 'language',
				title: 'Sample course',
				chapters: 2,
				exercises: 3,
				tasks: 1
			}
		]);
		expect(mocks.loadCourseText).toHaveBeenCalledWith(pack, 'en');
		expect(mocks.loadCourse).not.toHaveBeenCalled();
		expect(mocks.loadProgress).not.toHaveBeenCalled();
	});

	it('keeps a course selectable when its localized title is absent', async () => {
		mocks.loadCourseText.mockResolvedValue({});
		expect((await loadChooser()).courses[0].title).toBe('sample');
	});

	it('loads the selected course and its progress on its own landing page', async () => {
		const result = await loadCoursePage({ params: { pack: 'sample' } } as Parameters<
			typeof loadCoursePage
		>[0]);
		expect(result).toEqual({
			pack,
			course: { title: 'Sample course', summary: 'Study first.', lessons: [] }
		});
		expect(mocks.loadCourse).toHaveBeenCalledExactlyOnceWith(pack, 'en');
		expect(mocks.loadProgress).toHaveBeenCalledExactlyOnceWith('sample');
	});

	it('returns 404 for an unknown course before loading content or progress', async () => {
		await expect(
			loadCoursePage({ params: { pack: 'missing' } } as Parameters<typeof loadCoursePage>[0])
		).rejects.toMatchObject({ status: 404 });
		expect(mocks.loadCourse).not.toHaveBeenCalled();
		expect(mocks.loadProgress).not.toHaveBeenCalled();
	});
});
