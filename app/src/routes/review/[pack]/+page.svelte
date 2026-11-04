<script lang="ts">
	import { practiceLevel } from '$lib/practiceLevel.svelte';
	import PracticeLevelSwitch from '$lib/PracticeLevelSwitch.svelte';
	import { t } from '$lib/locale.svelte';
	import ReviewView from '$lib/ReviewView.svelte';
	let { data } = $props();
	const mode = $derived(
		practiceLevel() === 'apply' ? 'apply' : practiceLevel() === 'recall' ? 'type' : 'drag'
	);
</script>

<svelte:head>
	<title>{t('review.title')} · Knowclick</title>
</svelte:head>

<main>
	<h1>{t('review.title')}</h1>
	<PracticeLevelSwitch hasTasks={data.tasks.length > 0} />
	<!-- The review fixes its queue when it starts, so a change of mode starts another. -->
	{#key mode}
		<ReviewView pack={data.pack} units={data.units} tasks={data.tasks} {mode} />
	{/key}
</main>

<style>
	h1 {
		margin-bottom: 0.5rem;
		font-size: 1.4rem;
	}
</style>
