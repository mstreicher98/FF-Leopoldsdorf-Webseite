<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Menu from '@lucide/svelte/icons/menu';
	import Phone from '@lucide/svelte/icons/phone';
	import X from '@lucide/svelte/icons/x';
	import { buildNav, type NavGroup } from '$lib/nav';
	import type { MenuPage } from '$lib/types';

	let { pages }: { pages: MenuPage[] } = $props();

	const groups = $derived(buildNav(pages));
	const path = $derived(page.url.pathname);
	const isActive = (g: NavGroup) => g.match.some((m) => path === m || path.startsWith(`${m}/`));

	let open = $state<string | null>(null);
	let drawer = $state(false);
	let drawerSection = $state<string | null>(null);
	let headerEl: HTMLElement;
	let timer: ReturnType<typeof setTimeout> | undefined;

	afterNavigate(() => {
		open = null;
		drawer = false;
	});

	function toggle(id: string) {
		clearTimeout(timer);
		open = open === id ? null : id;
	}

	// Mit der Maus reicht Überfahren; kurze Verzögerung, damit das Menü nicht flackert
	function hoverIn(id: string, e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		clearTimeout(timer);
		timer = setTimeout(() => (open = id), open ? 0 : 90);
	}
	function hoverOut(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		clearTimeout(timer);
		timer = setTimeout(() => (open = null), 180);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (drawer) drawer = false;
		else if (open) {
			const id = open;
			open = null;
			headerEl?.querySelector<HTMLButtonElement>(`[data-menu="${id}"]`)?.focus();
		}
	}

	function onDocClick(e: MouseEvent) {
		if (open && headerEl && !headerEl.contains(e.target as Node)) open = null;
	}

	$effect(() => {
		document.documentElement.style.overflow = drawer ? 'hidden' : '';
	});
</script>

<svelte:window onkeydown={onKey} onclick={onDocClick} />

