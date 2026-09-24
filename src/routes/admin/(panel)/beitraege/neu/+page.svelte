<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import PostForm from '$lib/components/admin/PostForm.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Neuer Beitrag | FF Intern</title></svelte:head>

<a href="/admin/beitraege" class="back"><ArrowLeft size={16} /> Beiträge</a>
<div class="page-head">
	<h1 class="page-title">{data.category === 'einsatz' ? 'Neuer Einsatzbericht' : 'Neuer Beitrag'}</h1>
</div>

<PostForm
	values={{
		id: null,
		slug: null,
		title: '',
		category: data.category,
		date: data.today,
		time: '',
		status: 'entwurf',
		pinned: false,
		summary: '',
		contentHtml: '',
		cover: null,
		gallery: [],
		einsatzNummer: '',
		einsatzartId: null,
		stichwort: '',
		einsatzort: '',
		vehicleIds: []
	}}
	einsatzarten={data.einsatzarten}
	fahrzeuge={data.fahrzeuge}
	nummerVorschlag={data.nummerVorschlag}
/>
