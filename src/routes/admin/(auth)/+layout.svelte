<script lang="ts">
	let { children } = $props();
</script>

<div class="auth">
	<div class="box">
		<a href="/" class="brand">
			<img src="/bilder/wappen.webp" alt="" width="189" height="224" />
			<span>
				<span class="small">Freiwillige Feuerwehr Leopoldsdorf</span>
				<span class="big">Interner Bereich</span>
			</span>
		</a>
		{@render children()}
	</div>
	<p class="foot"><a href="/">Zur öffentlichen Webseite</a></p>
</div>

<style>
	.auth {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		background:
			linear-gradient(to bottom, var(--c-red) 0 12rem, transparent 12rem),
			var(--c-bg);
	}
	.box {
		width: 100%;
		max-width: 26rem;
		padding: 1.75rem;
		border-radius: 16px;
		background: var(--c-surface);
		border: 1px solid var(--c-line);
		box-shadow: var(--shadow-pop);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		color: var(--c-ink);
		text-decoration: none;
	}
	.brand img {
		height: 2.9rem;
		width: auto;
	}
	.small {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--c-ink-3);
	}
	.big {
		display: block;
		font-size: 1.5rem;
		font-weight: 850;
		font-stretch: 68%;
		text-transform: uppercase;
		line-height: 1.05;
	}
	.foot {
		margin-top: 1.25rem;
		font-size: 0.875rem;
	}
	.foot a {
		color: var(--c-ink-3);
	}
</style>
