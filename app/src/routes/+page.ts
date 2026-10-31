import { locale } from '$lib/locale.svelte';
import { listPacks, loadCourse } from '$lib/packs';
import { loadProgress } from '$lib/progress.svelte';

export async function load() {
	const packs = await Promise.all(
		listPacks().map(async (pack) => {
			await loadProgress(pack.id);
			return { pack, course: await loadCourse(pack, locale()) };
		})
	);
	return { packs };
}
