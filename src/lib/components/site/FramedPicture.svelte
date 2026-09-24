<script lang="ts" module>
	/** Querformat zwischen diesen Seitenverhältnissen füllt den Rahmen; alles andere wird ganz gezeigt */
	export const FILL_MIN = 1.25;
	export const FILL_MAX = 2.2;

	export function fillsFrame(m: { width: number; height: number }): boolean {
		const r = m.width && m.height ? m.width / m.height : 1.5;
		return r >= FILL_MIN && r <= FILL_MAX;
	}
</script>

<script lang="ts">
	import { mediaSrc, type MediaRef } from '$lib/media';
	import Picture from './Picture.svelte';

	interface Props {
		media: MediaRef;
		sizes?: string;
		want?: number;
		eager?: boolean;
		alt?: string;
		class?: string;
	}

	let { media, sizes, want, eager = false, alt, class: cls = '' }: Props = $props();

	/*
	 * Füllt den umgebenden Rahmen. Hochformat, Quadrat und sehr breite Banner
	 * werden nicht beschnitten, sondern ganz gezeigt – davor eine unscharfe,
	 * abgedunkelte Fassung desselben Bildes, damit keine leeren Balken entstehen.
	 */
	const fill = $derived(fillsFrame(media));
</script>

<div class="frame {cls}" class:whole={!fill}>
	{#if !fill}
		<img class="backdrop" src={mediaSrc(media, 400)} alt="" aria-hidden="true" loading="lazy" decoding="async" />
	{/if}
	<Picture {media} {sizes} {want} {eager} {alt} class="pic" />
</div>

<style>
	.frame {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--c-surface-3);
	}
	.backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(22px) saturate(1.15) brightness(0.72);
		transform: scale(1.2);
	}
	.frame :global(.pic) {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.whole :global(.pic) {
		object-fit: contain;
	}
</style>
