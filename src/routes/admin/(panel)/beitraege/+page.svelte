<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Pin from '@lucide/svelte/icons/pin';
	import Plus from '@lucide/svelte/icons/plus';
	import Siren from '@lucide/svelte/icons/siren';
	import EinsatzChip from '$lib/components/site/EinsatzChip.svelte';
	import Pagination from '$lib/components/site/Pagination.svelte';
	import { CATEGORIES, CATEGORY_ORDER } from '$lib/categories';
	import { formatDayShort } from '$lib/format';
	import { mediaSrc } from '$lib/media';

	let { data } = $props();

	function href(p: number) {
		const q = new URLSearchParams(page.url.searchParams);
		if (p > 1) q.set('seite', String(p));
		else q.delete('seite');
		return `?${q}`;
	}

	let timer: ReturnType<typeof setTimeout>;
	function filter(e: Event) {
		const form = (e.currentTarget as HTMLElement).closest('form')!;
		clearTimeout(timer);
		timer = setTimeout(() => {
			const q = new URLSearchParams();
			for (const [k, v] of new FormData(form)) if (v) q.set(k, String(v));
			goto(`?${q}`, { keepFocus: true, noScroll: true, replaceState: true });
		}, e.type === 'input' ? 250 : 0);
	}
</script>

<svelte:head><title>Beiträge | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Beiträge</h1>
		<p class="page-sub">{data.total} {data.total === 1 ? 'Beitrag' : 'Beiträge'}</p>
	</div>
	<div class="head-btns">
		<a href="/admin/beitraege/neu?kategorie=einsatz" class="btn btn-primary"><Siren size={18} /> Einsatzbericht</a>
		<a href="/admin/beitraege/neu" class="btn"><Plus size={18} /> Beitrag</a>
	</div>
</div>

<form class="toolbar" onsubmit={(e) => e.preventDefault()}>
	<input class="input grow" type="search" name="suche" placeholder="Titel suchen" value={data.filter.q} oninput={filter} />
	<select class="select" name="kategorie" value={data.filter.cat} onchange={filter}>
		<option value="">Alle Kategorien</option>
		{#each CATEGORY_ORDER as c (c)}<option value={c}>{CATEGORIES[c].title}</option>{/each}
	</select>
	<select class="select" name="status" value={data.filter.status} onchange={filter}>
		<option value="">Alle</option>
		<option value="veroeffentlicht">Veröffentlicht</option>
		<option value="entwurf">Entwürfe</option>
	</select>
</form>

<div class="card">
	{#if data.items.length}
		<ul class="rows">
			{#each data.items as p (p.id)}
				<li>
					<a href="/admin/beitraege/{p.id}" class="row">
						<span class="thumb">
							{#if p.coverFile}<img src={mediaSrc({ file: p.coverFile, widths: p.coverWidths ?? '' }, 400)} alt="" loading="lazy" />{/if}
						</span>
						<span class="main">
							<span class="title">
								{#if p.pinned}<Pin size={14} class="pin" />{/if}
								{p.title}
							</span>
							<span class="meta">
								{#if p.category === 'einsatz'}
									<EinsatzChip code={p.code} group={p.group} />
									{#if p.einsatzNummer}<span class="tabular">{p.einsatzNummer}</span>{/if}
								{:else}
									<span>{CATEGORIES[p.category].label}</span>
								{/if}
								<span class="tabular">{formatDayShort(p.date)}</span>
							</span>
						</span>
						{#if p.status === 'veroeffentlicht'}
							<span class="badge badge-ok">Online</span>
						{:else}
							<span class="badge badge-warn">Entwurf</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">
			{#if data.filter.q || data.filter.cat || data.filter.status}Keine Beiträge gefunden.{:else}Noch keine Beiträge. Leg gleich den ersten an.{/if}
		</p>
	{/if}
</div>

<Pagination page={data.page} pages={data.pages} {href} />

<style>
	.head-btns {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.rows li + li {
		border-top: 1px solid var(--c-line);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.7rem 1rem;
		color: inherit;
		text-decoration: none;
	}
	.row:hover {
		background: var(--c-surface-2);
	}
	.thumb {
		width: 4rem;
		height: 2.9rem;
		flex-shrink: 0;
		border-radius: 6px;
		overflow: hidden;
		background: var(--c-surface-3);
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.title {
		font-weight: 650;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.title :global(.pin) {
		display: inline;
		vertical-align: -2px;
		color: var(--c-red);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		color: var(--c-ink-3);
	}
</style>
