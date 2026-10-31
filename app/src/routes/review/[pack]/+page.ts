import { error } from '@sveltejs/kit';
import { locale } from '$lib/locale.svelte';
import { findPack, loadCourse } from '$lib/packs';
import { loadProgress } from '$lib/progress.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const pack = findPack(params.pack);
	if (!pack) error(404, 'No such pack');
	await loadProgress(pack.id);
	const { lessons } = await loadCourse(pack, locale());
	return {
		pack,
		units: lessons.flatMap((lesson) => lesson.units),
		tasks: lessons.flatMap((lesson) => lesson.tasks)
	};
};
