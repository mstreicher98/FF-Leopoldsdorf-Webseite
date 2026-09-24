<script lang="ts">
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import FilePlus from '@lucide/svelte/icons/file-plus';
	import Siren from '@lucide/svelte/icons/siren';
	import ViewsChart from '$lib/components/admin/ViewsChart.svelte';
	import EventItem from '$lib/components/site/EventItem.svelte';
	import StatsBar from '$lib/components/site/StatsBar.svelte';
	import { CATEGORIES } from '$lib/categories';
	import { formatNumber, relativeTime } from '$lib/format';

	let { data } = $props();

	const ENTITY_LINK: Record<string, string> = {
		beitrag: '/admin/beitraege',
		termin: '/admin/termine',
		mitglied: '/admin/mitglieder',
		fahrzeug: '/admin/fahrzeuge',
		seite: '/admin/seiten'
	};
	const ENTITY_LABEL: Record<string, string> = {
		beitrag: 'Beitrag',
		termin: 'Termin',
		mitglied: 'Mitglied',
		fahrzeug: 'Fahrzeug',
		seite: 'Seite',
		bild: 'Bild',
		benutzer: 'Benutzer',
		einstellungen: 'Einstellungen',
		einsatzart: 'Einsatzart'
	};
</script>

<svelte:head><title>Übersicht | FF Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Hallo {data.me.name.split(' ')[0]}</h1>
		<p class="page-sub">Was gibt es Neues bei der Feuerwehr?</p>
	</div>
	<div class="quick">
		<a href="/admin/beitraege/neu?kategorie=einsatz" class="btn btn-primary"><Siren size={18} /> Einsatzbericht</a>
		<a href="/admin/beitraege/neu" class="btn"><FilePlus size={18} /> Beitrag</a>
		<a href="/admin/termine/neu" class="btn"><CalendarPlus size={18} /> Termin</a>
	</div>
</div>

<div class="tiles">
	<div class="card card-pad tile">
		<p class="t-label">Aufrufe in 30 Tagen</p>
		<p class="t-value">{formatNumber(data.viewsTotal)}</p>
	</div>
	<div class="card card-pad tile">
		<p class="t-label">Beiträge {data.year}</p>
		<p class="t-value">{formatNumber(data.counts.published)}</p>
	</div>
	<div class="card card-pad tile">
		<p class="t-label">Mitglieder</p>
		<p class="t-value">{formatNumber(data.counts.members)}</p>
	</div>
	<div class="card card-pad tile">
		<p class="t-label">Fahrzeuge im Dienst</p>
		<p class="t-value">{formatNumber(data.counts.vehicles)}</p>
	</div>
</div>

<div class="cols">
	<section class="card card-pad span-2">
		<h2 class="card-title">Seitenaufrufe</h2>
		<p class="card-sub">Letzte 30 Tage, ohne angemeldete Redakteure und ohne Suchmaschinen</p>
		<div class="chart"><ViewsChart data={data.views} /></div>
	</section>

	<section class="card card-pad">
		<h2 class="card-title">Meistgelesen</h2>
		<p class="card-sub">Letzte 30 Tage</p>
		{#if data.top.length}
			<ol class="top">
				{#each data.top as t (t.path)}
					<li>
						<a href={t.path} target="_blank" rel="noopener" class="top-title">{t.title === '/' ? 'Startseite' : t.title}</a>
						<span class="tabular muted">{formatNumber(t.n)}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="muted small mt">Noch keine Aufrufe gezählt.</p>
		{/if}
	</section>

	<section class="card card-pad">
		<h2 class="card-title">Einsätze {data.year}</h2>
		<div class="mt">
			{#if data.stats.total}
				<StatsBar stats={data.stats} />
			{:else}
				<p class="muted small">Noch keine Einsatzberichte für {data.year} veröffentlicht.</p>
			{/if}
		</div>
	</section>

	<section class="card card-pad">
		<h2 class="card-title">Entwürfe</h2>
		{#if data.drafts.length}
			<ul class="list">
				{#each data.drafts as d (d.id)}
					<li>
						<a href="/admin/beitraege/{d.id}" class="row-link">{d.title}</a>
						<span class="muted small">{CATEGORIES[d.category].label}, {relativeTime(d.updatedAt)}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted small mt">Keine offenen Entwürfe.</p>
		{/if}
	</section>

	<section class="card card-pad">
		<h2 class="card-title">Nächste Termine</h2>
		{#if data.events.length}
			<ul class="list events">
				{#each data.events as e (e.id)}
					<li><a href="/admin/termine/{e.id}" class="plain"><EventItem event={e} compact /></a></li>
				{/each}
			</ul>
		{:else}
			<p class="muted small mt">Keine Termine geplant. <a href="/admin/termine/neu">Termin anlegen</a></p>
		{/if}
	</section>

	<section class="card card-pad span-2">
		<h2 class="card-title">Letzte Änderungen</h2>
		{#if data.actions.length}
			<ul class="list">
				{#each data.actions as a (a.id)}
					<li class="action">
						<span>
							<strong>{a.userName ?? 'Gelöschter Benutzer'}</strong>
							hat {ENTITY_LABEL[a.entity] ?? a.entity}
							{#if ENTITY_LINK[a.entity] && a.entityId && a.action !== 'gelöscht'}
								<a href="{ENTITY_LINK[a.entity]}/{a.entityId}">„{a.label}“</a>
							{:else}
								„{a.label}“
							{/if}
							{a.action}
						</span>
						<span class="muted small nowrap">{relativeTime(a.createdAt)}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted small mt">Noch keine Änderungen.</p>
		{/if}
	</section>
</div>

<style>
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	@media (min-width: 900px) {
		.tiles {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1rem;
		}
	}
	.t-label {
		font-size: 0.85rem;
		color: var(--c-ink-3);
	}
	.t-value {
		margin-top: 0.2rem;
		font-size: 2rem;
		font-weight: 800;
		font-stretch: 72%;
		line-height: 1;
	}
	/* minmax(0, …): Karten nie breiter als der Bildschirm, auch mit Diagramm und langen Titeln */
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}
	@media (min-width: 1100px) {
		.cols {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.span-2 {
			grid-column: span 2;
		}
	}
	.chart {
		margin-top: 1rem;
	}
	.mt {
		margin-top: 0.9rem;
	}
	.top {
		margin-top: 0.75rem;
	}
	.top li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.45rem 0;
		border-bottom: 1px solid var(--c-line);
	}
	.top li:last-child {
		border-bottom: 0;
	}
	.top-title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--c-ink);
		text-decoration: none;
	}
	.top-title:hover {
		text-decoration: underline;
	}
	.list {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
	}
	.list li {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--c-line);
	}
	.list li:last-child {
		border-bottom: 0;
	}
	.list .action {
		flex-direction: row;
		justify-content: space-between;
		gap: 1rem;
	}
	.action a {
		color: var(--c-ink);
	}
	.nowrap {
		white-space: nowrap;
	}
	.events li {
		padding: 0.7rem 0;
	}
	.plain {
		color: inherit;
		text-decoration: none;
	}
	.plain:hover :global(.title) {
		color: var(--c-red);
	}
</style>
