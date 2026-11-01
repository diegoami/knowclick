// The shape of a subject pack, and the validator that keeps one honest. Pure:
// callers read the JSON and hand it in, so the app can run this on a download too.
// packs/README.md is the author's guide. Adapted from LangClick2027 (591043e), with
// its language fields removed and tasks, coverage, versions and code boards added.
//
// Nothing here knows any one subject. What differs between subjects is data: the
// versions a pack holds for, its boards, its tasks and the curricula it covers.

export const FORMAT_VERSION = 1;

/** How many independent checks every piece of content needs. */
export const REQUIRED_CHECKS = 2;

export const STUDY_KINDS = ['docs', 'video', 'reading', 'course', 'reference'] as const;
export const CATEGORIES = ['certification', 'language', 'library', 'other'] as const;
/** What a task needs: a shell, a cluster of one's own, or a cloud account. */
export const TASK_PLACES = ['terminal', 'cluster', 'cloud'] as const;

export type StudyKind = (typeof STUDY_KINDS)[number];
export type Category = (typeof CATEGORIES)[number];
export type TaskPlace = (typeof TASK_PLACES)[number];

export interface Source {
	title: string;
	url: string;
}

/** Something to study before the exercises. It belongs to the source, not to us. */
export interface StudyLink extends Source {
	kind: StudyKind;
}

export interface Lesson {
	id: string;
	/** One of the manifest's `sections`. */
	section: string;
	/** Unit ids, in teaching order. */
	units: string[];
	/** Task ids, in teaching order. */
	tasks?: string[];
	study: StudyLink[];
}

/** A version the content is true for, such as a tool's or a curriculum's. */
export interface HoldsFor {
	name: string;
	version: string;
}

/** One command the verify script runs, with `{placeholders}` filled from the content. */
export interface VerifyStep {
	run: string;
	/** Text piped to the command. */
	stdin?: string;
	/** A regular expression the output must match. */
	expect?: string;
}

/** How the verify script prepares its sandbox for a pack. */
export interface PackVerify {
	/** Must succeed, and match, before anything else runs: it keeps the script off
	 * anything that isn't a disposable sandbox. */
	guard: VerifyStep;
	/** Prints the versions the commands run against, for the record. */
	version?: string;
	setup?: string[];
	teardown?: string[];
}

export interface PackManifest {
	id: string;
	category: Category;
	licence: string;
	formatVersion: number;
	/** MAJOR.MINOR.PATCH, bumped on every content change. */
	version: string;
	/** What the content is true for. */
	holdsFor: HoldsFor[];
	/** When the content was last checked against `holdsFor`, YYYY-MM-DD. */
	checkedOn: string;
	/** Languages this pack is explained in: one layer each. */
	explanations: string[];
	/** The groups lessons are shown under, in order. */
	sections: string[];
	/** In teaching order. */
	lessons: Lesson[];
	/** Names of this subject that engine code must never contain. */
	keywords: string[];
	verify?: PackVerify;
}

export type BoardLayout =
	/** `gaps` lists crossings with no cell, as "row/col". */
	| { type: 'table'; rows: string[]; columns: string[]; gaps?: string[] }
	/** Tiles in the order given. `size` is how many there must be. */
	| { type: 'grid'; size: number }
	/** One line of code per cell, each a `line` with one gap. */
	| { type: 'lines'; size: number }
	/** One block of code, with every cell a gap in it, written {{gap:<cell id>}}. */
	| { type: 'code'; code: string[] };

/** Marks where the answer goes in a cell's `line`. */
export const GAP = '___';

/** A gap in a `code` board. */
export const CODE_GAP = /\{\{gap:([\w.-]+)\}\}/g;

export interface Cell {
	id: string;
	/** What progress is kept against; the same fact in two units shares one item. */
	item: string;
	/** The answer, as compared and shown. */
	text: string;
	/** A clue that needs no translation. */
	clue?: string;
	/** The line of code the answer completes, with one `GAP`. */
	line?: string;
	/** Ids of the concepts this cell illustrates. */
	concepts?: string[];
	row?: string;
	col?: string;
	/** How the verify script checks this cell, in place of the unit's way. */
	verify?: VerifyStep;
}

export interface UnitVerify extends Partial<VerifyStep> {
	/** A table's columns can each need their own check. */
	columns?: Record<string, VerifyStep>;
}

export interface Unit {
	id: string;
	layout: BoardLayout;
	cells: Cell[];
	sources: Source[];
	/** The answers only mean something against each other: the tray always offers all
	 * of them, however well the unit is known. */
	dealAll?: boolean;
	/** The answers are names, where case is not the answer: a typed answer is compared
	 * without case. Never for flags, fields or code, where case is the answer. */
	caseInsensitive?: boolean;
	verify?: UnitVerify;
}

