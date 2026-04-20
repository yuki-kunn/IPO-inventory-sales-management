import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// WeatherAPI.comから天候データを取得
export const GET: RequestHandler = async ({ url }) => {
	const date = url.searchParams.get('date');
	const location = url.searchParams.get('location') || 'Izumi, Osaka, Japan';

	if (!date) {
		return json({ error: 'Date parameter is required' }, { status: 400 });
	}

	const apiKey = env.WEATHER_API_KEY;
	if (!apiKey) {
		console.error('WEATHER_API_KEY is not set');
		return json({ error: 'Weather API is not configured' }, { status: 500 });
	}

	try {
		// WeatherAPI.com History API
		const apiUrl = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(location)}&dt=${date}`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
			console.error('WeatherAPI error:', response.status, await response.text());
			return json({ error: 'Failed to fetch weather data' }, { status: response.status });
		}

		const data = await response.json();

		// 天候コードを簡易的に分類
		const condition = data.forecast?.forecastday?.[0]?.day?.condition;
		const conditionCode = condition?.code || 1000;

		// WeatherAPI.comのコードを独自の天候タイプに変換
		let weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'other' = 'other';

		if (conditionCode === 1000) {
			weather = 'sunny'; // 晴れ
		} else if ([1003, 1006, 1009].includes(conditionCode)) {
			weather = 'cloudy'; // 曇り
		} else if (conditionCode >= 1063 && conditionCode <= 1201) {
			weather = 'rainy'; // 雨
		} else if (conditionCode >= 1204 && conditionCode <= 1282) {
			weather = 'snowy'; // 雪
		} else {
			weather = 'other'; // その他
		}

		return json({
			date,
			weather,
			description: condition?.text || 'Unknown',
			temp_c: data.forecast?.forecastday?.[0]?.day?.avgtemp_c
		});
	} catch (error) {
		console.error('Weather API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
