<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import { formatDayShort, weekdayShort } from '$lib/format';
	import type { Event } from '$lib/server/db/schema';

	let { data } = $props();

	const when = (e: Event) =>
		`${weekdayShort(e.startDate)}, ${formatDayShort(e.startDate)}${e.startTime ? `, ${e.startTime}` : ''}${e.endDate && e.endDate !== e.startDate ? ` bis ${formatDayShort(e.endDate)}` : ''}`;
</script>

<svelte:head><title>Termine | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Termine</h1>
		<p class="page-sub">Öffentliche Termine erscheinen auf der Webseite und im abonnierbaren Kalender.</p>
	</div>
	<a href="/admin/termine/neu" class="btn btn-primary"><Plus size={18} /> Termin</a>
</div>

{#snippet list(items: Event[])}
	<ul class="rows">
		{#each items as e (e.id)}
			<li>
				<a href="/admin/termine/{e.id}" class="row">
					<span class="title">{e.title}</span>
					<span class="muted small">{when(e)}{e.location ? `, ${e.location}` : ''}</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<section class="card">
	<h2 class="card-title pad">Kommende Termine</h2>
	{#if data.upcoming.length}
		{@render list(data.upcoming)}
	{:else}
		<p class="empty">Keine kommenden Termine.</p>
	{/if}
</section>

{#if data.past.length}
	<section class="card past">
		<h2 class="card-title pad">Vergangene Termine</h2>
		{@render list(data.past)}
	</section>
{/if}

<style>
	.pad {
		padding: 1rem 1rem 0.5rem;
	}
	.past {
		margin-top: 1rem;
		opacity: 0.85;
	}
	.rows li {
		border-top: 1px solid var(--c-line);
	}
	.row {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.75rem 1rem;
		color: inherit;
		text-decoration: none;
	}
	.row:hover {
		background: var(--c-surface-2);
	}
	.title {
		font-weight: 650;
	}
</style>
