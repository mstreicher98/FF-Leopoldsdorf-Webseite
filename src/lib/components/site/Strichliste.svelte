<script lang="ts">
	import { EINSATZ_GROUPS, GROUP_PLURAL, type EinsatzGroup } from '$lib/einsatz';
	import { formatDay, formatNumber, monthShort, todayVienna, weekdayShort } from '$lib/format';
	import type { EinsatzTick } from '$lib/types';

	interface Props {
		year: number;
		ticks: EinsatzTick[];
		byGroup: Record<EinsatzGroup, number>;
		total: number;
		headingLevel?: 2 | 3;
		/** Link rechts neben der Überschrift, z. B. zur Einsatzübersicht */
		more?: { href: string; label: string };
		note?: string;
	}

	let { year, ticks, byGroup, total, headingLevel = 2, more, note = '' }: Props = $props();

	const today = todayVienna();
	const current = $derived(String(year) === today.slice(0, 4));

	/* Eine Spalte je Monat, gleich breit: die Zeitachse bleibt maßstabsgetreu,
	   auch wenn ein Monat (Sturm, Hochwasser) viel mehr Einsätze hat als andere */
	const months = $derived.by(() => {
		let i = 0;
		return Array.from({ length: 12 }, (_, m) => {
			const mm = String(m + 1).padStart(2, '0');
			const items = ticks.filter((t) => t.date.slice(5, 7) === mm).map((t) => ({ ...t, i: i++ }));
			return { mm, label: monthShort(`${year}-${mm}-01`), items, future: `${year}-${mm}` > today.slice(0, 7) };
		});
	});
	const flat = $derived(months.flatMap((m) => m.items));
	const groups = $derived(EINSATZ_GROUPS.filter((g) => byGroup[g] > 0));
	const summary = $derived(`${total} ${total === 1 ? 'Einsatz' : 'Einsätze'} ${year}: ${groups.map((g) => `${GROUP_PLURAL[g]} ${byGroup[g]}`).join(', ')}`);

	/* ---------- Hinweis beim Überfahren bzw. ersten Antippen eines Strichs */
	let box: HTMLElement | undefined = $state();
	let active = $state<{ i: number; x: number } | null>(null);
	let pointer = $state('mouse');
	const tip = $derived(active ? flat[active.i] : null);

	function locate(el: HTMLElement) {
		if (!box) return;
		const r = el.getBoundingClientRect();
		const b = box.getBoundingClientRect();
		// Hinweis bleibt innerhalb des Kastens
		const x = Math.min(Math.max(r.left + r.width / 2 - b.left, 96), b.width - 96);
		active = { i: Number(el.dataset.i), x };
	}
	const tickOf = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>('[data-i]');

	function over(e: PointerEvent) {
		pointer = e.pointerType;
		if (e.pointerType !== 'mouse') return;
		const el = tickOf(e);
		if (el) locate(el);
	}
	function click(e: MouseEvent) {
		const el = tickOf(e);
		if (!el) return;
		// Am Handy zeigt das erste Antippen den Einsatz, das zweite öffnet den Bericht
		if (pointer !== 'mouse' && active?.i !== Number(el.dataset.i)) {
			e.preventDefault();
			locate(el);
		}
	}
	function outside(e: PointerEvent) {
		if (active && box && !box.contains(e.target as Node)) active = null;
	}

	const shortDay = (d: string) => `${weekdayShort(d)}, ${d.slice(8, 10)}.${d.slice(5, 7)}.`;
</script>

<svelte:window onpointerdown={outside} />

