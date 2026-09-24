<script lang="ts">
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { dayOfMonth, formatDay, monthShort, weekdayShort } from '$lib/format';
	import type { EventView } from '$lib/types';

	let { event, compact = false }: { event: EventView; compact?: boolean } = $props();

	/** "3. Oktober 2026, 12:00 bis 12:45 Uhr" bzw. "10. Oktober 2026, 14:00 Uhr bis 11. Oktober 2026" */
	const when = $derived.by(() => {
		const e = event;
		const start = formatDay(e.startDate);
		if (e.endDate && e.endDate !== e.startDate) {
			const from = e.startTime ? `${start}, ${e.startTime} Uhr` : start;
			const to = e.endTime ? `${formatDay(e.endDate)}, ${e.endTime} Uhr` : formatDay(e.endDate);
			return `${from} bis ${to}`;
		}
		if (e.startTime && e.endTime) return `${start}, ${e.startTime} bis ${e.endTime} Uhr`;
		if (e.startTime) return `${start}, ab ${e.startTime} Uhr`;
		return `${start}, ganztägig`;
	});
</script>

<article class="event" class:compact>
	<!-- Kalenderblatt -->
	<div class="sheet" aria-hidden="true">
		<span class="wd">{weekdayShort(event.startDate)}</span>
		<span class="d">{dayOfMonth(event.startDate)}</span>
		<span class="m">{monthShort(event.startDate)}</span>
	</div>
	<div class="info">
		<h3 class="title">{event.title}</h3>
		<p class="when"><time datetime={event.startDate}>{when}</time></p>
		{#if event.location}
			<p class="where"><MapPin size={15} /> {event.location}</p>
		{/if}
		{#if !compact && event.description}
			<p class="desc">{event.description}</p>
		{/if}
		{#if !compact}
			<p class="links">
				<a href="/termine/{event.id}.ics" download><CalendarPlus size={15} /> In meinen Kalender</a>
				{#if event.postSlug}<a href="/beitrag/{event.postSlug}">Bericht lesen</a>{/if}
			</p>
		{/if}
	</div>
</article>

<style>
	.event {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	.sheet {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 4.25rem;
		flex-shrink: 0;
		border-radius: 8px;
		overflow: hidden;
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		box-shadow: var(--shadow-1);
		text-align: center;
		line-height: 1;
	}
	.wd {
		width: 100%;
		padding: 0.3rem 0;
		background: var(--c-red);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
	}
	.d {
		padding-top: 0.35rem;
		font-size: 1.9rem;
		font-weight: 850;
		font-stretch: 65%;
		font-variant-numeric: tabular-nums;
	}
	.m {
		padding: 0.15rem 0 0.45rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--c-ink-3);
	}
	.title {
		font-size: 1.2rem;
		font-weight: 750;
		font-stretch: 80%;
		line-height: 1.2;
	}
	.when,
	.where {
		margin-top: 0.25rem;
		font-size: 0.925rem;
		color: var(--c-ink-2);
	}
	.where {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.desc {
		margin-top: 0.5rem;
		white-space: pre-line;
		color: var(--c-ink-2);
		max-width: 60ch;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: 0.6rem;
		font-size: 0.9rem;
	}
	.links a {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--c-red);
		font-weight: 600;
		text-decoration: none;
	}
	.links a:hover {
		text-decoration: underline;
	}
	.compact .title {
		font-size: 1.1rem;
	}
</style>
