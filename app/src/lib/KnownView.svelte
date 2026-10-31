<script lang="ts">
	// Only what the learner has earned: an answer appears at its first clean quiz
	// answer and strengthens up to Known. Nothing here gives away what isn't earned.
	import type { LocalCell, LocalUnit, PackManifest } from '@knowclick/pack-format';
	import Board from './Board.svelte';
	import CellFace from './CellFace.svelte';
	import CellNote from './CellNote.svelte';
	import { KNOWN_CLEAN_STREAK } from './difficulty';
	import { t } from './locale.svelte';
	import { levelOf, unitStarted } from './progress.svelte';

	interface Props {
		pack: PackManifest;
		unit: LocalUnit;
	}

	let { pack, unit }: Props = $props();
	let chosen = $state<LocalCell>();
	const current = $derived(unit.cells.find((cell) => cell.id === chosen?.id));

	const earned = (cell: LocalCell) => levelOf(pack.id, cell) > 0;
</script>

<p>{unitStarted(pack.id, unit) ? t('known.hint') : t('known.empty')}</p>

<Board
	{unit}
	spoken={(cell) => (earned(cell) ? cell.text : t('cell.notEarned'))}
	classOf={(cell) => {
		if (!earned(cell)) return 'empty';
		const known = levelOf(pack.id, cell) >= KNOWN_CLEAN_STREAK;
		return `pickable ${known ? 'correct' : ''} ${cell.id === chosen?.id ? 'selected' : ''}`;
	}}
	onpick={(cell) => {
		if (earned(cell)) chosen = cell;
	}}
>
	{#snippet face(cell)}
		<CellFace
			{cell}
			showAnswer={earned(cell)}
			level={levelOf(pack.id, cell)}
			inline={unit.layout.type === 'code'}
		/>
	{/snippet}
</Board>

{#if current}
	<CellNote cell={current} />
{/if}

<style>
	p {
		margin: 0 0 0.75rem;
	}
</style>
