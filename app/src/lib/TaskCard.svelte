<script lang="ts">
	// A task done outside the app, in a terminal or on a cluster of one's own. The
	// prompt and the solution stay at the source; this keeps time and asks how it
	// went, and the answer schedules the task like any other card.
	import type { Grade } from '@knowclick/srs';
	import type { LocalTask, PackManifest } from '@knowclick/pack-format';
	import { onDestroy } from 'svelte';
	import { KNOWN_CLEAN_STREAK } from './difficulty';
	import { t } from './locale.svelte';
	import { recordPractice, taskDueDate, taskLevel } from './progress.svelte';

	interface Props {
		pack: PackManifest;
		task: LocalTask;
		/** Called once the learner has graded the task. */
		ongraded?: (grade: Grade) => void;
	}

	let { pack, task, ongraded }: Props = $props();

	let startedAt = $state<number>();
	let now = $state(Date.now());
	let justGraded = $state(false);
	let ticker: ReturnType<typeof setInterval> | undefined;

	const dots = Array.from({ length: KNOWN_CLEAN_STREAK }, (_unused, i) => i);
	const level = $derived(taskLevel(pack.id, task));
	const due = $derived(taskDueDate(pack.id, task));
	const elapsed = $derived(startedAt === undefined ? 0 : Math.floor((now - startedAt) / 1000));
	const over = $derived(elapsed > task.minutes * 60);

	function clock(seconds: number): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
	}

	function start() {
		startedAt = Date.now();
		now = startedAt;
		justGraded = false;
		clearInterval(ticker);
		ticker = setInterval(() => (now = Date.now()), 1000);
	}

	function stop() {
		clearInterval(ticker);
		ticker = undefined;
	}

	async function grade(value: Grade) {
		stop();
		startedAt = undefined;
		await recordPractice(pack.id, task, value);
		justGraded = true;
		ongraded?.(value);
	}

	onDestroy(stop);

	const grades: { value: Grade; key: 'task.again' | 'task.hard' | 'task.good' }[] = [
		{ value: 'again', key: 'task.again' },
		{ value: 'hard', key: 'task.hard' },
		{ value: 'good', key: 'task.good' }
	];
</script>

<article class="task" data-task-id={task.id}>
	<header>
		<h3>{task.title}</h3>
		<span class="level" title={t('task.level', { level, top: KNOWN_CLEAN_STREAK })}>
			{#each dots as i (i)}
				<span class="dot" class:on={i < level}></span>
			{/each}
		</span>
	</header>
	<p>{task.brief}</p>
	<p class="meta">
		{t(`task.where.${task.where}`)} · {t('task.minutes', { minutes: task.minutes })}
		{#if due}· {t('task.due', { date: due })}{/if}
	</p>
	<p>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an outside address -->
		<a href={task.source.url} rel="external noreferrer" target="_blank">{t('task.open')}</a>
		<span class="source">({task.source.title})</span>
	</p>

	<div class="actions">
		{#if startedAt === undefined}
			<button type="button" class="action quiet" onclick={start}>{t('task.start')}</button>
		{:else}
			<span class="clock" class:over aria-live="off">{clock(elapsed)}</span>
		{/if}
		<span class="how">{t('task.how')}</span>
		{#each grades as { value, key } (value)}
			<button type="button" class="grade {value}" data-grade={value} onclick={() => grade(value)}
				>{t(key, { minutes: task.minutes })}</button
			>
		{/each}
	</div>
	{#if justGraded}
		<p class="recorded" aria-live="polite">{t('task.recorded', { date: due ?? '' })}</p>
	{/if}
</article>

<style>
	.task {
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--card);
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
	}

	p {
		margin: 0.35rem 0;
	}

	.meta,
	.source,
	.how {
		font-size: 0.85rem;
		color: var(--muted);
	}

	.level {
		display: inline-flex;
		gap: 0.2rem;
	}

	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 50%;
		background: var(--line);
	}

	.dot.on {
		background: var(--known);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}

	.clock {
		min-width: 4ch;
		font-family: var(--mono);
		font-weight: 600;
	}

	.clock.over {
		color: var(--wrong);
	}

	.grade {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		cursor: pointer;
	}

	.grade.again:hover {
		border-color: var(--wrong);
	}

	.grade.hard:hover {
		border-color: var(--revealed);
	}

	.grade.good:hover {
		border-color: var(--known);
	}

	.recorded {
		font-size: 0.9rem;
		color: var(--known);
	}
</style>
