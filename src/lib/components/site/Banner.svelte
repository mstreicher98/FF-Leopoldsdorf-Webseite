<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mediaSrc, mediaSrcset, type MediaRef } from '$lib/media';

	interface Props {
		title: string;
		subtitle?: string;
		/** Statischer Pfad oder Bild aus der Mediathek */
		image: string | MediaRef | null;
		children?: Snippet;
	}

	let { title, subtitle = '', image, children }: Props = $props();
</script>

<section class="banner">
	{#if image}
		{#if typeof image === 'string'}
			<img src={image} alt="" class="bg" fetchpriority="high" />
		{:else}
			<img src={mediaSrc(image, 1600)} srcset={mediaSrcset(image)} sizes="100vw" alt="" class="bg" fetchpriority="high" />
		{/if}
	{/if}
	<div class="shade"></div>
	<div class="wrap content">
		{@render children?.()}
		<h1 class="display title">{title}</h1>
		{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
	</div>
</section>

<style>
	.banner {
		position: relative;
		isolation: isolate;
		display: flex;
		align-items: flex-end;
		min-height: 15rem;
		background: var(--c-night);
		color: #fff;
		overflow: hidden;
	}
	@media (min-width: 768px) {
		.banner {
			min-height: 21rem;
		}
	}
	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: -2;
	}
	.shade {
		position: absolute;
		inset: 0;
		z-index: -1;
		background:
			linear-gradient(to top, rgb(16 24 33 / 0.88) 0%, rgb(16 24 33 / 0.45) 45%, rgb(16 24 33 / 0.15) 100%),
			linear-gradient(to right, rgb(16 24 33 / 0.35), transparent 60%);
	}
	.content {
		padding-top: 4rem;
		padding-bottom: 2rem;
	}
	@media (min-width: 768px) {
		.content {
			padding-bottom: 2.75rem;
		}
	}
	.title {
		font-size: clamp(2.6rem, 7vw, 4.75rem);
		text-transform: uppercase;
		max-width: 18ch;
	}
	.subtitle {
		margin-top: 0.75rem;
		max-width: 52ch;
		font-size: clamp(1rem, 2vw, 1.2rem);
		color: rgb(255 255 255 / 0.88);
		line-height: 1.45;
	}
</style>
