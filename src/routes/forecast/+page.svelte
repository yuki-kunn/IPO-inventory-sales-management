<script lang="ts">
	import { TrendingUp, AlertTriangle, ShoppingCart, Calendar, Sun, Moon, CloudRain, Zap } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { dailySales } from '$lib/stores/dailySales.api';
	import { recipes } from '$lib/stores/recipes.firestore';
	import { ingredients } from '$lib/stores/ingredients.firestore';
	import { darkMode } from '$lib/stores/darkMode';
	import { ForecastService, type ForecastSummary, type TomorrowForecast } from '$lib/services/forecastService';
	import { fetchDailyWeatherForecast } from '$lib/utils/weatherService';
	import type { WeatherType } from '$lib/types';
	import type { FactorSource } from '$lib/utils/forecastUtils';

	let currentDailySales = $state($dailySales);
	let currentRecipes = $state($recipes);
	let currentIngredients = $state($ingredients);
	let isDarkMode = $state($darkMode);
	let forecastDays = $state(7);
	let forecastData = $state<ForecastSummary | null>(null);
	let isCalculating = $state(false);
	let weatherLoadingStatus = $state<'idle' | 'loading' | 'partial' | 'done'>('idle');
	let activeTab = $state<'tomorrow' | 'period' | 'factors'>('tomorrow');

	dailySales.subscribe((value) => {
		currentDailySales = value;
	});

	recipes.subscribe((value) => {
		currentRecipes = value;
	});

	ingredients.subscribe((value) => {
		currentIngredients = value;
	});

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	function toggleDarkMode() {
		darkMode.toggle();
	}

	async function calculateForecast() {
		isCalculating = true;
		activeTab = forecastDays === 2 ? 'tomorrow' : 'period';
		weatherLoadingStatus = 'loading';

		try {
			// 予測期間の天候を事前取得（未来日は同曜日の過去実績で補完）
			const today = new Date();
			const dailyWeather = await fetchDailyWeatherForecast(
				today,
				forecastDays,
				currentDailySales
			);
			weatherLoadingStatus = dailyWeather.some((w) => w !== null) ? 'done' : 'partial';

			const service = new ForecastService(currentDailySales, currentRecipes, currentIngredients);
			forecastData = service.generateForecast(forecastDays, dailyWeather as (WeatherType | null)[]);
		} catch (error) {
			console.error('[Forecast] 予測計算エラー:', error);
			weatherLoadingStatus = 'idle';
			alert(`予測計算に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\nコンソールで詳細を確認してください。`);
		} finally {
			isCalculating = false;
		}
	}

	function getRiskColor(risk: string) {
		switch (risk) {
			case 'critical':
				return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
			case 'high':
				return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
			case 'medium':
				return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
			case 'low':
				return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
			default:
				return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
		}
	}

	function getRiskLabel(risk: string) {
		switch (risk) {
			case 'critical':
				return '緊急';
			case 'high':
				return '高';
			case 'medium':
				return '中';
			case 'low':
				return '低';
			default:
				return '不明';
		}
	}

	function getTrendIcon(trend: string) {
		switch (trend) {
			case 'increasing':
				return '↗';
			case 'decreasing':
				return '↘';
			default:
				return '→';
		}
	}

	function getDayOfWeekName(day: number): string {
		const names = ['日', '月', '火', '水', '木', '金', '土'];
		return names[day];
	}

	function getSourceLabel(source: FactorSource): string {
		switch (source) {
			case 'prior':
				return '既定値';
			case 'blended':
				return '混合';
			case 'empirical':
				return '実績';
		}
	}

	function getWeatherLabel(weather: string | null): string {
		switch (weather) {
			case 'sunny': return '☀️ 晴れ';
			case 'cloudy': return '☁️ 曇り';
			case 'rainy': return '🌧️ 雨';
			case 'snowy': return '❄️ 雪';
			case null: return '？ 不明';
			default: return '🌤️ その他';
		}
	}

	function formatRevenue(yen: number): string {
		if (yen >= 10000) return `¥${(yen / 10000).toFixed(1)}万`;
		return `¥${yen.toLocaleString()}`;
	}

	function getSourceBadgeClass(source: FactorSource): string {
		switch (source) {
			case 'prior':
				return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
			case 'blended':
				return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
			case 'empirical':
				return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
		}
	}

	// 初回表示時に自動計算
	$effect(() => {
		if (currentDailySales.length > 0 && currentIngredients.length > 0 && !forecastData) {
			calculateForecast();
		}
	});
