<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { relativeTime } from '$lib/format';

	let { data } = $props();

	const SECTIONS = [
		{ id: 'feuerwehr', title: 'Menü „Feuerwehr“', text: 'Neben Kommando, Mannschaft und Fuhrpark' },
		{ id: 'buergerservice', title: 'Menü „Bürgerservice“', text: 'Informationen für die Bevölkerung' },
		{ id: 'rechtliches', title: 'Rechtliches', text: 'Im Footer verlinkt, kann nicht gelöscht werden' }
	] as const;

	const href = (p: { slug: string; section: string }) => (p.section === 'rechtliches' ? `/${p.slug}` : `/${p.section}/${p.slug}`);
</script>

<svelte:head><title>Seiten | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Seiten</h1>
		<p class="page-sub">Feste Textseiten wie „Über uns“, Bürgerservice, Impressum und Datenschutz.</p>
	</div>
	<a href="/admin/seiten/neu" class="btn btn-primary"><Plus size={18} /> Seite</a>
</div>

<div class="stack">
	{#each SECTIONS as s (s.id)}
		{@const items = data.pages.filter((p) => p.section === s.id)}
		<section class="card">
			<div class="head">
				<h2 class="card-title">{s.title}</h2>
				<p class="card-sub">{s.text}</p>
			</div>
			{#if items.length}
				<ul>
					{#each items as p (p.id)}
						<li class="row">
							<a href="/admin/seiten/{p.id}" class="row-link">{p.title}</a>
							<span class="muted small">{href(p)}</span>
							<span class="muted small right">geändert {relativeTime(p.updatedAt)}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty">Keine Seiten.</p>
			{/if}
		</section>
	{/each}
</div>

<style>
	.head {
		padding: 1rem 1rem 0.6rem;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 1rem;
		padding: 0.7rem 1rem;
		border-top: 1px solid var(--c-line);
	}
	.right {
		margin-left: auto;
	}
</style>
