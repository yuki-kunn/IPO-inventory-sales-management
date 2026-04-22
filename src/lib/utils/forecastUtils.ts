import type { DailySales, Recipe, Ingredient, WeatherType } from '$lib/types';

/**
 * 統計的予測ユーティリティ
 * AIを使わず、厳密な統計手法で販売予測を行う
 */

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
		const weight = index + 1; // 新しいデータほど重みが大きい
		valueSum += value * weight;
		weightSum += weight;
	});

	return weightSum > 0 ? valueSum / weightSum : 0;
}

// 指数平滑化法（Exponential Smoothing）
export function calculateExponentialSmoothing(
	data: number[],
	alpha: number = 0.3
): number {
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

// 曜日別の販売係数を計算
export function calculateDayOfWeekFactors(
	salesHistory: DailySales[]
): Record<number, number> {
	const dayTotals: Record<number, number[]> = {};

	salesHistory.forEach((sale) => {
		const dayOfWeek = new Date(sale.date).getDay(); // 0=日曜, 6=土曜
		if (!dayTotals[dayOfWeek]) {
			dayTotals[dayOfWeek] = [];
		}
		const totalSales = sale.sales?.reduce((sum, p) => sum + p.quantity, 0) || 0;
		dayTotals[dayOfWeek].push(totalSales);
	});

	// 全体平均を計算
	const allSales = Object.values(dayTotals).flat();
	const overallAvg = allSales.reduce((sum, val) => sum + val, 0) / allSales.length;

	// 各曜日の係数を計算（全体平均との比率）
	const factors: Record<number, number> = {};
	for (let day = 0; day < 7; day++) {
		if (dayTotals[day] && dayTotals[day].length > 0) {
			const dayAvg = dayTotals[day].reduce((sum, val) => sum + val, 0) / dayTotals[day].length;
			factors[day] = dayAvg / overallAvg;
		} else {
			factors[day] = 1.0;
		}
	}

	return factors;
}

// 天候別の販売係数を計算
export function calculateWeatherFactors(
	salesHistory: DailySales[]
): Record<WeatherType, number> {
	const weatherTotals: Record<string, number[]> = {};

	salesHistory.forEach((sale) => {
		const weather = sale.weather || 'other';
		if (!weatherTotals[weather]) {
			weatherTotals[weather] = [];
		}
		const totalSales = sale.sales?.reduce((sum, p) => sum + p.quantity, 0) || 0;
		weatherTotals[weather].push(totalSales);
	});

	// 全体平均を計算
	const allSales = Object.values(weatherTotals).flat();
	const overallAvg = allSales.reduce((sum, val) => sum + val, 0) / allSales.length;

	// 各天候の係数を計算
	const factors: Record<string, number> = {};
	const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'snowy', 'other'];

	weatherTypes.forEach((weather) => {
		if (weatherTotals[weather] && weatherTotals[weather].length > 0) {
			const weatherAvg =
				weatherTotals[weather].reduce((sum, val) => sum + val, 0) / weatherTotals[weather].length;
			factors[weather] = weatherAvg / overallAvg;
		} else {
			factors[weather] = 1.0;
		}
	});

	return factors as Record<WeatherType, number>;
}

// 商品別の販売予測
export function forecastProductSales(
	productName: string,
	salesHistory: DailySales[],
	forecastDays: number = 7,
	targetDayOfWeek?: number,
	targetWeather?: WeatherType
): number[] {
	// 商品の過去販売データを抽出
	const productSalesData: number[] = [];

	salesHistory.forEach((sale) => {
		const product = sale.sales?.find((p) => p.productName === productName);
		productSalesData.push(product?.soldQuantity || 0);
	});

	if (productSalesData.length === 0) {
		return Array(forecastDays).fill(0);
	}

	// 曜日係数と天候係数を計算
	const dayFactors = calculateDayOfWeekFactors(salesHistory);
	const weatherFactors = calculateWeatherFactors(salesHistory);

	// 複数の手法で予測して平均を取る（アンサンブル手法）
	const maForecast = calculateMovingAverage(productSalesData, 7);
	const wmaForecast = calculateWeightedMovingAverage(productSalesData, 7);
	const esForecast = calculateExponentialSmoothing(productSalesData, 0.3);
	const lrForecast = calculateLinearRegression(productSalesData).nextValue;

	// 基本予測値（4つの手法の平均）
	const baseForecast = (maForecast + wmaForecast + esForecast + lrForecast) / 4;

	// 各日の予測値を計算
	const forecasts: number[] = [];
	const today = new Date();

	for (let i = 0; i < forecastDays; i++) {
		const forecastDate = new Date(today);
		forecastDate.setDate(today.getDate() + i);
		const dayOfWeek = forecastDate.getDay();

		// 曜日係数を適用
		let adjustedForecast = baseForecast * (dayFactors[dayOfWeek] || 1.0);

		// 天候係数を適用（指定されている場合）
		if (targetWeather) {
			adjustedForecast *= weatherFactors[targetWeather] || 1.0;
		}

		forecasts.push(Math.round(adjustedForecast));
	}

	return forecasts;
}

// レシピベースの原材料必要量予測
export function forecastIngredientDemand(
	ingredientName: string,
	recipes: Recipe[],
	salesHistory: DailySales[],
	forecastDays: number = 7
): {
	totalDemand: number;
	dailyDemand: number[];
	breakdown: { productName: string; quantity: number }[];
} {
	// この原材料を使用する商品を特定
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

	// 各商品の販売予測を取得し、原材料必要量に変換
	const dailyDemand: number[] = Array(forecastDays).fill(0);
	const breakdown: { productName: string; quantity: number }[] = [];

	productsUsingIngredient.forEach(({ productName, quantityPerUnit }) => {
		const productForecasts = forecastProductSales(productName, salesHistory, forecastDays);

		productForecasts.forEach((forecast, dayIndex) => {
			const ingredientNeeded = forecast * quantityPerUnit;
			dailyDemand[dayIndex] += ingredientNeeded;
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

	// リスクレベルの判定
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

	// 推奨発注量（リードタイム + 安全在庫分）
	const leadTimeDemand = dailyDemand.slice(0, leadTimeDays).reduce((sum, val) => sum + val, 0);
	const safetyStock = leadTimeDemand * 0.5; // 安全在庫は50%
	const recommendedOrderQuantity = Math.max(0, leadTimeDemand + safetyStock - currentStock);

	return {
		daysUntilStockout,
		stockoutRisk,
		recommendedOrderQuantity: Math.ceil(recommendedOrderQuantity)
	};
}
