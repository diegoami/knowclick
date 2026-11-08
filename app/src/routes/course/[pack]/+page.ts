import { error } from '@sveltejs/kit';
import { locale } from '$lib/locale.svelte';
import { findPack, loadCourse } from '$lib/packs';
import { loadProgress } from '$lib/progress.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const pack = findPack(params.pack);
	if (!pack) error(404, 'No such course');
	await loadProgress(pack.id);
	return { pack, course: await loadCourse(pack, locale()) };
};
