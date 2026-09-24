<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import SaveBar from '$lib/components/admin/SaveBar.svelte';
	import { formatDayShort, todayVienna } from '$lib/format';
	import { submitting } from '$lib/formEnhance';

	let { data } = $props();
	let busy = $state(false);
	const e = $derived(data.event);
</script>

<svelte:head><title>{e ? e.title : 'Neuer Termin'} | FF Intern</title></svelte:head>

<a href="/admin/termine" class="back"><ArrowLeft size={16} /> Termine</a>
<div class="page-head">
	<h1 class="page-title">{e ? 'Termin bearbeiten' : 'Neuer Termin'}</h1>
</div>

<form method="POST" action="?/speichern" use:enhance={submitting((b) => (busy = b))} class="form">
	<div class="card card-pad stack">
		<label class="field">
			<span class="label">Titel</span>
			<input class="input" name="titel" value={e?.title ?? ''} required maxlength="160" placeholder="z. B. Feuerwehrheuriger" />
		</label>
		<div class="grid-2">
			<label class="field">
				<span class="label">Beginn</span>
				<input class="input" type="date" name="beginn" value={e?.startDate ?? todayVienna()} required />
			</label>
			<label class="field">
				<span class="label">Uhrzeit <span class="opt">(leer = ganztägig)</span></span>
				<input class="input" type="time" name="beginnZeit" value={e?.startTime ?? ''} />
			</label>
			<label class="field">
				<span class="label">Ende <span class="opt">(bei mehrtägigen Terminen)</span></span>
				<input class="input" type="date" name="ende" value={e?.endDate ?? ''} />
			</label>
			<label class="field">
				<span class="label">bis <span class="opt">(Uhrzeit, optional)</span></span>
				<input class="input" type="time" name="endeZeit" value={e?.endTime ?? ''} />
			</label>
		</div>
		<label class="field">
			<span class="label">Ort</span>
			<input class="input" name="ort" value={e?.location ?? ''} maxlength="160" placeholder="z. B. Feuerwehrhaus Leopoldsdorf" />
		</label>
		<label class="field">
			<span class="label">Beschreibung <span class="opt">(optional)</span></span>
			<textarea class="textarea" name="beschreibung" rows="4" maxlength="2000">{e?.description ?? ''}</textarea>
		</label>
		<label class="field">
			<span class="label">Bericht verknüpfen <span class="opt">(optional, z. B. nach der Veranstaltung)</span></span>
			<select class="select" name="beitrag" value={e?.postId ?? ''}>
				<option value="">– kein Bericht –</option>
				{#each data.recentPosts as p (p.id)}<option value={p.id}>{formatDayShort(p.date)}: {p.title}</option>{/each}
			</select>
		</label>
	</div>
	<SaveBar {busy} cancelHref="/admin/termine" deleteConfirm={e ? 'Diesen Termin löschen?' : ''} />
</form>

<style>
	.form {
		max-width: 44rem;
	}
</style>
