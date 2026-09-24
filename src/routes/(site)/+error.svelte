<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status === 404 ? 'Nicht gefunden' : 'Fehler'} | FF Leopoldsdorf</title></svelte:head>

<section class="wrap err">
	<p class="code display">{page.status}</p>
	<h1 class="title">{page.status === 404 ? 'Diese Seite gibt es nicht.' : 'Da ist etwas schiefgelaufen.'}</h1>
	<p class="text">
		{#if page.status === 404}
			Vielleicht hat sich die Adresse geändert. Auf der Startseite finden Sie alle aktuellen Berichte.
		{:else}
			{page.error?.message}
		{/if}
	</p>
	<p class="links">
		<a href="/" class="btn">Zur Startseite</a>
		<a href="tel:122" class="alt">Im Notfall: 122</a>
	</p>
</section>

<style>
	.err {
		padding-top: 5rem;
		padding-bottom: 2rem;
	}
	.code {
		font-size: clamp(6rem, 20vw, 11rem);
		color: var(--c-red);
	}
	.title {
		margin-top: 1rem;
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		font-weight: 800;
		font-stretch: 72%;
	}
	.text {
		margin-top: 0.75rem;
		max-width: 48ch;
		color: var(--c-ink-2);
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.25rem;
		margin-top: 2rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		height: 2.9rem;
		padding: 0 1.4rem;
		border-radius: 999px;
		background: var(--c-red);
		color: #fff;
		font-weight: 700;
		text-decoration: none;
	}
	.alt {
		font-weight: 700;
		color: var(--c-red);
	}
</style>
