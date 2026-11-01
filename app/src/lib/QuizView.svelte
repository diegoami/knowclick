<script lang="ts">
	// Fill the board: drag a slip onto its cell, or press the slip and then the cell.
	// One attempt per slip per round. A wrong answer loses a level and shows the
	// right one. packages/quiz-engine decides what a drop means; this owns the
	// pointer, the tray and when to draw. Copied from LangClick2027 (591043e).
	import type { LocalCell, LocalUnit, PackManifest } from '@knowclick/pack-format';
	import {
		attemptMatch,
		createQuizSession,
		isSessionComplete,
		pendingIds,
		scoreSession,
		type QuizSession
	} from '@knowclick/quiz-engine';
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import Board from './Board.svelte';
	import CellFace from './CellFace.svelte';
	import CellNote from './CellNote.svelte';
	import { HAND_SIZE, handAfterUse, refillHand } from './difficulty';
	import { t } from './locale.svelte';
	import { recordAnswer, unitKnown } from './progress.svelte';
	import { forgetRound, rememberRound, roundInProgress, type RoundInProgress } from './quizRound';
	import { aimPoint, movedPastSlop } from './touchDrag';

	interface Props {
		pack: PackManifest;
		unit: LocalUnit;
		/** Review: ask only these items, and keep the rest of the board visible. */
		only?: ReadonlySet<string>;
		/** Review: what follows this board, in place of playing it again. */
		next?: { label: string; action: () => void };
	}

	let { pack, unit, only, next }: Props = $props();

	const WRONG_FLASH_MS = 900;

	function newRound(): RoundInProgress {
		const asked = only ? unit.cells.filter((cell) => only.has(cell.item)) : unit.cells;
		const session = createQuizSession(asked.map((cell) => ({ id: cell.id, text: cell.text })));
		const size = unit.dealAll ? asked.length : HAND_SIZE;
		return { session, size, hand: refillHand(pendingIds(session), [], size) };
	}

	/** A saved round is dealt again from what is still pending. */
	function resumed(round: RoundInProgress): RoundInProgress {
		const pending = pendingIds(round.session);
		const size = unit.dealAll ? pending.length : HAND_SIZE;
		return { ...round, size, hand: refillHand(pending, round.hand, size) };
	}

	// A review is one sitting, and isn't a round to come back to.
	const start = untrack(() => {
		const saved = only ? undefined : roundInProgress(pack.id, unit.id);
		return saved ? resumed(saved) : newRound();
	});

	let session = $state.raw<QuizSession>(start.session);
	let hand = $state.raw<string[]>(start.hand);
	let size = $state(start.size);
	let selected = $state<string>();
	let lastMiss = $state<{ cell: LocalCell; lead: string }>();
	let wrongCell = $state<string>();
	let wrongTimer: ReturnType<typeof setTimeout> | undefined;

	interface Press {
		slipId: string;
		x0: number;
		y0: number;
		touch: boolean;
		dragging: boolean;
		x: number;
		y: number;
	}
	let press = $state<Press>();
	let hoverCell = $state<string>();

	const complete = $derived(isSessionComplete(session));
	const score = $derived(scoreSession(session));
	const cellById = $derived(new Map(unit.cells.map((cell) => [cell.id, cell])));
	const statusById = $derived(new Map(session.items.map((item) => [item.cell.id, item.status])));

	function textOf(id: string): string {
		const cell = cellById.get(id);
		return cell?.text ?? '';
	}

	/** One drop. Everything a slip does, by pointer or keyboard, comes through here. */
	function drop(slipId: string, cellId: string | undefined) {
		const result = attemptMatch(session, slipId, cellId);
		if (result.outcome.kind === 'ignored') return;

		session = result.session;
		hand = refillHand(pendingIds(session), handAfterUse(hand, slipId, result.outcome.cellId), size);
		selected = undefined;

		const answered = cellById.get(result.outcome.cellId);
		if (result.outcome.kind === 'correct') {
			lastMiss = undefined;
			if (answered) void recordAnswer(pack.id, answered, 'good');
		} else {
			if (answered) {
				void recordAnswer(pack.id, answered, 'again');
				lastMiss = { cell: answered, lead: t('quiz.notThere') };
			}
			flashWrong(result.outcome.droppedOnId);
		}

		if (only) return;
		if (isSessionComplete(session)) forgetRound(pack.id, unit.id);
		else rememberRound(pack.id, unit.id, { session, hand, size });
	}

	function flashWrong(cellId: string) {
		wrongCell = cellId;
		clearTimeout(wrongTimer);
		wrongTimer = setTimeout(() => (wrongCell = undefined), WRONG_FLASH_MS);
	}

	onDestroy(() => clearTimeout(wrongTimer));

	function playAgain() {
		const round = newRound();
		session = round.session;
		hand = round.hand;
		size = round.size;
		selected = undefined;
		lastMiss = undefined;
		wrongCell = undefined;
	}

	function cellAt(x: number, y: number): string | undefined {
		const element = document.elementFromPoint(x, y);
		return element?.closest<HTMLElement>('[data-cell-id]')?.dataset.cellId;
	}

	function onSlipPointerDown(event: PointerEvent, slipId: string) {
		if (event.button !== 0) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		press = {
			slipId,
			x0: event.clientX,
			y0: event.clientY,
			touch: event.pointerType !== 'mouse',
			dragging: false,
			x: event.clientX,
			y: event.clientY
		};
	}

	function onSlipPointerMove(event: PointerEvent) {
		if (!press) return;
		press.x = event.clientX;
		press.y = event.clientY;
		if (!press.dragging && movedPastSlop(press.x0, press.y0, press.x, press.y)) {
			press.dragging = true;
			selected = undefined;
		}
		if (press.dragging) {
			const aim = aimPoint(press.x, press.y, press.touch);
			hoverCell = cellAt(aim.x, aim.y);
		}
	}

	function onSlipPointerUp() {
		if (!press) return;
		if (press.dragging) {
			const aim = aimPoint(press.x, press.y, press.touch);
			drop(press.slipId, cellAt(aim.x, aim.y));
		} else {
			toggleSelected(press.slipId);
		}
		press = undefined;
		hoverCell = undefined;
	}

	function onSlipPointerCancel() {
		press = undefined;
		hoverCell = undefined;
	}

	function toggleSelected(slipId: string) {
		selected = selected === slipId ? undefined : slipId;
	}

	/** A press with a pointer is handled on pointerup; `detail` is 0 only for a
	 * click from the keyboard, which has no pointer events. */
	function onSlipClick(event: MouseEvent, slipId: string) {
		if (event.detail === 0) toggleSelected(slipId);
	}

	function cellClass(cell: LocalCell): string {
		const status = statusById.get(cell.id);
		if (status === undefined) return 'given';
		if (cell.id === wrongCell) return 'wrong empty';
		if (status === 'correct') return 'correct';
		if (status === 'revealed') return 'revealed';
		if (cell.id === hoverCell) return 'target';
		return selected || press?.dragging ? 'empty pickable' : 'empty';
	}

	function isShown(cell: LocalCell): boolean {
		return statusById.get(cell.id) !== 'pending';
	}

	// Slips with equal text are interchangeable, so the tray shows each once, with a
	// count: ten copies of the same letter would only be noise.
	const tray = $derived.by(() => {
		const entries: { text: string; slipId: string; count: number }[] = [];
		for (const slipId of hand) {
			const text = textOf(slipId);
			const entry = entries.find((candidate) => candidate.text === text);
			if (entry) entry.count += 1;
			else entries.push({ text, slipId, count: 1 });
		}
		return entries;
	});

	const ghost = $derived.by(() => {
		if (!press?.dragging) return undefined;
		return { text: textOf(press.slipId), ...aimPoint(press.x, press.y, press.touch) };
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') selected = undefined;
	}}
