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

<!-- Niedrige Titelleiste: Titel links, Bild rechts in derselben Inhaltsbreite wie die Seite darunter -->
<section class="banner" class:has-image={!!image}>
	<div class="wrap inner">
		<div class="text" class:plate>
			{@render children?.()}
			<h1 class="display title">{title}</h1>
			{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
		</div>
		{#if image}
			<div class="media">
				{#if typeof image === 'string'}
					<img src={image} alt="" fetchpriority="high" />
				{:else}
					<img src={mediaSrc(image, 1200)} srcset={mediaSrcset(image)} sizes="(min-width: 1216px) 480px, (min-width: 768px) 40vw, 100vw" alt="" fetchpriority="high" />
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.banner {
		background: var(--c-surface-2);
		border-bottom: 1px solid var(--c-line);
	}
	.inner {
		display: grid;
	}
	.text {
		padding-block: 1.75rem 2rem;
	}
	/* Am Handy als Streifen über dem Titel, über die ganze Breite */
	.media {
		position: relative;
		order: -1;
		height: 9rem;
		margin-inline: -1rem;
		overflow: hidden;
		background: var(--c-night);
	}
	@media (min-width: 640px) {
		.media {
			margin-inline: -1.5rem;
		}
	}
	.media img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	@media (min-width: 768px) {
		.inner {
			min-height: 15rem;
		}
		.has-image .inner {
			grid-template-columns: minmax(0, 1fr) minmax(0, 40%);
			gap: 3rem;
		}
		.text {
			align-self: end;
			padding-block: 3rem 2.5rem;
		}
		/* bündig mit der rechten Inhaltskante, oben und unten an den Rand der Leiste */
		.media {
			order: 0;
			height: auto;
			margin-inline: 0;
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

	/* Hinweisschild: weiße Tafel mit rotem Rahmen und schmalem weißem Rand */
	.plate {
		align-self: center;
		justify-self: start;
		margin-block: 2rem;
		padding: 1.1rem 1.4rem 1.25rem;
		border: 4px solid var(--c-red);
		border-radius: 6px;
		background: #fff;
		box-shadow:
			0 0 0 4px #fff,
			0 0 0 5px var(--c-line-strong),
			var(--shadow-2);
	}
	.plate .title {
		color: var(--c-red);
		font-size: clamp(2.2rem, 5vw, 3.5rem);
	}
	.plate .subtitle {
		color: var(--c-ink);
	}
	@media (max-width: 767px) {
		.has-image .plate {
			position: relative;
			margin-top: -3.5rem;
		}
	}
</style>
