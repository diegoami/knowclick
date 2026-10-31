<script lang="ts">
	import KnownView from '$lib/KnownView.svelte';

	let { data } = $props();
</script>

<KnownView pack={data.pack} unit={data.unit} />
