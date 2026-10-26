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

<!-- Niedrige Titelleiste: Titel links, Bild rechts – der Inhalt beginnt gleich darunter -->
<section class="banner" class:has-image={!!image}>
	{#if image}
		<div class="media">
			{#if typeof image === 'string'}
				<img src={image} alt="" fetchpriority="high" />
			{:else}
				<img src={mediaSrc(image, 1200)} srcset={mediaSrcset(image)} sizes="(min-width: 768px) 42vw, 100vw" alt="" fetchpriority="high" />
			{/if}
		</div>
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
		background: var(--c-surface-2);
		border-bottom: 1px solid var(--c-line);
	}
	.media {
		height: 9rem;
		overflow: hidden;
		background: var(--c-night);
	}
	.media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.content {
		padding-top: 1.75rem;
		padding-bottom: 2rem;
	}
	@media (min-width: 768px) {
		.media {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			width: 42%;
			height: auto;
		}
		.content {
			display: flex;
			align-items: flex-end;
			min-height: 15rem;
			padding-top: 3rem;
			padding-bottom: 2.5rem;
		}
		.has-image .text {
			max-width: 54%;
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
			margin-top: -3.5rem;
			position: relative;
		}
	}
</style>
