<script lang="ts">
	import Banner from '$lib/components/site/Banner.svelte';
	import Picture from '$lib/components/site/Picture.svelte';
	import RankBadge from '$lib/components/site/RankBadge.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import { rankName } from '$lib/dienstgrade';

	let { data } = $props();
</script>

<Seo title="Kommando" description="Das Kommando der Freiwilligen Feuerwehr Leopoldsdorf" />

<Banner title="Kommando" subtitle="Wer unsere Feuerwehr führt und organisiert" image="/banner/kdo.webp" />

<div class="wrap">
	{#if data.kommando.length}
		<ul class="list">
			{#each data.kommando as m, i (m.id)}
				<li class="person" class:first={i === 0}>
					<div class="photo">
						{#if m.photo}
							<Picture media={m.photo} sizes="(min-width: 768px) 320px, 100vw" want={800} alt="{m.firstName} {m.lastName}" class="img" />
						{:else}
							<span class="initials" aria-hidden="true">{m.firstName[0]}{m.lastName[0]}</span>
						{/if}
					</div>
					<div class="text">
						<p class="position">{m.kommandoPosition}</p>
						<h2 class="name">{m.firstName} {m.lastName}</h2>
						<p class="rank"><RankBadge rank={m.rank} honorary={m.honoraryRank} /> <span>{rankName(m.rank, m.honoraryRank)}</span></p>
						{#if m.kommandoText}<p class="about">{m.kommandoText}</p>{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Das Kommando wird hier in Kürze vorgestellt.</p>
	{/if}
	{#if data.hidden}
		<p class="empty">{data.hidden === 1 ? 'Ein Mitglied des Kommandos möchte' : `${data.hidden} Mitglieder des Kommandos möchten`} nicht namentlich genannt werden.</p>
	{/if}
</div>

<style>
	.list {
		display: grid;
		gap: 3rem 2.5rem;
		margin-top: 3.5rem;
	}
	@media (min-width: 768px) {
		.list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.person {
		display: grid;
		grid-template-columns: 7.5rem 1fr;
		gap: 1.25rem;
		align-items: start;
	}
	@media (min-width: 480px) {
		.person {
			grid-template-columns: 10rem 1fr;
			gap: 1.5rem;
		}
	}
	.photo {
		aspect-ratio: 4 / 5;
		border-radius: 10px;
		overflow: hidden;
		background: var(--c-surface-3);
	}
	.photo :global(.img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 20%;
	}
	.initials {
		display: grid;
		place-items: center;
		height: 100%;
		font-size: 3rem;
		font-weight: 850;
		font-stretch: 65%;
		color: var(--c-line-strong);
	}
	.position {
		font-weight: 700;
		color: var(--c-red);
	}
	.name {
		margin-top: 0.2rem;
		font-size: clamp(1.6rem, 3.5vw, 2.1rem);
		font-weight: 850;
		font-stretch: 68%;
		line-height: 1;
		text-transform: uppercase;
	}
	.rank {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.6rem;
		color: var(--c-ink-2);
		font-size: 0.9rem;
	}
	.about {
		margin-top: 0.75rem;
		color: var(--c-ink-2);
		max-width: 42ch;
	}
	.empty {
		margin-top: 3rem;
		color: var(--c-ink-3);
	}
</style>
