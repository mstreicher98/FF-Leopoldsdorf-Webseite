<script lang="ts">
	import { enhance } from '$app/forms';
	import Plus from '@lucide/svelte/icons/plus';
	import EinsatzChip from '$lib/components/site/EinsatzChip.svelte';
	import { EINSATZ_GROUPS, GROUP_LABELS } from '$lib/einsatz';
	import { submitting } from '$lib/formEnhance';

	let { data } = $props();

	let editing = $state<number | 'neu' | null>(null);
	let busy = $state(false);

	const setBusy = (b: boolean) => (busy = b);
</script>

<svelte:head><title>Einsatzarten | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Einsatzarten</h1>
		<p class="page-sub">Auswahl bei Einsatzberichten. Die Farbe richtet sich nach der Gruppe.</p>
	</div>
	<button type="button" class="btn btn-primary" onclick={() => (editing = 'neu')}><Plus size={18} /> Einsatzart</button>
</div>

{#snippet editor(a: { id: number | null; code: string; label: string; group: string; countsInStats: boolean; active: boolean })}
	<form
		method="POST"
		action="?/speichern"
		class="edit"
		use:enhance={submitting(setBusy, { onSuccess: () => (editing = null) })}
	>
		<input type="hidden" name="id" value={a.id ?? ''} />
		<div class="edit-grid">
			<label class="field"><span class="label">Kürzel</span><input class="input" name="code" value={a.code} required maxlength="10" /></label>
			<label class="field grow"><span class="label">Bezeichnung</span><input class="input" name="bezeichnung" value={a.label} required maxlength="80" /></label>
			<label class="field">
				<span class="label">Gruppe</span>
				<select class="select" name="gruppe" value={a.group}>
					{#each EINSATZ_GROUPS as g (g)}<option value={g}>{GROUP_LABELS[g]}</option>{/each}
				</select>
			</label>
		</div>
		<div class="edit-row">
			<label class="check"><input type="checkbox" name="statistik" checked={a.countsInStats} /> <span>Zählt zur Einsatzstatistik</span></label>
			<label class="check"><input type="checkbox" name="aktiv" checked={a.active} /> <span>Bei neuen Berichten anbieten</span></label>
			<span class="spacer"></span>
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => (editing = null)}>Abbrechen</button>
			<button class="btn btn-primary btn-sm" disabled={busy}>Speichern</button>
		</div>
	</form>
{/snippet}

<div class="card">
	{#if editing === 'neu'}
		{@render editor({ id: null, code: '', label: '', group: 'technik', countsInStats: true, active: true })}
	{/if}
	<ul>
		{#each data.arten as a (a.id)}
			<li class="row" class:off={!a.active}>
				{#if editing === a.id}
					{@render editor(a)}
				{:else}
					<EinsatzChip code={a.code} group={a.group} size="md" />
					<span class="main">
						<span class="name">{a.label}</span>
						<span class="muted small">
							{GROUP_LABELS[a.group]}{a.countsInStats ? '' : ', nicht in der Statistik'}{a.active ? '' : ', wird nicht mehr angeboten'}{a.used ? `, in ${a.used} Berichten` : ''}
						</span>
					</span>
					<button type="button" class="btn btn-sm" onclick={() => (editing = a.id)}>Bearbeiten</button>
					{#if !a.used}
						<form method="POST" action="?/loeschen" use:enhance={submitting(setBusy)}>
							<input type="hidden" name="id" value={a.id} />
							<button class="btn btn-sm btn-ghost" onclick={(e) => !confirm(`${a.code} löschen?`) && e.preventDefault()}>Löschen</button>
						</form>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.7rem 1rem;
		border-top: 1px solid var(--c-line);
	}
	.row:first-child {
		border-top: 0;
	}
	.row.off {
		opacity: 0.6;
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
	.edit {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--c-surface-2);
		border-radius: 10px;
	}
	.row .edit {
		margin: -0.2rem -0.4rem;
	}
	.edit-grid {
		display: grid;
		gap: 0.75rem;
	}
	@media (min-width: 640px) {
		.edit-grid {
			grid-template-columns: 7rem 1fr 13rem;
		}
	}
	.edit-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
	}
	.spacer {
		flex: 1;
	}
</style>
