<script lang="ts">
	// Fill the board by typing. One open cell is asked at a time, in board order, so the
	// board stays the map: you see where each answer goes. Pressing another open cell
	// asks that one instead. One attempt per cell per round, as with a drag: a wrong
	// answer shows the right one. Answers are saved as `produce` cards, apart from the
	// `recognise` cards dragging earns. packages/quiz-engine decides what an answer means.
	import {
		boardOrder,
		type LocalCell,
		type LocalUnit,
		type PackManifest
	} from '@knowclick/pack-format';
	import {
		attemptTyped,
		createQuizSession,
		isSessionComplete,
		pendingIds,
		scoreSession,
		type QuizSession
	} from '@knowclick/quiz-engine';
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import Board from './Board.svelte';
	import CellFace from './CellFace.svelte';
	import CellNote from './CellNote.svelte';
	import { t } from './locale.svelte';
	import { recordAnswer, unitKnown } from './progress.svelte';
	import { forgetRound, rememberRound, roundInProgress } from './quizRound';

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
	// A typed round is remembered apart from a dragged one.
	const roundId = untrack(() => `${unit.id}#type`);
	const order = $derived(boardOrder(unit));

	function newSession(): QuizSession {
		const asked = boardOrder(unit).filter((cell) => !only || only.has(cell.item));
		return createQuizSession(asked.map((cell) => ({ id: cell.id, text: cell.text })));
	}

	let session = $state.raw<QuizSession>(
		untrack(() => (only ? undefined : roundInProgress(pack.id, roundId)?.session) ?? newSession())
	);
	let askedId = $state<string | undefined>(untrack(() => pendingIds(session)[0]));
	let typed = $state('');
	let lastMiss = $state<{ cell: LocalCell; lead: string }>();
	let wrongCell = $state<string>();
	let wrongTimer: ReturnType<typeof setTimeout> | undefined;
	let input = $state<HTMLInputElement>();

	const complete = $derived(isSessionComplete(session));
	const score = $derived(scoreSession(session));
	const statusById = $derived(new Map(session.items.map((item) => [item.cell.id, item.status])));
	const asked = $derived(unit.cells.find((cell) => cell.id === askedId));

	/** The next open cell after `from`, in board order, wrapping round. */
	function nextOpen(from: string | undefined): string | undefined {
		const pending = new Set(pendingIds(session));
		const ids = order.map((cell) => cell.id).filter((id) => pending.has(id));
		const at = from === undefined ? -1 : order.findIndex((cell) => cell.id === from);
		return ids.find((id) => order.findIndex((cell) => cell.id === id) > at) ?? ids[0] ?? undefined;
	}

	function placeOf(cell: LocalCell): string {
		const layout = unit.layout;
		if (layout.type === 'table') {
			const row = layout.rows.find((r) => r.id === cell.row)?.label ?? '';
			const column = layout.columns.find((c) => c.id === cell.col)?.label ?? '';
			return `${row}, ${column}`;
		}
		if (layout.type === 'code') {
			return t('type.gap', { n: order.indexOf(cell) + 1, total: order.length });
		}
		return cell.clue ?? cell.line ?? '';
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!askedId) return;
		const result = attemptTyped(session, askedId, typed, unit.caseInsensitive);
		if (result.outcome.kind === 'ignored') return;
		session = result.session;
		const answered = unit.cells.find((cell) => cell.id === askedId);
		if (result.outcome.kind === 'correct') {
			lastMiss = undefined;
			if (answered) void recordAnswer(pack.id, answered, 'good', 'produce');
		} else if (answered) {
			void recordAnswer(pack.id, answered, 'again', 'produce');
			lastMiss = { cell: answered, lead: t('type.notIt', { typed: typed.trim() }) };
			flashWrong(answered.id);
		}
		typed = '';
		askedId = nextOpen(askedId);
		if (!only) {
			if (isSessionComplete(session)) forgetRound(pack.id, roundId);
			else rememberRound(pack.id, roundId, { session, hand: [], size: 0 });
		}
		await tick();
		input?.focus();
	}

	function flashWrong(cellId: string) {
		wrongCell = cellId;
		clearTimeout(wrongTimer);
		wrongTimer = setTimeout(() => (wrongCell = undefined), WRONG_FLASH_MS);
	}

	// The input is the whole point of this view, so it starts with the focus.
	onMount(() => input?.focus());
	onDestroy(() => clearTimeout(wrongTimer));

	function playAgain() {
		session = newSession();
		askedId = pendingIds(session)[0];
		typed = '';
		lastMiss = undefined;
		wrongCell = undefined;
	}

	function cellClass(cell: LocalCell): string {
		const status = statusById.get(cell.id);
		if (status === undefined) return 'given';
		if (status === 'correct') return cell.id === wrongCell ? 'wrong' : 'correct';
		if (status === 'revealed') return cell.id === wrongCell ? 'wrong revealed' : 'revealed';
		return cell.id === askedId ? 'empty target' : 'empty pickable';
	}

	const isShown = (cell: LocalCell) => statusById.get(cell.id) !== 'pending';
</script>

<Board
	{unit}
	spoken={(cell) => (isShown(cell) ? cell.text : t('cell.open'))}
	classOf={cellClass}
	onpick={(cell) => {
		if (statusById.get(cell.id) === 'pending') {
			askedId = cell.id;
			input?.focus();
		}
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
	<form class="typing" onsubmit={submit}>
		<label for="typed-answer">
			{t('type.label')}
			{#if asked}<span class="place">{placeOf(asked)}</span>{/if}
		</label>
		<div class="row">
			<input
				id="typed-answer"
				bind:this={input}
				bind:value={typed}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
			/>
			<button type="submit" class="action">{t('type.check')}</button>
		</div>
		<p class="hint">{t('type.hint', { count: pendingIds(session).length })}</p>
	</form>
{/if}

<style>
	.typing {
		position: sticky;
		bottom: 0;
		margin-top: 0.75rem;
		padding: 0.6rem;
		border-top: 1px solid var(--line);
		background: var(--paper);
	}

	label {
		display: block;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.place {
		color: var(--ink);
		font-weight: 600;
	}

	.row {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.3rem;
	}

	input {
		flex: 1;
		min-width: 0;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--accent);
		border-radius: 0.4rem;
		background: var(--card);
		font-family: var(--mono);
		font-size: 1rem;
		color: var(--ink);
	}

	.hint {
		margin: 0.25rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		text-align: center;
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
