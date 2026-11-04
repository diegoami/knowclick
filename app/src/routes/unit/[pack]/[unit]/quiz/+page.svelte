<script lang="ts">
	import ApplyView from '$lib/ApplyView.svelte';
	import PracticeLevelSwitch from '$lib/PracticeLevelSwitch.svelte';
	import { practiceLevel } from '$lib/practiceLevel.svelte';
	import { recommendLevel } from '$lib/practiceLevel';
	import { skillLevels, tasksKnown } from '$lib/progress.svelte';
	import { knownCount } from '$lib/difficulty';
	import QuizView from '$lib/QuizView.svelte';
	import TypeQuizView from '$lib/TypeQuizView.svelte';
	let { data } = $props();
	const recall = $derived(data.unit.recall ?? data.unit);
	const progress = $derived({
		guided: `${knownCount(skillLevels(data.pack.id, data.unit, 'recognise'))}/${data.unit.cells.length}`,
		recall: `${knownCount(skillLevels(data.pack.id, recall, 'produce'))}/${recall.cells.length}`,
		apply: `${tasksKnown(data.pack.id, data.tasks)}/${data.tasks.length}`
	});
	const recommended = $derived(
		recommendLevel(
			skillLevels(data.pack.id, data.unit, 'recognise'),
			skillLevels(data.pack.id, recall, 'produce'),
			data.tasks.length > 0
		)
	);
</script>

<PracticeLevelSwitch {recommended} {progress} hasTasks={data.tasks.length > 0} />
{#key `${data.pack.id}/${data.unit.id}/${practiceLevel()}`}
	{#if practiceLevel() === 'apply'}<ApplyView pack={data.pack} tasks={data.tasks} />
	{:else if practiceLevel() === 'recall'}<TypeQuizView pack={data.pack} unit={recall} />
	{:else}<QuizView pack={data.pack} unit={data.unit} />{/if}
{/key}
