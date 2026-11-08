<script lang="ts">
	import { CATEGORIES } from '@knowclick/pack-format';
	import { resolve } from '$app/paths';
	import { t } from '$lib/locale.svelte';

	let { data } = $props();
	const categories = $derived(
		CATEGORIES.map((category) => ({
			category,
			courses: data.courses.filter((course) => course.category === category)
		})).filter(({ courses }) => courses.length > 0)
	);
</script>

<svelte:head>
	<title>Knowclick</title>
</svelte:head>

<main>
	<h1>Knowclick</h1>
	<p class="tagline">{t('app.tagline')}</p>
	<p class="intro">{t('home.chooseCourse')}</p>
	{#each categories as { category, courses } (category)}
		<section>
			<h2>{t(`category.${category}`)}</h2>
			<ul>
				{#each courses as course (course.id)}
					<li>
						<a href={resolve('/course/[pack]', { pack: course.id })}>
							<h3>{course.title}</h3>
							<p class="stats">
								{t('home.courseStats', {
									chapters: course.chapters,
									exercises: course.exercises,
									tasks: course.tasks
								})}
							</p>
							<span class="open">{t('home.openCourse')} →</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</main>

<style>
	.tagline {
		margin: 0.25rem 0 1.5rem;
		color: var(--muted);
	}
	.intro {
		margin: 0 0 1rem;
	}
	h2 {
		margin: 1.5rem 0 0.5rem;
		font-size: 0.9rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: 0.8rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}
	li a {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--card);
		color: inherit;
		text-decoration: none;
	}
	li a:hover,
	li a:focus-visible {
		border-color: var(--accent);
	}
	h3 {
		margin: 0;
		font-size: 1.3rem;
	}
	.stats {
		margin: 0.5rem 0 1rem;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.open {
		margin-top: auto;
		color: var(--accent);
		font-weight: 600;
	}
</style>
