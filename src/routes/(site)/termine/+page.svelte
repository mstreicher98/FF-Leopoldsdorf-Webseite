<script lang="ts">
	import { page } from '$app/state';
	import CalendarSync from '@lucide/svelte/icons/calendar-sync';
	import Banner from '$lib/components/site/Banner.svelte';
	import EventItem from '$lib/components/site/EventItem.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import { monthYear } from '$lib/format';
	import type { EventView } from '$lib/types';

	let { data } = $props();

	/** Nach Monat gruppiert: "Oktober 2026" → Termine */
	const months = $derived.by(() => {
		const out: { label: string; items: EventView[] }[] = [];
		for (const e of data.upcoming) {
			const label = monthYear(e.startDate);
			const last = out[out.length - 1];
			if (last?.label === label) last.items.push(e);
			else out.push({ label, items: [e] });
		}
		return out;
	});
	const webcal = $derived(`webcal://${page.url.host}/termine.ics`);
</script>

<Seo title="Termine" description="Veranstaltungen und öffentliche Termine der Freiwilligen Feuerwehr Leopoldsdorf" />

<Banner title="Termine" subtitle="Feste, Übungen mit Publikum und alles, wozu wir Sie einladen" image="/banner/termine.webp" />

<div class="wrap layout">
	<div>
		{#if months.length}
			{#each months as m (m.label)}
				<section class="month">
					<h2 class="month-title">{m.label}</h2>
					<ul class="list">
						{#each m.items as event (event.id)}
							<li><EventItem {event} /></li>
						{/each}
					</ul>
				</section>
			{/each}
		{:else}
			<p class="empty">Derzeit sind keine öffentlichen Termine geplant. Schauen Sie bald wieder vorbei.</p>
		{/if}

		{#if data.past.length}
			<details class="past">
				<summary>Vergangene Termine</summary>
				<ul class="list">
					{#each data.past as event (event.id)}
						<li><EventItem {event} compact /></li>
					{/each}
				</ul>
			</details>
		{/if}
	</div>

	<aside class="subscribe">
		<CalendarSync size={26} />
		<h2>Termine im eigenen Kalender</h2>
		<p>Abonnieren Sie unseren Kalender. Neue Termine erscheinen dann automatisch am Handy oder am Computer.</p>
		<a href={webcal} class="btn">Kalender abonnieren</a>
		<a href="/termine.ics" class="alt">Als Datei herunterladen (.ics)</a>
	</aside>
</div>

<style>
	.layout {
		display: grid;
		gap: 3rem;
		margin-top: 3rem;
	}
	@media (min-width: 1024px) {
		.layout {
			grid-template-columns: 1fr 20rem;
			gap: 4rem;
			align-items: start;
		}
	}
	.month + .month {
		margin-top: 3rem;
	}
	.month-title {
		padding-bottom: 0.6rem;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid var(--c-night);
		font-size: 1.6rem;
		font-weight: 800;
		font-stretch: 70%;
		text-transform: uppercase;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	.empty {
		color: var(--c-ink-3);
		font-size: 1.1rem;
	}
	.past {
		margin-top: 3.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--c-line);
	}
	.past summary {
		cursor: pointer;
		font-weight: 700;
		margin-bottom: 1.5rem;
	}
	.subscribe {
		padding: 1.5rem;
		border-radius: 14px;
		background: var(--c-surface-2);
		border: 1px solid var(--c-line);
		color: var(--c-ink-2);
	}
	@media (min-width: 1024px) {
		.subscribe {
			position: sticky;
			top: 6.5rem;
		}
	}
	.subscribe :global(svg) {
		color: var(--c-red);
	}
	.subscribe h2 {
		margin-top: 0.75rem;
		font-size: 1.25rem;
		font-weight: 750;
		font-stretch: 80%;
		color: var(--c-ink);
	}
	.subscribe p {
		margin-top: 0.5rem;
		font-size: 0.95rem;
	}
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 2.75rem;
		margin-top: 1.25rem;
		border-radius: 999px;
		background: var(--c-red);
		color: #fff;
		font-weight: 700;
		text-decoration: none;
	}
	.btn:hover {
		background: var(--c-red-deep);
	}
	.alt {
		display: block;
		margin-top: 0.75rem;
		text-align: center;
		font-size: 0.9rem;
		color: var(--c-ink-2);
	}
</style>
