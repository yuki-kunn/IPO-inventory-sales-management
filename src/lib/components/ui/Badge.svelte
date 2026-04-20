<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();

	const variantClasses = {
		default: 'border-transparent bg-primary/10 text-primary',
		secondary: 'border-transparent bg-secondary text-secondary-foreground',
		destructive: 'border-transparent bg-red-500/10 text-red-500 dark:text-red-400',
		outline: 'text-foreground border-border',
		success: 'border-transparent bg-green-500/10 text-green-600 dark:text-green-400',
		warning: 'border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
	};
</script>

<div
	class="focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none {variantClasses[
		variant
	]} {className}"
>
	{@render children()}
</div>
