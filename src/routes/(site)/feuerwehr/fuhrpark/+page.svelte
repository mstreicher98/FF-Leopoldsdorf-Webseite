<script lang="ts">
	import Banner from '$lib/components/site/Banner.svelte';
	import Picture from '$lib/components/site/Picture.svelte';
	import Seo from '$lib/components/site/Seo.svelte';

	let { data } = $props();

	const active = $derived(data.vehicles.filter((v) => v.inService));
	const retired = $derived(data.vehicles.filter((v) => !v.inService));
</script>

<Seo title="Fuhrpark" description="Die Einsatzfahrzeuge der Freiwilligen Feuerwehr Leopoldsdorf" />

<Banner title="Fuhrpark" subtitle="Unsere Fahrzeuge für Brand, Technik und Schadstoff" image="/banner/fuhrpark.webp" />

{#snippet card(v: (typeof data.vehicles)[number])}
	<article class="vehicle">
		<div class="media">
			{#if v.cover}
				<Picture media={v.cover} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" class="img" />
			{:else}
				<img src="/bilder/fahrzeug-platzhalter.webp" alt="" class="img placeholder" loading="lazy" />
			{/if}
		</div>
		<div class="body">
			{#if v.shortName}<span class="short">{v.shortName}</span>{/if}
			<h2 class="radio"><a href="/feuerwehr/fuhrpark/{v.slug}">{v.radioName || v.name}</a></h2>
			{#if v.radioName}<p class="name">{v.name}</p>{/if}
			{#if v.purpose}<p class="purpose">{v.purpose}</p>{/if}
		</div>
	</article>
{/snippet}

<div class="wrap">
	{#if active.length}
		<ul class="grid">
			{#each active as v (v.id)}
				<li>{@render card(v)}</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Unsere Fahrzeuge werden hier in Kürze vorgestellt.</p>
	{/if}

	{#if retired.length}
		<section class="retired">
			<h2 class="sec-title">Außer Dienst</h2>
			<ul class="grid">
				{#each retired as v (v.id)}
					<li>{@render card(v)}</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.grid {
		display: grid;
		gap: 2.5rem 2rem;
		margin-top: 3rem;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	.vehicle {
		position: relative;
	}
	.media {
		aspect-ratio: 4 / 3;
		border-radius: 10px;
		overflow: hidden;
		background: var(--c-surface-3);
	}
	.media :global(.img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 400ms var(--ease-out);
	}
	.media :global(.placeholder) {
		object-fit: contain;
		padding: 1.5rem;
		opacity: 0.5;
	}
	.vehicle:hover .media :global(.img) {
		transform: scale(1.03);
	}
	.body {
		padding-top: 1rem;
	}
	.short {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		border-radius: 5px;
		background: var(--c-red);
		color: #fff;
		font-weight: 800;
		font-stretch: 75%;
		font-size: 0.95rem;
		letter-spacing: 0.02em;
	}
	.radio {
		margin-top: 0.5rem;
		font-size: 1.7rem;
		font-weight: 850;
		font-stretch: 66%;
		line-height: 1;
		text-transform: uppercase;
	}
	.radio a {
		color: var(--c-ink);
		text-decoration: none;
	}
	.radio a::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.vehicle:hover .radio a {
		color: var(--c-red);
	}
	.name {
		margin-top: 0.35rem;
		font-weight: 600;
		color: var(--c-ink-2);
	}
	.purpose {
		margin-top: 0.25rem;
		font-size: 0.9rem;
		color: var(--c-ink-3);
	}
	.retired {
		margin-top: 4rem;
	}
	.retired .grid {
		margin-top: 1.5rem;
	}
	.sec-title {
		padding-bottom: 0.6rem;
		border-bottom: 2px solid var(--c-night);
		font-size: 1.8rem;
		font-weight: 850;
		font-stretch: 66%;
		text-transform: uppercase;
	}
	.empty {
		margin-top: 3rem;
		color: var(--c-ink-3);
	}
</style>
