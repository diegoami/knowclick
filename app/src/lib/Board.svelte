<script lang="ts">
	// A unit's board: the table, grid, lines or code that play the part of Geoclick's
	// map. It knows the layout; each screen decides what a cell shows and what a press
	// does. Every cell carries `data-cell-id` for hit-testing, and so tools such as
	// ai-player can drive the board without changing the app. Copied from
	// LangClick2027 (591043e), with the code layouts added.
	import type { Header, LocalCell, LocalUnit } from '@knowclick/pack-format';
	import type { Snippet } from 'svelte';

	interface Props {
		unit: LocalUnit;
		face: Snippet<[LocalCell]>;
		/** What the cell currently holds, for screen readers. */
		spoken: (cell: LocalCell) => string;
		classOf?: (cell: LocalCell) => string;
		onpick?: (cell: LocalCell) => void;
	}

	let { unit, face, spoken, classOf = () => '', onpick }: Props = $props();

	const cellById = $derived(new Map(unit.cells.map((cell) => [cell.id, cell])));

	function labelOf(headers: Header[], id: string | undefined) {
		return headers.find((entry) => entry.id === id)?.label ?? '';
	}

	function ariaLabel(cell: LocalCell): string {
		const layout = unit.layout;
		if (layout.type === 'table') {
			return `${labelOf(layout.rows, cell.row)}, ${labelOf(layout.columns, cell.col)}: ${spoken(cell)}`;
		}
		// A code gap's id is often its answer, so it is named by its place instead.
		if (layout.type === 'code') {
			return `${unit.cells.indexOf(cell) + 1} / ${unit.cells.length}: ${spoken(cell)}`;
		}
		return `${cell.clue ?? cell.line}: ${spoken(cell)}`;
	}
</script>

{#snippet cellButton(cell: LocalCell, inline = false)}
	<button
		type="button"
		class="cell {classOf(cell)}"
		class:inline
		data-cell-id={cell.id}
		aria-label={ariaLabel(cell)}
		onclick={() => onpick?.(cell)}
	>
		{@render face(cell)}
	</button>
{/snippet}

{#if unit.layout.type === 'table'}
	{@const { rows, columns } = unit.layout}
	<table class="board-table">
		<thead>
			<tr>
				<td></td>
				{#each columns as column (column.id)}
					<th scope="col">{column.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr>
					<th scope="row">{row.label}</th>
					{#each columns as column (column.id)}
						{@const cell = unit.cells.find((c) => c.row === row.id && c.col === column.id)}
						<td>
							{#if cell}{@render cellButton(cell)}{:else}<span class="none">—</span>{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{:else if unit.layout.type === 'code'}
	<pre class="board-code"><code
			>{#each unit.layout.code as line, i (i)}<span class="code-line"
					>{#each line as part, j (j)}{#if 'gap' in part}{@const cell = cellById.get(
								part.gap
							)}{#if cell}{@render cellButton(cell, true)}{/if}{:else}{part.text}{/if}{/each}</span
				>{/each}</code
		></pre>
{:else}
	<ul class="board-grid" class:lines={unit.layout.type === 'lines'}>
		{#each unit.cells as cell (cell.id)}
			<li>{@render cellButton(cell)}</li>
		{/each}
	</ul>
{/if}

<style>
	.board-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0.35rem;
		table-layout: fixed;
	}

	.board-table thead td {
		width: 34%;
	}

	th {
		font-weight: 600;
		font-size: clamp(0.7rem, 2.6vw, 0.9rem);
		color: var(--muted);
		text-align: left;
		overflow-wrap: anywhere;
	}

	thead th {
		text-align: center;
	}

	td {
		padding: 0;
	}

	.none {
		display: block;
		color: var(--line);
		text-align: center;
	}

	.board-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.board-grid.lines {
		grid-template-columns: 1fr;
	}

	.board-grid li {
		display: flex;
	}

	.board-code {
		margin: 0;
		padding: 0.75rem;
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--card);
		font-family: var(--mono);
		font-size: 0.9rem;
		line-height: 1.9;
	}

	.board-code code {
		font: inherit;
	}

	/* Each line is its own block, so the code needs no newline characters, and an
	   empty line still takes its height. */
	.code-line {
		display: block;
		min-height: 1.9em;
	}

	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		width: 100%;
		min-height: 3.25rem;
		padding: 0.35rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--card);
		text-align: center;
		overflow-wrap: anywhere;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}

	.cell.inline {
		display: inline-block;
		width: auto;
		min-width: 8ch;
		min-height: 0;
		padding: 0 0.35rem;
		line-height: 1.5;
		font: inherit;
		vertical-align: baseline;
	}

	.cell:global(.empty) {
		border-style: dashed;
		background: transparent;
	}

	.cell:global(.pickable) {
		cursor: pointer;
	}

	.cell:global(.target) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.cell:global(.correct) {
		border-color: var(--known);
		background: var(--known-soft);
	}

	.cell:global(.revealed) {
		border-color: var(--revealed);
		background: var(--revealed-soft);
	}

	.cell:global(.wrong) {
		border-color: var(--wrong);
		background: var(--wrong-soft);
	}

	.cell:global(.given) {
		opacity: 0.55;
	}

	.cell:global(.selected) {
		box-shadow: 0 0 0 2px var(--accent);
	}
</style>
