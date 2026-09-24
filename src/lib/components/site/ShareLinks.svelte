<script lang="ts">
	import { onMount } from 'svelte';
	import Check from '@lucide/svelte/icons/check';
	import Link from '@lucide/svelte/icons/link';
	import Mail from '@lucide/svelte/icons/mail';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Share2 from '@lucide/svelte/icons/share-2';
	import SocialIcon from './SocialIcon.svelte';

	/** Einfache Links ohne eingebettete Skripte der Plattformen – es wird nichts vorab übertragen */
	let { url, title }: { url: string; title: string } = $props();

	let copied = $state(false);
	let canShare = $state(false);

	onMount(() => {
		canShare = typeof navigator.share === 'function';
	});

	const enc = encodeURIComponent;

	async function copy() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2200);
		} catch {
			prompt('Link kopieren:', url);
		}
	}

	async function share() {
		try {
			await navigator.share({ title, url });
		} catch {
			/* abgebrochen */
		}
	}
</script>

<div class="share">
	<p class="label">Beitrag teilen</p>
	<div class="links">
		{#if canShare}
			<button type="button" onclick={share}><Share2 size={17} /> Teilen</button>
		{/if}
		<a href="https://wa.me/?text={enc(`${title} ${url}`)}" target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> WhatsApp</a>
		<a href="https://www.facebook.com/sharer/sharer.php?u={enc(url)}" target="_blank" rel="noopener noreferrer"><SocialIcon name="facebook" size={17} /> Facebook</a>
		<a href="mailto:?subject={enc(title)}&body={enc(url)}"><Mail size={17} /> E-Mail</a>
		<button type="button" onclick={copy}>
			{#if copied}<Check size={17} /> Link kopiert{:else}<Link size={17} /> Link kopieren{/if}
		</button>
	</div>
</div>

<style>
	.share {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
	}
	.label {
		font-weight: 700;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	a,
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		height: 2.4rem;
		padding: 0 0.9rem;
		border-radius: 999px;
		border: 1px solid var(--c-line-strong);
		background: var(--c-surface);
		color: var(--c-ink);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	a:hover,
	button:hover {
		border-color: var(--c-ink);
	}
</style>
