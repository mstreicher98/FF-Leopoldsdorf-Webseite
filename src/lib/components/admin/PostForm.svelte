<script lang="ts" module>
	import type { MediaRef } from '$lib/media';
	import type { PostCategory } from '$lib/server/db/schema';

	export interface PostFormValues {
		id: number | null;
		slug: string | null;
		title: string;
		category: PostCategory;
		date: string;
		time: string;
		status: 'entwurf' | 'veroeffentlicht' | 'statistik';
		pinned: boolean;
		summary: string;
		contentHtml: string;
		cover: MediaRef | null;
		gallery: MediaRef[];
		einsatzNummer: string;
		einsatzartId: number | null;
		stichwort: string;
		einsatzort: string;
		vehicleIds: number[];
	}
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { CATEGORIES, CATEGORY_ORDER } from '$lib/categories';
	import { EINSATZ_GROUPS, GROUP_PLURAL } from '$lib/einsatz';
	import type { Einsatzart } from '$lib/server/db/schema';
	import { toasts } from '$lib/toast.svelte';
	import GalleryField from './GalleryField.svelte';
	import ImageField from './ImageField.svelte';
	import RichEditor from './RichEditor.svelte';


	interface Props {
		values: PostFormValues;
		einsatzarten: Einsatzart[];
		fahrzeuge: { id: number; name: string; shortName: string; radioName: string; inService: boolean }[];
		nummerVorschlag: string;
	}

	let { values, einsatzarten, fahrzeuge, nummerVorschlag }: Props = $props();

	// Formularzustand – einmalig aus den Startwerten übernommen
	// svelte-ignore state_referenced_locally
	let category = $state<PostCategory>(values.category);
	// svelte-ignore state_referenced_locally
	let cover = $state<MediaRef | null>(values.cover);
	// svelte-ignore state_referenced_locally
	let gallery = $state<MediaRef[]>(values.gallery);
	// svelte-ignore state_referenced_locally
	let nummer = $state(values.einsatzNummer);
	// Einsatz ohne öffentlichen Bericht – zählt nur in der Statistik
	// svelte-ignore state_referenced_locally
	let statsOnly = $state(values.status === 'statistik');
	let busy = $state(false);
	let error = $state('');
	let dirty = $state(false);

	const isNew = $derived(values.id === null);
	const online = $derived(values.status === 'veroeffentlicht');
	const einsatz = $derived(category === 'einsatz');
	const reportless = $derived(einsatz && statsOnly);
	const artGroups = $derived(
		EINSATZ_GROUPS.map((g) => ({ g, items: einsatzarten.filter((a) => a.group === g && (a.active || a.id === values.einsatzartId)) })).filter((x) => x.items.length)
	);
	const activeVehicles = $derived(fahrzeuge.filter((f) => f.inService || values.vehicleIds.includes(f.id)));

	beforeNavigate((nav) => {
		if (dirty && !busy && nav.type !== 'form' && !confirm('Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?')) nav.cancel();
	});

	// Bildänderungen zählen auch als Änderung (erster Lauf = Startwerte)
	let firstRun = true;
	$effect(() => {
		void cover?.id;
		void gallery.map((g) => g.id).join();
		if (firstRun) firstRun = false;
		else dirty = true;
	});
</script>

<form
	method="POST"
	action="?/speichern"
	class="post-form"
	oninput={() => (dirty = true)}
	use:enhance={() => {
		busy = true;
		error = '';
		return async ({ result, update }) => {
			if (result.type === 'failure') {
				error = String(result.data?.error ?? 'Speichern fehlgeschlagen.');
				toasts.show(error, 'error');
			}
			if (result.type === 'redirect') dirty = false;
			await update({ reset: false });
			busy = false;
		};
	}}
