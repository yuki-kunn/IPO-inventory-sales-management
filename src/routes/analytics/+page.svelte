<script lang="ts">
	import { onMount } from 'svelte';
	import { BarChart3, TrendingUp, Calendar as CalendarIcon, Moon, Sun, Cloud } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import { dailySales } from '$lib/stores/dailySales.firestore';
	import { darkMode } from '$lib/stores/darkMode';
	import type { DailySales, SalesData, WeatherType } from '$lib/types';
	import { DollarSign, Package, ShoppingCart } from 'lucide-svelte';

	let isDarkMode = $state(false);
	let allSalesData = $state<DailySales[]>([]);
	let loading = $state(true);

	// 期間選択
	let startDate = $state('');
	let endDate = $state('');

	// 天候フィルタ
	let weatherFilter = $state<WeatherType | 'all'>('all');

	// 集計結果
	let periodStats = $state({
		totalSales: 0,
		totalProfit: 0,
		totalQuantity: 0,
		productCount: 0,
		avgDailySales: 0
	});

	// 天候別集計
	let weatherStats = $state<
		Array<{
			weather: WeatherType;
			totalSales: number;
			totalProfit: number;
			dayCount: number;
			avgDailySales: number;
		}>
	>([]);

	// 商品別データ
	let productTrends = $state<
		Array<{
			productName: string;
			totalSales: number;
			totalQuantity: number;
			avgPrice: number;
			frequency: number;
		}>
	>([]);

	let selectedProduct = $state<string | null>(null);
	let productDailyData = $state<
		Array<{
			date: string;
			quantity: number;
			sales: number;
		}>
	>([]);

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	dailySales.subscribe((value) => {
		allSalesData = value;
		loading = false;
	});

	onMount(() => {
		// デフォルトで過去30日間を設定
		const end = new Date();
		const start = new Date();
		start.setDate(start.getDate() - 30);

		endDate = end.toISOString().split('T')[0];
		startDate = start.toISOString().split('T')[0];

		calculatePeriodStats();
	});

	function toggleDarkMode() {
		darkMode.toggle();
	}

	function calculatePeriodStats() {
		if (!startDate || !endDate) return;

		// 期間内のデータをフィルタリング
		let filteredData = allSalesData.filter((ds) => {
			return ds.date >= startDate && ds.date <= endDate;
		});

		// 天候フィルタを適用
		if (weatherFilter !== 'all') {
			filteredData = filteredData.filter((ds) => ds.weather === weatherFilter);
		}

		// 統計計算
		let totalSales = 0;
		let totalProfit = 0;
		let totalQuantity = 0;
		const productMap = new Map<
			string,
			{
				totalSales: number;
				totalQuantity: number;
				frequency: number;
			}
		>();

		filteredData.forEach((daily) => {
			totalSales += daily.totalSales;
			totalProfit += daily.totalProfit;
			totalQuantity += daily.totalQuantity;

			daily.sales.forEach((sale) => {
				const existing = productMap.get(sale.productName) || {
					totalSales: 0,
					totalQuantity: 0,
					frequency: 0
				};

				productMap.set(sale.productName, {
					totalSales: existing.totalSales + sale.totalSales,
					totalQuantity: existing.totalQuantity + sale.soldQuantity,
					frequency: existing.frequency + 1
				});
			});
		});

		periodStats = {
			totalSales,
			totalProfit,
			totalQuantity,
			productCount: productMap.size,
			avgDailySales: filteredData.length > 0 ? totalSales / filteredData.length : 0
		};

		// 商品別トレンドデータを作成
		productTrends = Array.from(productMap.entries())
			.map(([productName, data]) => ({
				productName,
				totalSales: data.totalSales,
				totalQuantity: data.totalQuantity,
				avgPrice: data.totalQuantity > 0 ? data.totalSales / data.totalQuantity : 0,
				frequency: data.frequency
			}))
			.sort((a, b) => b.totalSales - a.totalSales);

		// 天候別統計を計算
		calculateWeatherStats();
	}

	function calculateWeatherStats() {
		if (!startDate || !endDate) return;

		// 期間内の全データを取得（天候フィルタなし）
		const periodData = allSalesData.filter((ds) => {
			return ds.date >= startDate && ds.date <= endDate;
		});

		// 天候別にグループ化
		const weatherMap = new Map<
			WeatherType,
			{
				totalSales: number;
				totalProfit: number;
				dayCount: number;
			}
		>();

		periodData.forEach((daily) => {
			const weather = daily.weather || '';
			if (!weather) return; // 天候未設定はスキップ

			const existing = weatherMap.get(weather as WeatherType) || {
				totalSales: 0,
				totalProfit: 0,
				dayCount: 0
			};

			weatherMap.set(weather as WeatherType, {
				totalSales: existing.totalSales + daily.totalSales,
				totalProfit: existing.totalProfit + daily.totalProfit,
				dayCount: existing.dayCount + 1
			});
		});

		// 配列に変換してソート
		weatherStats = Array.from(weatherMap.entries())
			.map(([weather, data]) => ({
				weather,
				totalSales: data.totalSales,
				totalProfit: data.totalProfit,
				dayCount: data.dayCount,
				avgDailySales: data.dayCount > 0 ? data.totalSales / data.dayCount : 0
			}))
			.sort((a, b) => b.totalSales - a.totalSales);
	}

	function selectProduct(productName: string) {
		selectedProduct = productName;

		// 選択した商品の日別データを取得
		let filteredData = allSalesData.filter((ds) => ds.date >= startDate && ds.date <= endDate);

		// 天候フィルタを適用
		if (weatherFilter !== 'all') {
			filteredData = filteredData.filter((ds) => ds.weather === weatherFilter);
		}

		const dailyData = filteredData
			.map((daily) => {
				const productSale = daily.sales.find((s) => s.productName === productName);
				return {
					date: daily.date,
					quantity: productSale?.soldQuantity || 0,
					sales: productSale?.totalSales || 0
				};
			})
			.filter((d) => d.quantity > 0)
			.sort((a, b) => a.date.localeCompare(b.date));

		productDailyData = dailyData;
	}

	function formatCurrency(value: number): string {
		return `¥${Math.round(value).toLocaleString()}`;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return `${date.getMonth() + 1}/${date.getDate()}`;
	}
