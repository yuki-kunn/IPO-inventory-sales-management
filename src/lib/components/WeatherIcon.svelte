<script lang="ts">
	import { Sun, Cloud, CloudRain, CloudSnow, HelpCircle } from 'lucide-svelte';
	import type { WeatherType } from '$lib/types';

	interface Props {
		weather: WeatherType;
		class?: string;
	}

	let { weather, class: className = 'h-4 w-4' }: Props = $props();
</script>

{#if weather === 'sunny'}
	<Sun class={className + ' text-yellow-500'} />
{:else if weather === 'cloudy'}
	<Cloud class={className + ' text-gray-500'} />
{:else if weather === 'rainy'}
	<CloudRain class={className + ' text-blue-500'} />
{:else if weather === 'snowy'}
	<CloudSnow class={className + ' text-cyan-400'} />
{:else if weather === 'other'}
	<HelpCircle class={className + ' text-muted-foreground'} />
{/if}
