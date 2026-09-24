<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import SocialIcon from './SocialIcon.svelte';

	interface FooterSettings {
		name: string;
		street: string;
		zip: string;
		city: string;
		email: string;
		phone: string;
		phoneNote: string;
		iban: string;
		bic: string;
		donationNote: string;
		facebook: string;
		instagram: string;
		x: string;
		youtube: string;
	}

	let { s }: { s: FooterSettings } = $props();

	const socials = $derived(
		(
			[
				['facebook', 'Facebook', s.facebook],
				['instagram', 'Instagram', s.instagram],
				['youtube', 'YouTube', s.youtube],
				['x', 'X', s.x]
			] as const
		).filter(([, , url]) => !!url)
	);
	const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="warnstripe stripe" aria-hidden="true"></div>
	<div class="wrap grid">
		<div class="col about">
			<img src="/bilder/wappen.webp" alt="" width="189" height="224" class="crest" />
			<p class="name">{s.name}</p>
			<p class="addr">{s.street}<br />{s.zip} {s.city}</p>
		</div>

		<div class="col">
			<h2 class="h">Kontakt</h2>
			<p><a href="mailto:{s.email}">{s.email}</a></p>
			<p>
				<a href={tel(s.phone)} class="tabular">{s.phone}</a>
				{#if s.phoneNote}<span class="muted">({s.phoneNote})</span>{/if}
			</p>
			<p class="emergency">Im Notfall immer <a href="tel:122">122</a> wählen.</p>
		</div>

		<div class="col">
			<h2 class="h">Spenden</h2>
			<dl class="bank">
				<dt>IBAN</dt>
				<dd class="tabular">{s.iban}</dd>
				<dt>BIC</dt>
				<dd class="tabular">{s.bic}</dd>
			</dl>
			{#if s.donationNote}<p class="muted small">{s.donationNote}</p>{/if}
		</div>

		{#if socials.length}
			<div class="col">
				<h2 class="h">Folgen Sie uns</h2>
				<ul class="social">
					{#each socials as [icon, label, url] (icon)}
						<li>
							<a href={url} target="_blank" rel="noopener noreferrer">
								<SocialIcon name={icon} />
								{label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>

	<div class="wrap legal">
		<p>© {year} {s.name}</p>
		<nav aria-label="Rechtliches" class="legal-links">
			<a href="/impressum">Impressum</a>
			<a href="/datenschutz">Datenschutz</a>
			<a href="/admin" class="intern"><KeyRound size={15} /> Interner Bereich</a>
		</nav>
	</div>
</footer>

<style>
	.footer {
		margin-top: 5rem;
		background: var(--c-night);
		color: rgb(255 255 255 / 0.86);
		font-size: 0.95rem;
	}
	.stripe {
		height: 12px;
	}
	.grid {
		display: grid;
		gap: 2.25rem;
		padding-top: 3rem;
		padding-bottom: 2.5rem;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 1.2fr 1fr 1fr 0.9fr;
		}
	}
	.crest {
		height: 3.5rem;
		width: auto;
	}
	.name {
		margin-top: 0.9rem;
		font-size: 1.3rem;
		font-weight: 800;
		font-stretch: 70%;
		text-transform: uppercase;
		line-height: 1.05;
		color: #fff;
		max-width: 14ch;
	}
	.addr {
		margin-top: 0.5rem;
	}
	.h {
		margin-bottom: 0.75rem;
		font-size: 1.05rem;
		font-weight: 750;
		font-stretch: 80%;
		color: #fff;
	}
	.col p + p {
		margin-top: 0.4rem;
	}
	a {
		color: #fff;
		text-decoration: underline;
		text-decoration-color: rgb(255 255 255 / 0.35);
		text-underline-offset: 3px;
	}
	a:hover {
		text-decoration-color: #fff;
	}
	.muted {
		color: rgb(255 255 255 / 0.62);
	}
	.small {
		font-size: 0.85rem;
		margin-top: 0.6rem;
	}
	.emergency {
		margin-top: 0.9rem !important;
	}
	.emergency a {
		font-weight: 800;
		text-decoration: none;
		background: var(--c-red);
		padding: 0.05rem 0.4rem;
		border-radius: 4px;
	}
	.bank {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.2rem 0.75rem;
	}
	.bank dt {
		color: rgb(255 255 255 / 0.62);
	}
	.bank dd {
		color: #fff;
		font-weight: 550;
	}
	.social {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.social a {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
	}
	.social a:hover {
		text-decoration: underline;
	}
	.legal {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		padding-top: 1.25rem;
		padding-bottom: 1.5rem;
		border-top: 1px solid rgb(255 255 255 / 0.12);
		font-size: 0.875rem;
		color: rgb(255 255 255 / 0.62);
	}
	.legal-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
	}
	.legal-links a {
		color: rgb(255 255 255 / 0.8);
		text-decoration: none;
	}
	.legal-links a:hover {
		color: #fff;
		text-decoration: underline;
	}
	.intern {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
</style>