/** Practice done outside the app. The prompt, setup and solution stay at the source. */
export interface Task {
	id: string;
	item: string;
	/** The time to aim for. */
	minutes: number;
	where: TaskPlace;
	source: Source;
}

export interface TaskText {
	title: string;
	/** What it practises, in a sentence of our own. */
	brief: string;
}

export interface CellText {
	clue?: string;
	note?: string;
}

export interface UnitText {
	title?: string;
	summary?: string;
	/** Labels of a table's rows and columns, by id. */
	headers?: Record<string, string>;
	cells?: Record<string, CellText>;
}

export interface Concept {
	title: string;
	body: string;
	sources?: Source[];
}

/** A layer's texts for the pack as a whole. */
export interface CourseText {
	title?: string;
	summary?: string;
	sections?: Record<string, { title: string }>;
	lessons?: Record<string, { title: string }>;
	concepts?: Record<string, Concept>;
}

export interface Layer {
	course: CourseText;
	units: Record<string, UnitText>;
	tasks: Record<string, TaskText>;
}

/** Every layer of a pack, by language. */
export type Layers = Record<string, Layer>;

/** A published curriculum, mapped to what covers it here. */
export interface Coverage {
	id: string;
	title: string;
	version: string;
	source: Source;
	domains: {
		id: string;
		title: string;
		/** Percent of the exam, or the range an exam publishes, as [min, max]. */
		weight: number | [number, number];
		competencies: { id: string; title: string; units: string[]; tasks: string[] }[];
	}[];
}

// ---------------------------------------------------------------- what a learner sees

export interface Header {
	id: string;
	label: string;
}

export type CodePart = { text: string } | { gap: string };

export type LocalLayout =
	| { type: 'table'; rows: Header[]; columns: Header[] }
	| { type: 'grid'; size: number }
	| { type: 'lines'; size: number }
	| { type: 'code'; code: CodePart[][] };

export interface LocalCell extends Cell, CellText {
	conceptDetails: (Concept & { id: string })[];
}

export interface LocalUnit {
	id: string;
	title: string;
	summary: string;
	layout: LocalLayout;
	cells: LocalCell[];
	sources: Source[];
	dealAll?: boolean;
	caseInsensitive?: boolean;
}

export interface LocalTask extends Task, TaskText {}

/** The layer a learner reads: their language if the pack offers it, else its first. */
export function layerFor(pack: Pick<PackManifest, 'explanations'>, language: string): string {
	return pack.explanations.includes(language) ? language : pack.explanations[0];
}

/** One line of a code board, as text and gaps. */
export function codeParts(line: string): CodePart[] {
	const parts: CodePart[] = [];
	let at = 0;
	for (const match of line.matchAll(CODE_GAP)) {
		if (match.index > at) parts.push({ text: line.slice(at, match.index) });
		parts.push({ gap: match[1] });
		at = match.index + match[0].length;
	}
	if (at < line.length || parts.length === 0) parts.push({ text: line.slice(at) });
	return parts;
}

/** The cell ids of a code board's gaps, in order. */
export function codeGaps(code: readonly string[]): string[] {
	return code.flatMap((line) => [...line.matchAll(CODE_GAP)].map((match) => match[1]));
}

/** A code board with every gap filled by its answer. */
export function filledCode(unit: Pick<Unit, 'layout' | 'cells'>): string {
	if (unit.layout.type !== 'code') return '';
	const answers = new Map(unit.cells.map((cell) => [cell.id, cell.text]));
	return unit.layout.code
		.map((line) => line.replace(CODE_GAP, (_whole, id: string) => answers.get(id) ?? ''))
		.join('\n');
}

/** A cell's line, as the code before and after its gap. */
export function lineParts(line: string): [string, string] {
	const at = line.indexOf(GAP);
	return at < 0 ? [line, ''] : [line.slice(0, at), line.slice(at + GAP.length)];
}

/** A cell's line with its answer in the gap. */
export function filledLine(cell: Pick<Cell, 'line' | 'text'>): string {
	const [before, after] = lineParts(cell.line ?? '');
	return `${before}${cell.text}${after}`;
}

