<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mediaSrc, mediaSrcset, type MediaRef } from '$lib/media';

	interface Props {
		title: string;
		subtitle?: string;
		/** Statischer Pfad oder Bild aus der Mediathek */
		image: string | MediaRef | null;
		/** Titel als Hinweisschild (weiße Tafel, roter Rahmen), etwa für den Bürgerservice */
		plate?: boolean;
		children?: Snippet;
	}

	let { title, subtitle = '', image, plate = false, children }: Props = $props();
</script>

<!-- Titelleiste: Foto über die ganze Breite, Titel darauf -->
<section class="banner" class:has-image={!!image}>
	{#if image}
		{#if typeof image === 'string'}
			<img src={image} alt="" class="bg" fetchpriority="high" />
		{:else}
			<img src={mediaSrc(image, 1600)} srcset={mediaSrcset(image)} sizes="100vw" alt="" class="bg" fetchpriority="high" />
		{/if}
		<div class="shade"></div>
	{/if}
	<div class="wrap content">
		<div class="text" class:plate>
			{@render children?.()}
			<h1 class="display title">{title}</h1>
			{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
		</div>
	</div>
</section>

<style>
	.banner {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		background: var(--c-surface-2);
		border-bottom: 1px solid var(--c-line);
	}
	.has-image {
		background: var(--c-night);
		color: #fff;
		border-bottom: 0;
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
			linear-gradient(to top, rgb(16 24 33 / 0.85) 0%, rgb(16 24 33 / 0.4) 55%, rgb(16 24 33 / 0.15) 100%),
			linear-gradient(to right, rgb(16 24 33 / 0.55), transparent 65%);
	}
	.content {
		display: flex;
		align-items: flex-end;
		min-height: 16rem;
		padding-block: 3rem 2rem;
	}
	@media (min-width: 768px) {
		.content {
			min-height: 23rem;
			padding-block: 4rem 3rem;
		}
	}
	.title {
		font-size: clamp(2.5rem, 6vw, 4.25rem);
		text-transform: uppercase;
		color: var(--c-night);
	}
	.subtitle {
		margin-top: 0.7rem;
		max-width: 48ch;
		font-size: clamp(1rem, 1.8vw, 1.15rem);
		line-height: 1.45;
		color: var(--c-ink-2);
	}
	.has-image .title {
		color: #fff;
	}
	.has-image .subtitle {
		color: rgb(255 255 255 / 0.88);
	}

	/* Hinweisschild: weiße Tafel mit rotem Rahmen und schmalem weißem Rand */
	.plate {
		padding: 1.1rem 1.4rem 1.25rem;
		border: 4px solid var(--c-red);
		border-radius: 6px;
		background: #fff;
		box-shadow:
			0 0 0 4px #fff,
			0 0 0 5px var(--c-line-strong),
			var(--shadow-2);
	}
	.text.plate .title {
		color: var(--c-red);
		font-size: clamp(2.2rem, 5vw, 3.5rem);
	}
	.text.plate .subtitle {
		color: var(--c-ink);
	}
</style>
