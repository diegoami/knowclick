<script lang="ts">
	// Drag or type: the choice is remembered, and each keeps its own level per cell.
	import { answerMode, setAnswerMode, type AnswerMode } from './answerMode.svelte';
	import { t } from './locale.svelte';

	interface Props {
		/** Shown after each choice, as in Review's counts of what is due. */
		counts?: Record<AnswerMode, number>;
	}

	let { counts }: Props = $props();

	const modes: { mode: AnswerMode; key: 'mode.drag' | 'mode.type' }[] = [
		{ mode: 'drag', key: 'mode.drag' },
		{ mode: 'type', key: 'mode.type' }
	];
</script>

<div class="switch" role="group" aria-label={t('mode.label')}>
	{#each modes as { mode, key } (mode)}
		<button
			type="button"
			data-mode={mode}
			aria-pressed={answerMode() === mode}
			onclick={() => setAnswerMode(mode)}
			>{t(key)}{#if counts}&nbsp;({counts[mode]}){/if}</button
		>
	{/each}
</div>

<style>
	.switch {
		display: inline-flex;
		margin-bottom: 0.75rem;
		border: 1px solid var(--accent);
		border-radius: 0.4rem;
		overflow: hidden;
	}

	button {
		padding: 0.3rem 0.9rem;
		border: none;
		background: var(--card);
		color: var(--accent);
		cursor: pointer;
	}

	button[aria-pressed='true'] {
		background: var(--accent);
		color: #fff;
	}
</style>
