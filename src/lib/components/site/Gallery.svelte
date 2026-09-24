<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import { mediaSrc, mediaSrcset, type MediaRef } from '$lib/media';
	import Picture from './Picture.svelte';

	interface Props {
		images: MediaRef[];
		label?: string;
		/** So viele Bilder am Anfang nur in der Großansicht, ohne Vorschau (z. B. das Titelbild) */
		skip?: number;
	}

	let { images, label = 'Bilder', skip = 0 }: Props = $props();

	let dialog: HTMLDialogElement;
	let index = $state(0);
	let startX = 0;

	const current = $derived(images[index]);
	const thumbs = $derived(images.slice(skip));
	// Seitenverhältnis für die Zeilen; extreme Formate leicht beschnitten
	const ratio = (m: MediaRef) => Math.min(2.2, Math.max(0.6, m.width && m.height ? m.width / m.height : 1.5));

	export function openAt(i: number) {
		index = i;
		dialog.showModal();
	}
	const step = (d: number) => (index = (index + d + images.length) % images.length);

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') step(1);
		else if (e.key === 'ArrowLeft') step(-1);
	}
	function onDown(e: PointerEvent) {
		startX = e.clientX;
	}
	function onUp(e: PointerEvent) {
		const dx = e.clientX - startX;
		if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
	}
	// Klick auf den dunklen Hintergrund schließt
	function onBackdrop(e: MouseEvent) {
		if (e.target === dialog) dialog.close();
	}
</script>

{#if thumbs.length}
	<!-- Bilder in Zeilen gleicher Höhe, jedes im eigenen Format (Hochformat bleibt Hochformat) -->
	<ul class="grid" aria-label={label}>
		{#each thumbs as img, i (img.id)}
			<li style:--r={ratio(img)}>
				<button type="button" class="thumb" onclick={() => openAt(i + skip)} aria-label="Bild {i + skip + 1} von {images.length} vergrößern">
					<Picture media={img} sizes="(min-width: 1024px) 420px, (min-width: 640px) 40vw, 60vw" want={400} class="img" />
				</button>
			</li>
		{/each}
	</ul>
{/if}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="lightbox" aria-label="Bildansicht" onkeydown={onKey} onclick={onBackdrop}>
	{#if current}
		<figure onpointerdown={onDown} onpointerup={onUp}>
			<img src={mediaSrc(current, 1600)} srcset={mediaSrcset(current)} sizes="100vw" alt={current.alt} width={current.width} height={current.height} />
			<figcaption>
				<span class="tabular">{index + 1} / {images.length}</span>
				{#if current.alt}<span>{current.alt}</span>{/if}
			</figcaption>
		</figure>
		{#if images.length > 1}
			<button type="button" class="nav prev" onclick={() => step(-1)} aria-label="Vorheriges Bild"><ChevronLeft size={30} /></button>
			<button type="button" class="nav next" onclick={() => step(1)} aria-label="Nächstes Bild"><ChevronRight size={30} /></button>
		{/if}
		<button type="button" class="close" onclick={() => dialog.close()} aria-label="Schließen"><X size={26} /></button>
	{/if}
</dialog>

<style>
	/* Blocksatz-Galerie: Breite wächst mit dem Seitenverhältnis, so bleibt die Zeilenhöhe gleich */
	.grid {
		--h: 6.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	/* hält die letzte Zeile in normaler Höhe statt sie auf volle Breite zu ziehen */
	.grid::after {
		content: '';
		flex: 999 1 0;
	}
	@media (min-width: 640px) {
		.grid {
			--h: 11rem;
		}
	}
	@media (min-width: 1024px) {
		.grid {
			--h: 13rem;
		}
	}
	li {
		flex: var(--r) 1 calc(var(--r) * var(--h));
		min-width: 0;
	}
	.thumb {
		display: block;
		width: 100%;
		aspect-ratio: var(--r);
		overflow: hidden;
		border-radius: 8px;
		background: var(--c-surface-3);
	}
	.thumb :global(.img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 300ms var(--ease-out);
	}
	.thumb:hover :global(.img) {
		transform: scale(1.04);
	}

	.lightbox {
		width: 100vw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: rgb(10 14 19 / 0.96);
		color: #fff;
	}
	.lightbox::backdrop {
		background: transparent;
	}
	figure {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 3.5rem 1rem 1rem;
		touch-action: pan-y;
		user-select: none;
	}
	figure img {
		max-width: 100%;
		max-height: calc(100dvh - 7rem);
		width: auto;
		height: auto;
		object-fit: contain;
	}
	figcaption {
		display: flex;
		gap: 1rem;
		margin-top: 0.75rem;
		font-size: 0.9rem;
		color: rgb(255 255 255 / 0.75);
	}
	.nav,
	.close {
		position: absolute;
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.12);
		color: #fff;
	}
	.nav:hover,
	.close:hover {
		background: rgb(255 255 255 / 0.24);
	}
	.nav {
		top: 50%;
		transform: translateY(-50%);
	}
	.prev {
		left: 0.75rem;
	}
	.next {
		right: 0.75rem;
	}
	.close {
		top: 0.75rem;
		right: 0.75rem;
	}
</style>
