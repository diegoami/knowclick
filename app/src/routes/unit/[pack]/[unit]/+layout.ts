import { error } from '@sveltejs/kit';
import { locale } from '$lib/locale.svelte';
import { findPack, loadUnit, loadCourse } from '$lib/packs';
import { loadProgress } from '$lib/progress.svelte';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
	const pack = findPack(params.pack);
	const unit = pack && (await loadUnit(pack, params.unit, locale()));
	if (!pack || !unit) error(404, 'No such unit');
	await loadProgress(pack.id);
	const course = await loadCourse(pack, locale());
	const lesson = course.lessons.find((lesson) =>
		lesson.units.some((candidate) => candidate.id === unit.id || candidate.recall?.id === unit.id)
	);
	const lessonId = lesson?.id ?? '';
	const tasks = lesson?.tasks ?? [];
	return { pack, unit, lessonId, tasks };
};