/** A unit as one learner sees it: the core with the text of their layer. */
export function localizeUnit(
	unit: Unit,
	text: UnitText | undefined,
	course: CourseText
): LocalUnit {
	const header = (id: string): Header => ({ id, label: text?.headers?.[id] ?? id });
	const layout: LocalLayout =
		unit.layout.type === 'table'
			? {
					type: 'table',
					rows: unit.layout.rows.map(header),
					columns: unit.layout.columns.map(header)
				}
			: unit.layout.type === 'code'
				? { type: 'code', code: unit.layout.code.map(codeParts) }
				: unit.layout;
	return {
		id: unit.id,
		title: text?.title ?? unit.id,
		summary: text?.summary ?? '',
		layout,
		sources: unit.sources,
		dealAll: unit.dealAll,
		caseInsensitive: unit.caseInsensitive,
		cells: unit.cells.map((cell) => ({
			...cell,
			...text?.cells?.[cell.id],
			conceptDetails: (cell.concepts ?? []).flatMap((id) => {
				const concept = course.concepts?.[id];
				return concept ? [{ id, ...concept }] : [];
			})
		}))
	};
}

/** A unit's cells in the order the board shows them: a table row by row, a code
 * board gap by gap, anything else as listed. */
export function boardOrder(unit: LocalUnit): LocalCell[] {
	const layout = unit.layout;
	if (layout.type === 'table') {
		return layout.rows.flatMap((row) =>
			layout.columns.flatMap(
				(column) => unit.cells.find((cell) => cell.row === row.id && cell.col === column.id) ?? []
			)
		);
	}
	if (layout.type === 'code') {
		const byId = new Map(unit.cells.map((cell) => [cell.id, cell]));
		return layout.code.flatMap((line) =>
			line.flatMap((part) => ('gap' in part ? (byId.get(part.gap) ?? []) : []))
		);
	}
	return unit.cells;
}

export function localizeTask(task: Task, text: TaskText | undefined): LocalTask {
	return { ...task, title: text?.title ?? task.id, brief: text?.brief ?? '' };
}

// ------------------------------------------------------------------------ validation

export interface PackIssue {
	where: string;
	problem: string;
}

const present = (value: unknown): value is string => typeof value === 'string' && value !== '';
const webAddress = (value: unknown) => typeof value === 'string' && /^https?:\/\//.test(value);

const SEMVER = /^\d+\.\d+\.\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `answer` stands in `code` as a whole word, which would give it away. Only
 * letters, digits, `_` and `-` continue a word, so an answer glued to punctuation,
 * as in `(rollingUpdate)`, is found, while `--from` is not found in `--from-file`. */
function givesAway(code: string, answer: string): boolean {
	const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`).test(code);
}

function validateCell(cell: Cell, unit: Unit, pack: PackManifest, issues: PackIssue[]): void {
	const where = `${pack.id}/${unit.id}/${cell.id}`;
	const report = (problem: string) => issues.push({ where, problem });

	if (!present(cell.id)) report('has no id');
	if (!present(cell.item)) report('has no item');
	if (!present(cell.text)) {
		report('has no text');
		return;
	}
	if (cell.text !== cell.text.normalize('NFC')) report('text is not in NFC form');
	if (cell.text !== cell.text.trim() || /[\n\t]/.test(cell.text)) {
		report(`text "${cell.text}" has surrounding or inner layout space`);
	}
	if (cell.text.includes(GAP)) report('text contains a gap');
}

function validateLines(unit: Unit, pack: PackManifest, issues: PackIssue[]): void {
	const where = `${pack.id}/${unit.id}`;
	const seen = new Map<string, string>();
	for (const cell of unit.cells) {
		const line = cell.line;
		if (!present(line) || line.split(GAP).length !== 2) {
			issues.push({ where, problem: `cell ${cell.id} needs a line with one gap` });
			continue;
		}
		// Two equal lines with different answers could not be answered fairly.
		const earlier = seen.get(line);
		if (earlier !== undefined && earlier !== cell.text) {
			issues.push({ where, problem: `line "${line}" fits both ${earlier} and ${cell.text}` });
		}
		seen.set(line, cell.text);
		if (givesAway(line.replace(GAP, ' '), cell.text)) {
			issues.push({ where, problem: `line "${line}" gives away the answer` });
		}
	}
}

function validateCode(
	unit: Unit,
	layout: { code: string[] },
	pack: PackManifest,
	issues: PackIssue[]
): void {
	const where = `${pack.id}/${unit.id}`;
	if (!Array.isArray(layout.code) || layout.code.length === 0) {
		issues.push({ where, problem: 'has no code' });
		return;
	}
	const gaps = codeGaps(layout.code);
	const ids = new Set(unit.cells.map((cell) => cell.id));
	for (const id of new Set(gaps)) {
		if (!ids.has(id)) issues.push({ where, problem: `gap ${id} has no cell` });
		if (gaps.filter((gap) => gap === id).length > 1) {
			issues.push({ where, problem: `gap ${id} appears more than once` });
		}
	}
	for (const id of ids) {
		if (!gaps.includes(id)) issues.push({ where, problem: `cell ${id} has no gap in the code` });
	}
	if (layout.code.some((line) => line.includes(GAP))) {
		issues.push({ where, problem: `code uses ${GAP}; a code board's gaps name their cell` });
	}
}

