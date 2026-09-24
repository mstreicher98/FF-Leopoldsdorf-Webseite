<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Footer from '$lib/components/site/Footer.svelte';
	import Header from '$lib/components/site/Header.svelte';

	let { data, children } = $props();

	// Aufrufzähler: nur echte Seitenwechsel, ohne Cookie und ohne IP-Speicherung
	afterNavigate(({ to }) => {
		if (!to || data.signedIn || page.status !== 200) return;
		try {
			navigator.sendBeacon('/api/aufruf', to.url.pathname);
		} catch {
			/* Zählen ist nicht wichtig genug für eine Fehlermeldung */
		}
	});
</script>

<a href="#inhalt" class="skip">Zum Inhalt springen</a>
<Header pages={data.menu} />
<main id="inhalt">
	{@render children()}
</main>
<Footer s={data.site} />

<style>
	.skip {
		position: absolute;
		left: 1rem;
		top: -3rem;
		z-index: 100;
		padding: 0.6rem 1rem;
		border-radius: 8px;
		background: var(--c-night);
		color: #fff;
		font-weight: 600;
	}
	.skip:focus {
		top: 0.75rem;
	}
	main {
		min-height: 60vh;
	}
</style>
