import type { DailySales, Recipe, WeatherType } from '$lib/types';
import {
	DEFAULT_DAY_OF_WEEK_FACTORS,
	DEFAULT_WEATHER_FACTORS,
	PSEUDO_COUNT
} from '$lib/utils/forecastDefaults';

/**
 * 統計的予測ユーティリティ
 * AIを使わず、厳密な統計手法で販売予測を行う
 */

// 係数計算の結果型（係数値 + サンプル数 + データソース区分）
export interface FactorAnalysis {
	factors: Record<number, number> | Record<string, number>;
	counts: Record<number, number> | Record<string, number>;
	sources: Record<number, FactorSource> | Record<string, FactorSource>;
}

export type FactorSource = 'prior' | 'blended' | 'empirical';

export interface DayOfWeekAnalysis {
	factors: Record<number, number>;
	counts: Record<number, number>;
	sources: Record<number, FactorSource>;
}

export interface WeatherAnalysis {
	factors: Record<string, number>;
	counts: Record<string, number>;
	sources: Record<string, FactorSource>;
}

// 移動平均法（Simple Moving Average）
export function calculateMovingAverage(data: number[], period: number): number {
	if (data.length === 0) return 0;
	const relevantData = data.slice(-period);
	return relevantData.reduce((sum, val) => sum + val, 0) / relevantData.length;
}

// 加重移動平均法（Weighted Moving Average）- 直近のデータに重みを置く
export function calculateWeightedMovingAverage(data: number[], period: number): number {
	if (data.length === 0) return 0;
	const relevantData = data.slice(-period);
	let weightSum = 0;
	let valueSum = 0;

	relevantData.forEach((value, index) => {
		const weight = index + 1;
		valueSum += value * weight;
		weightSum += weight;
	});

	return weightSum > 0 ? valueSum / weightSum : 0;
}

// 指数平滑化法（Exponential Smoothing）
export function calculateExponentialSmoothing(data: number[], alpha: number = 0.3): number {
	if (data.length === 0) return 0;
	if (data.length === 1) return data[0];

	let smoothed = data[0];
	for (let i = 1; i < data.length; i++) {
		smoothed = alpha * data[i] + (1 - alpha) * smoothed;
	}
	return smoothed;
}

// 線形回帰によるトレンド予測
export function calculateLinearRegression(data: number[]): {
	slope: number;
	intercept: number;
	nextValue: number;
} {
	if (data.length < 2) {
		return { slope: 0, intercept: data[0] || 0, nextValue: data[0] || 0 };
	}

	const n = data.length;
	let sumX = 0;
	let sumY = 0;
	let sumXY = 0;
	let sumX2 = 0;

	data.forEach((y, x) => {
		sumX += x;
		sumY += y;
		sumXY += x * y;
		sumX2 += x * x;
	});

	const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
	const intercept = (sumY - slope * sumX) / n;
	const nextValue = slope * n + intercept;

	return { slope, intercept, nextValue: Math.max(0, nextValue) };
}

/**
 * 曜日別の販売係数を計算（ベイズ収縮）
 * 実績が少ない場合は業界デフォルト値に引き寄せる
 */
export function calculateDayOfWeekFactors(
	salesHistory: DailySales[],
	pseudoCount: number = PSEUDO_COUNT
): DayOfWeekAnalysis {
	const dayTotals: Record<number, number[]> = {};

	salesHistory.forEach((sale) => {
		const dayOfWeek = new Date(sale.date).getDay();
		if (!dayTotals[dayOfWeek]) {
			dayTotals[dayOfWeek] = [];
		}
		const totalSales = sale.sales?.reduce((sum, p) => sum + p.soldQuantity, 0) || 0;
		dayTotals[dayOfWeek].push(totalSales);
	});

	const allSales = Object.values(dayTotals).flat();
	const overallAvg = allSales.length > 0 ? allSales.reduce((sum, v) => sum + v, 0) / allSales.length : 1;

	const factors: Record<number, number> = {};
	const counts: Record<number, number> = {};
	const sources: Record<number, FactorSource> = {};

	for (let day = 0; day < 7; day++) {
		const n = dayTotals[day]?.length || 0;
		const prior = DEFAULT_DAY_OF_WEEK_FACTORS[day] ?? 1.0;

		if (n === 0) {
			factors[day] = prior;
			sources[day] = 'prior';
		} else {
			const dayAvg = dayTotals[day].reduce((sum, v) => sum + v, 0) / n;
			const empirical = overallAvg > 0 ? dayAvg / overallAvg : 1.0;
			factors[day] = (n * empirical + pseudoCount * prior) / (n + pseudoCount);
			sources[day] = n >= pseudoCount * 2 ? 'empirical' : 'blended';
		}
		counts[day] = n;
	}

	return { factors, counts, sources };
}

