<script lang="ts">
	// Repetition: what is due across every started unit, one board at a time, and then
	// the tasks that are due again. Both queues are fixed when the review starts, so an
	// answer that comes straight back as due doesn't keep a board open forever: it
	// waits for the next review. Boards are asked by drag or by typing, and each
	// reviews the cards of its own skill. Adapted from LangClick2027 (591043e).
	import type { LocalTask, LocalUnit, PackManifest } from '@knowclick/pack-format';
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { skillOf, type AnswerMode } from './answerMode.svelte';
	import { t } from './locale.svelte';
	import { dueCells, dueTasks } from './progress.svelte';
	import QuizView from './QuizView.svelte';
	import TaskCard from './TaskCard.svelte';
	import TypeQuizView from './TypeQuizView.svelte';

	interface Props {
		pack: PackManifest;
		units: LocalUnit[];
		tasks: LocalTask[];
		mode?: AnswerMode;
	}

	let { pack, units, tasks, mode = 'drag' }: Props = $props();

	const queue = untrack(() =>
		units
			.map((unit) => ({
				unit,
				due: new Set(dueCells(pack.id, unit, undefined, skillOf(mode)).map((cell) => cell.item))
			}))
			.filter(({ due }) => due.size > 0)
	);
	const taskQueue = untrack(() => dueTasks(pack.id, tasks));

	let index = $state(0);
	let graded = $state<string[]>([]);
	const current = $derived(queue[index]);
	const remaining = $derived(queue.length - index);
	const tasksLeft = $derived(taskQueue.filter((task) => !graded.includes(task.id)));
	const anything = queue.length + taskQueue.length > 0;
</script>

<p>{anything ? t('review.intro') : t('review.none')}</p>

{#if current}
	<h2>{current.unit.title}</h2>
	<p class="remaining">{t('review.remaining', { count: remaining })}</p>
	{#key index}
		{@const next = {
			label: remaining > 1 || taskQueue.length ? t('review.next') : t('review.finish'),
			action: () => (index += 1)
		}}
		{#if mode === 'type'}
			<TypeQuizView {pack} unit={current.unit} only={current.due} {next} />
		{:else}
			<QuizView {pack} unit={current.unit} only={current.due} {next} />
		{/if}
	{/key}
{:else if tasksLeft.length}
	<h2>{t('review.tasks')}</h2>
	<p class="remaining">{t('review.tasksIntro')}</p>
	<div class="tasks">
		{#each tasksLeft as task (task.id)}
			<TaskCard {pack} {task} ongraded={() => (graded = [...graded, task.id])} />
		{/each}
	</div>
{:else if anything}
	<p class="done">{t('review.done')}</p>
{/if}

<p><a href={resolve('/')}>← {t('lesson.back')}</a></p>

<style>
	p {
		margin: 0 0 0.75rem;
	}

	h2 {
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.remaining {
		font-size: 0.85rem;
		color: var(--muted);
	}

	.tasks {
		display: grid;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}

	.done {
		font-weight: 600;
		color: var(--known);
	}
</style>