function validateLayout(unit: Unit, pack: PackManifest, issues: PackIssue[]): void {
	const where = `${pack.id}/${unit.id}`;
	const layout = unit.layout;
	if (layout?.type === 'table') {
		const taken = new Map<string, number>();
		const rows = new Set(layout.rows);
		const columns = new Set(layout.columns);
		const gaps = new Set(layout.gaps ?? []);
		for (const cell of unit.cells) {
			if (!rows.has(cell.row ?? '') || !columns.has(cell.col ?? '')) {
				issues.push({ where, problem: `cell ${cell.id} is outside the board` });
				continue;
			}
			const key = `${cell.row}/${cell.col}`;
			taken.set(key, (taken.get(key) ?? 0) + 1);
		}
		for (const row of rows) {
			for (const column of columns) {
				const key = `${row}/${column}`;
				const expected = gaps.has(key) ? 0 : 1;
				const count = taken.get(key) ?? 0;
				if (count !== expected) {
					issues.push({ where, problem: `${key} has ${count} cells, expected ${expected}` });
				}
			}
		}
	} else if (layout?.type === 'grid' || layout?.type === 'lines') {
		if (unit.cells.length !== layout.size) {
			issues.push({ where, problem: `${unit.cells.length} cells, expected ${layout.size}` });
		}
		if (layout.type === 'lines') validateLines(unit, pack, issues);
	} else if (layout?.type === 'code') {
		validateCode(unit, layout, pack, issues);
	} else {
		issues.push({ where, problem: 'has no known layout' });
	}
}

function validateSources(sources: Source[] | undefined, where: string, issues: PackIssue[]): void {
	for (const source of sources ?? []) {
		if (!present(source.title) || !webAddress(source.url)) {
			issues.push({ where, problem: `source "${source.title}" has no title or web address` });
		}
	}
}

function validateStep(step: VerifyStep | undefined, where: string, issues: PackIssue[]): void {
	if (step === undefined) return;
	if (!present(step.run)) issues.push({ where, problem: 'verify step has nothing to run' });
	if (step.expect !== undefined) {
		try {
			new RegExp(step.expect, 'm');
		} catch {
			issues.push({ where, problem: `verify expect "${step.expect}" is not a pattern` });
		}
	}
}

function validateManifest(pack: PackManifest, issues: PackIssue[]): void {
	const report = (problem: string) => issues.push({ where: pack.id, problem });
	for (const field of ['id', 'licence'] as const) {
		if (!present(pack[field])) report(`manifest has no ${field}`);
	}
	if (!CATEGORIES.includes(pack.category)) report(`unknown category ${pack.category}`);
	if (pack.formatVersion !== FORMAT_VERSION) {
		report(`format version ${pack.formatVersion}, expected ${FORMAT_VERSION}`);
	}
	if (!SEMVER.test(pack.version ?? '')) report(`version "${pack.version}" is not X.Y.Z`);
	if (!pack.holdsFor?.length) report('manifest says nothing it holds for');
	for (const entry of pack.holdsFor ?? []) {
		if (!present(entry.name) || !present(entry.version)) {
			report('a holdsFor entry needs a name and a version');
		}
	}
	if (!DATE.test(pack.checkedOn ?? '')) report(`checkedOn "${pack.checkedOn}" is not YYYY-MM-DD`);
	if (!pack.explanations?.length) report('manifest has no explanations');
	if (!pack.keywords?.length) report('manifest has no keywords');
	if (pack.keywords && !pack.keywords.includes(pack.id)) {
		report('keywords must include the pack id');
	}
	if (pack.verify) validateStep(pack.verify.guard, `${pack.id}/verify`, issues);
	if (pack.verify && !pack.verify.guard?.expect) report('the verify guard needs an expect');
	for (const lesson of pack.lessons ?? []) {
		if (!pack.sections?.includes(lesson.section)) {
			report(`lesson ${lesson.id} is in unknown section ${lesson.section}`);
		}
		for (const link of lesson.study ?? []) {
			if (!present(link.title) || !webAddress(link.url)) {
				report(`lesson ${lesson.id}: study link "${link.title}" has no title or web address`);
			}
			if (!STUDY_KINDS.includes(link.kind)) {
				report(`lesson ${lesson.id}: unknown study kind ${link.kind}`);
			}
		}
	}
}

