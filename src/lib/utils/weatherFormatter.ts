import type { WeatherType } from '$lib/types';

/**
 * 天候タイプを日本語ラベルに変換
 */
export function getWeatherLabel(weather: WeatherType | 'all'): string {
	const labels: Record<WeatherType | 'all', string> = {
		sunny: '晴れ',
		cloudy: '曇り',
		rainy: '雨',
		snowy: '雪',
		other: 'その他',
		all: 'すべて',
		'': ''
	};
	return labels[weather] || 'その他';
}
