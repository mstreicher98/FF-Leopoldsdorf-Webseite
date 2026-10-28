<script lang="ts">
	import { goto } from '$app/navigation';
	import Banner from '$lib/components/site/Banner.svelte';
	import Einsatzbuch from '$lib/components/site/Einsatzbuch.svelte';
	import Pagination from '$lib/components/site/Pagination.svelte';
	import PostCard from '$lib/components/site/PostCard.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import StatsBar from '$lib/components/site/StatsBar.svelte';
	import { CATEGORIES, CATEGORY_ORDER } from '$lib/categories';

	let { data } = $props();

	const cat = $derived(data.category);
	const base = $derived(cat ? `/taetigkeiten/${cat.path}` : '/taetigkeiten');
	const title = $derived(cat ? cat.title : 'Alle Beiträge');
	const subtitle = $derived(cat ? cat.description : 'Alle Berichte der Freiwilligen Feuerwehr Leopoldsdorf');

	function href(page: number, year = data.year) {
		const q = new URLSearchParams();
		if (year) q.set('jahr', String(year));
		if (page > 1) q.set('seite', String(page));
		const s = q.toString();
		return s ? `${base}?${s}` : base;
	}

	const tabs = $derived([
		{ href: '/taetigkeiten', label: 'Alle', active: !cat },
		...CATEGORY_ORDER.map((id) => ({ href: `/taetigkeiten/${CATEGORIES[id].path}`, label: CATEGORIES[id].title, active: cat?.id === id }))
	]);
</script>

<Seo title={title} description={subtitle} />

<Banner {title} {subtitle} image={data.banner} />

<div class="wrap">
	<div class="toolbar">
		<nav aria-label="Kategorien" class="tabs">
			{#each tabs as t (t.href)}
				<a href={t.href} aria-current={t.active ? 'page' : undefined}>{t.label}</a>
			{/each}
		</nav>
		{#if data.years.length > 1}
			<label class="year">
				<span>Jahr</span>
				<select value={data.year ?? ''} onchange={(e) => goto(href(1, Number(e.currentTarget.value) || null), { noScroll: true })}>
					<option value="">Alle Jahre</option>
					{#each data.years as y (y)}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</label>
		{/if}
	</div>

	{#if data.stats}
		<section class="stats" aria-label="Einsätze {data.stats.year}">
			<h2 class="stats-title">Einsatzstatistik {data.stats.year}</h2>
			{#if data.stats.total}
				<StatsBar stats={data.stats} note="Gezählt werden alle Einsätze, auch solche ohne eigenen Bericht. Brandsicherheitswachen zählen nicht mit." />
			{:else}
				<p class="empty">Für {data.stats.year} sind noch keine Einsätze eingetragen.</p>
			{/if}
		</section>
	{/if}

	{#if data.items.length}
		<p class="count">{data.total} {cat?.id === 'einsatz' ? (data.total === 1 ? 'Einsatzbericht' : 'Einsatzberichte') : data.total === 1 ? 'Beitrag' : 'Beiträge'}{data.year ? ` aus ${data.year}` : ''}</p>
		{#if cat?.id === 'einsatz'}
			<Einsatzbuch posts={data.items} headingLevel={2} years />
		{:else}
			<div class="grid">
				{#each data.items as post (post.id)}
					<PostCard {post} headingLevel={2} />
				{/each}
			</div>
		{/if}
		<Pagination page={data.page} pages={data.pages} href={(p) => href(p)} />
	{:else}
		<p class="empty big">Hier gibt es noch keine Beiträge.</p>
	{/if}
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--c-line);
	}
	/* Register wie im Menü: aktive Kategorie rot unterstrichen */
	.tabs {
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		margin: 0 -0.25rem;
		padding: 0 0.25rem;
		scrollbar-width: none;
	}
	.tabs a {
		position: relative;
		flex-shrink: 0;
		padding: 0.55rem 0.7rem;
		border-radius: 6px;
		font-weight: 650;
		color: var(--c-ink-2);
		text-decoration: none;
	}
	.tabs a:hover {
		background: var(--c-surface-2);
		color: var(--c-ink);
	}
	.tabs a[aria-current='page'] {
		color: var(--c-ink);
	}
	.tabs a[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 0.7rem;
		right: 0.7rem;
		bottom: 0.1rem;
		height: 3px;
		border-radius: 2px;
		background: var(--c-red);
	}
	.year {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--c-ink-2);
	}
	.year select {
		height: 2.5rem;
		padding: 0 2rem 0 0.75rem;
		border: 1px solid var(--c-line-strong);
		border-radius: 8px;
		background: var(--c-surface);
		color: var(--c-ink);
		font: inherit;
	}
	.stats {
		margin-top: 2.5rem;
	}
	.stats-title {
		margin-bottom: 1rem;
		font-size: 1.35rem;
		font-weight: 800;
		font-stretch: 72%;
		text-transform: uppercase;
	}
	.count {
		margin-top: 2.5rem;
		margin-bottom: 1.25rem;
		color: var(--c-ink-3);
		font-size: 0.9rem;
	}
	.grid {
		display: grid;
		gap: 2.5rem 2rem;
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
	.empty {
		color: var(--c-ink-3);
	}
	.empty.big {
		margin-top: 3rem;
		font-size: 1.1rem;
	}
</style>
