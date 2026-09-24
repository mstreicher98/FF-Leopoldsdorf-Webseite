<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import SaveBar from '$lib/components/admin/SaveBar.svelte';
	import { DIENSTGRAD_GROUPS, DIENSTGRADE, isKnownRank, rankShort } from '$lib/dienstgrade';
	import { submitting } from '$lib/formEnhance';
	import type { MediaRef } from '$lib/media';

	let { data } = $props();

	const m = $derived(data.member);
	let busy = $state(false);
	// svelte-ignore state_referenced_locally
	let photo = $state<MediaRef | null>(data.photo);
	// svelte-ignore state_referenced_locally
	let status = $state(data.member?.status ?? 'aktiv');
	// svelte-ignore state_referenced_locally
	let rank = $state(data.member?.rank ?? 'PFM');
	// svelte-ignore state_referenced_locally
	let honorary = $state(data.member?.honoraryRank ?? false);
	// svelte-ignore state_referenced_locally
	let kommando = $state(data.member?.kommandoPosition ?? '');
	// Datenschutz: bei neuen Jugendmitgliedern ist beides aus, sonst an
	// svelte-ignore state_referenced_locally
	let visible = $state(data.member ? data.member.publicVisible : true);
	// svelte-ignore state_referenced_locally
	let photoOk = $state(data.member ? data.member.photoApproved : true);

	function onStatus() {
		if (!m && status === 'jugend') {
			visible = false;
			photoOk = false;
		}
		if (status === 'jugend' && !rank.startsWith('JFM')) rank = 'JFM';
	}

	const POSITIONS = [
		'Kommandant',
		'Kommandant-Stellvertreter',
		'1. Kommandant-Stellvertreter',
		'2. Kommandant-Stellvertreter',
		'Leiter des Verwaltungsdienstes',
		'Leiterin des Verwaltungsdienstes'
	];
</script>

<svelte:head><title>{m ? `${m.firstName} ${m.lastName}` : 'Neues Mitglied'} | FF Intern</title></svelte:head>

<a href="/admin/mitglieder" class="back"><ArrowLeft size={16} /> Mitglieder</a>
<div class="page-head">
	<h1 class="page-title">{m ? `${m.firstName} ${m.lastName}` : 'Neues Mitglied'}</h1>
</div>