function validateLayer(
	name: string,
	pack: PackManifest,
	units: readonly Unit[],
	tasks: readonly Task[],
	layer: Layer | undefined,
	issues: PackIssue[]
): void {
	const prefix = `${pack.id}/layers/${name}`;
	if (!layer) {
		issues.push({ where: prefix, problem: 'is listed but missing' });
		return;
	}
	const report = (where: string, problem: string) => issues.push({ where, problem });
	const byId = new Map(units.map((unit) => [unit.id, unit]));

	if (!present(layer.course.title)) report(prefix, 'the pack has no title');
	if (!present(layer.course.summary)) report(prefix, 'the pack has no summary');
	for (const id of Object.keys(layer.units)) {
		if (!byId.has(id)) report(prefix, `text for unknown unit ${id}`);
	}
	for (const [id, concept] of Object.entries(layer.course.concepts ?? {})) {
		if (!present(concept.title) || !present(concept.body)) {
			report(`${prefix}/concepts/${id}`, 'needs a title and a body');
		}
		validateSources(concept.sources, `${prefix}/concepts/${id}`, issues);
	}
	for (const section of pack.sections ?? []) {
		if (!present(layer.course.sections?.[section]?.title)) {
			report(prefix, `section ${section} has no title`);
		}
	}
	for (const lesson of pack.lessons ?? []) {
		if (!present(layer.course.lessons?.[lesson.id]?.title)) {
			report(prefix, `lesson ${lesson.id} has no title`);
		}
	}
	const taskIds = new Set(tasks.map((task) => task.id));
	for (const id of Object.keys(layer.tasks)) {
		if (!taskIds.has(id)) report(prefix, `text for unknown task ${id}`);
	}
	for (const task of tasks) {
		const text = layer.tasks[task.id];
		if (!present(text?.title) || !present(text?.brief)) {
			report(`${prefix}/tasks/${task.id}`, 'needs a title and a brief');
		}
	}

	for (const unit of units) {
		const where = `${prefix}/${unit.id}`;
		const text = layer.units[unit.id];
		if (!present(text?.title)) report(where, 'has no title');
		if (!present(text?.summary)) report(where, 'has no summary');
		if (unit.layout?.type === 'table') {
			for (const id of [...unit.layout.rows, ...unit.layout.columns]) {
				if (!present(text?.headers?.[id])) report(where, `header ${id} has no label`);
			}
		}
		const cells = new Map((unit.cells ?? []).map((cell) => [cell.id, cell]));
		for (const id of Object.keys(text?.cells ?? {})) {
			if (!cells.has(id)) report(where, `text for unknown cell ${id}`);
		}
		const clues = new Map<string, string>();
		for (const cell of unit.cells ?? []) {
			for (const id of cell.concepts ?? []) {
				if (!present(layer.course.concepts?.[id]?.title)) {
					report(`${where}/${cell.id}`, `concept ${id} has no text`);
				}
			}
			const clue = text?.cells?.[cell.id]?.clue ?? cell.clue;
			const needsClue = unit.layout?.type === 'grid' || unit.layout?.type === 'lines';
			if (!needsClue) continue;
			if (!present(clue)) {
				report(where, `cell ${cell.id} has no clue`);
				continue;
			}
			if (givesAway(clue, cell.text)) report(where, `clue "${clue}" gives away the answer`);
			if (unit.layout.type !== 'grid') continue;
			// Two equal clues with different answers could not be answered fairly.
			const earlier = clues.get(clue);
			if (earlier !== undefined && earlier !== cell.text) {
				report(where, `clue "${clue}" fits both ${earlier} and ${cell.text}`);
			}
			clues.set(clue, cell.text);
		}
	}
}

function validateTasks(pack: PackManifest, tasks: readonly Task[], issues: PackIssue[]): void {
	const ids = new Set<string>();
	const items = new Set<string>();
	for (const task of tasks) {
		const where = `${pack.id}/tasks/${task.id}`;
		const report = (problem: string) => issues.push({ where, problem });
		if (!present(task.id)) report('has no id');
		if (!present(task.item)) report('has no item');
		if (ids.has(task.id)) report('duplicate task id');
		if (items.has(task.item)) report(`duplicate item ${task.item}`);
		ids.add(task.id);
		items.add(task.item);
		if (!Number.isInteger(task.minutes) || task.minutes <= 0) {
			report(`minutes ${task.minutes} is not a whole number above 0`);
		}
		if (!TASK_PLACES.includes(task.where)) report(`unknown place ${task.where}`);
		if (!task.source) report('has no source');
		validateSources(task.source ? [task.source] : [], where, issues);
	}
	const listed = (pack.lessons ?? []).flatMap((lesson) => lesson.tasks ?? []);
	for (const id of listed) {
		if (!ids.has(id)) issues.push({ where: pack.id, problem: `task ${id} is listed but missing` });
	}
	if (new Set(listed).size !== listed.length) {
		issues.push({ where: pack.id, problem: 'a task is listed in more than one lesson' });
	}
	for (const id of ids) {
		if (!listed.includes(id)) {
			issues.push({ where: pack.id, problem: `task ${id} is not in any lesson` });
		}
	}
}

