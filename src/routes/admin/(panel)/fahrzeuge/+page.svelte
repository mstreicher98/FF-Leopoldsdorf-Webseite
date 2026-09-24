<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Plus from '@lucide/svelte/icons/plus';
	import { mediaSrc } from '$lib/media';

	let { data } = $props();
</script>

<svelte:head><title>Fahrzeuge | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Fahrzeuge</h1>
		<p class="page-sub">Die Reihenfolge hier gilt auch für den Fuhrpark auf der Webseite.</p>
	</div>
	<a href="/admin/fahrzeuge/neu" class="btn btn-primary"><Plus size={18} /> Fahrzeug</a>
</div>

<div class="card">
	{#if data.vehicles.length}
		<ul class="rows">
			{#each data.vehicles as v, i (v.id)}
				<li class="row">
					<a href="/admin/fahrzeuge/{v.id}" class="link">
						<span class="thumb">
							{#if v.coverFile}<img src={mediaSrc({ file: v.coverFile, widths: v.coverWidths ?? '' }, 400)} alt="" loading="lazy" />{/if}
						</span>
						<span class="main">
							<span class="name">{v.radioName || v.name}</span>
							<span class="muted small">{v.shortName}{v.shortName && v.radioName ? ', ' : ''}{v.radioName ? v.name : ''}</span>
						</span>
						{#if !v.inService}<span class="badge">Außer Dienst</span>{/if}
					</a>
					<form method="POST" action="?/verschieben" use:enhance class="move">
						<input type="hidden" name="id" value={v.id} />
						<button class="btn btn-ghost btn-icon btn-sm" name="richtung" value="hoch" disabled={i === 0} aria-label="Nach oben"><ArrowUp size={16} /></button>
						<button class="btn btn-ghost btn-icon btn-sm" name="richtung" value="runter" disabled={i === data.vehicles.length - 1} aria-label="Nach unten"><ArrowDown size={16} /></button>
					</form>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Noch keine Fahrzeuge eingetragen.</p>
	{/if}
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-right: 0.75rem;
	}
	.row + .row {
		border-top: 1px solid var(--c-line);
	}
	.link {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.6rem 1rem;
		color: inherit;
		text-decoration: none;
	}
	.link:hover .name {
		color: var(--c-red);
	}
	.thumb {
		width: 4.5rem;
		height: 3rem;
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
	}
	.name {
		font-weight: 650;
	}
	.move {
		display: flex;
		gap: 0.15rem;
	}
</style>
