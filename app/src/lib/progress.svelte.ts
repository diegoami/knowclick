// The learner's earned levels and studied lessons, kept reactive so every screen
// follows an answer without reloading. The repository is the durable copy; this is
// its mirror. Copied from LangClick2027 (591043e), with tasks added: a cell is a
// `recognise` card when its slip is dragged and a `produce` card when its answer is
// typed, and a task is a `practise` card, so each keeps its own level.

import { isDue, rate, type Grade } from '@knowclick/srs';
import type { Cell, LocalUnit, Task } from '@knowclick/pack-format';
import { knownCount } from './difficulty';
import {
	LocalStorageProgressRepository,
	todayLocalDate,
	type Card,
	type ProgressRepository,
	type Skill
} from './progressRepository';

type ItemRef = Pick<Cell, 'item'>;
type TaskRef = Pick<Task, 'item'>;

let repository: ProgressRepository = new LocalStorageProgressRepository();
let cardsByPack = $state<Record<string, Record<string, Card>>>({});
let studiedByPack = $state<Record<string, string[]>>({});

const cardKey = (skill: Skill, item: string) => `${skill}/${item}`;

function cardOf(packId: string, skill: Skill, item: string): Card | undefined {
	return cardsByPack[packId]?.[cardKey(skill, item)];
}

/** Reads a pack's saved progress. Screens await this in their route's load. */
export async function loadProgress(packId: string): Promise<void> {
	if (cardsByPack[packId]) return;
	const [cards, studied] = await Promise.all([
		repository.getCards(packId),
		repository.getStudied(packId)
	]);
	cardsByPack[packId] = Object.fromEntries(
		cards.map((card) => [cardKey(card.skill, card.itemId), card])
	);
	studiedByPack[packId] = studied;
}

/** The skills a board answer can be given in: dragging a slip, or typing. */
export type AnswerSkill = Extract<Skill, 'recognise' | 'produce'>;

/** The earned level of one cell: the stronger of dragging and typing, since typing
 * is optional and a cell you recognise is learned. 0 if never answered. */
export function levelOf(packId: string, cell: ItemRef): number {
	return Math.max(
		cardOf(packId, 'recognise', cell.item)?.cleanStreak ?? 0,
		cardOf(packId, 'produce', cell.item)?.cleanStreak ?? 0
	);
}

export function unitLevels(packId: string, unit: LocalUnit): number[] {
	return unit.cells.map((cell) => levelOf(packId, cell));
}

export function unitKnown(packId: string, unit: LocalUnit): number {
	return knownCount(unitLevels(packId, unit));
}

/** Whether the learner has answered anything in this unit yet. */
export function unitStarted(packId: string, unit: LocalUnit): boolean {
	return unit.cells.some(
		(cell) =>
			cardOf(packId, 'recognise', cell.item) !== undefined ||
			cardOf(packId, 'produce', cell.item) !== undefined
	);
}

/** What is due for review in this unit, in one skill. An item never answered in that
 * skill isn't due: it's new, and belongs to the quiz. */
export function dueCells(
	packId: string,
	unit: LocalUnit,
	today = todayLocalDate(),
	skill: AnswerSkill = 'recognise'
) {
	return unit.cells.filter((cell) => {
		const card = cardOf(packId, skill, cell.item);
		return card !== undefined && isDue(card, today);
	});
}

/** How many cells of this unit are due in either skill, for counts on Home and a
 * lesson. */
export function dueCount(packId: string, unit: LocalUnit, today = todayLocalDate()): number {
	return unit.cells.filter((cell) =>
		(['recognise', 'produce'] as const).some((skill) => {
			const card = cardOf(packId, skill, cell.item);
			return card !== undefined && isDue(card, today);
		})
	).length;
}

async function record(packId: string, skill: Skill, item: string, grade: Grade): Promise<void> {
	const card: Card = {
		...rate(cardOf(packId, skill, item), grade, todayLocalDate()),
		itemId: item,
		skill
	};
	cardsByPack[packId] = { ...cardsByPack[packId], [cardKey(skill, item)]: card };
	await repository.saveCard(packId, card);
}

/** Records one answer on a board, in memory at once and then on disk. */
export function recordAnswer(
	packId: string,
	cell: ItemRef,
	grade: Grade,
	skill: AnswerSkill = 'recognise'
): Promise<void> {
	return record(packId, skill, cell.item, grade);
}

/** Records how a task done by hand went, as the learner judged it. */
export function recordPractice(packId: string, task: TaskRef, grade: Grade): Promise<void> {
	return record(packId, 'practise', task.item, grade);
}

/** A task's earned level, 0 if it has never been done. */
export function taskLevel(packId: string, task: TaskRef): number {
	return cardOf(packId, 'practise', task.item)?.cleanStreak ?? 0;
}

/** When a task done before comes back, or undefined if it never has been done. */
export function taskDueDate(packId: string, task: TaskRef): string | undefined {
	return cardOf(packId, 'practise', task.item)?.dueDate;
}

/** The tasks done before that are due again. A task never done isn't due: it's new. */
export function dueTasks<T extends TaskRef>(
	packId: string,
	tasks: readonly T[],
	today = todayLocalDate()
): T[] {
	return tasks.filter((task) => {
		const card = cardOf(packId, 'practise', task.item);
		return card !== undefined && isDue(card, today);
	});
}

export function tasksKnown(packId: string, tasks: readonly TaskRef[]): number {
	return knownCount(tasks.map((task) => taskLevel(packId, task)));
}

export function isStudied(packId: string, lessonId: string): boolean {
	return studiedByPack[packId]?.includes(lessonId) ?? false;
}

export async function setStudied(
	packId: string,
	lessonId: string,
	studied: boolean
): Promise<void> {
	const others = (studiedByPack[packId] ?? []).filter((id) => id !== lessonId);
	const next = studied ? [...others, lessonId] : others;
	studiedByPack[packId] = next;
	await repository.saveStudied(packId, next);
}

/** Tests only: forget the mirror, as a reload would. */
export function resetProgressMirror(next?: ProgressRepository): void {
	cardsByPack = {};
	studiedByPack = {};
	if (next) repository = next;
}