/**
 * 天候別の販売係数を計算（ベイズ収縮）
 * 実績が少ない場合は業界デフォルト値に引き寄せる
 */
export function calculateWeatherFactors(salesHistory: DailySales[], pseudoCount: number = PSEUDO_COUNT): WeatherAnalysis {
	const weatherTotals: Record<string, number[]> = {};

	salesHistory.forEach((sale) => {
		const weather = sale.weather || 'other';
		if (!weatherTotals[weather]) {
			weatherTotals[weather] = [];
		}
		const totalSales = sale.sales?.reduce((sum, p) => sum + p.soldQuantity, 0) || 0;
		weatherTotals[weather].push(totalSales);
	});

	const allSales = Object.values(weatherTotals).flat();
	const overallAvg = allSales.length > 0 ? allSales.reduce((sum, v) => sum + v, 0) / allSales.length : 1;

	const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'snowy', 'other'];
	const factors: Record<string, number> = {};
	const counts: Record<string, number> = {};
	const sources: Record<string, FactorSource> = {};

	weatherTypes.forEach((weather) => {
		const n = weatherTotals[weather]?.length || 0;
		const prior = DEFAULT_WEATHER_FACTORS[weather] ?? 1.0;

		if (n === 0) {
			factors[weather] = prior;
			sources[weather] = 'prior';
		} else {
			const weatherAvg = weatherTotals[weather].reduce((sum, v) => sum + v, 0) / n;
			const empirical = overallAvg > 0 ? weatherAvg / overallAvg : 1.0;
			factors[weather] = (n * empirical + pseudoCount * prior) / (n + pseudoCount);
			sources[weather] = n >= pseudoCount * 2 ? 'empirical' : 'blended';
		}
		counts[weather] = n;
	});

	return { factors, counts, sources };
}

/**
 * 商品別の販売予測
 * dailyWeather: 各予測日の天候（null = 不明、1.0として扱う）
 */
export function forecastProductSales(
	productName: string,
	salesHistory: DailySales[],
	forecastDays: number = 7,
	dailyWeather?: (WeatherType | null)[]
): number[] {
	const productSalesData: number[] = [];

	salesHistory.forEach((sale) => {
		const product = sale.sales?.find((p) => p.productName === productName);
		productSalesData.push(product?.soldQuantity || 0);
	});

	if (productSalesData.length === 0) {
		return Array(forecastDays).fill(0);
	}

	const { factors: dayFactors } = calculateDayOfWeekFactors(salesHistory);
	const { factors: weatherFactors } = calculateWeatherFactors(salesHistory);

	const maForecast = calculateMovingAverage(productSalesData, 7);
	const wmaForecast = calculateWeightedMovingAverage(productSalesData, 7);
	const esForecast = calculateExponentialSmoothing(productSalesData, 0.3);
	const lrForecast = calculateLinearRegression(productSalesData).nextValue;

	const baseForecast = (maForecast + wmaForecast + esForecast + lrForecast) / 4;

	const forecasts: number[] = [];
	const today = new Date();

	for (let i = 0; i < forecastDays; i++) {
		// DST安全な日付計算（setDateはサマータイム境界でずれる可能性があるため）
		const forecastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
		const dayOfWeek = forecastDate.getDay();

		const dayFactor = dayFactors[dayOfWeek] ?? 1.0;

		// 天候係数: 当日の天候が分かる場合のみ適用
		const weather = dailyWeather?.[i];
		const weatherFactor = weather ? (weatherFactors[weather] ?? 1.0) : 1.0;

		// 曜日×天候の複合調整は [0.5, 1.5] でキャップ（過補正防止）
		const combinedFactor = Math.min(1.5, Math.max(0.5, dayFactor * weatherFactor));

		forecasts.push(Math.max(0, Math.round(baseForecast * combinedFactor)));
	}

	return forecasts;
}

