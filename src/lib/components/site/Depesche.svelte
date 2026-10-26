<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { GROUP_LABELS } from '$lib/einsatz';
	import { weekdayShort } from '$lib/format';
	import type { PostSummary, VehicleRef } from '$lib/types';
	import EinsatzChip from './EinsatzChip.svelte';

	let { post }: { post: PostSummary & { vehicles: VehicleRef[] } } = $props();

	const e = $derived(post.einsatz);
	const day = $derived(`${post.date.slice(8, 10)}.${post.date.slice(5, 7)}.`);
</script>

<!-- Der letzte Einsatz wie auf dem Einsatzmonitor im Feuerwehrhaus -->
<article class="depesche" data-group={e?.group ?? 'sonstiges'}>
	<header class="top">
		<span>Letzter Einsatz</span>
		{#if e?.nummer}<span class="nr">Nr. {e.nummer}</span>{/if}
	</header>

	<div class="alarm">
		<EinsatzChip code={e?.code ?? null} group={e?.group ?? null} label={e?.label} size="lg" />
		<p class="when">
			<span class="wd">{weekdayShort(post.date)}</span>
			<time datetime={post.date + (post.time ? `T${post.time}` : '')}>
				<span class="day">{day}</span>{#if post.time}<span class="clock">{post.time}</span>{/if}
			</time>
		</p>
	</div>

	<h2 class="what"><a href="/beitrag/{post.slug}">{post.title}</a></h2>
	{#if e?.label && e.label !== post.title}<p class="art">{e.label}</p>{:else if !e?.label && e?.group}<p class="art">{GROUP_LABELS[e.group]}</p>{/if}

	{#if e?.ort}
		<p class="where"><MapPin size={16} strokeWidth={2.25} /> {e.ort}</p>
	{/if}
	{#if post.vehicles.length}
		<ul class="veh" aria-label="Ausgerückt">
			{#each post.vehicles as v (v.id)}
				<li>{v.shortName || v.name}</li>
			{/each}
		</ul>
	{/if}
	<span class="read" aria-hidden="true">Bericht lesen</span>
</article>

<style>
	.depesche {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 1.1rem 1.25rem 1.25rem;
		border-top: 6px solid var(--c-brand);
		border-radius: 10px;
		background: var(--c-night);
		color: #fff;
		box-shadow: var(--shadow-3);
	}
	.depesche[data-group='technik'] {
		border-top-color: var(--c-technik);
	}
	.depesche[data-group='schadstoff'] {
		border-top-color: var(--c-schadstoff);
	}
	.depesche[data-group='sonstiges'] {
		border-top-color: var(--c-sonstiges);
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.85rem;
		font-weight: 650;
		color: rgb(255 255 255 / 0.7);
	}
	.nr {
		font-variant-numeric: tabular-nums;
	}
	.alarm {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.85rem;
	}
	.when {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}
	.wd {
		font-size: 0.85rem;
		font-weight: 650;
		color: rgb(255 255 255 / 0.7);
	}
	time {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		margin-top: 0.2rem;
		font-size: clamp(2rem, 4vw, 2.6rem);
		font-weight: 800;
		font-stretch: 64%;
		font-variant-numeric: tabular-nums;
	}
	.clock {
		color: #ffd9d4;
	}
	.what {
		margin-top: 1rem;
		font-size: 1.4rem;
		font-weight: 750;
		font-stretch: 80%;
		line-height: 1.15;
		text-wrap: balance;
	}
	.what a {
		color: inherit;
		text-decoration: none;
	}
	/* ganze Depesche klickbar */
	.what a::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.what a:focus-visible {
		outline: none;
	}
	.what a:focus-visible::after {
		outline: 2.5px solid #fff;
		outline-offset: 3px;
	}
	.art {
		margin-top: 0.2rem;
		font-size: 0.9rem;
		color: rgb(255 255 255 / 0.7);
	}
	.where {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.75rem;
		font-weight: 600;
	}
	.veh {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.75rem;
	}
	.veh li {
		padding: 0.1rem 0.45rem;
		border: 1px solid rgb(255 255 255 / 0.4);
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 750;
		font-stretch: 78%;
	}
	.read {
		align-self: flex-start;
		margin-top: 1.1rem;
		font-weight: 650;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.depesche:hover .read {
		text-decoration-thickness: 2px;
	}
</style>
