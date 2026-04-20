<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variantClasses = {
		default: 'bg-primary text-primary-foreground hover:opacity-90 transition-opacity',
		destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity',
		outline: 'border border-border bg-transparent hover:bg-accent transition-colors',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors',
		ghost: 'hover:bg-accent hover:text-accent-foreground transition-colors',
		link: 'text-primary underline-offset-4 hover:underline'
	};

	const sizeClasses = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
		lg: 'h-11 rounded-md px-8',
		icon: 'h-10 w-10'
	};
</script>

<button
	class="focus-visible:ring-primary focus-visible:ring-offset-background inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 {variantClasses[
		variant
	]} {sizeClasses[size]} {className}"
	{...rest}
>
	{@render children()}
</button>
