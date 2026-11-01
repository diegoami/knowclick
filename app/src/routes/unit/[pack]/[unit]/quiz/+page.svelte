<script lang="ts">
	import { answerMode } from '$lib/answerMode.svelte';
	import AnswerModeSwitch from '$lib/AnswerModeSwitch.svelte';
	import QuizView from '$lib/QuizView.svelte';
	import TypeQuizView from '$lib/TypeQuizView.svelte';

	let { data } = $props();
</script>

<AnswerModeSwitch />

<!-- The view reads its round once, so a change of unit or mode has to rebuild it. -->
{#key `${data.pack.id}/${data.unit.id}/${answerMode()}`}
	{#if answerMode() === 'type'}
		<TypeQuizView pack={data.pack} unit={data.unit} />
	{:else}
		<QuizView pack={data.pack} unit={data.unit} />
	{/if}
{/key}