</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border ml-14 flex flex-col gap-4 border-b pb-4 sm:ml-0 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div>
				<h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
					<BarChart3 class="h-6 w-6 sm:h-8 sm:w-8" />
					売上分析
				</h1>
				<p class="text-muted-foreground mt-1 text-xs sm:text-sm">期間集計と商品別トレンド分析</p>
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

		<!-- 期間選択 -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CalendarIcon class="h-5 w-5" />
					分析期間の選択
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 md:grid-cols-3">
					<div>
						<label for="startDate" class="mb-2 block text-sm font-medium">開始日</label>
						<input
							id="startDate"
							type="date"
							bind:value={startDate}
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>
					<div>
						<label for="endDate" class="mb-2 block text-sm font-medium">終了日</label>
						<input
							id="endDate"
							type="date"
							bind:value={endDate}
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>
					<div class="flex items-end">
						<Button onclick={calculatePeriodStats} class="w-full">
							<BarChart3 class="mr-2 h-4 w-4" />
							集計実行
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- 天候フィルタ -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Cloud class="h-5 w-5" />
					天候フィルタ
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex flex-wrap gap-2">
					<Button
						variant={weatherFilter === 'all' ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							weatherFilter = 'all';
							calculatePeriodStats();
						}}
						class="touch-manipulation"
					>
						すべて
					</Button>
					<Button
						variant={weatherFilter === 'sunny' ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							weatherFilter = 'sunny';
							calculatePeriodStats();
						}}
						class="flex touch-manipulation items-center gap-1"
					>
						<WeatherIcon weather="sunny" class="h-4 w-4" />
						晴れ
					</Button>
					<Button
						variant={weatherFilter === 'cloudy' ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							weatherFilter = 'cloudy';
							calculatePeriodStats();
						}}
						class="flex touch-manipulation items-center gap-1"
					>
						<WeatherIcon weather="cloudy" class="h-4 w-4" />
						曇り
					</Button>
					<Button
						variant={weatherFilter === 'rainy' ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							weatherFilter = 'rainy';
							calculatePeriodStats();
						}}
						class="flex touch-manipulation items-center gap-1"
					>
						<WeatherIcon weather="rainy" class="h-4 w-4" />
						雨
					</Button>
					<Button
						variant={weatherFilter === 'snowy' ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							weatherFilter = 'snowy';
							calculatePeriodStats();
						}}
						class="flex touch-manipulation items-center gap-1"
					>
						<WeatherIcon weather="snowy" class="h-4 w-4" />
						雪
					</Button>
					<Button
						variant={weatherFilter === 'other' ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							weatherFilter = 'other';
							calculatePeriodStats();
						}}
						class="touch-manipulation"
					>
						その他
					</Button>
				</div>
				{#if weatherFilter !== 'all'}
					<p class="text-muted-foreground mt-3 text-sm">
						現在、{weatherFilter === 'sunny'
							? '晴れ'
							: weatherFilter === 'cloudy'
								? '曇り'
								: weatherFilter === 'rainy'
									? '雨'
									: weatherFilter === 'snowy'
										? '雪'
										: 'その他'}の日のみを表示しています
					</p>
				{/if}
			</CardContent>
		</Card>

		<!-- 期間統計 -->
		<div class="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-5">
			<StatsCard
				title="総売上"
				value={formatCurrency(periodStats.totalSales)}
				description={`${startDate} 〜 ${endDate}`}
				icon={DollarSign}
				iconColor="text-green-600 dark:text-green-400"
			/>
			<StatsCard
				title="総粗利"
				value={formatCurrency(periodStats.totalProfit)}
				description="期間内の粗利益"
				icon={TrendingUp}
				iconColor="text-blue-600 dark:text-blue-400"
			/>
			<StatsCard
				title="販売商品数"
				value={periodStats.totalQuantity}
				description="期間内の販売総数"
				icon={ShoppingCart}
				iconColor="text-purple-600 dark:text-purple-400"
			/>
			<StatsCard
				title="商品種類"
				value={periodStats.productCount}
				description="販売された商品種類"
				icon={Package}
				iconColor="text-orange-600 dark:text-orange-400"
			/>
			<StatsCard
				title="1日平均売上"
				value={formatCurrency(periodStats.avgDailySales)}
				description="期間内の平均"
				icon={DollarSign}
				iconColor="text-teal-600 dark:text-teal-400"
			/>
		</div>

		<!-- 天候別統計 -->
		{#if weatherStats.length > 0 && weatherFilter === 'all'}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Cloud class="h-5 w-5" />
						天候別売上統計
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-border border-b">
									<th
										class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase"
										>天候</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>日数</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>総売上</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>総粗利</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>1日平均売上</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-center text-xs font-medium uppercase"
										>フィルタ</th
									>
								</tr>
							</thead>
							<tbody>
								{#each weatherStats as stat, index}
									<tr class="border-border hover:bg-muted/50 border-b transition-colors">
										<td class="px-4 py-3">
											<div class="flex items-center gap-2">
												<WeatherIcon weather={stat.weather} class="h-5 w-5" />
												<span class="font-medium">
													{stat.weather === 'sunny'
														? '晴れ'
														: stat.weather === 'cloudy'
															? '曇り'
															: stat.weather === 'rainy'
																? '雨'
																: stat.weather === 'snowy'
																	? '雪'
																	: 'その他'}
												</span>
											</div>
										</td>
										<td class="px-4 py-3 text-right text-sm">{stat.dayCount}日</td>
										<td class="px-4 py-3 text-right font-medium"
											>{formatCurrency(stat.totalSales)}</td
										>
										<td class="px-4 py-3 text-right font-medium"
											>{formatCurrency(stat.totalProfit)}</td
										>
										<td class="px-4 py-3 text-right text-sm"
											>{formatCurrency(stat.avgDailySales)}</td
										>
										<td class="px-4 py-3 text-center">
											<Button
												variant="outline"
												size="sm"
												onclick={() => {
													weatherFilter = stat.weather;
													calculatePeriodStats();
												}}
												class="touch-manipulation text-xs"
											>
												絞り込む
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- 商品別ランキング -->
		<Card>
			<CardHeader>
				<CardTitle>商品別売上ランキング（TOP 20）</CardTitle>
			</CardHeader>
			<CardContent>
				{#if productTrends.length === 0}
					<div class="text-muted-foreground py-12 text-center">
						期間を選択して集計を実行してください
					</div>
				{:else}
					<!-- モバイル表示: カードレイアウト -->
					<div class="space-y-3 md:hidden">
						{#each productTrends.slice(0, 20) as product, index}
							<div
								class="border-border bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors"
							>
								<div class="mb-3 flex items-start justify-between">
									<div class="flex items-center gap-2">
										<Badge variant={index < 3 ? 'default' : 'outline'}>{index + 1}</Badge>
										<span class="font-semibold">{product.productName}</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => selectProduct(product.productName)}
										class="touch-manipulation"
									>
										<TrendingUp class="h-4 w-4" />
									</Button>
								</div>
								<div class="grid grid-cols-2 gap-2 text-sm">
									<div>
										<div class="text-muted-foreground text-xs">売上額</div>
										<div class="font-semibold">{formatCurrency(product.totalSales)}</div>
									</div>
									<div>
										<div class="text-muted-foreground text-xs">販売数</div>
										<div class="font-medium">{product.totalQuantity}</div>
									</div>
									<div>
										<div class="text-muted-foreground text-xs">平均単価</div>
										<div class="font-medium">{formatCurrency(product.avgPrice)}</div>
									</div>
									<div>
										<div class="text-muted-foreground text-xs">販売日数</div>
										<div class="font-medium">{product.frequency}日</div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- タブレット以上: テーブル表示 -->
					<div class="hidden overflow-x-auto md:block">
						<table class="w-full">
							<thead>
								<tr class="border-border border-b">
									<th
										class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase"
										>順位</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase"
										>商品名</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>売上額</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>販売数</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>平均単価</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>販売日数</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>アクション</th
									>
								</tr>
							</thead>
							<tbody>
								{#each productTrends.slice(0, 20) as product, index}
									<tr class="border-border hover:bg-muted/50 border-b transition-colors">
										<td class="px-4 py-3">
											<Badge variant={index < 3 ? 'default' : 'outline'}>{index + 1}</Badge>
										</td>
										<td class="px-4 py-3 font-medium">{product.productName}</td>
										<td class="px-4 py-3 text-right font-semibold"
											>{formatCurrency(product.totalSales)}</td
										>
										<td class="px-4 py-3 text-right">{product.totalQuantity}</td>
										<td class="px-4 py-3 text-right">{formatCurrency(product.avgPrice)}</td>
										<td class="px-4 py-3 text-right">{product.frequency}日</td>
										<td class="px-4 py-3 text-right">
											<Button
												variant="ghost"
												size="sm"
												onclick={() => selectProduct(product.productName)}
											>
												<TrendingUp class="h-4 w-4" />
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- 商品別トレンド -->
		{#if selectedProduct && productDailyData.length > 0}
			{@const maxQuantity = Math.max(...productDailyData.map((d) => d.quantity))}
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="flex items-center gap-2">
							<TrendingUp class="h-5 w-5" />
							{selectedProduct} のトレンド
						</CardTitle>
						<Button variant="ghost" size="sm" onclick={() => (selectedProduct = null)}>
							<span class="text-lg">×</span>
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<!-- シンプルなバーチャート -->
					<div class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="bg-muted/50 rounded-lg p-4">
								<div class="text-muted-foreground text-sm">期間内総売上</div>
								<div class="mt-1 text-2xl font-bold">
									{formatCurrency(productDailyData.reduce((sum, d) => sum + d.sales, 0))}
								</div>
							</div>
							<div class="bg-muted/50 rounded-lg p-4">
								<div class="text-muted-foreground text-sm">期間内総販売数</div>
								<div class="mt-1 text-2xl font-bold">
									{productDailyData.reduce((sum, d) => sum + d.quantity, 0)}
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<h4 class="text-sm font-medium">日別販売推移</h4>
							{#each productDailyData as data}
								<div class="flex items-center gap-3">
									<div class="text-muted-foreground w-16 text-xs">{formatDate(data.date)}</div>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<div
												class="bg-primary/20 border-primary/30 flex h-8 items-center rounded border px-2"
												style="width: {(data.quantity / maxQuantity) * 100}%;"
											>
												<span class="text-xs font-medium">{data.quantity}個</span>
											</div>
										</div>
									</div>
									<div class="w-24 text-right text-sm font-medium">
										{formatCurrency(data.sales)}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
