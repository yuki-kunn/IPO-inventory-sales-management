<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div
	class="border-border bg-card text-card-foreground rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md {className}"
>
	{@render children()}
</div>