// レシピベースの原材料必要量予測
export function forecastIngredientDemand(
	ingredientName: string,
	recipes: Recipe[],
	salesHistory: DailySales[],
	forecastDays: number = 7,
	dailyWeather?: (WeatherType | null)[]
): {
	totalDemand: number;
	dailyDemand: number[];
	breakdown: { productName: string; quantity: number }[];
} {
	const productsUsingIngredient: {
		productName: string;
		quantityPerUnit: number;
	}[] = [];

	recipes.forEach((recipe) => {
		const ingredient = recipe.ingredients.find((ing) => ing.ingredientName === ingredientName);
		if (ingredient) {
			productsUsingIngredient.push({
				productName: recipe.productName,
				quantityPerUnit: ingredient.quantity
			});
		}
	});

	if (productsUsingIngredient.length === 0) {
		return {
			totalDemand: 0,
			dailyDemand: Array(forecastDays).fill(0),
			breakdown: []
		};
	}

	const dailyDemand: number[] = Array(forecastDays).fill(0);
	const breakdown: { productName: string; quantity: number }[] = [];

	productsUsingIngredient.forEach(({ productName, quantityPerUnit }) => {
		const productForecasts = forecastProductSales(productName, salesHistory, forecastDays, dailyWeather);

		productForecasts.forEach((forecast, dayIndex) => {
			dailyDemand[dayIndex] += forecast * quantityPerUnit;
		});

		const totalProductDemand = productForecasts.reduce((sum, val) => sum + val, 0);
		const totalIngredientNeeded = totalProductDemand * quantityPerUnit;

		if (totalIngredientNeeded > 0) {
			breakdown.push({
				productName,
				quantity: Math.round(totalIngredientNeeded * 10) / 10
			});
		}
	});

	const totalDemand = dailyDemand.reduce((sum, val) => sum + val, 0);

	return {
		totalDemand: Math.round(totalDemand * 10) / 10,
		dailyDemand: dailyDemand.map((val) => Math.round(val * 10) / 10),
		breakdown
	};
}

// 在庫切れリスクの計算
export function calculateStockoutRisk(
	currentStock: number,
	dailyDemand: number[],
	leadTimeDays: number = 3
): {
	daysUntilStockout: number;
	stockoutRisk: 'low' | 'medium' | 'high' | 'critical';
	recommendedOrderQuantity: number;
} {
	let remainingStock = currentStock;
	let daysUntilStockout = dailyDemand.length;

	for (let i = 0; i < dailyDemand.length; i++) {
		remainingStock -= dailyDemand[i];
		if (remainingStock <= 0) {
			daysUntilStockout = i;
			break;
		}
	}

	let stockoutRisk: 'low' | 'medium' | 'high' | 'critical';
	if (daysUntilStockout <= leadTimeDays) {
		stockoutRisk = 'critical';
	} else if (daysUntilStockout <= leadTimeDays * 2) {
		stockoutRisk = 'high';
	} else if (daysUntilStockout <= leadTimeDays * 3) {
		stockoutRisk = 'medium';
	} else {
		stockoutRisk = 'low';
	}

	const leadTimeDemand = dailyDemand.slice(0, leadTimeDays).reduce((sum, val) => sum + val, 0);
	const safetyStock = leadTimeDemand * 0.5;
	const recommendedOrderQuantity = Math.max(0, leadTimeDemand + safetyStock - currentStock);

	return {
		daysUntilStockout,
		stockoutRisk,
		recommendedOrderQuantity: Math.ceil(recommendedOrderQuantity)
	};
}
