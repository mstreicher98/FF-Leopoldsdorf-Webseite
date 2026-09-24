<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import Images from '@lucide/svelte/icons/images';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Menu from '@lucide/svelte/icons/menu';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Moon from '@lucide/svelte/icons/moon';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import Settings from '@lucide/svelte/icons/settings';
	import Sun from '@lucide/svelte/icons/sun';
	import Truck from '@lucide/svelte/icons/truck';
	import UserCog from '@lucide/svelte/icons/user-cog';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Users from '@lucide/svelte/icons/users';
	import X from '@lucide/svelte/icons/x';
	import { can, ROLE_LABELS } from '$lib/permissions';
	import { toasts } from '$lib/toast.svelte';

	let { data, children } = $props();

	const nav = $derived(
		[
			{ href: '/admin', label: 'Übersicht', icon: LayoutDashboard, exact: true },
			{ href: '/admin/beitraege', label: 'Beiträge', icon: Newspaper },
			{ href: '/admin/termine', label: 'Termine', icon: CalendarDays },
			{ href: '/admin/mitglieder', label: 'Mitglieder', icon: Users },
			{ href: '/admin/fahrzeuge', label: 'Fahrzeuge', icon: Truck },
			{ href: '/admin/seiten', label: 'Seiten', icon: FileText },
			{ href: '/admin/bilder', label: 'Mediathek', icon: Images },
			{ href: '/admin/einsatzarten', label: 'Einsatzarten', icon: ListChecks },
			...(can(data.me.role, 'users.manage') ? [{ href: '/admin/benutzer', label: 'Benutzer', icon: UserCog }] : []),
			...(can(data.me.role, 'settings.manage') ? [{ href: '/admin/einstellungen', label: 'Einstellungen', icon: Settings }] : [])
		] as { href: string; label: string; icon: typeof Newspaper; exact?: boolean }[]
	);

	const path = $derived(page.url.pathname);
	const active = (item: { href: string; exact?: boolean }) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

	let drawer = $state(false);
	afterNavigate(() => (drawer = false));

	// Meldung aus einer Weiterleitung („gespeichert“) einmal anzeigen
	let lastFlash = 0;
	$effect(() => {
		const f = data.flash;
		if (f && f.id !== lastFlash) {
			lastFlash = f.id;
			toasts.show(f.message, f.kind);
		}
	});

	let theme = $state<'light' | 'dark' | 'system'>('system');
	$effect.pre(() => {
		theme = data.theme;
	});
	function setTheme(t: typeof theme) {
		theme = t;
		document.cookie = `theme=${t === 'system' ? '' : t}; path=/admin; max-age=${t === 'system' ? 0 : 31536000}; samesite=lax`;
		if (t === 'system') document.documentElement.removeAttribute('data-theme');
		else document.documentElement.setAttribute('data-theme', t);
	}
</script>

