<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import PostForm from '$lib/components/admin/PostForm.svelte';

	let { data } = $props();
</script>

<svelte:head><title>{data.values.title} | FF Intern</title></svelte:head>

<a href="/admin/beitraege" class="back"><ArrowLeft size={16} /> Beiträge</a>
<div class="page-head">
	<h1 class="page-title">Beitrag bearbeiten</h1>
</div>

{#key data.values.id}
	<PostForm values={data.values} einsatzarten={data.einsatzarten} fahrzeuge={data.fahrzeuge} nummerVorschlag={data.nummerVorschlag} />
{/key}