function validateUnitVerify(unit: Unit, pack: PackManifest, issues: PackIssue[]): void {
	const where = `${pack.id}/${unit.id}/verify`;
	if (!unit.verify && !unit.cells.some((cell) => cell.verify)) return;
	if (!pack.verify) issues.push({ where, problem: 'the pack has no verify guard' });
	const columns = unit.verify?.columns ?? {};
	if (unit.verify?.run !== undefined) validateStep(unit.verify as VerifyStep, where, issues);
	for (const [id, step] of Object.entries(columns)) {
		if (unit.layout.type !== 'table' || !unit.layout.columns.includes(id)) {
			issues.push({ where, problem: `verify names unknown column ${id}` });
		}
		validateStep(step, where, issues);
	}
	// A code board is verified as a whole, so a verify block that runs nothing would
	// retire its verification without a word. Having no verify at all is the opt-out.
	if (unit.layout.type === 'code') {
		if (unit.verify && !present(unit.verify.run)) {
			issues.push({ where, problem: 'verify step has nothing to run' });
		}
		return;
	}
	for (const cell of unit.cells) {
		validateStep(cell.verify, `${where}/${cell.id}`, issues);
		const covered = cell.verify ?? columns[cell.col ?? ''] ?? unit.verify?.run;
		if (!covered) issues.push({ where, problem: `cell ${cell.id} has no way to be verified` });
	}
}

/** Everything wrong with a pack; empty means it is fit to load. */
export function validatePack(
	pack: PackManifest,
	units: readonly Unit[],
	tasks: readonly Task[],
	layers: Layers
): PackIssue[] {
	const issues: PackIssue[] = [];
	validateManifest(pack, issues);

	const listed = (pack.lessons ?? []).flatMap((lesson) => lesson.units ?? []);
	const found = new Set(units.map((unit) => unit.id));
	for (const id of listed) {
		if (!found.has(id))
			issues.push({ where: pack.id, problem: `unit ${id} is listed but missing` });
	}
	if (new Set(listed).size !== listed.length) {
		issues.push({ where: pack.id, problem: 'a unit is listed in more than one lesson' });
	}
	for (const id of found) {
		if (!listed.includes(id)) {
			issues.push({ where: pack.id, problem: `unit ${id} is not in any lesson` });
		}
	}

	const textOfItem = new Map<string, string>();
	for (const unit of units) {
		const where = `${pack.id}/${unit.id}`;
		if (!unit.sources?.length) issues.push({ where, problem: 'has no source' });
		validateSources(unit.sources, where, issues);
		validateLayout(unit, pack, issues);
		validateUnitVerify(unit, pack, issues);

		const ids = new Set<string>();
		const items = new Set<string>();
		for (const cell of unit.cells ?? []) {
			validateCell(cell, unit, pack, issues);
			if (ids.has(cell.id)) issues.push({ where, problem: `duplicate cell id ${cell.id}` });
			if (items.has(cell.item)) issues.push({ where, problem: `duplicate item ${cell.item}` });
			ids.add(cell.id);
			items.add(cell.item);

			const earlier = textOfItem.get(cell.item);
			if (earlier !== undefined && earlier !== cell.text) {
				issues.push({
					where,
					problem: `item ${cell.item} is "${cell.text}" here and "${earlier}" elsewhere`
				});
			}
			textOfItem.set(cell.item, cell.text);
		}
	}

	validateTasks(pack, tasks, issues);
	const taskItems = new Set(tasks.map((task) => task.item));
	for (const item of textOfItem.keys()) {
		if (taskItems.has(item)) {
			issues.push({ where: pack.id, problem: `item ${item} is both a cell and a task` });
		}
	}

	for (const name of pack.explanations ?? []) {
		validateLayer(name, pack, units, tasks, layers[name], issues);
	}
	for (const name of Object.keys(layers)) {
		if (!pack.explanations?.includes(name)) {
			issues.push({ where: pack.id, problem: `layer ${name} is not in the manifest` });
		}
	}
	return issues;
}

