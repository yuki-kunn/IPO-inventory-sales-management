<script lang="ts">
	import { Sun, Cloud, CloudRain, CloudSnow, HelpCircle } from 'lucide-svelte';
	import type { WeatherType } from '$lib/types';

	interface Props {
		weather: WeatherType;
		onSelect: (weather: WeatherType) => void;
	}

	let { weather, onSelect }: Props = $props();

	const weatherOptions: Array<{ value: WeatherType; label: string; icon: any; color: string }> = [
		{ value: 'sunny', label: '晴れ', icon: Sun, color: 'text-yellow-500' },
		{ value: 'cloudy', label: '曇り', icon: Cloud, color: 'text-gray-500' },
		{ value: 'rainy', label: '雨', icon: CloudRain, color: 'text-blue-500' },
		{ value: 'snowy', label: '雪', icon: CloudSnow, color: 'text-cyan-400' },
		{ value: 'other', label: 'その他', icon: HelpCircle, color: 'text-muted-foreground' }
	];
</script>

<div class="flex flex-wrap gap-2">
	{#each weatherOptions as option}
		{@const Icon = option.icon}
		<button
			onclick={() => onSelect(option.value)}
			class="flex items-center gap-1 rounded-md border px-3 py-1.5 transition-all {weather ===
			option.value
				? 'bg-primary text-primary-foreground border-primary'
				: 'bg-background border-border hover:bg-muted'}"
		>
			<Icon class="h-4 w-4 {weather === option.value ? '' : option.color}" />
			<span class="text-xs font-medium">{option.label}</span>
		</button>
	{/each}
</div>
