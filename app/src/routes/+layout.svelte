<script lang="ts">
	import '../app.css';
	import { locale } from '$lib/locale.svelte';

	let { children } = $props();

	$effect(() => {
		document.documentElement.lang = locale();
	});
</script>

{@render children()}
