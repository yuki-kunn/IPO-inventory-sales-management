<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div
	class="border-border bg-card text-card-foreground rounded-md border transition-colors {className}"
>
	{@render children()}
</div>