/** Everything wrong with a curriculum's mapping to a pack. */
export function validateCoverage(
	coverage: Coverage,
	units: readonly Unit[],
	tasks: readonly Task[]
): PackIssue[] {
	const issues: PackIssue[] = [];
	const where = `coverage/${coverage.id}`;
	const report = (problem: string) => issues.push({ where, problem });
	if (!present(coverage.title) || !present(coverage.version)) {
		report('needs a title and a version');
	}
	validateSources(coverage.source ? [coverage.source] : [], where, issues);
	if (!coverage.source) report('has no source');
	const ranges = coverage.domains.map((domain) =>
		typeof domain.weight === 'number' ? [domain.weight, domain.weight] : domain.weight
	);
	for (const [i, [min, max]] of ranges.entries()) {
		if (!(min >= 0 && min <= max && max <= 100)) {
			report(`domain ${coverage.domains[i].id} has an impossible weight`);
		}
	}
	const low = ranges.reduce((sum, [min]) => sum + min, 0);
	const high = ranges.reduce((sum, [, max]) => sum + max, 0);
	if (low === high && low !== 100) report(`domain weights add up to ${low}, not 100`);
	if (low !== high && (low > 100 || high < 100)) {
		report(`domain weights span ${low} to ${high}, which can't make 100`);
	}

	const unitIds = new Set(units.map((unit) => unit.id));
	const taskIds = new Set(tasks.map((task) => task.id));
	const ids = new Set<string>();
	for (const domain of coverage.domains) {
		for (const id of [domain.id, ...domain.competencies.map((c) => `${domain.id}/${c.id}`)]) {
			if (ids.has(id)) report(`duplicate id ${id}`);
			ids.add(id);
		}
		for (const competency of domain.competencies) {
			if (!present(competency.title)) report(`${domain.id}/${competency.id} has no title`);
			for (const id of competency.units) {
				if (!unitIds.has(id)) report(`${domain.id}/${competency.id} names unknown unit ${id}`);
			}
			for (const id of competency.tasks) {
				if (!taskIds.has(id)) report(`${domain.id}/${competency.id} names unknown task ${id}`);
			}
		}
	}
	const mapped = new Set(
		coverage.domains.flatMap((domain) => domain.competencies.flatMap((c) => c.tasks))
	);
	for (const id of taskIds) {
		if (!mapped.has(id)) report(`task ${id} is mapped to no competency`);
	}
	return issues;
}

// ---------------------------------------------------------------------- content checks

/** One thing a checker has to pass. `seen` is the exact content, so an edit voids it. */
export interface CheckTarget {
	key: string;
	seen: string;
}

/** One independent check's results, kept in packs/<id>/checks/ and written by
 * scripts/pack-check.mjs, so that a checker fills in verdicts and copies no text. */
export interface ContentCheck {
	checker: string;
	entries: {
		key: string;
		seen: string;
		verdict: 'ok' | 'problem' | 'pending';
		comment?: string;
	}[];
}

const seenOf = (value: unknown) => JSON.stringify(value);

/** Everything in a pack that a checker must pass: the versions it claims, core facts,
 * tasks, curricula and every layer's text. */
export function checkTargets(
	pack: Pick<PackManifest, 'holdsFor' | 'lessons'>,
	units: readonly Unit[],
	tasks: readonly Task[],
	layers: Layers,
	coverage: readonly Coverage[] = []
): CheckTarget[] {
	const targets: CheckTarget[] = [{ key: 'core/holdsFor', seen: seenOf(pack.holdsFor) }];
	for (const lesson of pack.lessons) {
		targets.push({ key: `core/lesson/${lesson.id}`, seen: seenOf(lesson.study) });
	}
	for (const unit of units) {
		// The Overview shows a unit's sources, so moving or replacing one is checked too.
		targets.push({ key: `core/${unit.id}/sources`, seen: seenOf(unit.sources) });
		// A code board's gaps mean what their surroundings say, so the code is checked too.
		if (unit.layout.type === 'code') {
			targets.push({ key: `core/${unit.id}`, seen: seenOf(unit.layout.code) });
		}
		for (const cell of unit.cells) {
			const { item, text, clue, line, concepts, row, col } = cell;
			targets.push({
				key: `core/${unit.id}/${cell.id}`,
				seen: seenOf({ item, text, clue, line, concepts, row, col })
			});
		}
	}
	for (const task of tasks) {
		targets.push({ key: `core/task/${task.id}`, seen: seenOf(task) });
	}
	for (const entry of coverage) {
		targets.push({ key: `coverage/${entry.id}`, seen: seenOf(entry) });
	}
	for (const [name, layer] of Object.entries(layers)) {
		const { title, summary } = layer.course;
		targets.push({ key: `${name}/pack`, seen: seenOf({ title, summary }) });
		for (const [id, section] of Object.entries(layer.course.sections ?? {})) {
			targets.push({ key: `${name}/section/${id}`, seen: seenOf(section.title) });
		}
		for (const [id, lesson] of Object.entries(layer.course.lessons ?? {})) {
			targets.push({ key: `${name}/lesson/${id}`, seen: seenOf(lesson.title) });
		}
		for (const [id, concept] of Object.entries(layer.course.concepts ?? {})) {
			targets.push({ key: `${name}/concept/${id}`, seen: seenOf(concept) });
		}
		for (const [id, text] of Object.entries(layer.tasks)) {
			targets.push({ key: `${name}/task/${id}`, seen: seenOf(text) });
		}
		for (const [unitId, text] of Object.entries(layer.units)) {
			const { title, summary, headers } = text;
			if (title || summary || headers) {
				targets.push({ key: `${name}/${unitId}`, seen: seenOf({ title, summary, headers }) });
			}
			for (const [cellId, cellText] of Object.entries(text.cells ?? {})) {
				targets.push({ key: `${name}/${unitId}/${cellId}`, seen: seenOf(cellText) });
			}
		}
	}
	return targets;
}

