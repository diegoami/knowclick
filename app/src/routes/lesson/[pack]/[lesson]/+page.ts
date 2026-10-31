import { error } from '@sveltejs/kit';
import { locale } from '$lib/locale.svelte';
import { findPack, loadCourse } from '$lib/packs';
import { loadProgress } from '$lib/progress.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const pack = findPack(params.pack);
	const course = pack && (await loadCourse(pack, locale()));
	const lesson = course?.lessons.find((candidate) => candidate.id === params.lesson);
	if (!pack || !lesson) error(404, 'No such lesson');
	await loadProgress(pack.id);
	return { pack, lesson };
};
