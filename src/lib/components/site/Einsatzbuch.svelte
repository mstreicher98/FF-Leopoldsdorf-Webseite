<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { weekdayShort } from '$lib/format';
	import type { PostSummary } from '$lib/types';
	import EinsatzChip from './EinsatzChip.svelte';
	import Picture from './Picture.svelte';

	interface Props {
		posts: PostSummary[];
		headingLevel?: 2 | 3;
		/** Jahreszahl als Trennzeile, wenn die Liste über den Jahreswechsel reicht */
		years?: boolean;
	}

	let { posts, headingLevel = 3, years = false }: Props = $props();

	const rows = $derived(posts.map((p, i) => ({ p, year: years && (i === 0 || posts[i - 1].date.slice(0, 4) !== p.date.slice(0, 4)) ? p.date.slice(0, 4) : null })));
</script>

<!-- Einsätze untereinander wie im Einsatzbuch: Alarmzeit, Einsatzart, Stichwort, Ort -->
<ol class="buch">
	{#each rows as { p, year } (p.id)}
		{#if year}
			<li class="year" aria-hidden="true">{year}</li>
		{/if}
		<li class="row" data-group={p.einsatz?.group ?? 'sonstiges'}>
			<p class="when">
				<time datetime={p.date}>
					<span class="day">{p.date.slice(8, 10)}.{p.date.slice(5, 7)}.</span>
					<span class="wd">{weekdayShort(p.date)}{#if p.time}, {p.time}{/if}</span>
				</time>
			</p>
			<div class="code">
				<EinsatzChip code={p.einsatz?.code ?? null} group={p.einsatz?.group ?? null} label={p.einsatz?.label} size="md" />
			</div>
			<div class="text">
				<svelte:element this={`h${headingLevel}`} class="title">
					<a href="/beitrag/{p.slug}">{p.title}</a>
				</svelte:element>
				<p class="meta">
					{#if p.einsatz?.ort}<span class="ort"><MapPin size={14} strokeWidth={2.25} />{p.einsatz.ort}</span>{/if}
					{#if p.einsatz?.nummer}<span class="nr">Nr. {p.einsatz.nummer}</span>{/if}
				</p>
			</div>
			{#if p.cover}
				<div class="thumb"><Picture media={p.cover} sizes="9rem" want={320} alt="" class="img" /></div>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.buch {
		border-top: 2px solid var(--c-ink);
	}
	.year {
		padding: 1.25rem 0 0.4rem;
		font-size: 1.5rem;
		font-weight: 850;
		font-stretch: 64%;
		color: var(--c-ink-3);
		font-variant-numeric: tabular-nums;
		border-bottom: 1px solid var(--c-line);
	}
	.row {
		position: relative;
		display: grid;
		grid-template-columns: 3.6rem minmax(0, 1fr) 4.5rem;
		grid-template-areas:
			'when text thumb'
			'code text thumb';
		gap: 0.35rem 0.9rem;
		align-items: start;
		padding: 0.9rem 0;
		border-bottom: 1px solid var(--c-line);
	}
	@media (min-width: 640px) {
		.row {
			grid-template-columns: 5.5rem 3rem minmax(0, 1fr) 7.5rem;
			grid-template-areas: 'when code text thumb';
			gap: 1.1rem;
			align-items: center;
			padding: 0.85rem 0.5rem 0.85rem 0;
		}
	}
	.row:hover {
		background: var(--c-surface-2);
	}
	.when {
		grid-area: when;
		line-height: 1.05;
	}
	time {
		display: flex;
		flex-direction: column;
	}
	.day {
		font-size: 1.35rem;
		font-weight: 800;
		font-stretch: 66%;
		font-variant-numeric: tabular-nums;
	}
	.wd {
		margin-top: 0.15rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--c-ink-3);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	@media (min-width: 640px) {
		.row {
			padding-left: 0.5rem;
		}
		.day {
			font-size: 1.6rem;
		}
		.wd {
			font-size: 0.85rem;
		}
	}
	.code {
		grid-area: code;
	}
	.text {
		grid-area: text;
		min-width: 0;
	}
	.title {
		font-size: 1.15rem;
		font-weight: 750;
		font-stretch: 82%;
		line-height: 1.2;
		text-wrap: balance;
	}
	@media (min-width: 640px) {
		.title {
			font-size: 1.3rem;
		}
	}
	.title a {
		color: var(--c-ink);
		text-decoration: none;
	}
	.title a::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.row:hover .title a {
		color: var(--c-red);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 1rem;
		margin-top: 0.3rem;
		font-size: 0.875rem;
		color: var(--c-ink-3);
	}
	.ort {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--c-ink-2);
		font-weight: 550;
	}
	.nr {
		font-variant-numeric: tabular-nums;
	}
	.thumb {
		grid-area: thumb;
		aspect-ratio: 3 / 2;
		overflow: hidden;
		border-radius: 6px;
	}
	/* kleines Vorschaubild: zuschneiden statt ganz zeigen */
	.thumb :global(.img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: var(--c-surface-3);
	}
</style>
