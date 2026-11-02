<script lang="ts">
	import { answerMode, skillOf, type AnswerMode } from '$lib/answerMode.svelte';
	import AnswerModeSwitch from '$lib/AnswerModeSwitch.svelte';
	import { t } from '$lib/locale.svelte';
	import { dueCells } from '$lib/progress.svelte';
	import ReviewView from '$lib/ReviewView.svelte';

	let { data } = $props();

	const counts = $derived(
		Object.fromEntries(
			(['drag', 'type'] as AnswerMode[]).map((mode) => [
				mode,
				data.units.reduce(
					(sum, unit) => sum + dueCells(data.pack.id, unit, undefined, skillOf(mode)).length,
					0
				)
			])
		) as Record<AnswerMode, number>
	);
</script>

<svelte:head>
	<title>{t('review.title')} · Knowclick</title>
</svelte:head>

<main>
	<h1>{t('review.title')}</h1>
	<AnswerModeSwitch {counts} />
	<!-- The review fixes its queue when it starts, so a change of mode starts another. -->
	{#key answerMode()}
		<ReviewView pack={data.pack} units={data.units} tasks={data.tasks} mode={answerMode()} />
	{/key}
</main>

<style>
	h1 {
		margin-bottom: 0.5rem;
		font-size: 1.4rem;
	}
</style>