>
	{#if error}<p class="alert alert-error" role="alert">{error}</p>{/if}

	<div class="layout">
		<div class="main stack">
			<label class="field">
				<span class="label">Titel {#if reportless}<span class="opt">(optional – leer: Stichwort bzw. Einsatzart)</span>{/if}</span>
				<input
					class="input title-input"
					name="titel"
					value={values.title}
					required={!reportless}
					maxlength="200"
					placeholder={einsatz ? 'z. B. Fahrzeugbergung auf der B16' : 'Worum geht es?'}
				/>
			</label>

			<fieldset class="field">
				<legend class="label">Kategorie</legend>
				<div class="segmented">
					{#each CATEGORY_ORDER as c (c)}
						<label><input type="radio" name="kategorie" value={c} bind:group={category} /><span>{CATEGORIES[c].label}</span></label>
					{/each}
				</div>
			</fieldset>

			{#if einsatz}
				<section class="card card-pad einsatz">
					<h2 class="card-title">Einsatzdaten</h2>
					<fieldset class="field mt">
						<legend class="label">Bericht auf der Webseite</legend>
						<div class="segmented">
							<label><input type="radio" name="berichtsart" value={false} bind:group={statsOnly} onchange={() => (dirty = true)} /><span>Mit Bericht</span></label>
							<label><input type="radio" name="berichtsart" value={true} bind:group={statsOnly} onchange={() => (dirty = true)} /><span>Ohne Bericht, nur Statistik</span></label>
						</div>
						{#if statsOnly}
							<span class="hint">Der Einsatz zählt in der Einsatzstatistik, erscheint aber nicht als Beitrag auf der Webseite. Die Einsatzart ist dafür Pflicht.</span>
						{/if}
					</fieldset>
					<div class="grid-2 mt">
						<label class="field">
							<span class="label">Einsatzart</span>
							<select class="select" name="einsatzart" value={values.einsatzartId ?? ''} required={reportless}>
								<option value="">– bitte wählen –</option>
								{#each artGroups as { g, items } (g)}
									<optgroup label={GROUP_PLURAL[g]}>
										{#each items as a (a.id)}<option value={a.id}>{a.code} – {a.label}</option>{/each}
									</optgroup>
								{/each}
							</select>
						</label>
						<label class="field">
							<span class="label">Einsatznummer <span class="opt">(optional)</span></span>
							<span class="with-btn">
								<input class="input" name="einsatznummer" bind:value={nummer} placeholder={nummerVorschlag} maxlength="20" />
								{#if !nummer}<button type="button" class="btn btn-sm" onclick={() => ((nummer = nummerVorschlag), (dirty = true))}>{nummerVorschlag} übernehmen</button>{/if}
							</span>
						</label>
						<label class="field">
							<span class="label">Stichwort</span>
							<input class="input" name="stichwort" value={values.stichwort} maxlength="120" placeholder="z. B. Auspumparbeiten" />
						</label>
						<label class="field">
							<span class="label">Einsatzort</span>
							<input class="input" name="einsatzort" value={values.einsatzort} maxlength="160" placeholder="z. B. Schulgasse" />
							<span class="hint">Keine Hausnummern von Privatpersonen und keine Namen von Betroffenen.</span>
						</label>
					</div>
					{#if activeVehicles.length}
						<fieldset class="field mt">
							<legend class="label">Eingesetzte Fahrzeuge</legend>
							<div class="vehicles">
								{#each activeVehicles as f (f.id)}
									<label class="veh">
										<input type="checkbox" name="fahrzeuge" value={f.id} checked={values.vehicleIds.includes(f.id)} />
										<span><strong>{f.shortName || f.name}</strong>{#if f.radioName}<small>{f.radioName}</small>{/if}</span>
									</label>
								{/each}
							</div>
						</fieldset>
					{:else}
						<p class="hint mt">Fahrzeuge lassen sich auswählen, sobald sie unter „Fahrzeuge“ angelegt sind.</p>
					{/if}
				</section>
			{/if}

			<!-- Ohne Bericht nur ausgeblendet, nicht entfernt: vorhandener Text und Bilder bleiben beim Speichern erhalten -->
			<div class="stack" style:display={reportless ? 'none' : null}>
				<div class="field">
					<span class="label">Text</span>
					<RichEditor name="inhalt" value={values.contentHtml} placeholder={einsatz ? 'Was ist passiert, was hat die Feuerwehr gemacht?' : 'Text schreiben …'} />
				</div>

				<GalleryField name="bilder" bind:value={gallery} />

				<label class="field">
					<span class="label">Kurzfassung <span class="opt">(optional)</span></span>
					<textarea class="textarea" name="kurzfassung" rows="2" maxlength="400" placeholder="Leer lassen: Die ersten Sätze des Textes werden verwendet.">{values.summary}</textarea>
					<span class="hint">Erscheint in Übersichten und als Vorschau beim Teilen.</span>
				</label>
			</div>
		</div>

		<aside class="side stack">
			<div class="card card-pad stack">
				<div class="state">
					{#if isNew}
						<span class="badge">Neu</span>
					{:else if online}
						<span class="badge badge-ok">Veröffentlicht</span>
					{:else if values.status === 'statistik'}
						<span class="badge badge-info">Nur Statistik</span>
					{:else}
						<span class="badge badge-warn">Entwurf</span>
					{/if}
					{#if values.slug && values.status !== 'statistik'}
						<a href="/beitrag/{values.slug}" target="_blank" rel="noopener" class="preview">{online ? 'Ansehen' : 'Vorschau'} <ExternalLink size={14} /></a>
					{/if}
				</div>
				<div class="grid-2 tight">
					<label class="field">
						<span class="label">{einsatz ? 'Alarmiert am' : 'Datum'}</span>
						<input class="input" type="date" name="datum" value={values.date} required />
					</label>
					<label class="field">
						<span class="label">{einsatz ? 'um' : 'Uhrzeit'} <span class="opt">(optional)</span></span>
						<input class="input" type="time" name="uhrzeit" value={values.time} />
					</label>
				</div>
				<label class="check" style:display={reportless ? 'none' : null}>
					<input type="checkbox" name="angeheftet" checked={values.pinned} />
					<span><span class="check-title">Auf der Startseite anheften</span><br /><span class="hint">Für wichtige Hinweise, die oben bleiben sollen.</span></span>
				</label>
			</div>

			<div class="card card-pad" style:display={reportless ? 'none' : null}>
				<ImageField name="titelbild" label="Titelbild" bind:value={cover} hint="Wird groß über dem Beitrag und in Übersichten gezeigt." />
			</div>
		</aside>
	</div>

	<div class="actionbar">
		{#if reportless}
			<button class="btn btn-primary" name="status" value="statistik" disabled={busy}>{isNew ? 'Einsatz speichern' : 'Änderungen speichern'}</button>
		{:else if online}
			<button class="btn btn-primary" name="status" value="veroeffentlicht" disabled={busy}>Änderungen speichern</button>
			<button class="btn" name="status" value="entwurf" disabled={busy}>Offline nehmen</button>
		{:else}
			<button class="btn btn-primary" name="status" value="veroeffentlicht" disabled={busy}>Veröffentlichen</button>
			<button class="btn" name="status" value="entwurf" disabled={busy}>Als Entwurf speichern</button>
		{/if}
		<span class="spacer"></span>
		{#if !isNew}
			<button
				class="btn btn-danger"
				formaction="?/loeschen"
				formnovalidate
				disabled={busy}
				onclick={(e) => {
					if (!confirm('Diesen Beitrag endgültig löschen? Die Bilder bleiben in der Mediathek.')) e.preventDefault();
					else dirty = false;
				}}>Löschen</button
			>
		{/if}
	</div>
</form>

<style>
	.layout {
		display: grid;
		gap: 1.25rem;
	}
	@media (min-width: 1100px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 20rem;
			gap: 1.5rem;
			align-items: start;
		}
		.side {
			position: sticky;
			top: 1.5rem;
		}
	}
	.title-input {
		font-size: 1.25rem !important;
		font-weight: 650;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}
	legend {
		margin-bottom: 0.35rem;
	}
	.einsatz {
		border-top: 4px solid var(--c-red);
	}
	.mt {
		margin-top: 1rem;
	}
	.with-btn {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}
	.vehicles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.veh {
		position: relative;
		cursor: pointer;
	}
	.veh input {
		position: absolute;
		opacity: 0;
	}
	.veh span {
		display: flex;
		flex-direction: column;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-field);
		border: 1px solid var(--c-line-strong);
		line-height: 1.2;
	}
	.veh small {
		font-size: 0.75rem;
		color: var(--c-ink-3);
	}
	.veh input:checked + span {
		border-color: var(--c-red);
		background: var(--c-red-soft);
		box-shadow: inset 0 0 0 1px var(--c-red);
	}
	.veh input:focus-visible + span {
		outline: 2.5px solid var(--c-focus);
		outline-offset: 2px;
	}
	.state {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.preview {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--c-info);
	}
	.tight {
		gap: 0.6rem;
	}
	@media (min-width: 640px) and (max-width: 1099px) {
		.side {
			display: grid;
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
</style>
