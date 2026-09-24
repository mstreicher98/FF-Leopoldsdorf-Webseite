<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import RankBadge from '$lib/components/site/RankBadge.svelte';
	import { mediaSrc } from '$lib/media';

	let { data } = $props();

	let query = $state('');
	let status = $state('');

	const STATUS_LABEL = { aktiv: 'Aktiv', reserve: 'Reserve', jugend: 'Jugend' } as const;

	const list = $derived(
		data.members.filter((m) => {
			if (status === 'kommando' ? !m.kommandoPosition : status && m.status !== status) return false;
			if (!query) return true;
			const q = query.toLowerCase();
			return `${m.firstName} ${m.lastName} ${m.functionTitle} ${m.rank}`.toLowerCase().includes(q);
		})
	);
	const counts = $derived({
		total: data.members.length,
		hidden: data.members.filter((m) => !m.publicVisible).length
	});
</script>

<svelte:head><title>Mitglieder | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Mitglieder</h1>
		<p class="page-sub">{counts.total} Mitglieder, davon {counts.hidden} nicht öffentlich sichtbar</p>
	</div>
	<a href="/admin/mitglieder/neu" class="btn btn-primary"><Plus size={18} /> Mitglied</a>
</div>

<div class="toolbar">
	<input class="input grow" type="search" placeholder="Name, Funktion oder Dienstgrad suchen" bind:value={query} />
	<select class="select" bind:value={status}>
		<option value="">Alle</option>
		<option value="kommando">Kommando</option>
		<option value="aktiv">Aktiv</option>
		<option value="reserve">Reserve</option>
		<option value="jugend">Jugend</option>
	</select>
</div>

<div class="card">
	{#if list.length}
		<ul class="rows">
			{#each list as m (m.id)}
				<li>
					<a href="/admin/mitglieder/{m.id}" class="row">
						<span class="photo">
							{#if m.photoFile}
								<img src={mediaSrc({ file: m.photoFile, widths: m.photoWidths ?? '' }, 400)} alt="" loading="lazy" />
							{:else}
								{m.firstName[0]}{m.lastName[0]}
							{/if}
						</span>
						<span class="main">
							<span class="name">{m.lastName} {m.firstName}</span>
							<span class="meta">
								<RankBadge rank={m.rank} honorary={m.honoraryRank} />
								<span>{m.kommandoPosition || m.functionTitle || STATUS_LABEL[m.status]}</span>
							</span>
						</span>
						<span class="flags">
							{#if !m.publicVisible}
								<span class="badge badge-warn">Nicht öffentlich</span>
							{:else if m.photoFile && !m.photoApproved}
								<span class="badge">Foto gesperrt</span>
							{/if}
							{#if m.status !== 'aktiv'}<span class="badge badge-info">{STATUS_LABEL[m.status]}</span>{/if}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">{data.members.length ? 'Niemand gefunden.' : 'Noch keine Mitglieder eingetragen.'}</p>
	{/if}
</div>

<style>
	.rows li + li {
		border-top: 1px solid var(--c-line);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.6rem 1rem;
		color: inherit;
		text-decoration: none;
	}
	.row:hover {
		background: var(--c-surface-2);
	}
	.photo {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		flex-shrink: 0;
		border-radius: 999px;
		overflow: hidden;
		background: var(--c-surface-3);
		color: var(--c-ink-3);
		font-weight: 700;
		font-size: 0.85rem;
	}
	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.name {
		font-weight: 650;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		color: var(--c-ink-3);
	}
	.meta :global(img) {
		width: 1.25rem !important;
		height: 1.25rem !important;
	}
	.flags {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.3rem;
	}
</style>
