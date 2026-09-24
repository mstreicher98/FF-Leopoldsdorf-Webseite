<script lang="ts">
	import Gallery from '$lib/components/site/Gallery.svelte';
	import Picture from '$lib/components/site/Picture.svelte';
	import PostCard from '$lib/components/site/PostCard.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import { mediaSrc } from '$lib/media';

	let { data } = $props();

	const v = $derived(data.vehicle);
	const specs = $derived(
		[
			['Kurzbezeichnung', v.shortName],
			['Funkrufname', v.radioName],
			['Fahrgestell', v.chassis],
			['Aufbau', v.body],
			['Baujahr', v.year ? String(v.year) : ''],
			['Gesamtgewicht', v.weight],
			['Besatzung', v.crew],
			['Einsatzbereich', v.purpose],
			...v.extra.map((e) => [e.label, e.value])
		].filter(([, value]) => !!value)
	);
</script>

<Seo title={v.radioName || v.name} description="{v.name} der Freiwilligen Feuerwehr Leopoldsdorf" image={v.cover ? mediaSrc(v.cover, 1600) : undefined} />

<div class="wrap head">
	<nav class="crumbs" aria-label="Brotkrümel">
		<a href="/feuerwehr/fuhrpark">Fuhrpark</a>
	</nav>
	{#if v.shortName}<span class="short">{v.shortName}</span>{/if}
	<h1 class="title display">{v.radioName || v.name}</h1>
	{#if v.radioName}<p class="name">{v.name}</p>{/if}
	{#if !v.inService}<p class="retired">Dieses Fahrzeug ist außer Dienst.</p>{/if}
</div>

<div class="wrap layout">
	<div class="main">
		{#if v.cover}
			<Picture media={v.cover} sizes="(min-width: 1024px) 760px, 100vw" want={1600} eager class="cover" />
		{/if}
		{#if v.descriptionHtml}
			<div class="prose desc">{@html v.descriptionHtml}</div>
		{/if}
		{#if v.gallery.length}
			<section class="gallery">
				<h2 class="h2">Bilder</h2>
				<Gallery images={v.gallery} label="Bilder von {v.name}" />
			</section>
		{/if}
	</div>

	{#if specs.length}
		<aside class="specs">
			<h2 class="h2">Technische Daten</h2>
			<dl>
				{#each specs as [label, value] (label)}
					<!-- lange Angaben (z. B. Beladung) untereinander statt in zwei schmalen Spalten -->
					<div class="row" class:long={label.length > 16 || value.length > 60}>
						<dt>{label}</dt>
						<dd>{value}</dd>
					</div>
				{/each}
			</dl>
		</aside>
	{/if}
</div>

{#if v.einsaetze.length}
	<section class="wrap recent">
		<h2 class="h2">Letzte Einsätze mit diesem Fahrzeug</h2>
		<div class="grid">
			{#each v.einsaetze.slice(0, 3) as post (post.id)}
				<PostCard {post} variant="compact" />
			{/each}
		</div>
	</section>
{/if}

<style>
	.head {
		padding-top: 2.5rem;
	}
	.crumbs a {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--c-ink-2);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--c-red);
		text-decoration: underline;
	}
	.short {
		display: inline-block;
		margin-top: 1.25rem;
		padding: 0.25rem 0.6rem;
		border-radius: 5px;
		background: var(--c-red);
		color: #fff;
		font-weight: 800;
		font-stretch: 75%;
		font-size: 1.1rem;
	}
	.title {
		margin-top: 0.6rem;
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		text-transform: uppercase;
	}
	.name {
		margin-top: 0.6rem;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--c-ink-2);
	}
	.retired {
		margin-top: 0.75rem;
		color: var(--c-warn);
		font-weight: 600;
	}
	.layout {
		display: grid;
		gap: 2.5rem;
		margin-top: 2.5rem;
	}
	@media (min-width: 1024px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 22rem;
			gap: 3.5rem;
			align-items: start;
		}
	}
	.main :global(.cover) {
		width: 100%;
		border-radius: 12px;
	}
	.desc {
		margin-top: 2rem;
	}
	.gallery {
		margin-top: 2.5rem;
	}
	.h2 {
		margin-bottom: 1rem;
		font-size: 1.5rem;
		font-weight: 800;
		font-stretch: 70%;
		text-transform: uppercase;
	}
	.specs {
		padding: 1.5rem;
		border-radius: 12px;
		background: var(--c-surface-2);
		border: 1px solid var(--c-line);
	}
	/* minmax(0, …): lange Wörter wie „Schaumdruckzumischsystem“ dürfen die Spalten nicht sprengen */
	.row {
		display: grid;
		grid-template-columns: minmax(0, 8.5rem) minmax(0, 1fr);
		gap: 0.75rem;
		padding: 0.6rem 0;
		border-top: 1px solid var(--c-line);
	}
	.row.long {
		grid-template-columns: minmax(0, 1fr);
		gap: 0.3rem;
	}
	dt,
	dd {
		overflow-wrap: break-word;
		hyphens: auto;
	}
	.row:first-child {
		border-top: 0;
	}
	dt {
		color: var(--c-ink-3);
		font-size: 0.9rem;
	}
	dd {
		font-weight: 600;
	}
	.recent {
		margin-top: 4rem;
	}
	.grid {
		display: grid;
		gap: 2rem;
	}
	@media (min-width: 768px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
