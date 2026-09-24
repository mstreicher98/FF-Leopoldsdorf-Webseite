<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status === 404 ? 'Nicht gefunden' : 'Fehler'} | FF Leopoldsdorf</title></svelte:head>

<main class="err">
	<img src="/bilder/wappen.webp" alt="" width="94" height="112" />
	<p class="code">{page.status}</p>
	<h1>{page.status === 404 ? 'Diese Seite gibt es nicht.' : 'Da ist etwas schiefgelaufen.'}</h1>
	{#if page.status !== 404 && page.error?.message}<p class="msg">{page.error.message}</p>{/if}
	<a href="/">Zur Startseite</a>
</main>

<style>
	.err {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		text-align: center;
	}
	img {
		height: 4.5rem;
		width: auto;
	}
	.code {
		font-size: 4.5rem;
		font-weight: 850;
		font-stretch: 62%;
		color: var(--c-red);
		line-height: 1;
	}
	h1 {
		font-size: 1.5rem;
		font-weight: 800;
		font-stretch: 75%;
	}
	.msg {
		color: var(--c-ink-2);
	}
	a {
		margin-top: 1rem;
		font-weight: 700;
		color: var(--c-red);
	}
</style>