<form method="POST" action="?/speichern" use:enhance={submitting((b) => (busy = b))}>
	<div class="layout">
		<div class="stack">
			<section class="card card-pad stack">
				<div class="grid-2">
					<label class="field">
						<span class="label">Vorname</span>
						<input class="input" name="vorname" value={m?.firstName ?? ''} required maxlength="60" autocomplete="off" />
					</label>
					<label class="field">
						<span class="label">Nachname</span>
						<input class="input" name="nachname" value={m?.lastName ?? ''} required maxlength="60" autocomplete="off" />
					</label>
				</div>

				<fieldset class="field">
					<legend class="label">Status</legend>
					<div class="segmented">
						{#each [['aktiv', 'Aktiv'], ['reserve', 'Reserve'], ['jugend', 'Jugend']] as [v, l] (v)}
							<label><input type="radio" name="status" value={v} bind:group={status} onchange={onStatus} /><span>{l}</span></label>
						{/each}
					</div>
				</fieldset>

				<div class="grid-2">
					<label class="field">
						<span class="label">Dienstgrad</span>
						<span class="rank-row">
							{#if isKnownRank(rank)}<img src="/dienstgrade/{rank}.png" alt="" width="50" height="50" />{/if}
							<select class="select" name="dienstgrad" bind:value={rank}>
								{#each DIENSTGRAD_GROUPS as g (g)}
									<optgroup label={g}>
										{#each DIENSTGRADE.filter((d) => d.group === g) as d (d.code)}
											<option value={d.code}>{d.code} – {d.name}</option>
										{/each}
									</optgroup>
								{/each}
							</select>
						</span>
					</label>
					<label class="check ehren">
						<input type="checkbox" name="ehren" bind:checked={honorary} />
						<span><span class="check-title">Ehrendienstgrad</span><br /><span class="hint">Wird als „{rankShort(rank, true)}“ angezeigt.</span></span>
					</label>
				</div>

				<div class="grid-2">
					<label class="field">
						<span class="label">Funktion <span class="opt">(optional)</span></span>
						<input class="input" name="funktion" value={m?.functionTitle ?? ''} maxlength="100" placeholder="z. B. Zugskommandant, Atemschutzwart" />
					</label>
					<label class="check ehren">
						<input type="checkbox" name="chargen" checked={m?.chargen ?? false} />
						<span><span class="check-title">Gehört zu den Chargen</span><br /><span class="hint">Eigener Abschnitt auf der Mannschaftsseite.</span></span>
					</label>
				</div>
			</section>

			<section class="card card-pad stack">
				<div>
					<h2 class="card-title">Kommando</h2>
					<p class="card-sub">Nur ausfüllen, wenn die Person zum Kommando gehört. Sie erscheint dann auf der Kommando-Seite.</p>
				</div>
				<div class="grid-2">
					<label class="field">
						<span class="label">Position im Kommando</span>
						<input class="input" name="kommandoPosition" bind:value={kommando} list="positionen" maxlength="80" placeholder="leer = nicht im Kommando" />
						<datalist id="positionen">{#each POSITIONS as p (p)}<option value={p}></option>{/each}</datalist>
					</label>
					<label class="field">
						<span class="label">Reihenfolge</span>
						<input class="input" type="number" name="kommandoSort" value={m?.kommandoSort ?? 0} min="0" max="99" disabled={!kommando} />
						<span class="hint">Kleinere Zahl steht weiter vorne.</span>
					</label>
				</div>
				{#if kommando}
					<label class="field">
						<span class="label">Kurzer Text <span class="opt">(optional)</span></span>
						<textarea class="textarea" name="kommandoText" rows="2" maxlength="600" placeholder="z. B. Seit 2021 Kommandant der Freiwilligen Feuerwehr Leopoldsdorf.">{m?.kommandoText ?? ''}</textarea>
					</label>
				{/if}
			</section>

			<label class="field narrow">
				<span class="label">Standesbuchnummer <span class="opt">(optional, nur intern)</span></span>
				<input class="input" name="standesbuch" value={m?.standesbuchNr ?? ''} maxlength="20" inputmode="numeric" />
			</label>
		</div>

		<aside class="stack">
			<section class="card card-pad stack privacy">
				<h2 class="card-title"><ShieldCheck size={18} /> Datenschutz</h2>
				<label class="check">
					<input type="checkbox" name="oeffentlich" bind:checked={visible} />
					<span><span class="check-title">Auf der Webseite zeigen</span><br /><span class="hint">Name, Dienstgrad und Funktion sind öffentlich sichtbar.</span></span>
				</label>
				<label class="check">
					<input type="checkbox" name="fotoFrei" bind:checked={photoOk} disabled={!visible} />
					<span><span class="check-title">Foto freigegeben</span><br /><span class="hint">Nur mit Einwilligung, bei Minderjährigen der Eltern.</span></span>
				</label>
				{#if status === 'jugend' && visible}
					<p class="alert alert-warn">Jugendmitglied: Bitte nur mit schriftlicher Einwilligung der Erziehungsberechtigten veröffentlichen.</p>
				{/if}
			</section>
			<section class="card card-pad">
				<ImageField name="foto" label="Foto" bind:value={photo} aspect="1 / 1" hint="Am besten ein Porträt im Hochformat, das Gesicht im oberen Drittel." />
			</section>
		</aside>
	</div>

	<SaveBar {busy} cancelHref="/admin/mitglieder" deleteConfirm={m ? `${m.firstName} ${m.lastName} wirklich löschen?` : ''} />
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
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}
	legend {
		margin-bottom: 0.35rem;
	}
	.rank-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.rank-row img {
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.ehren {
		align-self: end;
		padding-bottom: 0.3rem;
	}
	.narrow {
		max-width: 16rem;
	}
	.privacy .card-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
</style>
