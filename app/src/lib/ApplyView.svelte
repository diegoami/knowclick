<script lang="ts">
	import type { LocalTask, PackManifest } from '@knowclick/pack-format';
	import { t } from './locale.svelte';
	import TaskCard from './TaskCard.svelte';
	let { pack, tasks }: { pack: PackManifest; tasks: LocalTask[] } = $props();
</script>

<section aria-label={t('practice.apply')}>
	<p>{t('practice.apply.instructions')}</p>
	{#each tasks as task (task.id)}<TaskCard {pack} {task} />{/each}
</section>

<style>
	section {
		display: grid;
		gap: 0.75rem;
	}
</style>
