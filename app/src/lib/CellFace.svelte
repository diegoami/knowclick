<script lang="ts">
	import { lineParts, type LocalCell } from '@knowclick/pack-format';

	interface Props {
		cell: LocalCell;
		/** Whether the answer is visible yet. */
		showAnswer: boolean;
		/** 0 to 3: how strongly an earned answer is drawn. */
		level?: number;
		/** A gap in a code board: the code around it says the rest. */
		inline?: boolean;
	}

	let { cell, showAnswer, level = 3, inline = false }: Props = $props();

	const parts = $derived(cell.line ? lineParts(cell.line) : undefined);
</script>

{#if inline}
	<span class="answer code" data-level={level}
		>{#if showAnswer}{cell.text}{:else}&nbsp;{/if}</span
	>
{:else if parts}
	<code class="line">
		{parts[0]}{#if showAnswer}<span class="answer" data-level={level}>{cell.text}</span>{:else}<span
				class="gap"
			></span>{/if}{parts[1]}
	</code>
	{#if cell.clue}
		<span class="clue">{cell.clue}</span>
	{/if}
{:else}
	<span class="answer code" data-level={level}>
		{#if showAnswer}{cell.text}{:else}&nbsp;{/if}
	</span>
	{#if cell.clue}
		<span class="clue">{cell.clue}</span>
	{/if}
{/if}

<style>
	.line {
		align-self: stretch;
		text-align: left;
		font-family: var(--mono);
		font-size: 0.95rem;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.gap {
		display: inline-block;
		width: 8ch;
		border-bottom: 2px solid var(--muted);
	}

	.answer {
		font-weight: 600;
		line-height: 1.3;
	}

	.code {
		font-family: var(--mono);
	}

	.answer[data-level='1'] {
		opacity: 0.45;
	}

	.answer[data-level='2'] {
		opacity: 0.7;
	}

	.clue {
		font-size: 0.8rem;
		line-height: 1.2;
		color: var(--muted);
	}
</style>
