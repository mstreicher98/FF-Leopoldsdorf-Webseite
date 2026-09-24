<script lang="ts">
	import { CATEGORIES } from '$lib/categories';
	import { formatDay } from '$lib/format';
	import type { PostSummary } from '$lib/types';
	import EinsatzChip from './EinsatzChip.svelte';
	import FramedPicture from './FramedPicture.svelte';

	interface Props {
		post: PostSummary;
		/** feature = groß mit Bild links, compact = ohne Vorschautext */
		variant?: 'default' | 'feature' | 'compact';
		headingLevel?: 2 | 3;
	}

	let { post, variant = 'default', headingLevel = 3 }: Props = $props();

	const cat = $derived(CATEGORIES[post.category]);
	const sizes = $derived(variant === 'feature' ? '(min-width: 1024px) 700px, 100vw' : '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw');
</script>

<article class="card {variant}">
	<div class="media">
		{#if post.cover}
			<FramedPicture media={post.cover} {sizes} want={variant === 'feature' ? 1600 : 800} />
		{:else}
			<img src={cat.banner} alt="" class="img fallback" loading="lazy" />
		{/if}
	</div>
	<div class="body">
		<div class="meta">
			{#if post.einsatz}
				<EinsatzChip code={post.einsatz.code} group={post.einsatz.group} label={post.einsatz.label} />
				{#if post.einsatz.nummer}<span class="nr">Einsatz {post.einsatz.nummer}</span>{:else}<span class="nr">Einsatz</span>{/if}
			{:else}
				<span class="cat">{cat.label}</span>
			{/if}
			<time datetime={post.date}>{formatDay(post.date)}</time>
		</div>
		<svelte:element this={`h${headingLevel}`} class="title">
			<a href="/beitrag/{post.slug}">{post.title}</a>
		</svelte:element>
		{#if variant !== 'compact' && post.excerpt}
			<p class="excerpt">{post.excerpt}</p>
		{/if}
	</div>
</article>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--c-surface);
	}
	.media {
		aspect-ratio: 3 / 2;
		overflow: hidden;
		border-radius: 10px;
		background: var(--c-surface-3);
	}
	.media :global(.img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.media :global(.img),
	.media :global(.pic) {
		transition: transform 400ms var(--ease-out);
	}
	.media :global(.fallback) {
		filter: grayscale(0.6) brightness(0.8);
	}
	.card:hover .media :global(.img),
	.card:hover .media :global(.pic) {
		transform: scale(1.03);
	}
	.body {
		padding-top: 0.9rem;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 0.75rem;
		font-size: 0.875rem;
		color: var(--c-ink-3);
	}
	.nr {
		font-weight: 650;
		color: var(--c-ink-2);
		font-variant-numeric: tabular-nums;
	}
	.cat {
		font-weight: 650;
		color: var(--c-red);
	}
	.title {
		margin-top: 0.4rem;
		font-size: 1.35rem;
		line-height: 1.12;
		font-weight: 750;
		font-stretch: 78%;
		text-wrap: balance;
	}
	.title a {
		color: var(--c-ink);
		text-decoration: none;
	}
	/* Ganze Karte klickbar */
	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.card:hover .title a {
		color: var(--c-red);
	}
	.excerpt {
		margin-top: 0.5rem;
		color: var(--c-ink-2);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.compact .title {
		font-size: 1.15rem;
	}

	@media (min-width: 768px) {
		.feature {
			display: grid;
			grid-template-columns: 1.35fr 1fr;
			gap: 2rem;
			align-items: center;
		}
		.feature .body {
			padding-top: 0;
		}
		.feature .title {
			font-size: clamp(1.8rem, 3vw, 2.5rem);
			font-weight: 800;
			font-stretch: 70%;
			line-height: 1.02;
		}
		.feature .excerpt {
			font-size: 1.0625rem;
			-webkit-line-clamp: 4;
			line-clamp: 4;
		}
	}
</style>
