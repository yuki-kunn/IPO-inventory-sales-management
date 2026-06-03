import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createErrorResponse, createValidationError } from '$lib/utils/errorHandler';

// WeatherAPI.comから天候データを取得
export const GET: RequestHandler = async ({ url }) => {
	const date = url.searchParams.get('date');
	const location = url.searchParams.get('location') || 'Izumi, Osaka, Japan';

	if (!date) {
		return createValidationError('日付パラメータが必要です', 'date');
	}

	const apiKey = env.WEATHER_API_KEY;
	if (!apiKey) {
		console.error('[Weather API] WEATHER_API_KEY is not set');
		return json({ error: '天候API設定がありません' }, { status: 500 });
	}

	try {
		// JST-aware today
		const jstToday = new Intl.DateTimeFormat('ja-JP', {
		  timeZone: 'Asia/Tokyo',
		  year: 'numeric', month: '2-digit', day: '2-digit'
		}).format(new Date()).replace(/\//g, '-');

		const isFuture = date >= jstToday;
		const apiUrl = isFuture
		  ? `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3`
		  : `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(location)}&dt=${date}`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
		  const errorText = await response.text();
		  console.error('[Weather API] External API error:', response.status, errorText);
		  return json({ error: '天候データの取得に失敗しました' }, { status: 502 });
		}

		const data = await response.json();

		// forecast.json returns forecastday[] — find matching date; history.json returns forecastday[0]
		const forecastDay = isFuture
		  ? data.forecast?.forecastday?.find((d: { date: string }) => d.date === date)
		  : data.forecast?.forecastday?.[0];

		if (isFuture && !forecastDay) {
		  return json({ error: '指定日の天気予報データがありません（無料プランは3日先まで）' }, { status: 404 });
		}

		// 天候コードを簡易的に分類
		const condition = forecastDay?.day?.condition;
		const conditionCode = condition?.code || 1000;

		// WeatherAPI.comのコードを独自の天候タイプに変換
		// 参照: https://www.weatherapi.com/docs/weather_conditions.json
		let weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'other' = 'other';

		// 晴れ: Clear/Sunny
		const SUNNY_CODES = [1000];

		// 曇り: Partly cloudy / Cloudy / Overcast / Mist / Fog / Thundery possible
		const CLOUDY_CODES = [1003, 1006, 1009, 1030, 1087, 1135, 1147];

		// 雨: 霧雨・雨・にわか雨・凍雨・雷雨（雪を含まないもの）
		const RAINY_CODES = [
			1063, // Patchy rain possible
			1072, // Patchy freezing drizzle possible
			1150, // Patchy light drizzle
			1153, // Light drizzle
			1168, // Freezing drizzle
			1171, // Heavy freezing drizzle
			1180, // Patchy light rain
			1183, // Light rain
			1186, // Moderate rain at times
			1189, // Moderate rain
			1192, // Heavy rain at times
			1195, // Heavy rain
			1198, // Light freezing rain
			1201, // Moderate or heavy freezing rain
			1240, // Light rain shower
			1243, // Moderate or heavy rain shower
			1246, // Torrential rain shower
			1273, // Patchy light rain with thunder
			1276  // Moderate or heavy rain with thunder
		];

		// 雪: 雪・みぞれ・霙・氷粒・雷雪
		const SNOWY_CODES = [
			1066, // Patchy snow possible
			1069, // Patchy sleet possible
			1114, // Blowing snow
			1117, // Blizzard
			1204, // Light sleet
			1207, // Moderate or heavy sleet
			1210, // Patchy light snow
			1213, // Light snow
			1216, // Patchy moderate snow
			1219, // Moderate snow
			1222, // Patchy heavy snow
			1225, // Heavy snow
			1237, // Ice pellets
			1249, // Light sleet showers
			1252, // Moderate or heavy sleet showers
			1255, // Light snow showers
			1258, // Moderate or heavy snow showers
			1261, // Light showers of ice pellets
			1264, // Moderate or heavy showers of ice pellets
			1279, // Patchy light snow with thunder
			1282  // Moderate or heavy snow with thunder
		];

		if (SUNNY_CODES.includes(conditionCode)) {
			weather = 'sunny';
		} else if (CLOUDY_CODES.includes(conditionCode)) {
			weather = 'cloudy';
		} else if (RAINY_CODES.includes(conditionCode)) {
			weather = 'rainy';
		} else if (SNOWY_CODES.includes(conditionCode)) {
			weather = 'snowy';
		} else {
			weather = 'other';
		}

		return json({
			date,
			weather,
			description: condition?.text || 'Unknown',
			temp_c: forecastDay?.day?.avgtemp_c
		});
	} catch (error: any) {
		return createErrorResponse(error, '天候データの取得中にエラーが発生しました', 500);
	}
};
