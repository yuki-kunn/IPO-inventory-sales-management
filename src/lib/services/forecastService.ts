import type { DailySales, Recipe, Ingredient, WeatherType } from '$lib/types';
import {
	forecastProductSales,
	forecastIngredientDemand,
	calculateStockoutRisk,
	calculateDayOfWeekFactors,
	calculateWeatherFactors,
	type DayOfWeekAnalysis,
	type WeatherAnalysis
} from '$lib/utils/forecastUtils';

export interface ProductForecast {
	productName: string;
	forecasts: number[];
	totalForecast: number;
	trend: 'increasing' | 'stable' | 'decreasing';
	confidence: 'high' | 'medium' | 'low';
}

export interface IngredientForecast {
	ingredientId: string;
	ingredientName: string;
	currentStock: number;
	unit: string;
	demand: {
		totalDemand: number;
		dailyDemand: number[];
		breakdown: { productName: string; quantity: number }[];
	};
	stockStatus: {
		daysUntilStockout: number;
		stockoutRisk: 'low' | 'medium' | 'high' | 'critical';
		recommendedOrderQuantity: number;
	};
}

/** 翌日の売上予測（商品別） */
export interface TomorrowProductForecast {
	productName: string;
	predictedQuantity: number;
	estimatedRevenue: number; // 過去平均単価 × 予測数量
	avgUnitPrice: number;
}

/** 翌日の売上予測サマリー */
export interface TomorrowForecast {
	date: string;
	dayOfWeek: number;
	weather: WeatherType | null;
	products: TomorrowProductForecast[];
	totalPredictedQuantity: number;
	totalEstimatedRevenue: number;
	ingredientWarnings: {
		ingredientName: string;
		unit: string;
		currentStock: number;
		tomorrowDemand: number;
		stockoutRisk: 'low' | 'medium' | 'high' | 'critical';
	}[];
}

export interface ForecastSummary {
	forecastPeriodDays: number;
	forecastStartDate: string;
	forecastEndDate: string;
	productForecasts: ProductForecast[];
	ingredientForecasts: IngredientForecast[];
	dayOfWeekAnalysis: DayOfWeekAnalysis;
	weatherAnalysis: WeatherAnalysis;
	tomorrowForecast: TomorrowForecast | null;
	// 後方互換のためのショートハンド
	dayOfWeekFactors: Record<number, number>;
	weatherFactors: Record<string, number>;
}

/**
 * 販売予測サービス
 */
export class ForecastService {
	private salesHistory: DailySales[];
	private recipes: Recipe[];
	private ingredients: Ingredient[];

