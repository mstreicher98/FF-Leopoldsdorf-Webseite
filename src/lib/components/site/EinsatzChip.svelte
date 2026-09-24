<script lang="ts">
	import { GROUP_LABELS, type EinsatzGroup } from '$lib/einsatz';

	interface Props {
		code: string | null;
		group: EinsatzGroup | null;
		label?: string | null;
		size?: 'sm' | 'md' | 'lg';
	}

	let { code, group, label = null, size = 'sm' }: Props = $props();

	const g = $derived(group ?? 'sonstiges');
</script>

<!-- Farbcode je Einsatzart: Brand rot, Technik blau, Schadstoff Warntafel-Orange -->
<span
	class="chip {size}"
	data-group={g}
	title={label ?? GROUP_LABELS[g]}
	aria-label={`${GROUP_LABELS[g]}${code ? ` ${code}` : ''}`}>{code ?? 'E'}</span
>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-stretch: 75%;
		letter-spacing: 0.02em;
		line-height: 1;
		border-radius: 4px;
		color: #fff;
		background: var(--c-brand);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.chip[data-group='technik'] {
		background: var(--c-technik);
	}
	.chip[data-group='schadstoff'] {
		background: var(--c-schadstoff);
		color: var(--c-night);
	}
	.chip[data-group='sonstiges'] {
		background: var(--c-sonstiges);
	}
	.sm {
		min-width: 2.1rem;
		height: 1.45rem;
		padding: 0 0.4rem;
		font-size: 0.85rem;
	}
	.md {
		min-width: 2.6rem;
		height: 1.8rem;
		padding: 0 0.5rem;
		font-size: 1.05rem;
	}
	.lg {
		min-width: 3.4rem;
		height: 2.4rem;
		padding: 0 0.65rem;
		font-size: 1.45rem;
	}
</style>
