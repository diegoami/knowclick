<script lang="ts">
	import QuizView from '$lib/QuizView.svelte';

	let { data } = $props();
</script>

<!-- The view reads its round once, so a change of unit has to rebuild it. -->
{#key `${data.pack.id}/${data.unit.id}`}
	<QuizView pack={data.pack} unit={data.unit} />
{/key}