	constructor(salesHistory: DailySales[], recipes: Recipe[], ingredients: Ingredient[]) {
		this.salesHistory = [...salesHistory].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);
		this.recipes = recipes;
		this.ingredients = ingredients;
	}

	/**
	 * 完全な予測レポートを生成
	 * @param forecastDays 予測日数
	 * @param dailyWeather 各予測日の天候（page側で事前取得して渡す）
	 */
	generateForecast(forecastDays: number = 7, dailyWeather?: (WeatherType | null)[]): ForecastSummary {
		const today = new Date();
		const endDate = new Date(today);
		endDate.setDate(today.getDate() + forecastDays - 1);

		const productForecasts = this.generateProductForecasts(forecastDays, dailyWeather);
		const ingredientForecasts = this.generateIngredientForecasts(forecastDays, dailyWeather);

		const dayOfWeekAnalysis = calculateDayOfWeekFactors(this.salesHistory);
		const weatherAnalysis = calculateWeatherFactors(this.salesHistory);

		// 翌日予測（dailyWeather[1] = 明日の天候）
		const tomorrowWeather = dailyWeather?.[1] ?? null;
		const tomorrowForecast = forecastDays >= 2
			? this.generateTomorrowForecast(productForecasts, ingredientForecasts, tomorrowWeather)
			: null;

		return {
			forecastPeriodDays: forecastDays,
			forecastStartDate: today.toISOString().split('T')[0],
			forecastEndDate: endDate.toISOString().split('T')[0],
			productForecasts,
			ingredientForecasts,
			dayOfWeekAnalysis,
			weatherAnalysis,
			tomorrowForecast,
			dayOfWeekFactors: dayOfWeekAnalysis.factors as Record<number, number>,
			weatherFactors: weatherAnalysis.factors
		};
	}

	/**
	 * 翌日の詳細売上予測を生成
	 */
	private generateTomorrowForecast(
		productForecasts: ProductForecast[],
		ingredientForecasts: IngredientForecast[],
		weather: WeatherType | null
	): TomorrowForecast | null {
		if (this.salesHistory.length === 0) return null;

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = tomorrow.toISOString().split('T')[0];

		// 商品別の平均単価を過去データから計算
		const avgUnitPrices = this.calculateAvgUnitPrices();

		// 翌日予測 = productForecasts[i].forecasts[1]（index 1 = 明日）
		const products: TomorrowProductForecast[] = productForecasts
			.map((pf) => {
				const qty = pf.forecasts[1] ?? 0;
				const avgPrice = avgUnitPrices[pf.productName] ?? 0;
				return {
					productName: pf.productName,
					predictedQuantity: qty,
					estimatedRevenue: Math.round(qty * avgPrice),
					avgUnitPrice: Math.round(avgPrice)
				};
			})
			.filter((p) => p.predictedQuantity > 0)
			.sort((a, b) => b.predictedQuantity - a.predictedQuantity);

		const totalPredictedQuantity = products.reduce((sum, p) => sum + p.predictedQuantity, 0);
		const totalEstimatedRevenue = products.reduce((sum, p) => sum + p.estimatedRevenue, 0);

		// 翌日の原材料警告（在庫が明日需要を下回るもの）
		const ingredientWarnings = ingredientForecasts
			.filter((ing) => {
				const tomorrowDemand = ing.demand.dailyDemand[1] ?? 0;
				return tomorrowDemand > 0 && (
					ing.stockStatus.stockoutRisk !== 'low' ||
					tomorrowDemand > ing.currentStock
				);
			})
			.map((ing) => ({
				ingredientName: ing.ingredientName,
				unit: ing.unit,
				currentStock: ing.currentStock,
				tomorrowDemand: ing.demand.dailyDemand[1] ?? 0,
				stockoutRisk: ing.stockStatus.stockoutRisk
			}))
			.slice(0, 5); // 上位5件のみ

		return {
			date: tomorrowStr,
			dayOfWeek: tomorrow.getDay(),
			weather,
			products,
			totalPredictedQuantity,
			totalEstimatedRevenue,
			ingredientWarnings
		};
	}

	/**
	 * 商品別の過去平均単価を計算（売上金額 ÷ 販売数）
	 */
	private calculateAvgUnitPrices(): Record<string, number> {
		const totals: Record<string, { revenue: number; quantity: number }> = {};

		this.salesHistory.forEach((sale) => {
			sale.sales?.forEach((s) => {
				if (!totals[s.productName]) totals[s.productName] = { revenue: 0, quantity: 0 };
				totals[s.productName].revenue += s.totalSales || 0;
				totals[s.productName].quantity += s.soldQuantity || 0;
			});
		});

		const prices: Record<string, number> = {};
		for (const [name, { revenue, quantity }] of Object.entries(totals)) {
			prices[name] = quantity > 0 ? revenue / quantity : 0;
		}
		return prices;
	}

	private generateProductForecasts(forecastDays: number, dailyWeather?: (WeatherType | null)[]): ProductForecast[] {
		const productNames = new Set<string>();

		this.salesHistory.forEach((sale) => {
			if (sale.sales) {
				sale.sales.forEach((product) => {
					productNames.add(product.productName);
				});
			}
		});

		const forecasts: ProductForecast[] = [];

		productNames.forEach((productName) => {
			const forecastValues = forecastProductSales(productName, this.salesHistory, forecastDays, dailyWeather);

			const totalForecast = forecastValues.reduce((sum, val) => sum + val, 0);

			const earlyAvg = forecastValues.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
			const lateAvg = forecastValues.slice(-3).reduce((sum, val) => sum + val, 0) / 3;

			let trend: 'increasing' | 'stable' | 'decreasing';
			if (lateAvg > earlyAvg * 1.1) {
				trend = 'increasing';
			} else if (lateAvg < earlyAvg * 0.9) {
				trend = 'decreasing';
			} else {
				trend = 'stable';
			}

			const productSalesCount = this.salesHistory.filter((sale) =>
				sale.sales?.some((p) => p.productName === productName)
			).length;

			let confidence: 'high' | 'medium' | 'low';
			if (productSalesCount >= 30) {
				confidence = 'high';
			} else if (productSalesCount >= 10) {
				confidence = 'medium';
			} else {
				confidence = 'low';
			}

			forecasts.push({
				productName,
				forecasts: forecastValues,
				totalForecast,
				trend,
				confidence
			});
		});

		return forecasts.sort((a, b) => b.totalForecast - a.totalForecast);
	}

	private generateIngredientForecasts(forecastDays: number, dailyWeather?: (WeatherType | null)[]): IngredientForecast[] {
		const forecasts: IngredientForecast[] = [];

		this.ingredients.forEach((ingredient) => {
			const demand = forecastIngredientDemand(
				ingredient.name,
				this.recipes,
				this.salesHistory,
				forecastDays,
				dailyWeather
			);
			const stockStatus = calculateStockoutRisk(ingredient.stockQuantity, demand.dailyDemand, 3);

			forecasts.push({
				ingredientId: ingredient.id,
				ingredientName: ingredient.name,
				currentStock: ingredient.stockQuantity,
				unit: ingredient.unit,
				demand,
				stockStatus
			});
		});

		const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
		return forecasts.sort(
			(a, b) => riskOrder[a.stockStatus.stockoutRisk] - riskOrder[b.stockStatus.stockoutRisk]
		);
	}

	getIngredientDetailedForecast(ingredientName: string, forecastDays: number = 14) {
		const ingredient = this.ingredients.find((ing) => ing.name === ingredientName);
		if (!ingredient) {
			return null;
		}

		const demand = forecastIngredientDemand(ingredientName, this.recipes, this.salesHistory, forecastDays);
		const stockStatus = calculateStockoutRisk(ingredient.stockQuantity, demand.dailyDemand, 3);

		const stockProjection: { date: string; stock: number; demand: number }[] = [];
		let currentStock = ingredient.stockQuantity;
		const today = new Date();

		for (let i = 0; i < forecastDays; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);

			const dayDemand = demand.dailyDemand[i] || 0;
			currentStock -= dayDemand;

			stockProjection.push({
				date: date.toISOString().split('T')[0],
				stock: Math.max(0, Math.round(currentStock * 10) / 10),
				demand: dayDemand
			});
		}

		return {
			ingredient: {
				id: ingredient.id,
				name: ingredient.name,
				currentStock: ingredient.stockQuantity,
				unit: ingredient.unit,
				minStockLevel: ingredient.minStockLevel
			},
			demand,
			stockStatus,
			stockProjection
		};
	}
}
