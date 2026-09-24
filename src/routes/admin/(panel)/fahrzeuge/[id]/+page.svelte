<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import GalleryField from '$lib/components/admin/GalleryField.svelte';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import RichEditor from '$lib/components/admin/RichEditor.svelte';
	import SaveBar from '$lib/components/admin/SaveBar.svelte';
	import { submitting } from '$lib/formEnhance';
	import type { MediaRef } from '$lib/media';

	let { data } = $props();

	const v = $derived(data.vehicle);
	let busy = $state(false);
	// svelte-ignore state_referenced_locally
	let cover = $state<MediaRef | null>(data.cover);
	// svelte-ignore state_referenced_locally
	let gallery = $state<MediaRef[]>(data.gallery);
	// svelte-ignore state_referenced_locally
	let extra = $state(data.extra.length ? data.extra : [{ label: '', value: '' }]);
</script>

<svelte:head><title>{v ? v.name : 'Neues Fahrzeug'} | FF Intern</title></svelte:head>

<a href="/admin/fahrzeuge" class="back"><ArrowLeft size={16} /> Fahrzeuge</a>
<div class="page-head">
	<h1 class="page-title">{v ? v.radioName || v.name : 'Neues Fahrzeug'}</h1>
	{#if v}<a href="/feuerwehr/fuhrpark/{v.slug}" target="_blank" rel="noopener" class="btn btn-sm">Ansehen <ExternalLink size={14} /></a>{/if}
</div>

<form method="POST" action="?/speichern" use:enhance={submitting((b) => (busy = b))}>
	<div class="layout">
		<div class="stack">
			<section class="card card-pad stack">
				<label class="field">
					<span class="label">Bezeichnung</span>
					<input class="input" name="bezeichnung" value={v?.name ?? ''} required maxlength="120" placeholder="z. B. Hilfeleistungslöschfahrzeug 3" />
				</label>
				<div class="grid-2">
					<label class="field">
						<span class="label">Kurzbezeichnung</span>
						<input class="input" name="kurz" value={v?.shortName ?? ''} maxlength="30" placeholder="z. B. HLF3" />
					</label>
					<label class="field">
						<span class="label">Funkrufname</span>
						<input class="input" name="funk" value={v?.radioName ?? ''} maxlength="60" placeholder="z. B. Tank 1 Leopoldsdorf" />
					</label>
				</div>
			</section>

			<section class="card card-pad stack">
				<h2 class="card-title">Technische Daten</h2>
				<div class="grid-2">
					<label class="field"><span class="label">Fahrgestell</span><input class="input" name="fahrgestell" value={v?.chassis ?? ''} maxlength="120" placeholder="z. B. MAN TGM 18.320" /></label>
					<label class="field"><span class="label">Aufbau</span><input class="input" name="aufbau" value={v?.body ?? ''} maxlength="120" placeholder="z. B. Rosenbauer" /></label>
					<label class="field"><span class="label">Baujahr</span><input class="input" type="number" name="baujahr" value={v?.year ?? ''} min="1900" max="2199" /></label>
					<label class="field"><span class="label">Gesamtgewicht</span><input class="input" name="gewicht" value={v?.weight ?? ''} maxlength="40" placeholder="z. B. 10.800 kg" /></label>
					<label class="field"><span class="label">Besatzung</span><input class="input" name="besatzung" value={v?.crew ?? ''} maxlength="40" placeholder="z. B. 1:6" /></label>
					<label class="field"><span class="label">Einsatzbereich</span><input class="input" name="bereich" value={v?.purpose ?? ''} maxlength="160" placeholder="z. B. Brandeinsätze und technische Hilfeleistung" /></label>
				</div>
				<div class="field">
					<span class="label">Weitere Angaben <span class="opt">(z. B. Pumpe, Löschwassertank)</span></span>
					{#each extra as row, i (i)}
						<div class="extra">
							<input class="input" name="extraLabel" bind:value={row.label} placeholder="Bezeichnung" maxlength="60" />
							<input class="input" name="extraWert" bind:value={row.value} placeholder="Wert" maxlength="200" />
							<button type="button" class="btn btn-ghost btn-icon" aria-label="Zeile entfernen" onclick={() => (extra = extra.filter((_, j) => j !== i))}><X size={16} /></button>
						</div>
					{/each}
					<button type="button" class="btn btn-sm add" onclick={() => extra.push({ label: '', value: '' })}><Plus size={15} /> Zeile hinzufügen</button>
				</div>
			</section>

			<div class="field">
				<span class="label">Beschreibung</span>
				<RichEditor name="beschreibung" value={v?.descriptionHtml ?? ''} placeholder="Wofür wird das Fahrzeug eingesetzt, was ist an Bord?" />
			</div>

			<GalleryField name="bilder" bind:value={gallery} />
		</div>

		<aside class="stack">
			<section class="card card-pad stack">
				<label class="check">
					<input type="checkbox" name="imDienst" checked={v?.inService ?? true} />
					<span><span class="check-title">Im Dienst</span><br /><span class="hint">Außer Dienst gestellte Fahrzeuge erscheinen in einem eigenen Abschnitt.</span></span>
				</label>
			</section>
			<section class="card card-pad">
				<ImageField name="titelbild" label="Titelbild" bind:value={cover} aspect="4 / 3" />
			</section>
		</aside>
	</div>

	<SaveBar {busy} cancelHref="/admin/fahrzeuge" deleteConfirm={v ? `${v.name} löschen? Es verschwindet auch aus allen Einsatzberichten.` : ''} />
</form>

<style>
	.layout {
		display: grid;
		gap: 1rem;
	}
	@media (min-width: 1100px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 20rem;
			align-items: start;
		}
	}
	.extra {
		display: grid;
		grid-template-columns: 1fr 1.4fr auto;
		gap: 0.4rem;
	}
	.add {
		align-self: flex-start;
		margin-top: 0.2rem;
	}
</style>
