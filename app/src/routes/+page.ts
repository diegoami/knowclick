import { locale } from '$lib/locale.svelte';
import { listPacks, loadCourseText } from '$lib/packs';

export async function load() {
	const courses = await Promise.all(
		listPacks().map(async (pack) => {
			const text = await loadCourseText(pack, locale());
			return {
				id: pack.id,
				category: pack.category,
				title: text.title ?? pack.id,
				chapters: pack.lessons.length,
				exercises: pack.lessons.reduce((sum, lesson) => sum + lesson.units.length, 0),
				tasks: pack.lessons.reduce((sum, lesson) => sum + (lesson.tasks?.length ?? 0), 0)
			};
		})
	);
	return { courses };
}