</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">販売予測・在庫管理</h1>
				<p class="text-muted-foreground mt-1 text-xs sm:text-sm">
					統計的手法による販売予測と発注推奨
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={toggleDarkMode} size="icon" class="touch-manipulation">
					{#if isDarkMode}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</Button>
			</div>
		</div>

		<!-- 予測期間選択 -->
		<Card>
			<CardHeader>
				<CardTitle>予測期間</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex flex-wrap gap-2">
					<Button
						variant={forecastDays === 2 ? 'default' : 'outline'}
						onclick={() => {
							forecastDays = 2;
							calculateForecast();
						}}
					>
						明日
					</Button>
					<Button
						variant={forecastDays === 7 ? 'default' : 'outline'}
						onclick={() => {
							forecastDays = 7;
							calculateForecast();
						}}
					>
						7日間
					</Button>
					<Button
						variant={forecastDays === 14 ? 'default' : 'outline'}
						onclick={() => {
							forecastDays = 14;
							calculateForecast();
						}}
					>
						14日間
					</Button>
					<Button
						variant={forecastDays === 30 ? 'default' : 'outline'}
						onclick={() => {
							forecastDays = 30;
							calculateForecast();
						}}
					>
						30日間
					</Button>
					<Button variant="outline" onclick={calculateForecast} disabled={isCalculating}>
						{isCalculating ? '計算中...' : '再計算'}
					</Button>
				</div>

				{#if forecastData}
					<div class="mt-4 flex flex-wrap items-center gap-3">
						<p class="text-muted-foreground text-sm">
							予測期間: {forecastData.forecastStartDate} 〜 {forecastData.forecastEndDate}
						</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- スナップショットストリップ + タブエリア（計算中はdim） -->
		<div class={isCalculating ? 'pointer-events-none opacity-50' : ''}>

		<!-- スナップショットストリップ（明日モードのみ） -->
		{#if forecastDays === 2 && forecastData?.tomorrowForecast}
			{@const tf = forecastData.tomorrowForecast}
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="bg-card rounded-lg border p-3 text-center">
					<p class="text-muted-foreground text-xs">明日の予測販売数</p>
					<p class="text-2xl font-bold">{tf.totalPredictedQuantity}<span class="text-muted-foreground text-sm font-normal">個</span></p>
				</div>
				<div class="bg-card rounded-lg border p-3 text-center">
					<p class="text-muted-foreground text-xs">推計売上</p>
					<p class="text-2xl font-bold">{tf.totalEstimatedRevenue > 0 ? formatRevenue(tf.totalEstimatedRevenue) : '—'}</p>
				</div>
				<div class="bg-card rounded-lg border p-3 text-center">
					<p class="text-muted-foreground text-xs">トップ商品</p>
					<p class="truncate text-sm font-semibold">{tf.products[0]?.productName ?? '—'}</p>
				</div>
				<div class="bg-card rounded-lg border p-3 text-center">
					<p class="text-muted-foreground text-xs">明日の天気</p>
					<p class="text-sm font-semibold">{getWeatherLabel(tf.weather)}</p>
				</div>
			</div>
		{/if}

		<!-- タブ行 -->
		{#if forecastData && forecastDays !== 2}
			<div class="border-border flex flex-wrap gap-1 border-b pb-1" role="tablist">
				<Button
					variant={activeTab === 'period' ? 'default' : 'ghost'}
					onclick={() => activeTab = 'period'}
					role="tab"
					aria-selected={activeTab === 'period'}
				>
					期間予測
				</Button>
				<Button
					variant={activeTab === 'factors' ? 'default' : 'ghost'}
					onclick={() => activeTab = 'factors'}
					role="tab"
					aria-selected={activeTab === 'factors'}
				>
					影響係数
				</Button>
			</div>
		{/if}

		<!-- 明日の予測タブ -->
		{#if forecastDays === 2 && forecastData}
			{#if forecastData.tomorrowForecast}
				{@const tf = forecastData.tomorrowForecast}
				{@const tomorrowDayFactor = (forecastData.dayOfWeekAnalysis.factors as Record<number,number>)[tf.dayOfWeek] ?? 1}
				{@const tomorrowWeatherFactor = forecastData.weatherAnalysis.factors[tf.weather ?? 'other'] ?? 1}
				{@const top3ByRevenue = [...tf.products].sort((a, b) => b.estimatedRevenue - a.estimatedRevenue).slice(0, 3)}
				{@const top3ByQty = tf.products.slice(0, 3)}
				{@const tomorrowProductNames = new Set(tf.products.map(p => p.productName))}
				{@const confidenceCounts = {
					high: forecastData.productForecasts.filter(p => tomorrowProductNames.has(p.productName) && p.confidence === 'high').length,
					medium: forecastData.productForecasts.filter(p => tomorrowProductNames.has(p.productName) && p.confidence === 'medium').length,
					low: forecastData.productForecasts.filter(p => tomorrowProductNames.has(p.productName) && p.confidence === 'low').length
				}}
				<Card class="border-primary/30 bg-primary/5 dark:bg-primary/10">
					<CardHeader>
						<!-- A. ヘッダー行 -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Zap class="text-primary h-5 w-5" />
								<CardTitle>明日の売上予測</CardTitle>
								<span class="text-muted-foreground text-sm">
									{tf.date}（{getDayOfWeekName(tf.dayOfWeek)}曜日）
								</span>
							</div>
							<span class="text-muted-foreground text-sm">
								{getWeatherLabel(tf.weather)}
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<!-- B. 係数説明行 -->
						<p class="text-muted-foreground mb-4 text-sm">
							{getDayOfWeekName(tf.dayOfWeek)}曜日のため通常比
							<span class={tomorrowDayFactor >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
								{tomorrowDayFactor >= 1 ? '+' : ''}{((tomorrowDayFactor - 1) * 100).toFixed(0)}%
							</span>
							{#if tf.weather && tf.weather !== 'other'}
								、{getWeatherLabel(tf.weather)}のため通常比
								<span class={tomorrowWeatherFactor >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
									{tomorrowWeatherFactor >= 1 ? '+' : ''}{((tomorrowWeatherFactor - 1) * 100).toFixed(0)}%
								</span>
							{/if}
							で予測
						</p>

						<!-- C. 2カラム商品ランキング -->
						<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- 販売数TOP3 -->
							<div>
								<h4 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">販売数 TOP3</h4>
								{#each top3ByQty as product, i}
									<div class="flex items-center justify-between py-1.5">
										<span class="text-muted-foreground w-5 text-sm">#{i + 1}</span>
										<span class="flex-1 truncate text-sm">{product.productName}</span>
										<span class="font-semibold">{product.predictedQuantity}個</span>
									</div>
								{/each}
							</div>
							<!-- 売上推計TOP3 -->
							<div>
								<h4 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">売上推計 TOP3</h4>
								{#each top3ByRevenue as product, i}
									<div class="flex items-center justify-between py-1.5">
										<span class="text-muted-foreground w-5 text-sm">#{i + 1}</span>
										<span class="flex-1 truncate text-sm">{product.productName}</span>
										<span class="font-semibold">{product.estimatedRevenue > 0 ? formatRevenue(product.estimatedRevenue) : `${product.predictedQuantity}個`}</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- D. 全商品バーチャート -->
						<div class="mb-4">
							<h4 class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">商品別予測数量</h4>
							<div class="space-y-1.5">
								{#each tf.products as product}
									{@const maxQty = tf.products[0]?.predictedQuantity ?? 1}
									<div class="flex items-center gap-2">
										<span class="w-32 shrink-0 truncate text-sm" title={product.productName}>
											{product.productName}
										</span>
										<div class="bg-muted h-2 flex-1 overflow-hidden rounded-full">
											<div
												class="bg-primary/70 h-full rounded-full transition-all"
												style="width: {(product.predictedQuantity / maxQty) * 100}%"
											></div>
										</div>
										<span class="w-12 text-right text-sm font-medium">{product.predictedQuantity}個</span>
										{#if product.estimatedRevenue > 0}
											<span class="text-muted-foreground w-16 text-right text-xs">{formatRevenue(product.estimatedRevenue)}</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<!-- E. 信頼度チップ -->
						<div class="mb-4 flex items-center gap-2 text-xs">
							<span class="text-muted-foreground">予測信頼度:</span>
							<span class="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/20 dark:text-green-400">高 {confidenceCounts.high}件</span>
							<span class="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">中 {confidenceCounts.medium}件</span>
							<span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">低 {confidenceCounts.low}件</span>
						</div>

						<!-- F. 原材料警告 -->
						{#if tf.ingredientWarnings.length > 0}
							<div>
								<h4 class="mb-2 text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
									⚠️ 明日の在庫リスク
								</h4>
								<div class="space-y-1">
									{#each tf.ingredientWarnings as w}
										<div class="flex items-center justify-between rounded-md bg-orange-50 px-3 py-1.5 text-sm dark:bg-orange-900/20">
											<span class="font-medium">{w.ingredientName}</span>
											<span class="text-muted-foreground text-xs">
												在庫 {w.currentStock}{w.unit} → 明日消費 {w.tomorrowDemand}{w.unit}
											</span>
											<Badge class={getRiskColor(w.stockoutRisk)}>
												{getRiskLabel(w.stockoutRisk)}
											</Badge>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- G. フッター注記 -->
						<p class="text-muted-foreground mt-3 text-xs">
							※ 過去の販売実績と曜日・天候係数から推計。実際の売上と異なる場合があります。
						</p>
					</CardContent>
				</Card>
			{/if}
		{/if}

		<!-- 期間予測タブ -->
		{#if activeTab === 'period' && forecastDays !== 2 && forecastData}
			<!-- 発注推奨リスト -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<ShoppingCart class="h-5 w-5" />
						<CardTitle>発注推奨リスト</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					{@const needsOrdering = forecastData.ingredientForecasts.filter(
						(ing) => ing.stockStatus.recommendedOrderQuantity > 0
					)}

					{#if needsOrdering.length === 0}
						<p class="text-muted-foreground text-sm">現在、発注が必要な原材料はありません。</p>
					{:else}
						<div class="space-y-2">
							{#each needsOrdering as ingredient}
								<div
									class="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
								>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium">{ingredient.ingredientName}</span>
											<Badge class={getRiskColor(ingredient.stockStatus.stockoutRisk)}>
												リスク: {getRiskLabel(ingredient.stockStatus.stockoutRisk)}
											</Badge>
										</div>
										<p class="text-muted-foreground mt-1 text-sm">
											現在庫: {ingredient.currentStock}
											{ingredient.unit} / 予測消費: {Math.round(ingredient.demand.totalDemand)}
											{ingredient.unit}
										</p>
										<p class="text-muted-foreground text-xs">
											在庫切れまで: 約{ingredient.stockStatus.daysUntilStockout}日
										</p>
									</div>
									<div class="text-right">
										<p class="text-sm font-semibold">
											推奨発注量: {ingredient.stockStatus.recommendedOrderQuantity}
											{ingredient.unit}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- 原材料別需要予測 -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<AlertTriangle class="h-5 w-5" />
						<CardTitle>原材料別需要予測</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div class="divide-border divide-y">
						{#each forecastData.ingredientForecasts as ingredient}
							<div class="py-3 first:pt-0 last:pb-0">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium">{ingredient.ingredientName}</span>
											<Badge class={getRiskColor(ingredient.stockStatus.stockoutRisk)}>
												{getRiskLabel(ingredient.stockStatus.stockoutRisk)}
											</Badge>
										</div>
										<div class="text-muted-foreground mt-2 space-y-1 text-sm">
											<p>
												現在庫: {ingredient.currentStock}
												{ingredient.unit} → 予測消費: {Math.round(ingredient.demand.totalDemand)}
												{ingredient.unit}
											</p>
											{#if ingredient.demand.breakdown.length > 0}
												<p class="text-xs">
													主な使用: {ingredient.demand.breakdown
														.slice(0, 3)
														.map((b) => `${b.productName}(${b.quantity}${ingredient.unit})`)
														.join(', ')}
												</p>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<!-- 商品別販売予測 -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<TrendingUp class="h-5 w-5" />
						<CardTitle>商品別販売予測</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div class="divide-border divide-y">
						{#each forecastData.productForecasts.slice(0, 10) as product}
							<div class="py-3 first:pt-0 last:pb-0">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium">{product.productName}</span>
											<span class="text-xl">{getTrendIcon(product.trend)}</span>
											<Badge variant={product.confidence === 'high' ? 'default' : 'outline'}>
												信頼度: {product.confidence === 'high'
													? '高'
													: product.confidence === 'medium'
														? '中'
														: '低'}
											</Badge>
										</div>
										<p class="text-muted-foreground mt-1 text-sm">
											予測販売数: {product.totalForecast}個 ({forecastDays}日間)
										</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- 影響係数タブ -->
		{#if activeTab === 'factors' && forecastData}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- 曜日別影響 -->
				<Card>
					<CardHeader>
						<div class="flex items-center gap-2">
							<Calendar class="h-5 w-5" />
							<CardTitle>曜日別影響係数</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							{#each Object.entries(forecastData.dayOfWeekAnalysis.factors).sort((a, b) => Number(a[0]) - Number(b[0])) as [day, factor]}
								{@const source = forecastData.dayOfWeekAnalysis.sources[Number(day)] ?? 'prior'}
								{@const count = forecastData.dayOfWeekAnalysis.counts[Number(day)] ?? 0}
								<div class="flex items-center justify-between gap-2">
									<span class="w-10 shrink-0 text-sm">{getDayOfWeekName(Number(day))}曜日</span>
									<div class="flex flex-1 items-center gap-2">
										<div class="bg-muted h-2 flex-1 overflow-hidden rounded-full">
											<div
												class="bg-primary h-full"
												style="width: {Math.min(100, (factor as number) * 100)}%"
											></div>
										</div>
										<span class="text-muted-foreground w-10 text-right text-xs">{((factor as number) * 100).toFixed(0)}%</span>
									</div>
									<span
										class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium {getSourceBadgeClass(source)}"
										title="{count}件の実績データ"
									>
										{getSourceLabel(source)}
									</span>
								</div>
							{/each}
						</div>
						<p class="text-muted-foreground mt-4 text-xs">
							※ 100%が平均。高いほど売上が多い傾向。<br />
							<span class="text-blue-600 dark:text-blue-400">既定値</span>=業界調査値、
							<span class="text-yellow-600 dark:text-yellow-400">混合</span>=調査値+実績の加重平均、
							<span class="text-green-600 dark:text-green-400">実績</span>=実績データ主体
						</p>
					</CardContent>
				</Card>

				<!-- 天候別影響 -->
				<Card>
					<CardHeader>
						<div class="flex items-center gap-2">
							<Sun class="h-5 w-5" />
							<CardTitle>天候別影響係数</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							{#each Object.entries(forecastData.weatherAnalysis.factors) as [weather, factor]}
								{@const source = forecastData.weatherAnalysis.sources[weather] ?? 'prior'}
								{@const count = forecastData.weatherAnalysis.counts[weather] ?? 0}
								{@const weatherName =
									weather === 'sunny'
										? '晴れ'
										: weather === 'cloudy'
											? '曇り'
											: weather === 'rainy'
												? '雨'
												: weather === 'snowy'
													? '雪'
													: 'その他'}
								<div class="flex items-center justify-between gap-2">
									<span class="w-10 shrink-0 text-sm">{weatherName}</span>
									<div class="flex flex-1 items-center gap-2">
										<div class="bg-muted h-2 flex-1 overflow-hidden rounded-full">
											<div
												class="bg-primary h-full"
												style="width: {Math.min(100, (factor as number) * 100)}%"
											></div>
										</div>
										<span class="text-muted-foreground w-10 text-right text-xs">{((factor as number) * 100).toFixed(0)}%</span>
									</div>
									<span
										class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium {getSourceBadgeClass(source)}"
										title="{count}件の実績データ"
									>
										{getSourceLabel(source)}
									</span>
								</div>
							{/each}
						</div>
						<p class="text-muted-foreground mt-4 text-xs">
							※ 100%が平均。高いほど売上が多い傾向。<br />
							<span class="text-blue-600 dark:text-blue-400">既定値</span>=業界調査値、
							<span class="text-yellow-600 dark:text-yellow-400">混合</span>=調査値+実績の加重平均、
							<span class="text-green-600 dark:text-green-400">実績</span>=実績データ主体
						</p>
					</CardContent>
				</Card>
			</div>
		{/if}

		</div><!-- /dimming wrapper -->

		<!-- ローディング表示 -->
		{#if !forecastData}
			<Card>
				<CardContent class="text-muted-foreground py-12 text-center">
					<p>予測を計算しています...</p>
					<p class="mt-2 text-sm">売上データと在庫データから予測を生成します。</p>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
