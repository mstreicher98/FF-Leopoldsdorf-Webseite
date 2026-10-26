<script lang="ts">
	import { enhance } from '$app/forms';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import { BANNER_PAGES } from '$lib/banners';
	import { relativeTime } from '$lib/format';
	import { submitting } from '$lib/formEnhance';

	let { data } = $props();
	let busy = $state(false);
	// svelte-ignore state_referenced_locally
	let banners = $state({ ...data.banners });

	// Das Menü „Feuerwehr“ hat nur noch Kommando, Mannschaft und Fuhrpark. Ältere Seiten
	// dort (z. B. aus einer Sicherung) erscheinen noch, damit man sie löschen kann.
	const SECTIONS = $derived([
		...(data.pages.some((p) => p.section === 'feuerwehr')
			? [{ id: 'feuerwehr', title: 'Menü „Feuerwehr“', text: 'Neue Seiten können hier nicht mehr angelegt werden' }]
			: []),
		{ id: 'buergerservice', title: 'Menü „Bürgerservice“', text: 'Informationen für die Bevölkerung' },
		{ id: 'rechtliches', title: 'Rechtliches', text: 'Im Footer verlinkt, kann nicht gelöscht werden' }
	]);

	const href = (p: { slug: string; section: string }) => (p.section === 'rechtliches' ? `/${p.slug}` : `/${p.section}/${p.slug}`);
</script>

<svelte:head><title>Seiten | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Seiten</h1>
		<p class="page-sub">Textseiten im Bürgerservice, Impressum und Datenschutz sowie die Titelbilder aller Seiten.</p>
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

	<form method="POST" action="?/titelbilder" use:enhance={submitting((b) => (busy = b))} class="card card-pad stack" id="titelbilder">
		<div>
			<h2 class="card-title">Titelbilder</h2>
			<p class="card-sub">
				Das breite Bild oben auf jeder Seite. Ohne eigene Wahl erscheint das Standardbild. Die Titelbilder der Textseiten oben stellt ihr direkt bei der jeweiligen Seite ein.
			</p>
		</div>
		<div class="banners">
			{#each BANNER_PAGES as b (b.key)}
				<div class="banner-field">
					<ImageField
						name="bild-{b.key}"
						label={b.title}
						bind:value={banners[b.key]}
						fallback={b.fallback}
						aspect="16 / 7"
						hint={b.key === 'start' ? 'Am besten ein Querformat mit ruhiger linker Bildhälfte – dort steht der Leitspruch.' : ''}
					/>
					<a href={b.path} target="_blank" rel="noopener" class="view"><ExternalLink size={14} /> Seite ansehen</a>
				</div>
			{/each}
		</div>
		<div class="actionbar">
			<button class="btn btn-primary" disabled={busy}>Titelbilder speichern</button>
		</div>
	</form>
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
	.banners {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 1.5rem 1.25rem;
	}
	.banner-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}
	.view {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--c-ink-3);
	}
	.view:hover {
		color: var(--c-ink);
	}
</style>
