<script lang="ts">
	import { EINSATZ_GROUPS, GROUP_PLURAL } from '$lib/einsatz';
	import { formatNumber } from '$lib/format';

	interface Props {
		stats: { year: number; total: number; byGroup: Record<(typeof EINSATZ_GROUPS)[number], number> };
		/** Überschrift, z. B. "Einsätze 2026" – leer lassen, wenn sie außen steht */
		heading?: string;
		note?: string;
	}

	let { stats, heading = '', note = '' }: Props = $props();

	const groups = $derived(EINSATZ_GROUPS.filter((g) => stats.byGroup[g] > 0));
</script>

<div class="stats">
	<div class="head">
		<p class="total"><span class="num">{formatNumber(stats.total)}</span> <span class="unit">{stats.total === 1 ? 'Einsatz' : 'Einsätze'}</span></p>
		{#if heading}<p class="year">{heading}</p>{/if}
	</div>

	{#if stats.total > 0}
		<!-- Anteil je Einsatzart als durchgehender Balken -->
		<div class="bar" role="img" aria-label={groups.map((g) => `${GROUP_PLURAL[g]}: ${stats.byGroup[g]}`).join(', ')}>
			{#each groups as g (g)}
				<span class="seg" data-group={g} style:flex-grow={stats.byGroup[g]} title="{GROUP_PLURAL[g]}: {stats.byGroup[g]}"></span>
			{/each}
		</div>
		<ul class="legend">
			{#each groups as g (g)}
				<li><span class="dot" data-group={g}></span>{GROUP_PLURAL[g]} <strong>{stats.byGroup[g]}</strong></li>
			{/each}
		</ul>
	{/if}
	{#if note}<p class="note">{note}</p>{/if}
</div>

<style>
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.total {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.num {
		font-size: clamp(3.5rem, 8vw, 5rem);
		font-weight: 850;
		font-stretch: 62%;
		line-height: 0.9;
		font-variant-numeric: tabular-nums;
		color: var(--c-red);
	}
	.unit {
		font-size: 1.35rem;
		font-weight: 750;
		font-stretch: 78%;
	}
	.year {
		color: var(--c-ink-3);
		font-weight: 600;
	}
	/* Anteile als ein Balken: 2px Fläche zwischen den Segmenten, 4px runde Enden */
	.bar {
		display: flex;
		gap: 2px;
		height: 14px;
		margin-top: 1rem;
	}
	.seg {
		flex-basis: 0;
		min-width: 6px;
	}
	.seg:first-child {
		border-radius: 4px 0 0 4px;
	}
	.seg:last-child {
		border-radius: 0 4px 4px 0;
	}
	.seg:only-child {
		border-radius: 4px;
	}
	[data-group='brand'] {
		background: var(--c-brand);
	}
	[data-group='technik'] {
		background: var(--c-technik);
	}
	[data-group='schadstoff'] {
		background: var(--c-schadstoff);
	}
	[data-group='sonstiges'] {
		background: var(--c-sonstiges);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		margin-top: 0.85rem;
		font-size: 0.9rem;
		color: var(--c-ink-2);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}
	.legend strong {
		color: var(--c-ink);
		font-variant-numeric: tabular-nums;
	}
	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 2px;
	}
	.note {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--c-ink-3);
	}
</style>
