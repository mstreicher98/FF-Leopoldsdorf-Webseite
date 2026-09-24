<script lang="ts">
	import { enhance } from '$app/forms';
	import Download from '@lucide/svelte/icons/download';
	import HardDrive from '@lucide/svelte/icons/hard-drive';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import { formatBytes, formatStamp } from '$lib/format';
	import { submitting } from '$lib/formEnhance';
	import type { MediaRef } from '$lib/media';

	let { data } = $props();
	const s = $derived(data.settings);
	let busy = $state(false);
	let backupBusy = $state(false);
	// svelte-ignore state_referenced_locally
	let hero = $state<MediaRef | null>(data.hero);
</script>

<svelte:head><title>Einstellungen | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Einstellungen</h1>
		<p class="page-sub">Angaben im Footer der Webseite und Sicherungen.</p>
	</div>
</div>

<form method="POST" action="?/speichern" use:enhance={submitting((b) => (busy = b))} class="stack">
	<div class="cols">
		<section class="card card-pad stack">
			<h2 class="card-title">Feuerwehr</h2>
			<label class="field"><span class="label">Name</span><input class="input" name="name" value={s.name} maxlength="100" /></label>
			<label class="field"><span class="label">Leitsatz auf der Startseite</span><input class="input" name="claim" value={s.claim} maxlength="160" /></label>
			<label class="field"><span class="label">Straße</span><input class="input" name="strasse" value={s.street} maxlength="100" /></label>
			<div class="grid-2">
				<label class="field"><span class="label">PLZ</span><input class="input" name="plz" value={s.zip} maxlength="10" /></label>
				<label class="field"><span class="label">Ort</span><input class="input" name="ort" value={s.city} maxlength="60" /></label>
			</div>
		</section>

		<section class="card card-pad stack">
			<h2 class="card-title">Kontakt</h2>
			<label class="field"><span class="label">E-Mail</span><input class="input" type="email" name="email" value={s.email} maxlength="120" /></label>
			<div class="grid-2">
				<label class="field"><span class="label">Telefon</span><input class="input" name="telefon" value={s.phone} maxlength="40" /></label>
				<label class="field"><span class="label">Hinweis</span><input class="input" name="telefonHinweis" value={s.phoneNote} maxlength="80" /></label>
			</div>
			<h2 class="card-title mt">Spendenkonto</h2>
			<div class="grid-2">
				<label class="field"><span class="label">IBAN</span><input class="input" name="iban" value={s.iban} maxlength="40" /></label>
				<label class="field"><span class="label">BIC</span><input class="input" name="bic" value={s.bic} maxlength="20" /></label>
			</div>
			<label class="field"><span class="label">Hinweis zu Spenden</span><input class="input" name="spendenHinweis" value={s.donationNote} maxlength="200" /></label>
		</section>

		<section class="card card-pad stack">
			<h2 class="card-title">Soziale Netzwerke</h2>
			<p class="hint">Leer lassen, um einen Link auszublenden.</p>
			<label class="field"><span class="label">Facebook</span><input class="input" type="url" name="facebook" value={s.facebook} placeholder="https://" /></label>
			<label class="field"><span class="label">Instagram</span><input class="input" type="url" name="instagram" value={s.instagram} placeholder="https://" /></label>
			<label class="field"><span class="label">YouTube</span><input class="input" type="url" name="youtube" value={s.youtube} placeholder="https://" /></label>
			<label class="field"><span class="label">X</span><input class="input" type="url" name="x" value={s.x} placeholder="https://" /></label>
		</section>

		<section class="card card-pad">
			<ImageField name="titelbild" label="Titelbild der Startseite" bind:value={hero} aspect="16 / 10" hint="Leer lassen für das Standardbild. Am besten ein Querformat mit ruhiger linker Bildhälfte – dort steht der Leitspruch." />
		</section>
	</div>
	<p class="hint">Impressum und Datenschutz enthalten Adresse und Kontakt als Text. Bitte bei Änderungen auch unter „Seiten“ anpassen.</p>
	<div class="actionbar">
		<button class="btn btn-primary" disabled={busy}>Einstellungen speichern</button>
	</div>
</form>

<section class="card card-pad backups">
	<div class="b-head">
		<div>
			<h2 class="card-title"><HardDrive size={18} /> Sicherungen</h2>
			<p class="card-sub">
				Jede Nacht ab 2 Uhr wird automatisch gesichert, die letzten 14 Stände bleiben am Server. Datenbank derzeit {formatBytes(data.sizes.db)}, Bilder {formatBytes(data.sizes.uploads)}.
			</p>
		</div>
		<form method="POST" action="?/sichern" use:enhance={submitting((b) => (backupBusy = b))}>
			<button class="btn" disabled={backupBusy}>{backupBusy ? 'Sichern …' : 'Jetzt sichern'}</button>
		</form>
	</div>
	{#if data.backups.length}
		<table class="table">
			<thead><tr><th>Stand</th><th>Datenbank</th><th>Bilder</th><th></th></tr></thead>
			<tbody>
				{#each data.backups as b (b.name)}
					<tr>
						<td>{formatStamp(b.createdAt)}</td>
						<td class="tabular">{formatBytes(b.dbSize)}</td>
						<td class="tabular">{b.images}</td>
						<td class="right"><a href="/admin/sicherung/{b.name}" class="btn btn-sm" download><Download size={15} /> Herunterladen</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="hint">Tipp: Ab und zu eine Sicherung herunterladen und zusätzlich an einem anderen Ort aufbewahren. Die Wiederherstellung ist in der Anleitung (README) beschrieben.</p>
	{:else}
		<p class="muted small">Noch keine Sicherung vorhanden.</p>
	{/if}
</section>

<style>
	.cols {
		display: grid;
		gap: 1rem;
	}
	@media (min-width: 1100px) {
		.cols {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
	.mt {
		margin-top: 0.5rem;
	}
	.backups {
		margin-top: 1.5rem;
	}
	.b-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.backups .card-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.right {
		text-align: right;
	}
	.table {
		margin-bottom: 0.75rem;
	}
</style>
