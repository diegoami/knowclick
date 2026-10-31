<script lang="ts">
	import OverviewView from '$lib/OverviewView.svelte';

	let { data } = $props();
</script>

<OverviewView pack={data.pack} unit={data.unit} />
