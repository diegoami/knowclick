<script lang="ts">
	// Concepts as native disclosures: a technical term is named and defined, and stays
	// out of the way until wanted.
	import type { Concept } from '@knowclick/pack-format';

	interface Props {
		concepts: (Concept & { id: string })[];
	}

	let { concepts }: Props = $props();
</script>

{#each concepts as concept (concept.id)}
	<details>
		<summary>{concept.title}</summary>
		<p>{concept.body}</p>
		{#if concept.sources?.length}
			<p class="sources">
				{#each concept.sources as source, i (i)}
					{#if i > 0},{/if}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an outside address -->
					<a href={source.url} rel="external noreferrer" target="_blank">{source.title}</a>
				{/each}
			</p>
		{/if}
	</details>
{/each}

<style>
	details {
		margin-top: 0.35rem;
	}

	summary {
		cursor: pointer;
		color: var(--accent);
		font-weight: 600;
	}

	p {
		margin: 0.25rem 0;
	}

	.sources {
		font-size: 0.8rem;
		color: var(--muted);
	}
</style>
