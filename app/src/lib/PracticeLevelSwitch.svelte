<script lang="ts">
	import { t } from './locale.svelte';
	import { practiceLevel, setPracticeLevel, type PracticeLevel } from './practiceLevel.svelte';
	let {
		recommended,
		progress,
		hasTasks = true
	}: {
		recommended?: PracticeLevel;
		progress?: Record<PracticeLevel, string>;
		hasTasks?: boolean;
	} = $props();
	const levels: PracticeLevel[] = ['guided', 'recall', 'apply'];
</script>

<div class="levels" role="group" aria-label={t('practice.label')}>
	{#each levels as level (level)}
		<button
			type="button"
			data-level-choice={level}
			data-mode={level === 'guided' ? 'drag' : level === 'recall' ? 'type' : undefined}
			aria-pressed={practiceLevel() === level}
			onclick={() => setPracticeLevel(level)}
			>{t(`practice.${level}`)}{#if progress}
				· {progress[level]}{/if}</button
		>
	{/each}
</div>
<p class="description">{t(`practice.${practiceLevel()}.description`)}</p>
{#if recommended}<p class="recommendation">
		{t('practice.recommended', { level: t(`practice.${recommended}`) })}
	</p>{/if}
{#if !hasTasks && practiceLevel() === 'apply'}<p>{t('practice.noTasks')}</p>{/if}

<style>
	.levels {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	button {
		border: 1px solid var(--accent);
		border-radius: 0.4rem;
		padding: 0.45rem 0.8rem;
		background: var(--card);
		color: var(--accent);
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		background: var(--accent);
		color: white;
	}
	.description {
		margin: 0.6rem 0 0.3rem;
	}
	.recommendation {
		color: var(--muted);
		font-size: 0.9rem;
		margin: 0.3rem 0 0.8rem;
	}
</style>
