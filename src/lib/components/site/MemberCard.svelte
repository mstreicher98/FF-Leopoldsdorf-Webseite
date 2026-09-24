<script lang="ts">
	import type { MemberView } from '$lib/types';
	import Picture from './Picture.svelte';
	import RankBadge from './RankBadge.svelte';

	let { member, showFunction = true }: { member: MemberView; showFunction?: boolean } = $props();

	const initials = $derived(`${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase());
	const role = $derived(member.kommandoPosition || member.functionTitle);
</script>

<article class="member">
	<div class="photo">
		{#if member.photo}
			<Picture media={member.photo} sizes="(min-width: 1024px) 220px, 45vw" want={400} alt="{member.firstName} {member.lastName}" class="img" />
		{:else}
			<span class="initials" aria-hidden="true">{initials}</span>
		{/if}
	</div>
	<h3 class="name">{member.firstName} {member.lastName}</h3>
	<RankBadge rank={member.rank} honorary={member.honoraryRank} />
	{#if showFunction && role}
		<p class="role">{role}</p>
	{/if}
</article>

<style>
	.member {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
	}
	.photo {
		width: 100%;
		aspect-ratio: 1;
		margin-bottom: 0.4rem;
		border-radius: 10px;
		overflow: hidden;
		background: var(--c-surface-3);
	}
	.photo :global(.img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 25%;
	}
	.initials {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		font-size: clamp(2rem, 6vw, 3rem);
		font-weight: 850;
		font-stretch: 65%;
		color: var(--c-line-strong);
		background: linear-gradient(160deg, var(--c-surface-2), var(--c-surface-3));
	}
	.name {
		font-size: 1.1rem;
		font-weight: 700;
		font-stretch: 85%;
		line-height: 1.2;
	}
	.role {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--c-red);
		line-height: 1.3;
	}
</style>
