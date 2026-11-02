import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createQuizSession } from '@knowclick/quiz-engine';
import { userEvent } from 'vitest/browser';
import {
	localizeTask,
	localizeUnit,
	type CourseText,
	type PackManifest,
	type Task,
	type TaskText,
	type Unit,
	type UnitText
} from '@knowclick/pack-format';
import resources from '../../../packs/kubernetes/units/resources.json';
import resourcesText from '../../../packs/kubernetes/layers/en/units/resources.json';
import manifestFile from '../../../packs/kubernetes/units/deployment-manifest.json';
import manifestText from '../../../packs/kubernetes/layers/en/units/deployment-manifest.json';
import imperative from '../../../packs/kubernetes/units/imperative.json';
import imperativeText from '../../../packs/kubernetes/layers/en/units/imperative.json';
import tasksFile from '../../../packs/kubernetes/tasks.json';
import tasksText from '../../../packs/kubernetes/layers/en/tasks.json';
import courseText from '../../../packs/kubernetes/layers/en/course.json';
import pack from '../../../packs/kubernetes/pack.json';
import { useLocale } from './locale.svelte';
import { forgetRound, rememberRound } from './quizRound';
import {
	dueCells,
	dueTasks,
	levelOf,
	loadProgress,
	recordAnswer,
	recordPractice,
	resetProgressMirror,
	taskLevel
} from './progress.svelte';
import { todayLocalDate } from './progressRepository';
import QuizView from './QuizView.svelte';
import ReviewView from './ReviewView.svelte';
import TaskCard from './TaskCard.svelte';
import TypeQuizView from './TypeQuizView.svelte';

const packManifest = pack as unknown as PackManifest;
const course = courseText as CourseText;
const unit = localizeUnit(resources as unknown as Unit, resourcesText as UnitText, course);
const code = localizeUnit(manifestFile as unknown as Unit, manifestText as UnitText, course);
const lines = localizeUnit(imperative as unknown as Unit, imperativeText as UnitText, course);
const tasks = (tasksFile as unknown as Task[]).map((task) =>
	localizeTask(task, (tasksText as Record<string, TaskText>)[task.id])
);
const SHARED = ['pods.api', 'services.api', 'configmaps.api', 'secrets.api'];

const cellEl = (id: string) => document.querySelector<HTMLElement>(`[data-cell-id="${id}"]`)!;
const slips = () => [...document.querySelectorAll<HTMLElement>('[data-slip-id]')];
const slipWith = (text: string) => slips().find((slip) => slip.textContent === text);
const dealt = () => slips().reduce((sum, slip) => sum + Number(slip.dataset.count ?? 1), 0);

