// Where pack content comes from. A pack is a folder under packs/: nothing here names
// one, so adding a pack needs no code. Reading goes through `PackSource`, so that
// downloads can replace the local folder without touching any screen. Adapted from
// LangClick2027 (591043e).

import {
	layerFor,
	localizeTask,
	localizeUnit,
	type CourseText,
	type LocalTask,
	type LocalUnit,
	type PackManifest,
	type StudyLink,
	type Task,
	type TaskText,
	type Unit,
	type UnitText
} from '@knowclick/pack-format';

export interface PackSource {
	manifests(): PackManifest[];
	/** One JSON file of a pack, by its path inside the pack. */
	read<T>(packId: string, path: string): Promise<T | undefined>;
}

const PACKS_ROOT = '../../../packs';

const manifestFiles = import.meta.glob<PackManifest>('../../../packs/*/pack.json', {
	eager: true,
	import: 'default'
});
// Check and verify records and coverage aren't content: they stay out of what a
// learner receives.
const contentFiles = import.meta.glob<unknown>(
	[
		'../../../packs/*/units/*.json',
		'../../../packs/*/tasks.json',
		'../../../packs/*/layers/**/*.json'
	],
	{ import: 'default' }
);

export const localPackSource: PackSource = {
	manifests() {
		return Object.values(manifestFiles);
	},
	async read<T>(packId: string, path: string) {
		return contentFiles[`${PACKS_ROOT}/${packId}/${path}`]?.() as Promise<T | undefined>;
	}
};

let source: PackSource = localPackSource;

/** Tests only. */
export function usePackSource(next: PackSource): void {
	source = next;
}

export function listPacks(): PackManifest[] {
	return [...source.manifests()].sort((a, b) => a.id.localeCompare(b.id));
}

export function findPack(packId: string): PackManifest | undefined {
	return source.manifests().find((pack) => pack.id === packId);
}

export async function loadCourseText(pack: PackManifest, language: string): Promise<CourseText> {
	const layer = layerFor(pack, language);
	return (await source.read<CourseText>(pack.id, `layers/${layer}/course.json`)) ?? {};
}

async function localUnit(
	pack: PackManifest,
	unitId: string,
	language: string,
	course: CourseText
): Promise<LocalUnit | undefined> {
	const layer = layerFor(pack, language);
	const [unit, text] = await Promise.all([
		source.read<Unit>(pack.id, `units/${unitId}.json`),
		source.read<UnitText>(pack.id, `layers/${layer}/units/${unitId}.json`)
	]);
	return unit && localizeUnit(unit, text, course);
}

/** One unit as this learner sees it. */
export async function loadUnit(
	pack: PackManifest,
	unitId: string,
	language: string
): Promise<LocalUnit | undefined> {
	return localUnit(pack, unitId, language, await loadCourseText(pack, language));
}

/** Every task of a pack, by id. */
async function loadTasks(pack: PackManifest, language: string): Promise<Map<string, LocalTask>> {
	const layer = layerFor(pack, language);
	const [tasks, texts] = await Promise.all([
		source.read<Task[]>(pack.id, 'tasks.json'),
		source.read<Record<string, TaskText>>(pack.id, `layers/${layer}/tasks.json`)
	]);
	return new Map((tasks ?? []).map((task) => [task.id, localizeTask(task, texts?.[task.id])]));
}

export interface LocalLesson {
	id: string;
	section: { id: string; title: string };
	title: string;
	study: StudyLink[];
	units: LocalUnit[];
	tasks: LocalTask[];
}

export interface LocalCourse {
	title: string;
	summary: string;
	lessons: LocalLesson[];
}

/** The whole pack as this learner sees it, in teaching order. */
export async function loadCourse(pack: PackManifest, language: string): Promise<LocalCourse> {
	const course = await loadCourseText(pack, language);
	const tasks = await loadTasks(pack, language);
	const lessons = await Promise.all(
		pack.lessons.map(async (lesson) => {
			const units = await Promise.all(
				lesson.units.map((id) => localUnit(pack, id, language, course))
			);
			return {
				id: lesson.id,
				section: {
					id: lesson.section,
					title: course.sections?.[lesson.section]?.title ?? lesson.section
				},
				title: course.lessons?.[lesson.id]?.title ?? lesson.id,
				study: lesson.study,
				units: units.filter((unit) => unit !== undefined),
				tasks: (lesson.tasks ?? []).flatMap((id) => tasks.get(id) ?? [])
			};
		})
	);
	return { title: course.title ?? pack.id, summary: course.summary ?? '', lessons };
}