{#snippet navList()}
	<ul class="nav">
		{#each nav as item (item.href)}
			<li>
				<a href={item.href} aria-current={active(item) ? 'page' : undefined}>
					<item.icon size={19} />
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet userBox()}
	<div class="user">
		<a href="/admin/konto" class="who" aria-current={path === '/admin/konto' ? 'page' : undefined}>
			<span class="avatar"><UserRound size={18} /></span>
			<span class="who-text">
				<span class="who-name">{data.me.name}</span>
				<span class="who-role">{ROLE_LABELS[data.me.role]}</span>
			</span>
		</a>
		<div class="theme" role="group" aria-label="Darstellung">
			<button type="button" aria-pressed={theme === 'light'} onclick={() => setTheme('light')} title="Hell"><Sun size={16} /></button>
			<button type="button" aria-pressed={theme === 'system'} onclick={() => setTheme('system')} title="Wie das Gerät"><Monitor size={16} /></button>
			<button type="button" aria-pressed={theme === 'dark'} onclick={() => setTheme('dark')} title="Dunkel"><Moon size={16} /></button>
		</div>
		<a href="/" class="side-link" target="_blank" rel="noopener"><ExternalLink size={17} /> Webseite ansehen</a>
		<form method="POST" action="/admin/logout">
			<button class="side-link"><LogOut size={17} /> Abmelden</button>
		</form>
	</div>
{/snippet}

<div class="shell">
	<aside class="sidebar">
		<a href="/admin" class="brand">
			<img src="/bilder/wappen.webp" alt="" width="189" height="224" />
			<span><span class="b-small">FF Leopoldsdorf</span><span class="b-big">Intern</span></span>
		</a>
		{@render navList()}
		{@render userBox()}
	</aside>

	<header class="topbar">
		<button type="button" class="menu-btn" aria-label="Menü öffnen" onclick={() => (drawer = true)}><Menu size={24} /></button>
		<a href="/admin" class="brand small-brand">
			<img src="/bilder/wappen.webp" alt="" width="189" height="224" />
			<span class="b-big">Intern</span>
		</a>
	</header>

	{#if drawer}
		<div class="drawer-bg" onclick={() => (drawer = false)} aria-hidden="true"></div>
		<div class="drawer" role="dialog" aria-modal="true" aria-label="Menü">
			<div class="drawer-head">
				<a href="/admin" class="brand">
					<img src="/bilder/wappen.webp" alt="" width="189" height="224" />
					<span><span class="b-small">FF Leopoldsdorf</span><span class="b-big">Intern</span></span>
				</a>
				<!-- svelte-ignore a11y_autofocus -->
				<button type="button" class="menu-btn" aria-label="Menü schließen" onclick={() => (drawer = false)} autofocus><X size={24} /></button>
			</div>
			{@render navList()}
			{@render userBox()}
		</div>
	{/if}

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		min-height: 100dvh;
	}
	@media (min-width: 1024px) {
		.shell {
			display: grid;
			grid-template-columns: var(--sidebar) 1fr;
		}
	}
	.sidebar {
		display: none;
	}
	@media (min-width: 1024px) {
		.sidebar {
			position: sticky;
			top: 0;
			height: 100dvh;
			display: flex;
			flex-direction: column;
			padding: 1.25rem 0.9rem;
			border-right: 1px solid var(--c-line);
			background: var(--c-surface);
			overflow-y: auto;
		}
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0 0.5rem 1.25rem;
		color: var(--c-ink);
		text-decoration: none;
	}
	.brand img {
		height: 2.4rem;
		width: auto;
	}
	.b-small {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--c-ink-3);
	}
	.b-big {
		display: block;
		font-size: 1.35rem;
		font-weight: 850;
		font-stretch: 66%;
		text-transform: uppercase;
		line-height: 1;
	}
	.nav {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.nav a {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		height: 2.6rem;
		padding: 0 0.75rem;
		border-radius: 9px;
		color: var(--c-ink-2);
		font-weight: 600;
		text-decoration: none;
	}
	.nav a:hover {
		background: var(--c-surface-2);
		color: var(--c-ink);
	}
	.nav a[aria-current='page'] {
		background: var(--c-red-soft);
		color: var(--c-red);
	}
	.user {
		margin-top: auto;
		padding-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		border-top: 1px solid var(--c-line);
	}
	.who {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem;
		border-radius: 9px;
		color: var(--c-ink);
		text-decoration: none;
	}
	.who:hover,
	.who[aria-current='page'] {
		background: var(--c-surface-2);
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 999px;
		background: var(--c-surface-3);
		color: var(--c-ink-2);
		flex-shrink: 0;
	}
	.who-name {
		display: block;
		font-weight: 650;
		line-height: 1.2;
	}
	.who-role {
		display: block;
		font-size: 0.8rem;
		color: var(--c-ink-3);
	}
	.theme {
		display: flex;
		gap: 0.25rem;
		margin: 0.25rem 0.5rem 0.4rem;
		padding: 0.2rem;
		border-radius: 9px;
		background: var(--c-surface-2);
	}
	.theme button {
		flex: 1;
		display: grid;
		place-items: center;
		height: 1.9rem;
		border-radius: 7px;
		color: var(--c-ink-3);
	}
	.theme button[aria-pressed='true'] {
		background: var(--c-surface);
		color: var(--c-ink);
		box-shadow: var(--shadow-1);
	}
	.side-link {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		height: 2.3rem;
		padding: 0 0.75rem;
		border-radius: 9px;
		color: var(--c-ink-2);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	.side-link:hover {
		background: var(--c-surface-2);
		color: var(--c-ink);
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 3.5rem;
		padding: 0 0.5rem;
		background: var(--c-surface);
		border-bottom: 1px solid var(--c-line);
	}
	@media (min-width: 1024px) {
		.topbar {
			display: none;
		}
	}
	.small-brand {
		padding: 0;
	}
	.small-brand img {
		height: 1.9rem;
	}
	.menu-btn {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 9px;
		color: var(--c-ink);
	}
	.menu-btn:hover {
		background: var(--c-surface-2);
	}
	.drawer-bg {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--c-scrim);
	}
	.drawer {
		position: fixed;
		z-index: 51;
		top: 0;
		bottom: 0;
		left: 0;
		width: min(19rem, 86vw);
		display: flex;
		flex-direction: column;
		padding: 0.75rem 0.9rem 1rem;
		background: var(--c-surface);
		overflow-y: auto;
		box-shadow: var(--shadow-modal);
		animation: slide 180ms var(--ease-out);
	}
	@keyframes slide {
		from {
			transform: translateX(-100%);
		}
	}
	.drawer-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.content {
		min-width: 0;
		padding: 1.25rem 1rem 2rem;
	}
	@media (min-width: 640px) {
		.content {
			padding: 2rem 2rem 3rem;
		}
	}
	@media (min-width: 1280px) {
		.content {
			padding: 2.25rem 3rem 3rem;
		}
	}
</style>
