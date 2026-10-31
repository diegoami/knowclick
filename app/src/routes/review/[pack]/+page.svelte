<script lang="ts">
	import { t } from '$lib/locale.svelte';
	import ReviewView from '$lib/ReviewView.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{t('review.title')} · Knowclick</title>
</svelte:head>

<main>
	<h1>{t('review.title')}</h1>
	<ReviewView pack={data.pack} units={data.units} tasks={data.tasks} />
</main>

<style>
	h1 {
		margin-bottom: 0.5rem;
		font-size: 1.4rem;
	}
</style>
