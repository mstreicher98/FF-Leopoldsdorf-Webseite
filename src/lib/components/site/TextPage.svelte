<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import type { MediaRef } from '$lib/media';
	import type { MenuPage } from '$lib/types';
	import Banner from './Banner.svelte';
	import Seo from './Seo.svelte';

	interface Props {
		page: { id: number; slug: string; section: string; title: string; subtitle: string; contentHtml: string };
		banner: string | MediaRef;
		siblings: MenuPage[];
		signedIn: boolean;
	}

	let { page, banner, siblings, signedIn }: Props = $props();
</script>

<Seo title={page.title} description={page.subtitle} />

<Banner title={page.title} subtitle={page.subtitle} image={banner} />

<div class="wrap layout" class:with-nav={siblings.length > 1}>
	<div>
		{#if signedIn}
			<a href="/admin/seiten/{page.id}" class="edit"><Pencil size={15} /> Seite bearbeiten</a>
		{/if}
		{#if page.contentHtml}
			<div class="prose">{@html page.contentHtml}</div>
		{:else}
			<p class="empty">Diese Seite wird gerade überarbeitet.</p>
		{/if}
	</div>

	{#if siblings.length > 1}
		<nav class="side" aria-label="Bürgerservice">
			<p class="side-title">Bürgerservice</p>
			<ul>
				{#each siblings as s (s.slug)}
					<li>
						<a href="/{s.section}/{s.slug}" aria-current={s.slug === page.slug ? 'page' : undefined}>{s.title}</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</div>

<style>
	.layout {
		margin-top: 3rem;
	}
	@media (min-width: 1024px) {
		.with-nav {
			display: grid;
			grid-template-columns: 1fr 16rem;
			gap: 4rem;
			align-items: start;
		}
	}
	.edit {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 1.5rem;
		font-weight: 650;
		color: var(--c-technik);
	}
	.empty {
		color: var(--c-ink-3);
	}
	.side {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--c-line);
	}
	@media (min-width: 1024px) {
		.side {
			position: sticky;
			top: 6.5rem;
			margin-top: 0;
			padding-top: 0;
			border-top: 0;
		}
	}
	.side-title {
		margin-bottom: 0.5rem;
		font-weight: 800;
		font-stretch: 75%;
		font-size: 1.1rem;
		text-transform: uppercase;
	}
	.side ul {
		display: flex;
		flex-direction: column;
		border-left: 2px solid var(--c-line);
	}
	.side a {
		display: block;
		margin-left: -2px;
		padding: 0.5rem 0 0.5rem 1rem;
		border-left: 2px solid transparent;
		color: var(--c-ink-2);
		text-decoration: none;
		font-weight: 550;
	}
	.side a:hover {
		color: var(--c-ink);
	}
	.side a[aria-current='page'] {
		border-left-color: var(--c-red);
		color: var(--c-red);
		font-weight: 700;
	}
</style>
