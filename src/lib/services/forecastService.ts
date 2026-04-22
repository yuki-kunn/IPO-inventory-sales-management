import type { DailySales, Recipe, Ingredient } from '$lib/types';
import {
	forecastProductSales,
	forecastIngredientDemand,
	calculateStockoutRisk,
	calculateDayOfWeekFactors,
	calculateWeatherFactors
} from '$lib/utils/forecastUtils';

export interface ProductForecast {
	productName: string;
	forecasts: number[]; // 日次予測値
	totalForecast: number; // 予測期間の合計
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

export interface ForecastSummary {
	forecastPeriodDays: number;
	forecastStartDate: string;
	forecastEndDate: string;
	productForecasts: ProductForecast[];
	ingredientForecasts: IngredientForecast[];
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
		this.salesHistory = salesHistory.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);
		this.recipes = recipes;
		this.ingredients = ingredients;
	}

	/**
	 * 完全な予測レポートを生成
	 */
	generateForecast(forecastDays: number = 7): ForecastSummary {
		const today = new Date();
		const endDate = new Date(today);
		endDate.setDate(today.getDate() + forecastDays - 1);

		// 商品別予測を生成
		const productForecasts = this.generateProductForecasts(forecastDays);

		// 原材料別予測を生成
		const ingredientForecasts = this.generateIngredientForecasts(forecastDays);

		// 曜日・天候係数を計算
		const dayOfWeekFactors = calculateDayOfWeekFactors(this.salesHistory);
		const weatherFactors = calculateWeatherFactors(this.salesHistory);

		return {
			forecastPeriodDays: forecastDays,
			forecastStartDate: today.toISOString().split('T')[0],
			forecastEndDate: endDate.toISOString().split('T')[0],
			productForecasts,
			ingredientForecasts,
			dayOfWeekFactors,
			weatherFactors
		};
	}

	/**
	 * 商品別の販売予測を生成
	 */
	private generateProductForecasts(forecastDays: number): ProductForecast[] {
		// すべての販売商品を抽出
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
			const forecastValues = forecastProductSales(productName, this.salesHistory, forecastDays);

			const totalForecast = forecastValues.reduce((sum, val) => sum + val, 0);

			// トレンド分析（最初の3日と最後の3日を比較）
			const earlyAvg =
				forecastValues.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
			const lateAvg =
				forecastValues.slice(-3).reduce((sum, val) => sum + val, 0) / 3;

			let trend: 'increasing' | 'stable' | 'decreasing';
			if (lateAvg > earlyAvg * 1.1) {
				trend = 'increasing';
			} else if (lateAvg < earlyAvg * 0.9) {
				trend = 'decreasing';
			} else {
				trend = 'stable';
			}

			// 信頼度（データ量に基づく）
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

		// 予測販売量でソート（降順）
		return forecasts.sort((a, b) => b.totalForecast - a.totalForecast);
	}

	/**
	 * 原材料別の需要予測を生成
	 */
	private generateIngredientForecasts(forecastDays: number): IngredientForecast[] {
		const forecasts: IngredientForecast[] = [];

		this.ingredients.forEach((ingredient) => {
			// 需要予測
			const demand = forecastIngredientDemand(
				ingredient.name,
				this.recipes,
				this.salesHistory,
				forecastDays
			);

			// 在庫切れリスク計算
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

		// 在庫切れリスクの高い順にソート
		const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
		return forecasts.sort(
			(a, b) => riskOrder[a.stockStatus.stockoutRisk] - riskOrder[b.stockStatus.stockoutRisk]
		);
	}

	/**
	 * 特定の原材料の詳細予測を取得
	 */
	getIngredientDetailedForecast(ingredientName: string, forecastDays: number = 14) {
		const ingredient = this.ingredients.find((ing) => ing.name === ingredientName);
		if (!ingredient) {
			return null;
		}

		const demand = forecastIngredientDemand(
			ingredientName,
			this.recipes,
			this.salesHistory,
			forecastDays
		);

		const stockStatus = calculateStockoutRisk(ingredient.stockQuantity, demand.dailyDemand, 3);

		// 日別の在庫推移を計算
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