/>

<Board
	{unit}
	spoken={(cell) => (isShown(cell) ? cell.text : t('cell.open'))}
	classOf={cellClass}
	onpick={(cell) => {
		if (selected) drop(selected, cell.id);
	}}
>
	{#snippet face(cell)}
		<CellFace {cell} showAnswer={isShown(cell)} inline={unit.layout.type === 'code'} />
	{/snippet}
</Board>

{#if lastMiss}
	<CellNote cell={lastMiss.cell} lead={lastMiss.lead} />
{/if}

{#if complete}
	<section class="score" aria-live="polite">
		<h2>{t('quiz.complete')}</h2>
		<p>
			{t('quiz.rightFirst', { right: score.perfect, total: score.total })}
			{t('quiz.knownNow', { known: unitKnown(pack.id, unit), total: unit.cells.length })}
		</p>
		<div class="actions">
			{#if next}
				<button type="button" class="action" onclick={next.action}>{next.label}</button>
			{:else}
				<button type="button" class="action" onclick={playAgain}>{t('quiz.again')}</button>
				<a
					class="action quiet"
					href={resolve('/unit/[pack]/[unit]', { pack: pack.id, unit: unit.id })}
					>{t('quiz.seeKnown')}</a
				>
			{/if}
		</div>
	</section>
{:else}
	<div class="tray" role="group" aria-label={t('quiz.slips')}>
		{#each tray as { slipId, count } (slipId)}
			<button
				type="button"
				class="slip"
				class:selected={selected === slipId}
				class:lifted={press?.slipId === slipId && press.dragging}
				data-slip-id={slipId}
				data-count={count > 1 ? count : undefined}
				aria-pressed={selected === slipId}
				onpointerdown={(event) => onSlipPointerDown(event, slipId)}
				onpointermove={onSlipPointerMove}
				onpointerup={onSlipPointerUp}
				onpointercancel={onSlipPointerCancel}
				onclick={(event) => onSlipClick(event, slipId)}>{textOf(slipId)}</button
			>
		{/each}
	</div>
	<p class="hint">
		{t('quiz.hint', { count: pendingIds(session).length })}
	</p>
{/if}

{#if ghost}
	<div class="ghost" style:left="{ghost.x}px" style:top="{ghost.y}px">
		{ghost.text}
	</div>
{/if}

<style>
	.tray {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin-top: 0.75rem;
		padding: 0.6rem;
		border-top: 1px solid var(--line);
		background: var(--paper);
	}

	.slip {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--accent);
		border-radius: 0.4rem;
		background: var(--card);
		font-family: var(--mono);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: grab;
		/* The drag is ours: the browser must not take it for a scroll. */
		touch-action: none;
		user-select: none;
	}

	.slip[data-count]::after {
		content: ' ×' attr(data-count);
		font-size: 0.8em;
		font-weight: 400;
		color: var(--muted);
	}

	.slip.selected {
		background: var(--accent);
		color: #fff;
	}

	.slip.selected[data-count]::after {
		color: inherit;
	}

	.slip.lifted {
		opacity: 0.35;
	}

	.hint {
		margin: 0.25rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
	}

	.ghost {
		position: fixed;
		z-index: 10;
		padding: 0.4rem 0.8rem;
		border-radius: 0.4rem;
		background: var(--accent);
		color: #fff;
		font-family: var(--mono);
		font-size: 0.95rem;
		font-weight: 600;
		/* Hit-testing must see the cell under the slip, not the slip. */
		pointer-events: none;
		transform: translate(-50%, -50%);
	}

	.score {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 0.4rem;
		background: var(--card);
	}

	.score p {
		margin: 0.5rem 0 0.75rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
