<script lang="ts">
	import TextPage from '$lib/components/site/TextPage.svelte';

	let { data } = $props();
</script>

<TextPage page={data.page} banner={data.banner} siblings={data.siblings} signedIn={data.signedIn} />
