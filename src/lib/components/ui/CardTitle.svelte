<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<h3 class="text-2xl leading-none font-semibold tracking-tight {className}">
	{@render children()}
</h3>
