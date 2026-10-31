<script lang="ts">
	// What a cell has to say once its answer is visible. The one card every screen
	// uses, like Geoclick's FactCard: each screen decides when, this decides how.
	import type { LocalCell } from '@knowclick/pack-format';
	import ConceptList from './ConceptList.svelte';

	interface Props {
		cell: LocalCell;
		lead?: string;
	}

	let { cell, lead }: Props = $props();
</script>

<aside class="note" aria-live="polite">
	{#if lead}<p class="lead">{lead}</p>{/if}
	<p>
		<code>{cell.text}</code>
		{#if cell.clue}&ensp;{cell.clue}{/if}
	</p>
	{#if cell.note}<p>{cell.note}</p>{/if}
	<ConceptList concepts={cell.conceptDetails} />
</aside>

<style>
	.note {
		margin-top: 0.75rem;
		padding: 0.6rem 0.8rem;
		border-left: 4px solid var(--accent);
		border-radius: 0.25rem;
		background: var(--card);
	}

	p {
		margin: 0.15rem 0;
	}

	.lead {
		color: var(--revealed);
		font-weight: 600;
	}

	code {
		font-family: var(--mono);
		font-size: 1.05rem;
		font-weight: 600;
	}
</style>
