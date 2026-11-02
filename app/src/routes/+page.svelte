<script lang="ts">
	import { CATEGORIES } from '@knowclick/pack-format';
	import { resolve } from '$app/paths';
	import { t } from '$lib/locale.svelte';
	import type { LocalLesson } from '$lib/packs';
	import { dueCount, dueTasks, isStudied, tasksKnown, unitKnown } from '$lib/progress.svelte';

	let { data } = $props();

	function known(packId: string, lesson: LocalLesson) {
		const cells = lesson.units.reduce((sum, unit) => sum + unitKnown(packId, unit), 0);
		return cells + tasksKnown(packId, lesson.tasks);
	}

	function total(lesson: LocalLesson) {
		return lesson.units.reduce((sum, unit) => sum + unit.cells.length, 0) + lesson.tasks.length;
	}

	function due(packId: string, lesson: LocalLesson) {
		const cells = lesson.units.reduce((sum, unit) => sum + dueCount(packId, unit), 0);
		return cells + dueTasks(packId, lesson.tasks).length;
	}

	const categories = $derived(
		CATEGORIES.map((category) => ({
			category,
			packs: data.packs.filter(({ pack }) => pack.category === category)
		})).filter(({ packs }) => packs.length > 0)
	);
</script>

<svelte:head>
	<title>Knowclick</title>
</svelte:head>

<main>
	<h1>Knowclick</h1>
	<p class="tagline">{t('app.tagline')}</p>

	{#each categories as { category, packs } (category)}
		<h2 class="category">{t(`category.${category}`)}</h2>
		{#each packs as { pack, course } (pack.id)}
			{@const dueTotal = course.lessons.reduce((sum, lesson) => sum + due(pack.id, lesson), 0)}
			<section>
				<h3>{course.title}</h3>
				<p class="summary">{course.summary}</p>
				<p class="quiet">
					{t('home.holdsFor', {
						versions: pack.holdsFor.map((entry) => `${entry.name} ${entry.version}`).join(', '),
						date: pack.checkedOn
					})}
				</p>
				{#if dueTotal > 0}
					<a class="action review" href={resolve('/review/[pack]', { pack: pack.id })}
						>{t('home.review', { count: dueTotal })}</a
					>
				{:else}
					<p class="quiet">{t('home.nothingDue')}</p>
				{/if}
				{#each pack.sections as sectionId (sectionId)}
					{@const inSection = course.lessons.filter((lesson) => lesson.section.id === sectionId)}
					{#if inSection.length > 0}
						<h4>{inSection[0].section.title}</h4>
						<ol>
							{#each inSection as lesson (lesson.id)}
								{@const dueNow = due(pack.id, lesson)}
								{@const knownNow = known(pack.id, lesson)}
								{@const size = total(lesson)}
								<li>
									<a
										href={resolve('/lesson/[pack]/[lesson]', {
											pack: pack.id,
											lesson: lesson.id
										})}
									>
										<span class="title">{lesson.title}</span>
										<span class="count">
											{#if isStudied(pack.id, lesson.id)}<span class="studied"
													>✓ {t('lesson.studied')}</span
												>{/if}
											{t('count.known', { known: knownNow, total: size })}
											{#if dueNow > 0}<span class="due">{t('count.due', { count: dueNow })}</span
												>{/if}
										</span>
										<span class="bar" aria-hidden="true">
											<span style:width="{size ? (100 * knownNow) / size : 0}%"></span>
										</span>
									</a>
								</li>
							{/each}
						</ol>
					{/if}
				{/each}
			</section>
		{/each}
	{/each}
</main>

<style>
	.tagline {
		margin: 0.25rem 0 1rem;
		color: var(--muted);
	}

	.category {
		margin-top: 1rem;
		font-size: 0.9rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	h3 {
		margin: 0.5rem 0 0;
		font-size: 1.3rem;
	}

	/* Each pack is its own block, so a second one doesn't read as part of the first. */
	section + section {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.summary {
		margin: 0.25rem 0;
	}

	.review {
		margin-top: 0.5rem;
	}

	.quiet {
		margin: 0.25rem 0;
		font-size: 0.9rem;
		color: var(--muted);
	}

	h4 {
		margin: 1.25rem 0 0;
		font-size: 1rem;
		color: var(--muted);
	}

	ol {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 0.6rem;
		margin: 0.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	li a {
		display: block;
		height: 100%;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--card);
		color: inherit;
		text-decoration: none;
	}

	li a:hover {
		border-color: var(--accent);
	}

	.title {
		display: block;
		font-weight: 600;
	}

	.count {
		display: block;
		margin: 0.2rem 0 0.4rem;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.studied {
		color: var(--known);
	}

	.due {
		color: var(--revealed);
		font-weight: 600;
	}

	.bar {
		display: block;
		height: 0.35rem;
		border-radius: 0.2rem;
		background: var(--line);
		overflow: hidden;
	}

	.bar span {
		display: block;
		height: 100%;
		background: var(--known);
	}
</style>
