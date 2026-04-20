<script lang="ts">
	import type { WeatherType } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import { getWeatherLabel } from '$lib/utils/weatherFormatter';

	interface Props {
		weatherFilter: WeatherType | 'all';
		onFilterChange: (filter: WeatherType | 'all') => void;
	}

	let { weatherFilter, onFilterChange }: Props = $props();

	const weatherOptions: Array<{ value: WeatherType | 'all'; label: string; hasIcon: boolean }> = [
		{ value: 'all', label: 'すべて', hasIcon: false },
		{ value: 'sunny', label: '晴れ', hasIcon: true },
		{ value: 'cloudy', label: '曇り', hasIcon: true },
		{ value: 'rainy', label: '雨', hasIcon: true },
		{ value: 'snowy', label: '雪', hasIcon: true },
		{ value: 'other', label: 'その他', hasIcon: false }
	];
</script>

<div class="flex flex-wrap gap-2">
	{#each weatherOptions as option}
		<Button
			variant={weatherFilter === option.value ? 'default' : 'outline'}
			size="sm"
			onclick={() => onFilterChange(option.value)}
			class={option.hasIcon ? 'flex touch-manipulation items-center gap-1' : 'touch-manipulation'}
		>
			{#if option.hasIcon && option.value !== 'all'}
				<WeatherIcon weather={option.value} class="h-4 w-4" />
			{/if}
			{option.label}
		</Button>
	{/each}
</div>
{#if weatherFilter !== 'all'}
	<p class="text-muted-foreground mt-3 text-sm">
		現在、{getWeatherLabel(weatherFilter)}の日のみを表示しています
	</p>
{/if}