/**
 * Every target needs REQUIRED_CHECKS different checkers who passed it as it now
 * stands: a check records what it saw, so an edit voids it.
 */
export function validateChecks(
	targets: readonly CheckTarget[],
	checks: readonly ContentCheck[]
): PackIssue[] {
	const issues: PackIssue[] = [];
	for (const target of targets) {
		const passedBy = new Set<string>();
		for (const check of checks) {
			const entry = check.entries.find((candidate) => candidate.key === target.key);
			if (entry?.verdict === 'ok' && entry.seen === target.seen) passedBy.add(check.checker);
		}
		if (passedBy.size < REQUIRED_CHECKS) {
			issues.push({
				where: target.key,
				problem: `passed by ${passedBy.size} of ${REQUIRED_CHECKS} required checks`
			});
		}
	}
	return issues;
}

// ---------------------------------------------------------------------- verification

/** One command the verify script runs, with everything filled in. */
export interface VerifyJob extends VerifyStep {
	key: string;
}

/** The record of a verify run, kept in packs/<id>/verified.json. */
export interface VerifyRecord {
	/** What the commands ran against, as the guard reported it. */
	ranAgainst: string;
	ranOn: string;
	entries: { key: string; seen: string; ok: boolean; output?: string }[];
}

function fill(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole);
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A step with its placeholders filled. In `expect` the values are escaped, so an
 * answer is matched literally. */
function fillStep(step: VerifyStep, values: Record<string, string>): VerifyStep {
	const escaped = Object.fromEntries(
		Object.entries(values).map(([name, value]) => [name, escapeRegExp(value)])
	);
	return {
		run: fill(step.run, values),
		stdin: step.stdin === undefined ? undefined : fill(step.stdin, values),
		expect: step.expect === undefined ? undefined : fill(step.expect, escaped)
	};
}

/**
 * What the verify script must run for a pack's units, with the answers filled in:
 * {text} is the answer, {line} the filled line, {code} the filled code, {row} and
 * {col} the cell's place.
 */
export function verifyJobs(units: readonly Unit[]): VerifyJob[] {
	const jobs: VerifyJob[] = [];
	for (const unit of units) {
		if (unit.layout.type === 'code') {
			if (!unit.verify?.run) continue;
			const step = fillStep(unit.verify as VerifyStep, { code: filledCode(unit) });
			jobs.push({ key: `verify/${unit.id}`, ...step });
			continue;
		}
		for (const cell of unit.cells) {
			const step = cell.verify ?? unit.verify?.columns?.[cell.col ?? ''] ?? unit.verify;
			if (!step?.run) continue;
			const values = {
				text: cell.text,
				line: cell.line === undefined ? '' : filledLine(cell),
				row: cell.row ?? '',
				col: cell.col ?? ''
			};
			jobs.push({ key: `verify/${unit.id}/${cell.id}`, ...fillStep(step as VerifyStep, values) });
		}
	}
	return jobs;
}

/** What a verify job is tied to: the exact command, input and expectation. */
export function verifySeen(job: VerifyJob): string {
	return seenOf({ run: job.run, stdin: job.stdin, expect: job.expect });
}

/** Every job must have passed, as it now stands, in the recorded run. */
export function validateVerified(
	jobs: readonly VerifyJob[],
	record: VerifyRecord | undefined
): PackIssue[] {
	if (jobs.length === 0) return [];
	if (!record) return [{ where: 'verified.json', problem: 'there is no verify record' }];
	const issues: PackIssue[] = [];
	for (const job of jobs) {
		const entry = record.entries.find((candidate) => candidate.key === job.key);
		if (!entry || entry.seen !== verifySeen(job)) {
			issues.push({ where: job.key, problem: 'not verified as it now stands' });
		} else if (!entry.ok) {
			issues.push({ where: job.key, problem: 'failed verification' });
		}
	}
	return issues;
}
