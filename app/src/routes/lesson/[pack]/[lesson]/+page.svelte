<script lang="ts">
	// A lesson's order is the point: study its source first, then the boards here,
	// then the tasks by hand. Marking it studied is a note to yourself, and locks
	// nothing. Adapted from LangClick2027 (591043e).
	import { resolve } from '$app/paths';
	import ConceptList from '$lib/ConceptList.svelte';
	import { t } from '$lib/locale.svelte';
	import { unitHref } from '$lib/opening';
	import TaskCard from '$lib/TaskCard.svelte';
	import { dueCount, isStudied, setStudied, unitKnown, unitStarted } from '$lib/progress.svelte';

	let { data } = $props();

	const pack = $derived(data.pack);
	const lesson = $derived(data.lesson);
	const studied = $derived(isStudied(pack.id, lesson.id));
	const concepts = $derived.by(() => {
		const byId = new Map(
			lesson.units.flatMap((unit) =>
				unit.cells.flatMap((cell) => cell.conceptDetails.map((c) => [c.id, c] as const))
			)
		);
		return [...byId.values()];
	});
</script>

<svelte:head>
	<title>{lesson.title} · Knowclick</title>
</svelte:head>

<main>
	<a class="back" href={resolve('/')}>← {t('lesson.back')}</a>
	<h1>{lesson.title}</h1>

	<section>
		<h2>{t('lesson.study')}</h2>
		{#if lesson.study.length}
			<p class="quiet">{t('lesson.studyIntro')}</p>
			<ul class="study">
				{#each lesson.study as link (link.url)}
					<li>
						<span class="kind">{t(`study.${link.kind}`)}</span>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an outside address -->
						<a href={link.url} rel="external noreferrer" target="_blank">{link.title}</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="quiet">{t('lesson.noStudy')}</p>
		{/if}
		<label class="mark">
			<input
				type="checkbox"
				name="studied"
				checked={studied}
				onchange={(event) => void setStudied(pack.id, lesson.id, event.currentTarget.checked)}
			/>
			{t('lesson.markStudied')}
		</label>
	</section>

	<section>
		<h2>{t('lesson.exercises')}</h2>
		<ul class="units">
			{#each lesson.units as unit (unit.id)}
				{@const due = dueCount(pack.id, unit)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- unitHref resolves it -->
					<a href={unitHref(pack.id, unit.id, unitStarted(pack.id, unit))}>
						<span class="title">{unit.title}</span>
						<span class="count">
							{t('count.known', { known: unitKnown(pack.id, unit), total: unit.cells.length })}
							{#if due > 0}<span class="due">{t('count.due', { count: due })}</span>{/if}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	{#if lesson.tasks.length}
		<section>
			<h2>{t('lesson.practise')}</h2>
			<p class="quiet">{t('lesson.practiseIntro')}</p>
			<div class="tasks">
				{#each lesson.tasks as task (task.id)}
					<TaskCard {pack} {task} />
				{/each}
			</div>
		</section>
	{/if}

	{#if concepts.length}
		<section>
			<h2>{t('lesson.concepts')}</h2>
			<ConceptList {concepts} />
		</section>
	{/if}
</main>

<style>
	.back {
		font-size: 0.9rem;
		text-decoration: none;
	}

	h1 {
		margin: 0.15rem 0 0.75rem;
		font-size: 1.4rem;
	}

	section {
		margin-bottom: 1.25rem;
	}

	h2 {
		margin-bottom: 0.35rem;
		font-size: 1.05rem;
	}

	.quiet {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		color: var(--muted);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.study li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.25rem 0;
	}

	.kind {
		min-width: 5rem;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.5rem;
		cursor: pointer;
	}

	.units {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 0.6rem;
	}

	.tasks {
		display: grid;
		gap: 0.6rem;
	}

	.units a {
		display: block;
		height: 100%;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--card);
		color: inherit;
		text-decoration: none;
	}

	.units a:hover {
		border-color: var(--accent);
	}

	.title {
		display: block;
		font-weight: 600;
	}

	.count {
		display: block;
		margin-top: 0.2rem;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.due {
		color: var(--revealed);
		font-weight: 600;
	}
</style>
