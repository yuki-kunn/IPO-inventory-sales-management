import type { WeatherType, DailySales } from '$lib/types';

export interface WeatherData {
	date: string;
	weather: WeatherType;
	description: string;
	temp_c?: number;
}

/**
 * 指定した日付の天候データを取得
 */
export async function fetchWeatherForDate(
	date: string,
	location: string = 'Izumi, Osaka, Japan'
): Promise<WeatherData | null> {
	try {
		const response = await fetch(
			`/api/weather?date=${date}&location=${encodeURIComponent(location)}`
		);
		if (!response.ok) {
			console.error('Weather fetch failed:', response.status);
			return null;
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Weather fetch error:', error);
		return null;
	}
}

/**
 * 予測期間の天候配列を取得
 * - 過去日・当日: /api/weather (history.json) で実績値を取得
 * - 未来日: 同曜日の過去実績から最頻値を推定（天気予報API未対応の代替策）
 *   ※ WeatherAPI forecast.json (3日先・無料プラン) 対応は別スプリントで検討
 */
export async function fetchDailyWeatherForecast(
	startDate: Date,
	days: number,
	salesHistory: DailySales[] = [],
	location: string = 'Izumi, Osaka, Japan'
): Promise<(WeatherType | null)[]> {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const results: (WeatherType | null)[] = [];

	// 過去の同曜日天候データを事前構築（未来日の推定用）
	const historicalWeatherByDayOfWeek = buildHistoricalWeatherByDayOfWeek(salesHistory);

	// 過去日・当日は並列で API 取得
	const fetchPromises: Array<Promise<void>> = [];

	for (let i = 0; i < days; i++) {
		const targetDate = new Date(startDate);
		targetDate.setDate(startDate.getDate() + i);
		targetDate.setHours(0, 0, 0, 0);

		results[i] = null; // 初期化

		if (targetDate <= today) {
			// 過去日・当日: API取得
			const dateStr = targetDate.toISOString().split('T')[0];
			const idx = i;
			fetchPromises.push(
				fetchWeatherForDate(dateStr, location).then((data) => {
					if (data?.weather) results[idx] = data.weather;
				})
			);
		} else {
			// 未来日: 同曜日の過去実績から推定
			const dayOfWeek = targetDate.getDay();
			results[i] = historicalWeatherByDayOfWeek[dayOfWeek] ?? null;
		}
	}

	await Promise.all(fetchPromises);
	return results;
}

/**
 * 履歴データから曜日別の最頻天候を導出
 */
function buildHistoricalWeatherByDayOfWeek(
	salesHistory: DailySales[]
): Record<number, WeatherType | null> {
	const weatherCounts: Record<number, Record<string, number>> = {};

	salesHistory.forEach((sale) => {
		if (!sale.weather) return;
		const dow = new Date(sale.date).getDay();
		if (!weatherCounts[dow]) weatherCounts[dow] = {};
		weatherCounts[dow][sale.weather] = (weatherCounts[dow][sale.weather] || 0) + 1;
	});

	const result: Record<number, WeatherType | null> = {};
	for (let dow = 0; dow < 7; dow++) {
		const counts = weatherCounts[dow];
		if (!counts) {
			result[dow] = null;
			continue;
		}
		// 最頻天候を選択
		const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
		result[dow] = (mostCommon?.[0] as WeatherType) ?? null;
	}
	return result;
}
