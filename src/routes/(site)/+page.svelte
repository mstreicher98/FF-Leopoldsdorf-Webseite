<script lang="ts">
	import Pin from '@lucide/svelte/icons/pin';
	import Depesche from '$lib/components/site/Depesche.svelte';
	import Einsatzbuch from '$lib/components/site/Einsatzbuch.svelte';
	import EventItem from '$lib/components/site/EventItem.svelte';
	import PostCard from '$lib/components/site/PostCard.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import Strichliste from '$lib/components/site/Strichliste.svelte';
	import { mediaSrc, mediaSrcset } from '$lib/media';

	let { data } = $props();

	const words = ['Retten', 'Schützen', 'Löschen', 'Bergen'];
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
		<div class="lead">
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
		{#if data.lastEinsatz}
			<div class="dep">
				<Depesche post={data.lastEinsatz} />
			</div>
		{/if}
	</div>
</section>

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

<section class="wrap block" aria-label="Einsätze {data.stats.year}">
	<Strichliste
		year={data.stats.year}
		ticks={data.ticks}
		byGroup={data.stats.byGroup}
		total={data.stats.total}
		more={{ href: '/taetigkeiten/einsaetze', label: 'Zur Einsatzübersicht' }}
		note="Jeder Strich ist ein Einsatz, auch wenn es dazu keinen eigenen Bericht gibt. Brandsicherheitswachen zählen nicht mit."
	/>
</section>

<div class="wrap block split">
	<section aria-labelledby="buch">
		<div class="sec-head">
			<h2 id="buch" class="sec-title">Letzte Einsätze</h2>
			<a href="/taetigkeiten/einsaetze" class="more">Alle Einsätze</a>
		</div>
		{#if data.einsaetze.length}
			<Einsatzbuch posts={data.einsaetze} />
		{:else}
			<p class="empty">Hier erscheinen die Berichte von unseren Einsätzen.</p>
		{/if}
	</section>

	<section aria-labelledby="termine">
		<div class="sec-head">
			<h2 id="termine" class="sec-title">Termine</h2>
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
	</section>
</div>

{#if data.others.length}
	<section class="band footer-flush" aria-labelledby="abseits">
		<div class="wrap">
			<div class="sec-head">
				<h2 id="abseits" class="sec-title">Abseits der Einsätze</h2>
				<a href="/taetigkeiten" class="more">Alle Beiträge</a>
			</div>
			<div class="grid">
				{#each data.others as post (post.id)}
					<PostCard {post} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	/* ---------------- Titelbild mit Leitspruch und letztem Einsatz */
	.hero {
		position: relative;
		isolation: isolate;
		display: flex;
		align-items: flex-end;
		min-height: min(82svh, 46rem);
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
			linear-gradient(to top, rgb(16 24 33 / 0.94) 0%, rgb(16 24 33 / 0.55) 45%, rgb(16 24 33 / 0.12) 78%),
			linear-gradient(to right, rgb(16 24 33 / 0.6), transparent 70%);
	}
	.inner {
		display: grid;
		gap: 2.5rem;
		align-items: end;
		padding-top: 6rem;
		padding-bottom: 2.5rem;
	}
	@media (min-width: 1024px) {
		.inner {
			grid-template-columns: minmax(0, 1fr) 23rem;
			gap: 3rem;
			padding-bottom: 3.5rem;
		}
	}
	.motto {
		display: flex;
		flex-direction: column;
		font-size: clamp(3.6rem, 12vw, 8.25rem);
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
	@media (prefers-reduced-motion: reduce) {
		.motto span {
			animation: none;
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
	.dep :global(.depesche) {
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.12),
			var(--shadow-3);
	}

	/* ---------------- Abschnitte */
	.block {
		margin-top: 3.5rem;
	}
	@media (min-width: 768px) {
		.block {
			margin-top: 4.5rem;
		}
	}
	.sec-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		margin-bottom: 1.25rem;
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
	.split {
		display: grid;
		gap: 3.5rem;
	}
	@media (min-width: 1024px) {
		.split {
			grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
			gap: 4rem;
		}
	}
	.events {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding-top: 1.1rem;
		border-top: 2px solid var(--c-ink);
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
		padding-block: 3.5rem;
		background: var(--c-surface-2);
		border-top: 1px solid var(--c-line);
	}
	.grid {
		display: grid;
		gap: 2.5rem 2rem;
	}
	.band .grid :global(.card) {
		background: transparent;
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
</style>
