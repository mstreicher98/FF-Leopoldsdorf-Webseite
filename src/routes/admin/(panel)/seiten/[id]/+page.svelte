<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import ImageField from '$lib/components/admin/ImageField.svelte';
	import RichEditor from '$lib/components/admin/RichEditor.svelte';
	import SaveBar from '$lib/components/admin/SaveBar.svelte';
	import { submitting } from '$lib/formEnhance';
	import type { MediaRef } from '$lib/media';

	let { data } = $props();

	const p = $derived(data.page);
	let busy = $state(false);
	// svelte-ignore state_referenced_locally
	let banner = $state<MediaRef | null>(data.banner);
	const url = $derived(p ? (p.section === 'rechtliches' ? `/${p.slug}` : `/${p.section}/${p.slug}`) : '');
</script>

<svelte:head><title>{p ? p.title : 'Neue Seite'} | FF Intern</title></svelte:head>

<a href="/admin/seiten" class="back"><ArrowLeft size={16} /> Seiten</a>
<div class="page-head">
	<h1 class="page-title">{p ? p.title : 'Neue Seite'}</h1>
	{#if p}<a href={url} target="_blank" rel="noopener" class="btn btn-sm">Ansehen <ExternalLink size={14} /></a>{/if}
</div>

{#if p?.slug === 'datenschutz' || p?.slug === 'impressum'}
	<p class="alert alert-info note">
		Dieser Text wurde als Vorlage nach österreichischem Recht erstellt. Bitte vor der Veröffentlichung prüfen lassen, zum Beispiel über den NÖ Landesfeuerwehrverband.
	</p>
{/if}

<form method="POST" action="?/speichern" use:enhance={submitting((b) => (busy = b))}>
	<div class="layout">
		<div class="stack">
			<section class="card card-pad stack">
				<label class="field">
					<span class="label">Titel</span>
					<input class="input" name="titel" value={p?.title ?? ''} required maxlength="100" />
				</label>
				<label class="field">
					<span class="label">Untertitel <span class="opt">(steht unter dem Titel im Bild)</span></span>
					<input class="input" name="untertitel" value={p?.subtitle ?? ''} maxlength="200" />
				</label>
				{#if !p}
					<!-- Neue Seiten erscheinen im Menü „Bürgerservice“ -->
					<label class="field">
						<span class="label">Adresse <span class="opt">(leer = aus dem Titel)</span></span>
						<input class="input" name="adresse" maxlength="60" placeholder="z. B. hochwasser" />
					</label>
				{/if}
			</section>

			<div class="field">
				<span class="label">Inhalt</span>
				<RichEditor name="inhalt" value={p?.contentHtml ?? ''} />
			</div>
		</div>

		<aside class="stack">
			{#if p?.section !== 'rechtliches'}
				<section class="card card-pad stack">
					<label class="field">
						<span class="label">Text im Menü</span>
						<input class="input" name="menutext" value={p?.menuText ?? ''} maxlength="120" placeholder="Kurze Beschreibung unter dem Menüpunkt" />
					</label>
					<label class="field">
						<span class="label">Reihenfolge im Menü</span>
						<input class="input" type="number" name="reihenfolge" value={p?.sortOrder ?? 0} min="0" max="99" />
					</label>
				</section>
			{:else}
				<input type="hidden" name="reihenfolge" value={p.sortOrder} />
			{/if}
			<section class="card card-pad">
				<ImageField name="banner" label="Titelbild" bind:value={banner} aspect="21 / 9" hint="Leer lassen für das Standardbild." />
			</section>
		</aside>
	</div>

	<SaveBar {busy} cancelHref="/admin/seiten" deleteConfirm={p && !p.system ? `Die Seite „${p.title}“ löschen?` : ''} />
</form>

<style>
	.note {
		margin-bottom: 1rem;
	}
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
</style>
