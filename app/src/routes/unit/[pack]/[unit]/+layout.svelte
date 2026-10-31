<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { t } from '$lib/locale.svelte';
	import { unitKnown } from '$lib/progress.svelte';

	let { data, children } = $props();

	const params = $derived({ pack: data.pack.id, unit: data.unit.id });
	const tabs = $derived([
		{ label: t('unit.known'), href: resolve('/unit/[pack]/[unit]', params) },
		{ label: t('unit.overview'), href: resolve('/unit/[pack]/[unit]/overview', params) },
		{ label: t('unit.quiz'), href: resolve('/unit/[pack]/[unit]/quiz', params) }
	]);
</script>

<svelte:head>
	<title>{data.unit.title} · Knowclick</title>
</svelte:head>

<main>
	<header>
		<a
			class="back"
			href={resolve('/lesson/[pack]/[lesson]', { pack: data.pack.id, lesson: data.lessonId })}
			>← {t('lesson.back')}</a
		>
		<h1>{data.unit.title}</h1>
		<nav>
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class:current={page.url.pathname === tab.href}
					aria-current={page.url.pathname === tab.href ? 'page' : undefined}>{tab.label}</a
				>
			{/each}
			<span class="count">
				{t('count.known', {
					known: unitKnown(data.pack.id, data.unit),
					total: data.unit.cells.length
				})}
			</span>
		</nav>
	</header>

	{@render children()}
</main>

<style>
	header {
		margin-bottom: 0.75rem;
	}

	.back {
		font-size: 0.9rem;
		text-decoration: none;
	}

	h1 {
		margin: 0.15rem 0 0.5rem;
		font-size: 1.4rem;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		border-bottom: 1px solid var(--line);
	}

	nav a {
		padding: 0.35rem 0.8rem;
		border-bottom: 3px solid transparent;
		color: var(--muted);
		text-decoration: none;
	}

	nav a.current {
		border-bottom-color: var(--accent);
		color: var(--ink);
		font-weight: 600;
	}

	.count {
		margin-left: auto;
		font-size: 0.85rem;
		color: var(--muted);
	}
</style>
