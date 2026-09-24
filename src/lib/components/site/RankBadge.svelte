<script lang="ts">
	import { isKnownRank, rankName, rankShort } from '$lib/dienstgrade';

	let { rank, honorary = false }: { rank: string; honorary?: boolean } = $props();
</script>

<span class="rank" title={rankName(rank, honorary)}>
	{#if isKnownRank(rank)}
		<img src="/dienstgrade/{rank}.png" alt="" width="50" height="50" loading="lazy" />
	{/if}
	<span class="code">{rankShort(rank, honorary)}</span>
</span>

<style>
	.rank {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	img {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 3px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.08);
	}
	.code {
		font-weight: 800;
		font-stretch: 75%;
		font-size: 0.95rem;
		letter-spacing: 0.02em;
	}
</style>
