<script lang="ts">
	import { page } from '$app/state';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EinsatzChip from '$lib/components/site/EinsatzChip.svelte';
	import Gallery from '$lib/components/site/Gallery.svelte';
	import Picture from '$lib/components/site/Picture.svelte';
	import PostCard from '$lib/components/site/PostCard.svelte';
	import Seo from '$lib/components/site/Seo.svelte';
	import ShareLinks from '$lib/components/site/ShareLinks.svelte';
	import { CATEGORIES } from '$lib/categories';
	import { GROUP_LABELS } from '$lib/einsatz';
	import { formatDayWeekday, formatTime } from '$lib/format';
	import { mediaSrc } from '$lib/media';

	let { data } = $props();

	const post = $derived(data.post);
	const cat = $derived(CATEGORIES[post.category]);
	const e = $derived(post.einsatz);
	const url = $derived(`${page.url.origin}/beitrag/${post.slug}`);
</script>

<Seo title={post.title} description={post.excerpt} image={post.cover ? mediaSrc(post.cover, 1600) : undefined} type="article" noindex={post.status !== 'veroeffentlicht'} />

<article>
	<header class="wrap head">
		<nav class="crumbs" aria-label="Brotkrümel">
			<a href="/taetigkeiten">Tätigkeiten</a>
			<span aria-hidden="true">/</span>
			<a href="/taetigkeiten/{cat.path}">{cat.title}</a>
		</nav>

		{#if post.status !== 'veroeffentlicht'}
			<p class="draft">Entwurf: Dieser Beitrag ist noch nicht veröffentlicht und nur für angemeldete Redakteure sichtbar.</p>
		{/if}
		{#if data.signedIn}
			<a href="/admin/beitraege/{post.id}" class="edit"><Pencil size={15} /> Bearbeiten</a>
		{/if}

		<h1 class="title display">{post.title}</h1>
		<p class="date">
			<time datetime={post.date}>{formatDayWeekday(post.date)}</time>{#if post.time && !e}, {formatTime(post.time)}{/if}
		</p>
	</header>

	{#if e}
		<section class="wrap" aria-label="Einsatzdaten">
			<div class="protokoll" data-group={e.group ?? 'sonstiges'}>
				<dl class="cell art">
					<dt>Einsatzart</dt>
					<dd>
						<EinsatzChip code={e.code} group={e.group} label={e.label} size="lg" />
						<span>
							<strong>{e.stichwort || e.label || GROUP_LABELS[e.group ?? 'sonstiges']}</strong>
							{#if e.stichwort && e.label}<span class="sub">{e.label}</span>{/if}
						</span>
					</dd>
				</dl>
				<div class="cells">
					{#if e.nummer}
						<dl class="cell">
							<dt>Einsatznummer</dt>
							<dd class="big tabular">{e.nummer}</dd>
						</dl>
					{/if}
					<dl class="cell">
						<dt>Alarmierung</dt>
						<dd class="tabular">{formatDayWeekday(post.date)}{#if post.time}<br /><strong>{formatTime(post.time)}</strong>{/if}</dd>
					</dl>
					{#if e.ort}
						<dl class="cell">
							<dt>Einsatzort</dt>
							<dd>{e.ort}</dd>
						</dl>
					{/if}
				</div>
				{#if post.vehicles.length}
					<dl class="cell wide">
						<dt>Eingesetzte Fahrzeuge</dt>
						<dd>
							<ul class="vehicles">
								{#each post.vehicles as v (v.id)}
									<li>
										<a href="/feuerwehr/fuhrpark/{v.slug}">
											<span class="vshort">{v.shortName || v.name}</span>
											{#if v.radioName}<span class="vradio">{v.radioName}</span>{/if}
										</a>
									</li>
								{/each}
							</ul>
						</dd>
					</dl>
				{/if}
			</div>
		</section>
	{/if}

	{#if post.cover}
		<figure class="wrap cover">
			<Picture media={post.cover} sizes="(min-width: 1216px) 1152px, 100vw" want={1600} eager class="cover-img" />
			{#if post.cover.alt}<figcaption>{post.cover.alt}</figcaption>{/if}
		</figure>
	{/if}

	<div class="wrap body">
		{#if post.contentHtml}
			<div class="prose">{@html post.contentHtml}</div>
		{/if}

		{#if post.gallery.length}
			<section class="gallery" aria-label="Bilder zum Beitrag">
				<h2 class="h2">Bilder</h2>
				<Gallery images={post.gallery} />
			</section>
		{/if}

		<div class="share"><ShareLinks {url} title={post.title} /></div>
	</div>

	{#if data.related.length}
		<section class="wrap related" aria-labelledby="weitere">
			<h2 id="weitere" class="h2">Weitere {cat.title}</h2>
			<div class="grid">
				{#each data.related as p (p.id)}
					<PostCard post={p} variant="compact" />
				{/each}
			</div>
		</section>
	{/if}
</article>

<style>
	.head {
		padding-top: 2.5rem;
	}
	.crumbs {
		display: flex;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--c-ink-3);
	}
	.crumbs a {
		color: var(--c-ink-2);
		font-weight: 600;
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--c-red);
		text-decoration: underline;
	}
	.draft {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		background: var(--c-warn-soft);
		color: var(--c-warn);
		font-weight: 600;
	}
	.edit {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 1rem;
		font-weight: 650;
		color: var(--c-technik);
	}
	.title {
		margin-top: 1rem;
		font-size: clamp(2.3rem, 6vw, 4rem);
		text-transform: uppercase;
		max-width: 22ch;
	}
	.date {
		margin-top: 0.9rem;
		color: var(--c-ink-2);
		font-size: 1.05rem;
	}

	/* Einsatzdaten wie ein Protokollblatt */
	.protokoll {
		margin-top: 2rem;
		border: 1px solid var(--c-line);
		border-top: 5px solid var(--c-brand);
		border-radius: 10px;
		background: var(--c-surface-2);
		overflow: hidden;
	}
	.protokoll[data-group='technik'] {
		border-top-color: var(--c-technik);
	}
	.protokoll[data-group='schadstoff'] {
		border-top-color: var(--c-schadstoff);
	}
	.protokoll[data-group='sonstiges'] {
		border-top-color: var(--c-sonstiges);
	}
	.cells {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		border-bottom: 1px solid var(--c-line);
	}
	.cell {
		padding: 1rem 1.25rem;
	}
	.cells .cell {
		border-right: 1px solid var(--c-line);
		margin-right: -1px;
	}
	.cell.art {
		border-bottom: 1px solid var(--c-line);
	}
	.cells + .cell.wide {
		border-top: 0;
	}
	dt {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--c-ink-3);
	}
	dd {
		margin-top: 0.3rem;
		font-weight: 550;
		line-height: 1.35;
	}
	.art dd {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		font-size: 1.2rem;
	}
	.art strong {
		display: block;
		font-weight: 750;
		font-stretch: 85%;
	}
	.sub {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--c-ink-3);
	}
	.big {
		font-size: 1.6rem;
		font-weight: 800;
		font-stretch: 70%;
	}
	.vehicles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.vehicles a {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.75rem 0.35rem 0.35rem;
		border-radius: 8px;
		background: var(--c-surface);
		border: 1px solid var(--c-line-strong);
		color: var(--c-ink);
		text-decoration: none;
	}
	.vehicles a:hover {
		border-color: var(--c-red);
	}
	.vshort {
		padding: 0.15rem 0.45rem;
		border-radius: 5px;
		background: var(--c-red);
		color: #fff;
		font-weight: 800;
		font-stretch: 75%;
		font-size: 0.95rem;
	}
	.vradio {
		font-size: 0.9rem;
		font-weight: 600;
	}

	.cover {
		margin-top: 2rem;
	}
	.cover :global(.cover-img) {
		width: 100%;
		max-height: 44rem;
		object-fit: cover;
		border-radius: 12px;
	}
	figcaption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--c-ink-3);
	}
	.body {
		margin-top: 2.5rem;
	}
	.h2 {
		margin-bottom: 1rem;
		font-size: 1.6rem;
		font-weight: 800;
		font-stretch: 70%;
		text-transform: uppercase;
	}
	.gallery {
		margin-top: 3rem;
	}
	.share {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--c-line);
	}
	.related {
		margin-top: 4rem;
	}
	.grid {
		display: grid;
		gap: 2rem;
	}
	@media (min-width: 768px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