<header class="header" bind:this={headerEl}>
	<div class="wrap bar">
		<a href="/" class="brand" aria-label="Freiwillige Feuerwehr Leopoldsdorf – zur Startseite">
			<img src="/bilder/wappen.webp" alt="" width="189" height="224" class="crest" />
			<span class="wordmark">
				<span class="small">Freiwillige Feuerwehr</span>
				<span class="big">Leopoldsdorf</span>
			</span>
		</a>

		<nav aria-label="Hauptmenü" class="desktop">
			<ul>
				{#each groups as g, i (g.id)}
					{#if i === 1}
						<li>
							<a href="/termine" class="top" data-active={path.startsWith('/termine') || undefined}>Termine</a>
						</li>
					{/if}
					<li onpointerenter={(e) => hoverIn(g.id, e)} onpointerleave={hoverOut}>
						<button
							type="button"
							class="top"
							data-menu={g.id}
							data-active={isActive(g) || undefined}
							aria-expanded={open === g.id}
							aria-controls="menu-{g.id}"
							onclick={() => toggle(g.id)}
						>
							{g.label}
							<ChevronDown size={16} strokeWidth={2.5} class="chev" />
						</button>
						{#if open === g.id}
							<div class="panel" id="menu-{g.id}">
								<div class="wrap panel-inner">
									<div class="intro">
										<p class="intro-title">{g.label}</p>
										<p class="intro-text">{g.intro}</p>
									</div>
									<ul class="items" style:--cols={g.items.length > 4 ? 3 : 2}>
										{#each g.items as item (item.href)}
											<li>
												<a href={item.href} class="item" aria-current={path === item.href ? 'page' : undefined}>
													<span class="icon"><item.icon size={20} strokeWidth={2} /></span>
													<span>
														<span class="item-title">{item.title}</span>
														{#if item.text}<span class="item-text">{item.text}</span>{/if}
													</span>
												</a>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>

		<div class="actions">
			<a href="tel:122" class="notruf">
				<Phone size={17} strokeWidth={2.5} />
				<span><span class="hide-sm">Notruf </span>122</span>
			</a>
			<button type="button" class="burger" aria-label="Menü öffnen" aria-expanded={drawer} onclick={() => (drawer = true)}>
				<Menu size={26} />
			</button>
		</div>
	</div>
</header>

{#if drawer}
	<div class="drawer" role="dialog" aria-modal="true" aria-label="Menü">
		<div class="drawer-head">
			<a href="/" class="brand">
				<img src="/bilder/wappen.webp" alt="" width="189" height="224" class="crest" />
				<span class="wordmark">
					<span class="small">Freiwillige Feuerwehr</span>
					<span class="big">Leopoldsdorf</span>
				</span>
			</a>
			<!-- svelte-ignore a11y_autofocus -->
			<button type="button" class="burger" aria-label="Menü schließen" onclick={() => (drawer = false)} autofocus>
				<X size={26} />
			</button>
		</div>
		<nav aria-label="Hauptmenü" class="drawer-nav">
			<a href="/" class="d-top" aria-current={path === '/' ? 'page' : undefined}>Startseite</a>
			{#each groups as g, i (g.id)}
				{#if i === 1}
					<a href="/termine" class="d-top" aria-current={path === '/termine' ? 'page' : undefined}>Termine</a>
				{/if}
				<button
					type="button"
					class="d-top"
					aria-expanded={drawerSection === g.id || (drawerSection === null && isActive(g))}
					onclick={() => (drawerSection = drawerSection === g.id ? '' : g.id)}
				>
					{g.label}
					<ChevronDown size={20} class="chev" />
				</button>
				{#if drawerSection === g.id || (drawerSection === null && isActive(g))}
					<ul class="d-items">
						{#each g.items as item (item.href)}
							<li>
								<a href={item.href} class="d-item" aria-current={path === item.href ? 'page' : undefined}>
									<item.icon size={19} />
									{item.title}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			{/each}
		</nav>
		<a href="tel:122" class="d-notruf"><Phone size={20} strokeWidth={2.5} /> Notruf Feuerwehr 122</a>
	</div>
{/if}

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: var(--c-red);
		color: #fff;
		box-shadow: 0 1px 0 rgb(0 0 0 / 0.08);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		height: 4rem;
	}
	@media (min-width: 1024px) {
		.bar {
			height: 4.75rem;
		}
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: #fff;
		text-decoration: none;
		flex-shrink: 0;
	}
	.crest {
		height: 2.6rem;
		width: auto;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.25));
	}
	@media (min-width: 1024px) {
		.crest {
			height: 3.1rem;
		}
	}
	.wordmark {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}
	.wordmark .small {
		font-size: 0.72rem;
		font-weight: 650;
		font-stretch: 85%;
		letter-spacing: 0.01em;
		opacity: 0.92;
	}
	.wordmark .big {
		margin-top: 0.1rem;
		font-size: 1.45rem;
		font-weight: 850;
		font-stretch: 66%;
		text-transform: uppercase;
		letter-spacing: 0.01em;
	}
	@media (min-width: 1024px) {
		.wordmark .big {
			font-size: 1.7rem;
		}
	}

	/* ---------------- Desktop-Navigation */
	.desktop {
		display: none;
		margin-left: auto;
	}
	@media (min-width: 1024px) {
		.desktop {
			display: block;
		}
	}
	.desktop > ul {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.top {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		height: 2.75rem;
		padding: 0 0.85rem;
		border-radius: 8px;
		color: #fff;
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		transition: background-color 120ms;
	}
	.top:hover,
	.top[aria-expanded='true'] {
		background: rgb(0 0 0 / 0.14);
	}
	.top[data-active]::after {
		content: '';
		position: absolute;
		left: 0.85rem;
		right: 0.85rem;
		bottom: 0.3rem;
		height: 3px;
		border-radius: 2px;
		background: #fff;
	}
	.top :global(.chev) {
		transition: transform 160ms var(--ease-out);
	}
	.top[aria-expanded='true'] :global(.chev) {
		transform: rotate(180deg);
	}

	.panel {
		position: absolute;
		left: 0;
		right: 0;
		top: 100%;
		background: var(--c-surface);
		color: var(--c-ink);
		border-top: 1px solid rgb(0 0 0 / 0.06);
		box-shadow: 0 24px 40px -24px rgb(16 24 33 / 0.45);
		animation: drop 160ms var(--ease-out);
	}
	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
	}
	.panel-inner {
		display: grid;
		grid-template-columns: 15rem 1fr;
		gap: 2rem;
		padding-top: 1.5rem;
		padding-bottom: 1.75rem;
	}
	.intro {
		padding: 0.75rem 1.5rem 0.75rem 0;
		border-right: 1px solid var(--c-line);
	}
	.intro-title {
		font-size: 1.9rem;
		font-weight: 850;
		font-stretch: 66%;
		text-transform: uppercase;
		line-height: 1;
		color: var(--c-red);
	}
	.intro-text {
		margin-top: 0.5rem;
		color: var(--c-ink-2);
		line-height: 1.45;
	}
	.items {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
		gap: 0.25rem 1rem;
		align-content: start;
	}
	.item {
		display: flex;
		gap: 0.85rem;
		align-items: flex-start;
		padding: 0.75rem;
		border-radius: 10px;
		text-decoration: none;
		color: inherit;
	}
	.item:hover,
	.item[aria-current='page'] {
		background: var(--c-surface-2);
	}
	.icon {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		flex-shrink: 0;
		border-radius: 8px;
		background: var(--c-red-soft);
		color: var(--c-red);
	}
	.item-title {
		display: block;
		font-weight: 650;
	}
	.item-text {
		display: block;
		margin-top: 0.1rem;
		font-size: 0.875rem;
		line-height: 1.35;
		color: var(--c-ink-3);
	}

	/* ---------------- Notruf + Burger */
	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}
	@media (min-width: 1024px) {
		.actions {
			margin-left: 0.5rem;
		}
	}
	.notruf {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		height: 2.5rem;
		padding: 0 0.9rem;
		border-radius: 999px;
		background: #fff;
		color: var(--c-red);
		font-weight: 800;
		font-stretch: 85%;
		font-size: 1.05rem;
		text-decoration: none;
		font-variant-numeric: tabular-nums;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
	}
	.notruf:hover {
		background: #fff4f2;
	}
	.hide-sm {
		display: none;
		margin-right: 0.3em;
	}
	@media (min-width: 480px) {
		.hide-sm {
			display: inline;
		}
	}
	.burger {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 8px;
		color: #fff;
	}
	.burger:hover {
		background: rgb(0 0 0 / 0.14);
	}
	@media (min-width: 1024px) {
		.actions .burger {
			display: none;
		}
	}

	/* ---------------- Mobiles Menü */
	.drawer {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		background: var(--c-red);
		color: #fff;
		overflow-y: auto;
		overscroll-behavior: contain;
		animation: fade 160ms var(--ease-out);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	.drawer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4rem;
		padding: 0 1rem;
		flex-shrink: 0;
		border-bottom: 1px solid rgb(255 255 255 / 0.18);
	}
	.drawer-nav {
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
	}
	.d-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 3.25rem;
		padding: 0 0.5rem;
		font-size: 1.35rem;
		font-weight: 750;
		font-stretch: 78%;
		color: #fff;
		text-decoration: none;
		border-radius: 8px;
	}
	.d-top[aria-current='page'] {
		background: rgb(0 0 0 / 0.14);
	}
	.d-top :global(.chev) {
		transition: transform 160ms;
	}
	.d-top[aria-expanded='true'] :global(.chev) {
		transform: rotate(180deg);
	}
	.d-items {
		padding: 0.25rem 0 0.75rem 0.5rem;
	}
	.d-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-height: 2.9rem;
		padding: 0 0.75rem;
		border-radius: 8px;
		color: rgb(255 255 255 / 0.92);
		text-decoration: none;
		font-size: 1.05rem;
		font-weight: 550;
	}
	.d-item[aria-current='page'],
	.d-item:hover {
		background: rgb(0 0 0 / 0.14);
		color: #fff;
	}
	.d-notruf {
		margin: auto 1rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		height: 3.25rem;
		border-radius: 999px;
		background: #fff;
		color: var(--c-red);
		font-weight: 800;
		font-size: 1.15rem;
		text-decoration: none;
	}
</style>
