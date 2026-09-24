<script lang="ts">
	import Banner from '$lib/components/site/Banner.svelte';
	import MemberCard from '$lib/components/site/MemberCard.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import { dienstgrad } from '$lib/dienstgrade';
	import type { MemberView } from '$lib/types';

	let { data } = $props();

	const byRank = (a: MemberView, b: MemberView) =>
		dienstgrad(b.rank).order - dienstgrad(a.rank).order || a.lastName.localeCompare(b.lastName, 'de');

	const sections = $derived([
		{
			id: 'kommando',
			title: 'Kommando',
			items: data.visible.filter((m) => m.kommandoPosition).sort((a, b) => a.kommandoSort - b.kommandoSort),
			hidden: data.hidden.kommando
		},
		{
			id: 'chargen',
			title: 'Chargen',
			text: 'Funktionärinnen und Funktionäre mit besonderen Aufgaben',
			items: data.visible.filter((m) => !m.kommandoPosition && m.chargen && m.status !== 'jugend').sort(byRank),
			hidden: data.hidden.chargen
		},
		{
			id: 'aktiv',
			title: 'Aktive Mannschaft',
			items: data.visible.filter((m) => !m.kommandoPosition && !m.chargen && m.status === 'aktiv'),
			hidden: data.hidden.aktiv
		},
		{
			id: 'reserve',
			title: 'Reserve',
			items: data.visible.filter((m) => !m.kommandoPosition && !m.chargen && m.status === 'reserve'),
			hidden: data.hidden.reserve
		},
		{
			id: 'jugend',
			title: 'Feuerwehrjugend',
			items: data.visible.filter((m) => !m.kommandoPosition && m.status === 'jugend'),
			hidden: data.hidden.jugend
		}
	]);
</script>

<Seo title="Mannschaft" description="Die Mitglieder der Freiwilligen Feuerwehr Leopoldsdorf" />

<Banner
	title="Mannschaft"
	subtitle={data.total > 1
		? `${data.total} Frauen und Männer, die in Leopoldsdorf helfen, wenn es darauf ankommt`
		: 'Die Frauen und Männer, die in Leopoldsdorf helfen, wenn es darauf ankommt'}
	image="/banner/mannschaft.webp"
/>

<div class="wrap">
	{#if data.total === 0}
		<p class="empty">Die Mitgliederliste wird gerade aufgebaut.</p>
	{/if}
	{#each sections as s (s.id)}
		{#if s.items.length || s.hidden}
			<section class="section" aria-labelledby="sec-{s.id}">
				<div class="head">
					<h2 id="sec-{s.id}" class="title">{s.title}</h2>
					<p class="count">{s.items.length + s.hidden} {s.items.length + s.hidden === 1 ? 'Mitglied' : 'Mitglieder'}</p>
				</div>
				{#if s.items.length}
					<ul class="grid">
						{#each s.items as m (m.id)}
							<li><MemberCard member={m} /></li>
						{/each}
					</ul>
				{/if}
				{#if s.hidden}
					<p class="hidden-note">
						{#if s.items.length}Dazu {s.hidden === 1 ? 'kommt ein weiteres Mitglied' : `kommen ${s.hidden} weitere Mitglieder`}, die nicht namentlich genannt werden möchten.
						{:else}{s.hidden === 1 ? 'Ein Mitglied' : `${s.hidden} Mitglieder`} – aus Datenschutzgründen ohne Namen.{/if}
					</p>
				{/if}
			</section>
		{/if}
	{/each}
</div>

<style>
	.section {
		margin-top: 3.5rem;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.6rem;
		margin-bottom: 1.75rem;
		border-bottom: 2px solid var(--c-night);
	}
	.title {
		font-size: clamp(1.7rem, 4vw, 2.2rem);
		font-weight: 850;
		font-stretch: 66%;
		text-transform: uppercase;
		line-height: 1;
	}
	.count {
		color: var(--c-ink-3);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2rem 1.25rem;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 900px) {
		.grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (min-width: 1200px) {
		.grid {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
	.hidden-note {
		margin-top: 1.5rem;
		color: var(--c-ink-3);
	}
	.empty {
		margin-top: 3rem;
		color: var(--c-ink-3);
	}
</style>