<div class="tally">
	<div class="head">
		<svelte:element this={`h${headingLevel}`} class="title">
			<span class="num">{formatNumber(total)}</span>
			<span class="label">{total === 1 ? 'Einsatz' : 'Einsätze'} {current ? `bis ${formatDay(today).replace(` ${year}`, '')}` : `im Jahr ${year}`}</span>
		</svelte:element>
		{#if more}<a href={more.href} class="more">{more.label}</a>{/if}
	</div>

	<div class="strip" bind:this={box} onpointerover={over} onpointerleave={() => pointer === 'mouse' && (active = null)} onclickcapture={click} role="img" aria-label={summary}>
		{#each months as m (m.mm)}
			<div class="month" class:future={m.future && !m.items.length}>
				<div class="ticks" aria-hidden="true">
					{#each m.items as t (t.i)}
						{#if t.slug}
							<a href="/beitrag/{t.slug}" class="t" data-group={t.group} data-i={t.i} class:on={active?.i === t.i} tabindex="-1" aria-label={t.title}></a>
						{:else}
							<span class="t" data-group={t.group} data-i={t.i} class:on={active?.i === t.i}></span>
						{/if}
					{/each}
				</div>
				<span class="m" aria-hidden="true">{m.label}</span>
			</div>
		{/each}

		{#if tip && active}
			<div class="tip" style:left="{active.x}px" aria-hidden="true">
				<span class="tip-when">{shortDay(tip.date)}{#if tip.time}, {tip.time} Uhr{/if}</span>
				<span class="tip-what"><b data-group={tip.group}>{tip.code ?? 'E'}</b> {tip.title}</span>
				<span class="tip-hint">{tip.slug ? (pointer === 'mouse' ? 'Klicken für den Bericht' : 'Nochmals tippen für den Bericht') : 'Ohne öffentlichen Bericht'}</span>
			</div>
		{/if}
	</div>

	<ul class="legend">
		{#each groups as g (g)}
			<li><span class="key" data-group={g}></span>{GROUP_PLURAL[g]} <strong>{byGroup[g]}</strong></li>
		{/each}
	</ul>
	{#if note}<p class="note">{note}</p>{/if}
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
	}
	.title {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
	}
	.num {
		font-size: clamp(3.25rem, 7vw, 4.5rem);
		font-weight: 850;
		font-stretch: 62%;
		line-height: 0.85;
		color: var(--c-red);
		font-variant-numeric: tabular-nums;
	}
	.label {
		font-size: clamp(1.15rem, 2.4vw, 1.45rem);
		font-weight: 750;
		font-stretch: 78%;
		line-height: 1.1;
	}
	.more {
		font-weight: 650;
		color: var(--c-red);
		text-decoration: none;
	}
	.more:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ---------------- Strichliste: zwölf gleich breite Monate, Striche wachsen von der Grundlinie */
	.strip {
		position: relative;
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 0 0.3rem;
		margin-top: 1.5rem;
	}
	@media (min-width: 768px) {
		.strip {
			gap: 0 0.6rem;
		}
	}
	.month {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.ticks {
		display: flex;
		align-items: flex-end;
		gap: 1px;
		height: 2.75rem;
		border-bottom: 2px solid var(--c-ink);
	}
	@media (min-width: 768px) {
		.ticks {
			gap: 2px;
			height: 3.5rem;
		}
	}
	.future .ticks {
		border-bottom: 2px dotted var(--c-line-strong);
	}
	.t {
		flex: 0 1 5px;
		min-width: 1px;
		height: 100%;
		border-radius: 1px 1px 0 0;
		transition: transform 120ms var(--ease-out);
		transform-origin: bottom;
	}
	.t.on {
		transform: scaleY(1.12);
	}
	a.t {
		cursor: pointer;
	}
	.m {
		margin-top: 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--c-ink-3);
		white-space: nowrap;
		overflow: hidden;
	}
	@media (min-width: 640px) {
		.m {
			font-size: 0.85rem;
		}
	}
	.future .m {
		color: var(--c-line-strong);
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

	.tip {
		position: absolute;
		bottom: calc(100% - 0.25rem);
		z-index: 5;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		width: max-content;
		max-width: min(17rem, 80vw);
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		background: var(--c-night);
		color: #fff;
		box-shadow: var(--shadow-2);
		transform: translateX(-50%);
		pointer-events: none;
		font-size: 0.875rem;
		line-height: 1.3;
	}
	.tip-when {
		font-weight: 650;
		font-variant-numeric: tabular-nums;
		color: rgb(255 255 255 / 0.75);
	}
	.tip-what {
		font-weight: 650;
	}
	.tip-what b {
		display: inline-block;
		margin-right: 0.3rem;
		padding: 0 0.3rem;
		border-radius: 3px;
		font-weight: 800;
		font-stretch: 75%;
		color: #fff;
	}
	.tip-what b[data-group='schadstoff'] {
		color: var(--c-night);
	}
	.tip-hint {
		font-size: 0.8rem;
		color: rgb(255 255 255 / 0.6);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		margin-top: 1.25rem;
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
	.key {
		width: 4px;
		height: 1rem;
		border-radius: 1px;
	}
	.note {
		margin-top: 0.6rem;
		font-size: 0.85rem;
		color: var(--c-ink-3);
	}

	@media (prefers-reduced-motion: reduce) {
		.t {
			transition: none;
		}
	}
</style>