function dayAfter(today: string, days: number): string {
	const [y, m, d] = today.split('-').map(Number);
	const next = new Date(y, m - 1, d + days);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

async function place(text: string, cellId: string) {
	const slip = slipWith(text);
	expect(slip, `a slip "${text}" in the tray`).toBeDefined();
	await userEvent.click(slip!);
	await userEvent.click(cellEl(cellId));
}

/** Plays until a slip with this text is in the hand, by answering others correctly.
 * The deal is random, so a test that needs a cell left open has to name it. */
async function dealUntil(text: string, keepOpen: string[] = []) {
	while (!slipWith(text)) {
		const slip = slips().find((candidate) => !keepOpen.includes(candidate.dataset.slipId!))!;
		const own = slip.dataset.slipId!;
		await userEvent.click(slip);
		await userEvent.click(cellEl(own));
	}
}

function start(board = unit) {
	forgetRound(packManifest.id, board.id);
	return render(QuizView, { pack: packManifest, unit: board });
}

beforeEach(async () => {
	localStorage.clear();
	useLocale('en');
	resetProgressMirror();
	await loadProgress(packManifest.id);
});

describe('QuizView', () => {
	it('deals ten slips on a new unit, and shows no answers', async () => {
		start();
		expect(dealt()).toBe(10);
		expect(cellEl('pods.api').textContent?.trim()).toBe('');
	});

	it.each([
		['pods.api', 'services.api'],
		['secrets.api', 'configmaps.api']
	])('accepts a v1 slip on %s and then on %s', async (first, second) => {
		start();
		await dealUntil('v1', SHARED);
		await place('v1', first);
		expect(cellEl(first).classList.contains('correct')).toBe(true);
		expect(cellEl(first).textContent).toContain('v1');

		await dealUntil('v1', SHARED);
		await place('v1', second);
		expect(cellEl(second).classList.contains('correct')).toBe(true);
		expect(document.querySelector('.revealed')).toBeNull();
	});

	it('shows identical slips once, with a count', async () => {
		start({ ...unit, dealAll: true });
		expect(dealt()).toBe(unit.cells.length);
		expect(slipWith('v1')?.dataset.count).toBe('7');
		expect(slipWith('apps/v1')?.dataset.count).toBe('3');
	});

	it('offers every slip on a round saved with a smaller hand, when the unit deals all', async () => {
		const all = { ...unit, dealAll: true };
		forgetRound(packManifest.id, all.id);
		const session = createQuizSession(all.cells.map((cell) => ({ id: cell.id, text: cell.text })));
		rememberRound(packManifest.id, all.id, { session, hand: ['pods.short'], size: 1 });
		render(QuizView, { pack: packManifest, unit: all });
		expect(dealt()).toBe(all.cells.length);
	});

	it('ignores a drop on a cell already filled', async () => {
		start();
		await dealUntil('po', ['services.short']);
		await place('po', 'pods.short');
		await dealUntil('svc', ['pods.short']);
		await place('svc', 'pods.short');
		expect(cellEl('services.short').classList.contains('revealed')).toBe(false);
		expect(slipWith('svc')).toBeDefined();
	});

	it('reveals the right cell on a wrong drop, explains, and lowers the level', async () => {
		start();
		await dealUntil('deploy', ['pods.short']);
		await place('deploy', 'pods.short');
		expect(cellEl('deployments.short').classList.contains('revealed')).toBe(true);
		expect(cellEl('deployments.short').textContent).toContain('deploy');
		expect(cellEl('pods.short').classList.contains('correct')).toBe(false);
		expect(document.querySelector('aside')?.textContent).toContain('Not there');
		expect(slipWith('deploy')).toBeUndefined();
	});

	it('raises the earned level on a correct answer and saves it', async () => {
		start();
		await dealUntil('netpol');
		await place('netpol', 'networkpolicies.short');
		const cell = unit.cells.find((c) => c.id === 'networkpolicies.short')!;
		expect(levelOf(packManifest.id, cell)).toBe(1);

		resetProgressMirror();
		await loadProgress(packManifest.id);
		expect(levelOf(packManifest.id, cell)).toBe(1);
	});

	it('cancels a selected slip with Escape, so the next cell press does nothing', async () => {
		start();
		const slip = slips()[0];
		const own = slip.dataset.slipId!;
		await userEvent.click(slip);
		expect(slip.getAttribute('aria-pressed')).toBe('true');
		await userEvent.keyboard('{Escape}');
		expect(slip.getAttribute('aria-pressed')).toBe('false');
		await userEvent.click(cellEl(own));
		expect(cellEl(own).classList.contains('correct')).toBe(false);
	});

	it('finishes a round and offers another', async () => {
		start();
		for (let i = 0; i < unit.cells.length; i++) {
			const slip = slips()[0];
			const own = slip.dataset.slipId!;
			await userEvent.click(slip);
			await userEvent.click(cellEl(own));
		}
		expect(document.querySelector('.score')?.textContent).toContain(
			`${unit.cells.length} of ${unit.cells.length}`
		);
		expect(slips()).toHaveLength(0);
	});

	it('marks a missing short name as a gap with no cell', async () => {
		start();
		expect(cellEl('jobs.short')).toBeNull();
		expect(cellEl('jobs.api')).not.toBeNull();
	});
});

describe('a code board', () => {
	it('shows the code around its gaps and deals every field', async () => {
		start(code);
		const block = document.querySelector('pre')!;
		expect(block.textContent).toContain('kind: Deployment');
		expect(block.textContent).toContain('httpGet:');
		expect(block.textContent).not.toContain('readinessProbe');
		expect(dealt()).toBe(code.cells.length);
	});

	it('fills a gap in place, inside the code', async () => {
		start(code);
		await place('readinessProbe', 'readinessProbe');
		const gap = cellEl('readinessProbe');
		expect(gap.classList.contains('correct')).toBe(true);
		expect(gap.closest('pre')?.textContent).toContain('readinessProbe');
	});

	it('names a gap by its place, not by its answer', async () => {
		start(code);
		expect(cellEl('emptyDir').getAttribute('aria-label')).not.toContain('emptyDir');
	});
});

describe('a board of lines', () => {
	it('shows the line with a gap and its clue, then with the answer in it', async () => {
		start(lines);
		const from = cellEl('from');
		expect(from.textContent).toContain('kubectl create job pi-once');
		expect(from.textContent).toContain("CronJob pi's template");
		expect(from.textContent).not.toContain('--from');

		await dealUntil('--from');
		await place('--from', 'from');
		expect(cellEl('from').classList.contains('correct')).toBe(true);
		expect(cellEl('from').textContent).toContain('pi-once --from=cronjob/pi');
	});
});

describe('the hand', () => {
	it('stays at ten when the unit is known', async () => {
		forgetRound(packManifest.id, unit.id);
		for (let i = 0; i < 6; i++) {
			for (const cell of unit.cells) await recordAnswer(packManifest.id, cell, 'good');
		}
		render(QuizView, { pack: packManifest, unit });
		expect(dealt()).toBe(10);
	});
});

describe('a task', () => {
	const task = tasks[0];

	it('starts unscheduled, and a good run raises its level and schedules it', async () => {
		render(TaskCard, { pack: packManifest, task });
		expect(document.querySelector('.meta')?.textContent).not.toContain('next due');
		await userEvent.click(document.querySelector<HTMLElement>('[data-grade="good"]')!);
		expect(taskLevel(packManifest.id, task)).toBe(1);
		expect(document.querySelector('.recorded')?.textContent).toContain(
			dayAfter(todayLocalDate(), 1)
		);
		expect(dueTasks(packManifest.id, tasks)).toEqual([]);

		resetProgressMirror();
		await loadProgress(packManifest.id);
		expect(taskLevel(packManifest.id, task)).toBe(1);
	});

	it('is due again the same day when it couldn’t be done', async () => {
		render(TaskCard, { pack: packManifest, task });
		await userEvent.click(document.querySelector<HTMLElement>('[data-grade="again"]')!);
		expect(dueTasks(packManifest.id, tasks).map((t) => t.id)).toEqual([task.id]);
	});

	it('keeps time once started, against the minutes it aims for', async () => {
		render(TaskCard, { pack: packManifest, task });
		expect(document.querySelector('.meta')?.textContent).toContain(`${task.minutes} min`);
		await userEvent.click(document.querySelector<HTMLElement>('.actions .action')!);
		expect(document.querySelector('.clock')?.textContent).toMatch(/^0:0\d$/);
	});

	it('keeps a task’s level apart from a board answer with the same item', async () => {
		await recordAnswer(packManifest.id, { item: task.item }, 'good');
		expect(taskLevel(packManifest.id, task)).toBe(0);
	});
});

describe('review', () => {
	const cell = (id: string) => unit.cells.find((c) => c.id === id)!;

	it('finds what is due: an answer missed today, but not a new item or a correct one', async () => {
		await recordAnswer(packManifest.id, cell('pods.short'), 'again');
		await recordAnswer(packManifest.id, cell('services.short'), 'good');
		expect(dueCells(packManifest.id, unit).map((c) => c.id)).toEqual(['pods.short']);
	});

	it('finds a correct answer once its day comes', async () => {
		await recordAnswer(packManifest.id, cell('services.short'), 'good');
		const later = dayAfter(todayLocalDate(), 1);
		expect(dueCells(packManifest.id, unit, later).map((c) => c.id)).toEqual(['services.short']);
	});

	it('asks only what is due, shows the rest, and ignores a drop on what is shown', async () => {
		await recordAnswer(packManifest.id, cell('pods.short'), 'again');
		render(QuizView, { pack: packManifest, unit, only: new Set([cell('pods.short').item]) });
		expect(slips().map((slip) => slip.textContent)).toEqual(['po']);
		expect(cellEl('services.short').classList.contains('given')).toBe(true);
		expect(cellEl('services.short').textContent).toContain('svc');
		expect(cellEl('pods.short').textContent?.trim()).toBe('');

		await place('po', 'services.short');
		expect(slipWith('po')).toBeDefined();
		expect(cellEl('pods.short').classList.contains('revealed')).toBe(false);

		// The drop was ignored, so the slip is still selected.
		await userEvent.click(cellEl('pods.short'));
		expect(cellEl('pods.short').classList.contains('correct')).toBe(true);
		expect(levelOf(packManifest.id, cell('pods.short'))).toBe(1);
	});

	it('walks the boards with something due, then the tasks, then says it is done', async () => {
		await recordAnswer(packManifest.id, { item: 'resource:deployments:apiVersion' }, 'again');
		await recordPractice(packManifest.id, tasks[1], 'again');
		render(ReviewView, { pack: packManifest, units: [unit, code], tasks });

		// Both boards hold the item: a Deployment's apiVersion is on each.
		expect(document.querySelector('h2')?.textContent).toBe(unit.title);
		await place('apps/v1', 'deployments.api');
		await userEvent.click(document.querySelector<HTMLElement>('.score .action')!);
		expect(document.querySelector('h2')?.textContent).toBe(code.title);
		await place('apps/v1', 'apiVersion');
		await userEvent.click(document.querySelector<HTMLElement>('.score .action')!);

		expect(document.querySelector('h2')?.textContent).toBe('Tasks due again');
		expect(document.querySelectorAll('[data-task-id]')).toHaveLength(1);
		await userEvent.click(document.querySelector<HTMLElement>('[data-grade="good"]')!);
		expect(document.querySelector('.done')?.textContent).toContain('All done');
	});

	it('says so when nothing is due', async () => {
		render(ReviewView, { pack: packManifest, units: [unit], tasks });
		expect(document.querySelector('p')?.textContent).toContain('Nothing is due');
		expect(document.querySelector('[data-cell-id]')).toBeNull();
		expect(document.querySelector('[data-task-id]')).toBeNull();
	});
});

describe('typing', () => {
	const typeIn = async (text: string) => {
		const input = document.querySelector<HTMLInputElement>('#typed-answer')!;
		await userEvent.clear(input);
		if (text) await userEvent.type(input, text);
		await userEvent.keyboard('{Enter}');
	};
	const asked = () => document.querySelector<HTMLElement>('.target')?.dataset.cellId;

	function startTyping(board = unit) {
		forgetRound(packManifest.id, `${board.id}#type`);
		return render(TypeQuizView, { pack: packManifest, unit: board });
	}

	it('asks the first open place in board order, and fills it when typed right', async () => {
		startTyping();
		expect(asked()).toBe('pods.short');
		await typeIn('po');
		expect(cellEl('pods.short').classList.contains('correct')).toBe(true);
		expect(asked()).toBe('pods.api');
	});

	it('saves a typed answer as its own card, apart from dragging, and Known shows it', async () => {
		startTyping();
		await typeIn('po');
		const cell = unit.cells.find((c) => c.id === 'pods.short')!;
		expect(levelOf(packManifest.id, cell)).toBe(1);
		expect(dueCells(packManifest.id, unit, undefined, 'recognise')).toEqual([]);

		resetProgressMirror();
		await loadProgress(packManifest.id);
		expect(levelOf(packManifest.id, cell)).toBe(1);
	});

	it('reveals the answer on a wrong one, says what was typed, and moves on', async () => {
		startTyping();
		await typeIn('pod');
		expect(cellEl('pods.short').classList.contains('revealed')).toBe(true);
		expect(document.querySelector('aside')?.textContent).toContain('Not \u201cpod\u201d');
		expect(asked()).toBe('pods.api');
		expect(dueCells(packManifest.id, unit, undefined, 'produce').map((c) => c.id)).toEqual([
			'pods.short'
		]);
	});

	it('ignores an empty answer', async () => {
		startTyping();
		await typeIn('');
		expect(asked()).toBe('pods.short');
		expect(document.querySelector('.revealed')).toBeNull();
	});

	it('asks another open place when it is pressed', async () => {
		startTyping();
		await userEvent.click(cellEl('ingresses.short'));
		expect(asked()).toBe('ingresses.short');
		await typeIn('ing');
		expect(cellEl('ingresses.short').classList.contains('correct')).toBe(true);
	});

	it('keeps case for flags and fields', async () => {
		startTyping(lines);
		await userEvent.click(cellEl('image'));
		await typeIn('--IMAGE');
		expect(cellEl('image').classList.contains('revealed')).toBe(true);
	});

	it('ignores case only where the unit says its answers are names', async () => {
		const names = { ...unit, id: 'names', caseInsensitive: true };
		startTyping(names);
		await typeIn('PO');
		expect(cellEl('pods.short').classList.contains('correct')).toBe(true);
	});

	it('asks a code board gap by gap, in the order of the code', async () => {
		startTyping(code);
		expect(asked()).toBe('apiVersion');
		await typeIn('apps/v1');
		expect(asked()).toBe('selector');
	});

	it('reviews by typing only what is due for typing', async () => {
		await recordAnswer(packManifest.id, { item: 'resource:pods:short' }, 'again', 'produce');
		await recordAnswer(packManifest.id, { item: 'resource:services:short' }, 'again');
		render(ReviewView, { pack: packManifest, units: [unit], tasks, mode: 'type' });
		expect(asked()).toBe('pods.short');
		expect(cellEl('services.short').classList.contains('given')).toBe(true);
	});
});
