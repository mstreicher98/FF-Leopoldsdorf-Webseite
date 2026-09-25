<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import EinsatzChip from '$lib/components/site/EinsatzChip.svelte';
	import EventItem from '$lib/components/site/EventItem.svelte';
	import PostCard from '$lib/components/site/PostCard.svelte';
	import StatsBar from '$lib/components/site/StatsBar.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import { formatDay, formatTime } from '$lib/format';
	import { mediaSrc, mediaSrcset } from '$lib/media';

	let { data } = $props();

	const words = ['Retten', 'Schützen', 'Löschen', 'Bergen'];
	const last = $derived(data.lastEinsatz);
</script>

<Seo title={data.site.name} description="{data.site.claim}. Einsätze, Übungen, Termine und Bürgerservice der Freiwilligen Feuerwehr Leopoldsdorf." />

<section class="hero">
	{#if data.hero}
		<img src={mediaSrc(data.hero, 1600)} srcset={mediaSrcset(data.hero)} sizes="100vw" alt="" class="bg" fetchpriority="high" />
	{:else}
		<img src="/banner/einsatz.webp" alt="" class="bg" fetchpriority="high" />
	{/if}
	<div class="shade"></div>
	<div class="wrap inner">
		<!-- Leitspruch der österreichischen Feuerwehren -->
		<p class="motto display" aria-label="Retten, schützen, löschen, bergen">
			{#each words as w, i (w)}
				<span style:--i={i}>{w}</span>
			{/each}
		</p>
		<h1 class="org">{data.site.name}</h1>
		<p class="claim">{data.site.claim}</p>
		<div class="cta">
			<a href="/taetigkeiten/einsaetze" class="btn primary">Einsatzberichte lesen</a>
			<a href={data.joinHref} class="btn ghost">Mitglied werden</a>
		</div>
	</div>
</section>

{#if last}
	<a href="/beitrag/{last.slug}" class="last">
		<div class="wrap last-inner">
			<EinsatzChip code={last.einsatz?.code ?? null} group={last.einsatz?.group ?? null} label={last.einsatz?.label} size="md" />
			<div class="last-text">
				<span class="last-label">Letzter Einsatz</span>
				<span class="last-title">{last.title}</span>
				<span class="last-meta">
					{formatDay(last.date)}{#if last.time}, {formatTime(last.time)}{/if}{#if last.einsatz?.ort}<span class="sep">|</span>{last.einsatz.ort}{/if}
				</span>
			</div>
			<span class="last-more">Bericht lesen</span>
		</div>
	</a>
{/if}

{#if data.pinned.length}
	<section class="wrap block">
		<div class="pinned">
			{#each data.pinned as post (post.id)}
				<div class="pin-item">
					<p class="pin-label"><Pin size={15} /> Angeheftet</p>
					<PostCard {post} variant="feature" headingLevel={2} />
				</div>
			{/each}
		</div>
	</section>
{/if}

<section class="wrap block" aria-labelledby="aktuelles">
	<div class="sec-head">
		<h2 id="aktuelles" class="sec-title">Aktuelles</h2>
		{#if data.totalPosts > 0}<a href="/taetigkeiten" class="more">Alle Beiträge ansehen</a>{/if}
	</div>
	{#if data.latest.length}
		<div class="grid">
			{#each data.latest as post (post.id)}
				<PostCard {post} />
			{/each}
		</div>
	{:else if !data.pinned.length}
		<p class="empty">Hier erscheinen bald unsere ersten Berichte von Einsätzen, Übungen und Veranstaltungen.</p>
	{/if}
</section>

<section class="band footer-flush">
	<div class="wrap band-grid">
		<div>
			<div class="sec-head">
				<h2 class="sec-title">Einsätze {data.stats.year}</h2>
				<a href="/taetigkeiten/einsaetze" class="more">Zur Einsatzübersicht</a>
			</div>
			{#if data.stats.total > 0}
				<StatsBar stats={data.stats} note="Gezählt werden alle Einsätze des Jahres, auch solche ohne eigenen Bericht." />
			{:else}
				<p class="empty">Für {data.stats.year} sind noch keine Einsätze eingetragen.</p>
			{/if}
		</div>
		<div>
			<div class="sec-head">
				<h2 class="sec-title">Nächste Termine</h2>
				<a href="/termine" class="more">Alle Termine</a>
			</div>
			{#if data.upcoming.length}
				<ul class="events">
					{#each data.upcoming as event (event.id)}
						<li><EventItem {event} compact /></li>
					{/each}
				</ul>
			{:else}
				<p class="empty">Derzeit sind keine öffentlichen Termine geplant.</p>
			{/if}
		</div>
	</div>
</section>

<style>
	/* ---------------- Titelbild mit Leitspruch */
	.hero {
		position: relative;
		isolation: isolate;
		display: flex;
		align-items: flex-end;
		min-height: min(88svh, 48rem);
		background: var(--c-night);
		color: #fff;
		overflow: hidden;
	}
	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 60% 40%;
		z-index: -2;
	}
	.shade {
		position: absolute;
		inset: 0;
		z-index: -1;
		background:
			linear-gradient(to top, rgb(16 24 33 / 0.92) 0%, rgb(16 24 33 / 0.5) 42%, rgb(16 24 33 / 0.1) 75%),
			linear-gradient(to right, rgb(16 24 33 / 0.55), transparent 70%);
	}
	.inner {
		padding-top: 6rem;
		padding-bottom: 3rem;
	}
	@media (min-width: 768px) {
		.inner {
			padding-bottom: 4.5rem;
		}
	}
	.motto {
		display: flex;
		flex-direction: column;
		font-size: clamp(3.6rem, 13vw, 8.75rem);
		text-transform: uppercase;
		/* Platz für die Umlautpunkte von SCHÜTZEN und LÖSCHEN */
		line-height: 0.96;
	}
	.motto span {
		display: block;
		animation: rise 700ms var(--ease-out) both;
		animation-delay: calc(var(--i) * 110ms + 80ms);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(0.3em);
		}
	}
	.org {
		margin-top: 1.5rem;
		font-size: clamp(1.15rem, 2.4vw, 1.5rem);
		font-weight: 750;
		font-stretch: 80%;
		line-height: 1.2;
	}
	.claim {
		margin-top: 0.25rem;
		font-size: clamp(1rem, 2vw, 1.15rem);
		color: rgb(255 255 255 / 0.85);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 3rem;
		padding: 0 1.4rem;
		border-radius: 999px;
		font-weight: 700;
		text-decoration: none;
		transition:
			background-color 140ms,
			color 140ms;
	}
	.primary {
		background: var(--c-red);
		color: #fff;
	}
	.primary:hover {
		background: var(--c-red-deep);
	}
	.ghost {
		color: #fff;
		box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.8);
	}
	.ghost:hover {
		background: #fff;
		color: var(--c-night);
	}

	/* ---------------- Letzter Einsatz */
	.last {
		display: block;
		background: var(--c-night-2);
		color: #fff;
		text-decoration: none;
	}
	.last:hover {
		background: #33475f;
	}
	.last-inner {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-top: 1rem;
		padding-bottom: 1rem;
	}
	.last-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	.last-label {
		font-size: 0.8rem;
		color: rgb(255 255 255 / 0.65);
	}
	.last-title {
		font-weight: 750;
		font-stretch: 82%;
		font-size: 1.15rem;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.last-meta {
		font-size: 0.875rem;
		color: rgb(255 255 255 / 0.75);
	}
	.sep {
		margin: 0 0.5rem;
		opacity: 0.4;
	}
	.last-more {
		display: none;
		font-weight: 650;
		white-space: nowrap;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	@media (min-width: 640px) {
		.last-more {
			display: inline;
		}
	}

	/* ---------------- Abschnitte */
	.block {
		margin-top: 4rem;
	}
	.sec-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		margin-bottom: 1.5rem;
	}
	.sec-title {
		font-size: clamp(2rem, 4.5vw, 2.75rem);
		font-weight: 850;
		font-stretch: 66%;
		line-height: 1;
		text-transform: uppercase;
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
	.grid {
		display: grid;
		gap: 2.5rem 2rem;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	.empty {
		color: var(--c-ink-3);
		max-width: 50ch;
	}
	.pinned {
		display: grid;
		gap: 3rem;
	}
	.pin-label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		font-weight: 650;
		color: var(--c-red);
	}

	.band {
		margin-top: 5rem;
		padding: 3.5rem 0;
		background: var(--c-surface-2);
		border-top: 1px solid var(--c-line);
	}
	.band-grid {
		display: grid;
		gap: 3.5rem;
	}
	@media (min-width: 1024px) {
		.band-grid {
			grid-template-columns: 1fr 1fr;
			gap: 5rem;
		}
	}
	.events {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
</style>
