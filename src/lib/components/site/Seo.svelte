<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title: string;
		description?: string;
		/** Pfad oder URL des Vorschaubilds (Teilen in sozialen Netzwerken) */
		image?: string;
		type?: 'website' | 'article';
		noindex?: boolean;
	}

	let { title, description = '', image = '/bilder/vorschau.jpg', type = 'website', noindex = false }: Props = $props();

	const SITE = 'Freiwillige Feuerwehr Leopoldsdorf';
	const full = $derived(title === SITE ? title : `${title} | FF Leopoldsdorf`);
	const abs = (p: string) => (p.startsWith('http') ? p : `${page.url.origin}${p}`);
	const canonical = $derived(`${page.url.origin}${page.url.pathname}`);
</script>

<svelte:head>
	<title>{full}</title>
	{#if description}<meta name="description" content={description} />{/if}
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<meta property="og:site_name" content={SITE} />
	<meta property="og:locale" content="de_AT" />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	{#if description}<meta property="og:description" content={description} />{/if}
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={abs(image)} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
