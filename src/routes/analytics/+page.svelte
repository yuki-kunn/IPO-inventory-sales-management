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
	import WeatherFilterButtons from '$lib/components/WeatherFilterButtons.svelte';
	import PeriodSelector from '$lib/components/PeriodSelector.svelte';
	import { dailySales } from '$lib/stores/dailySales.api';
	import { darkMode } from '$lib/stores/darkMode';
	import { loadAnalyticsSettings, saveAnalyticsSettings } from '$lib/stores/analyticsSettings';
	import type { DailySales, SalesData, WeatherType, CustomerInfo } from '$lib/types';
	import { DollarSign, Package, ShoppingCart } from 'lucide-svelte';
	import { getWeatherLabel } from '$lib/utils/weatherFormatter';
	import { formatCurrency, formatDate } from '$lib/utils/formatters';
	import { goto } from '$app/navigation';
	import SalesScatterPlot from '$lib/components/SalesScatterPlot.svelte';
	import {
		calculateWeekdayStats,
		getWeekday,
		WEEKDAY_LABELS,
		getComparisonRange,
		summarizePeriod,
		calculateWeatherStats as computeWeatherStats,
		buildProductComparison,
		netSales,
		type PeriodSummary,
		type WeatherStat,
		type ProductComparisonRow
	} from '$lib/utils/salesAnalytics';

	let isDarkMode = $state(false);
	let allSalesData = $state<DailySales[]>([]);
	let loading = $state(true);

	// 期間選択
	let startDate = $state('');
	let endDate = $state('');

	// 天候フィルタ
	let weatherFilter = $state<WeatherType | 'all'>('all');

	// しきい値（散布図／ピックアップで共有）
	let lowerThreshold = $state(20000); // 下限額（円）
	let upperThreshold = $state(80000); // 上限額（円）

	// 比較モード
	let comparisonMode = $state<'none' | 'prevMonth' | 'prevYear' | 'custom'>('none');
	let customComparisonStart = $state('');
	let customComparisonEnd = $state('');

	// ソート状態（商品別比較テーブル）
	let sortKey = $state<'productName' | 'currentSales' | 'comparisonSales' | 'diffSales' | 'diffPercent'>(
		'diffSales'
	);
	let sortDir = $state<'asc' | 'desc'>('desc');

	// localStorage への保存ガード（onMount での復元完了後のみ保存）
	let initialized = $state(false);

	// 期間内データ（date昇順）
	const periodDays = $derived(
		allSalesData
			.filter((ds) => ds.date >= startDate && ds.date <= endDate)
			.slice()
			.sort((a, b) => a.date.localeCompare(b.date))
	);

	// 曜日別統計（7要素）
	const weekdayStats = $derived(calculateWeekdayStats(periodDays));

	// 曜日別平均の最大値（横棒バーの正規化用）
	const maxWeekdayAvg = $derived(Math.max(...weekdayStats.map((w) => w.avg), 1));

	// 天候フィルタ適用済みの現期間データ（比較の"今期"側に使う。既存の periodStats/productTrends とは別経路）
	const periodDaysFiltered = $derived(
		periodDays.filter((d) => weatherFilter === 'all' || d.weather === weatherFilter)
	);

	// 比較期間の算出
	const comparisonRange = $derived.by((): { start: string; end: string } | null => {
		if (comparisonMode === 'none') return null;
		if (comparisonMode === 'custom') {
			if (!customComparisonStart || !customComparisonEnd) return null;
			return { start: customComparisonStart, end: customComparisonEnd };
		}
		if (!startDate || !endDate) return null;
		return getComparisonRange(startDate, endDate, comparisonMode);
	});

	// 比較期間内データ（天候フィルタも同様に適用し、同一条件での比較を保証する）
	const comparisonPeriodDays = $derived(
		comparisonRange
			? allSalesData
					.filter((ds) => ds.date >= comparisonRange.start && ds.date <= comparisonRange.end)
					.filter((ds) => weatherFilter === 'all' || ds.weather === weatherFilter)
					.slice()
					.sort((a, b) => a.date.localeCompare(b.date))
			: []
	);

	const comparisonSummary = $derived<PeriodSummary | null>(
		comparisonRange ? summarizePeriod(comparisonPeriodDays) : null
	);
	const currentSummaryForComparison = $derived<PeriodSummary | null>(
		comparisonRange ? summarizePeriod(periodDaysFiltered) : null
	);
	const comparisonWeekdayStats = $derived(comparisonRange ? calculateWeekdayStats(comparisonPeriodDays) : []);
	const comparisonWeatherStats = $derived<WeatherStat[]>(
		comparisonRange ? computeWeatherStats(comparisonPeriodDays) : []
	);

	const productComparisonRaw = $derived<ProductComparisonRow[]>(
		comparisonRange ? buildProductComparison(periodDaysFiltered, comparisonPeriodDays) : []
	);

	const productComparisonSorted = $derived.by(() => {
		const rows = productComparisonRaw.slice();
		const dir = sortDir === 'asc' ? 1 : -1;
		rows.sort((a, b) => {
			if (sortKey === 'productName') {
				return dir * a.productName.localeCompare(b.productName);
			}
			if (sortKey === 'diffPercent') {
				if (a.diffPercent === null && b.diffPercent === null) return 0;
				if (a.diffPercent === null) return 1;
				if (b.diffPercent === null) return -1;
				return dir * (a.diffPercent - b.diffPercent);
			}
			return dir * ((a[sortKey] as number) - (b[sortKey] as number));
		});
		return rows;
	});

	function toggleSort(key: typeof sortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'productName' ? 'asc' : 'desc';
		}
	}

	// 閾値で抽出された日（割引反映後の実質売上で判定）
	const belowDays = $derived(periodDays.filter((d) => netSales(d) < lowerThreshold));
	const aboveDays = $derived(periodDays.filter((d) => netSales(d) > upperThreshold));

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

	// カテゴリ別集計
	let categoryStats = $state<
		Array<{
			category: string;
			totalSales: number;
			totalProfit: number;
			totalQuantity: number;
			productCount: number;
		}>
	>([]);

	// 顧客情報集計
	let customerStats = $state<
		Array<{
			gender: string;
			ageGroup: string;
			count: number;
		}>
	>([]);

	let genderSummary = $state<
		Array<{
			gender: string;
			totalCount: number;
			percentage: number;
		}>
	>([]);

	let ageGroupSummary = $state<
		Array<{
			ageGroup: string;
			totalCount: number;
			percentage: number;
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
		const saved = loadAnalyticsSettings();
		if (saved) {
			// 保存済み設定を復元
			startDate = saved.startDate;
			endDate = saved.endDate;
			lowerThreshold = saved.lowerThreshold;
			upperThreshold = saved.upperThreshold;
			weatherFilter = saved.weatherFilter;
			comparisonMode = saved.comparisonMode ?? 'none';
			customComparisonStart = saved.customComparisonStart ?? '';
			customComparisonEnd = saved.customComparisonEnd ?? '';
		} else {
			// 初回はデフォルトで過去30日間
			const end = new Date();
			const start = new Date();
			start.setDate(start.getDate() - 30);
			endDate = end.toISOString().split('T')[0];
			startDate = start.toISOString().split('T')[0];
		}
		initialized = true;
		calculatePeriodStats();
	});

	// 設定変更を localStorage に永続化（初期化完了後のみ）
	$effect(() => {
		// 5値すべてを参照して依存登録（順序重要：if より前に読む）
		const settings = {
			startDate,
			endDate,
			lowerThreshold,
			upperThreshold,
			weatherFilter,
			comparisonMode,
			customComparisonStart,
			customComparisonEnd
		};
		if (initialized) {
			saveAnalyticsSettings(settings);
		}
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
			totalSales += netSales(daily);
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

		// カテゴリ別統計を計算
		calculateCategoryStats();

		// 顧客情報統計を計算
		calculateCustomerStats();
	}

	function calculateWeatherStats() {
		if (!startDate || !endDate) return;
		const periodData = allSalesData.filter((ds) => ds.date >= startDate && ds.date <= endDate);
		weatherStats = computeWeatherStats(periodData);
	}

	function calculateCategoryStats() {
		if (!startDate || !endDate) return;

		// 期間内のデータを取得
		let filteredData = allSalesData.filter((ds) => {
			return ds.date >= startDate && ds.date <= endDate;
		});

		// 天候フィルタを適用
		if (weatherFilter !== 'all') {
			filteredData = filteredData.filter((ds) => ds.weather === weatherFilter);
		}

		// カテゴリ別にグループ化
		const categoryMap = new Map<
			string,
			{
				totalSales: number;
				totalProfit: number;
				totalQuantity: number;
				productSet: Set<string>;
			}
		>();

		filteredData.forEach((daily) => {
			daily.sales.forEach((sale) => {
				const category = sale.category || '未分類';
				const existing = categoryMap.get(category) || {
					totalSales: 0,
					totalProfit: 0,
					totalQuantity: 0,
					productSet: new Set<string>()
				};

				existing.totalSales += sale.totalSales;
				existing.totalProfit += sale.grossProfit;
				existing.totalQuantity += sale.soldQuantity;
				existing.productSet.add(sale.productName);

				categoryMap.set(category, existing);
			});
		});

		// 配列に変換してソート
		categoryStats = Array.from(categoryMap.entries())
			.map(([category, data]) => ({
				category,
				totalSales: data.totalSales,
				totalProfit: data.totalProfit,
				totalQuantity: data.totalQuantity,
				productCount: data.productSet.size
			}))
			.sort((a, b) => b.totalSales - a.totalSales);
	}

	function calculateCustomerStats() {
		if (!startDate || !endDate) return;

		// 期間内のデータを取得
		let filteredData = allSalesData.filter((ds) => {
			return ds.date >= startDate && ds.date <= endDate;
		});

		// 天候フィルタを適用
		if (weatherFilter !== 'all') {
			filteredData = filteredData.filter((ds) => ds.weather === weatherFilter);
		}

		// 顧客情報を集計
		const allCustomerInfo: CustomerInfo[] = [];
		filteredData.forEach((daily) => {
			if (daily.customerInfo && daily.customerInfo.length > 0) {
				allCustomerInfo.push(...daily.customerInfo);
			}
		});

		customerStats = allCustomerInfo;

		// 性別別集計
		const genderMap = new Map<string, number>();
		allCustomerInfo.forEach((info) => {
			const existing = genderMap.get(info.gender) || 0;
			genderMap.set(info.gender, existing + info.count);
		});

		const totalCustomers = Array.from(genderMap.values()).reduce((sum, count) => sum + count, 0);
		genderSummary = Array.from(genderMap.entries())
			.map(([gender, count]) => ({
				gender,
				totalCount: count,
				percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0
			}))
			.sort((a, b) => b.totalCount - a.totalCount);

		// 年齢層別集計
		const ageGroupMap = new Map<string, number>();
		allCustomerInfo.forEach((info) => {
			const existing = ageGroupMap.get(info.ageGroup) || 0;
			ageGroupMap.set(info.ageGroup, existing + info.count);
		});

		ageGroupSummary = Array.from(ageGroupMap.entries())
			.map(([ageGroup, count]) => ({
				ageGroup,
				totalCount: count,
				percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0
			}))
			.sort((a, b) => b.totalCount - a.totalCount);
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

</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
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
				<PeriodSelector
					{startDate}
					{endDate}
					onDateChange={(start, end) => {
						startDate = start;
						endDate = end;
					}}
					onCalculate={calculatePeriodStats}
				/>
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
				<WeatherFilterButtons
					{weatherFilter}
					onFilterChange={(filter) => {
						weatherFilter = filter;
						calculatePeriodStats();
					}}
				/>
			</CardContent>
		</Card>

		<!-- 期間比較 -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5" />
					期間比較
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex flex-wrap gap-2">
					<Button
						variant={comparisonMode === 'none' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (comparisonMode = 'none')}
						class="touch-manipulation"
					>
						なし
					</Button>
					<Button
						variant={comparisonMode === 'prevMonth' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (comparisonMode = 'prevMonth')}
						class="touch-manipulation"
					>
						前月比
					</Button>
					<Button
						variant={comparisonMode === 'prevYear' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (comparisonMode = 'prevYear')}
						class="touch-manipulation"
					>
						前年比
					</Button>
					<Button
						variant={comparisonMode === 'custom' ? 'default' : 'outline'}
						size="sm"
						onclick={() => (comparisonMode = 'custom')}
						class="touch-manipulation"
					>
						カスタム
					</Button>
				</div>

				{#if comparisonMode === 'prevMonth' || comparisonMode === 'prevYear'}
					<p class="text-muted-foreground mt-3 text-sm">
						{#if comparisonRange}
							比較期間: {comparisonRange.start} 〜 {comparisonRange.end}
						{:else}
							主期間（分析期間の選択）を設定してください
						{/if}
					</p>
				{/if}

				{#if comparisonMode === 'custom'}
					<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label class="flex flex-col gap-1">
							<span class="text-muted-foreground text-xs font-medium">比較期間の開始日</span>
							<input
								type="date"
								bind:value={customComparisonStart}
								class="border-border bg-background w-full rounded border px-3 py-2 text-sm"
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="text-muted-foreground text-xs font-medium">比較期間の終了日</span>
							<input
								type="date"
								bind:value={customComparisonEnd}
								class="border-border bg-background w-full rounded border px-3 py-2 text-sm"
							/>
						</label>
					</div>
				{/if}

				{#if comparisonRange && comparisonSummary && currentSummaryForComparison}
					<div class="mt-6 overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-border border-b">
									<th class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase">指標</th>
									<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase">今期</th>
									<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase">比較期間</th>
									<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase">差額</th>
									<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase">増減率</th>
								</tr>
							</thead>
							<tbody>
								{#each [
									{ label: '総売上', cur: currentSummaryForComparison.totalSales, cmp: comparisonSummary.totalSales, fmt: formatCurrency },
									{ label: '総粗利', cur: currentSummaryForComparison.totalProfit, cmp: comparisonSummary.totalProfit, fmt: formatCurrency },
									{ label: '販売数', cur: currentSummaryForComparison.totalQuantity, cmp: comparisonSummary.totalQuantity, fmt: (v: number) => `${v}個` },
									{ label: '1日平均売上', cur: currentSummaryForComparison.avgDailySales, cmp: comparisonSummary.avgDailySales, fmt: formatCurrency }
								] as row}
									{@const diff = row.cur - row.cmp}
									{@const pct = row.cmp === 0 ? null : (diff / row.cmp) * 100}
									<tr class="border-border hover:bg-muted/50 border-b transition-colors">
										<td class="px-4 py-3 font-medium">{row.label}</td>
										<td class="px-4 py-3 text-right">{row.fmt(row.cur)}</td>
										<td class="px-4 py-3 text-right">{row.fmt(row.cmp)}</td>
										<td
											class="px-4 py-3 text-right font-medium {diff > 0
												? 'text-green-600 dark:text-green-400'
												: diff < 0
													? 'text-red-600 dark:text-red-400'
													: ''}"
										>
											{diff > 0 ? '+' : ''}{row.fmt(diff)}
										</td>
										<td
											class="px-4 py-3 text-right {pct === null
												? 'text-muted-foreground'
												: pct > 0
													? 'text-green-600 dark:text-green-400'
													: pct < 0
														? 'text-red-600 dark:text-red-400'
														: ''}"
										>
											{pct === null ? '—' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
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
									{#if comparisonRange}
										<th
											class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
											>比較期間総売上</th
										>
										<th
											class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
											>増減率</th
										>
									{/if}
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
													{getWeatherLabel(stat.weather)}
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
										{#if comparisonRange}
											{@const cmpStat = comparisonWeatherStats.find((c) => c.weather === stat.weather)}
											<td class="px-4 py-3 text-right text-sm">
												{cmpStat ? formatCurrency(cmpStat.totalSales) : '—'}
											</td>
											<td class="px-4 py-3 text-right text-sm">
												{#if cmpStat && cmpStat.totalSales > 0}
													{@const pct = ((stat.totalSales - cmpStat.totalSales) / cmpStat.totalSales) * 100}
													<span
														class={pct > 0
															? 'text-green-600 dark:text-green-400'
															: pct < 0
																? 'text-red-600 dark:text-red-400'
																: ''}
													>
														{pct > 0 ? '+' : ''}{pct.toFixed(1)}%
													</span>
												{:else}
													—
												{/if}
											</td>
										{/if}
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

		<!-- 曜日別売上統計 -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<CalendarIcon class="h-5 w-5" />
					曜日別売上
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-border border-b">
								<th class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase"
									>曜日</th
								>
								<th class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase"
									>平均</th
								>
								<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
									>中央値</th
								>
								<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
									>最高</th
								>
								<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
									>最低</th
								>
								<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
									>日数</th
								>
								{#if comparisonRange}
									<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>比較期間平均</th
									>
									<th class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>増減率</th
									>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each weekdayStats as w}
								<tr class="border-border hover:bg-muted/50 border-b transition-colors">
									<td class="px-4 py-3">
										<span
											class="font-medium {w.weekday === 0
												? 'text-red-500'
												: w.weekday === 6
													? 'text-blue-500'
													: ''}"
										>
											{w.label}
										</span>
									</td>
									<td class="px-4 py-3">
										{#if w.count > 0}
											<div class="flex items-center gap-2">
												<div class="bg-muted h-2 w-24 overflow-hidden rounded-full sm:w-32">
													<div
														class="bg-primary h-full transition-all"
														style="width: {(w.avg / maxWeekdayAvg) * 100}%"
													></div>
												</div>
												<span class="text-sm font-medium whitespace-nowrap"
													>{formatCurrency(w.avg)}</span
												>
											</div>
										{:else}
											<span class="text-muted-foreground text-sm">—</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-right text-sm">
										{w.count > 0 ? formatCurrency(w.median) : '—'}
									</td>
									<td class="px-4 py-3 text-right text-sm">
										{w.count > 0 ? formatCurrency(w.max) : '—'}
									</td>
									<td class="px-4 py-3 text-right text-sm">
										{w.count > 0 ? formatCurrency(w.min) : '—'}
									</td>
									<td class="px-4 py-3 text-right text-sm">{w.count}日</td>
									{#if comparisonRange}
										{@const cmp = comparisonWeekdayStats[w.weekday]}
										<td class="px-4 py-3 text-right text-sm">
											{cmp && cmp.count > 0 ? formatCurrency(cmp.avg) : '—'}
										</td>
										<td class="px-4 py-3 text-right text-sm">
											{#if cmp && cmp.count > 0 && w.count > 0}
												{@const pct = ((w.avg - cmp.avg) / cmp.avg) * 100}
												<span
													class={pct > 0
														? 'text-green-600 dark:text-green-400'
														: pct < 0
															? 'text-red-600 dark:text-red-400'
															: ''}
												>
													{pct > 0 ? '+' : ''}{pct.toFixed(1)}%
												</span>
											{:else}
												—
											{/if}
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>

		<!-- しきい値ピックアップ -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5" />
					しきい値で日を抽出
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<label class="flex flex-col gap-1">
						<span class="text-muted-foreground text-xs font-medium">下限（この額未満を抽出）</span>
						<input
							type="number"
							min="0"
							value={lowerThreshold}
							oninput={(e) => {
								const v = e.currentTarget.valueAsNumber;
								lowerThreshold = Number.isFinite(v) ? Math.max(0, v) : 0;
							}}
							class="border-border bg-background w-full rounded border px-3 py-2 text-sm"
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-muted-foreground text-xs font-medium">上限（この額超を抽出）</span>
						<input
							type="number"
							min="0"
							value={upperThreshold}
							oninput={(e) => {
								const v = e.currentTarget.valueAsNumber;
								upperThreshold = Number.isFinite(v) ? Math.max(0, v) : 0;
							}}
							class="border-border bg-background w-full rounded border px-3 py-2 text-sm"
						/>
					</label>
				</div>

				{#if lowerThreshold >= upperThreshold}
					<p class="mt-3 rounded-md bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700 dark:text-yellow-400">
						⚠️ 下限が上限以上に設定されています。同じ日が両方のリストに表示される場合があります。
					</p>
				{/if}

				<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- 下限未満（赤系） -->
					<div>
						<h4 class="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">
							下限 {formatCurrency(lowerThreshold)} 未満の日（{belowDays.length}件）
						</h4>
						{#if belowDays.length === 0}
							<div class="text-muted-foreground py-6 text-center text-sm">
								該当する日はありません
							</div>
						{:else}
							<div class="space-y-2">
								{#each belowDays as d}
									<button
										type="button"
										onclick={() => goto(`/calendar/${d.date}?from=analytics`)}
										class="border-border hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-lg border border-l-4 border-l-red-500 px-3 py-2 text-left transition-colors"
									>
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">{formatDate(d.date)}</span>
											<span class="text-muted-foreground text-xs"
												>({WEEKDAY_LABELS[getWeekday(d.date)]})</span
											>
											{#if d.weather}
												<WeatherIcon weather={d.weather} class="h-4 w-4" />
											{/if}
										</div>
										<span class="text-sm font-semibold whitespace-nowrap"
											>{formatCurrency(netSales(d))}</span
										>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- 上限超（緑系） -->
					<div>
						<h4 class="mb-3 text-sm font-semibold text-green-600 dark:text-green-400">
							上限 {formatCurrency(upperThreshold)} 超の日（{aboveDays.length}件）
						</h4>
						{#if aboveDays.length === 0}
							<div class="text-muted-foreground py-6 text-center text-sm">
								該当する日はありません
							</div>
						{:else}
							<div class="space-y-2">
								{#each aboveDays as d}
									<button
										type="button"
										onclick={() => goto(`/calendar/${d.date}?from=analytics`)}
										class="border-border hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-lg border border-l-4 border-l-green-500 px-3 py-2 text-left transition-colors"
									>
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium">{formatDate(d.date)}</span>
											<span class="text-muted-foreground text-xs"
												>({WEEKDAY_LABELS[getWeekday(d.date)]})</span
											>
											{#if d.weather}
												<WeatherIcon weather={d.weather} class="h-4 w-4" />
											{/if}
										</div>
										<span class="text-sm font-semibold whitespace-nowrap"
											>{formatCurrency(netSales(d))}</span
										>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- 売上散布図 -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<BarChart3 class="h-5 w-5" />
					売上散布図（閾値ドラッグ）
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground mb-4 text-sm">
					点は各日の売上。曜日ごとに色分け。青/赤の線をドラッグすると閾値が変わり、上のリストに反映されます。
				</p>
				<SalesScatterPlot days={periodDays} bind:lowerThreshold bind:upperThreshold />
			</CardContent>
		</Card>

		<!-- カテゴリ別統計 -->
		{#if categoryStats.length > 0}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Package class="h-5 w-5" />
						カテゴリ別売上統計
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-border border-b">
									<th
										class="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase"
										>カテゴリ</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>商品数</th
									>
									<th
										class="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase"
										>販売数</th
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
										>粗利率</th
									>
								</tr>
							</thead>
							<tbody>
								{#each categoryStats as stat}
									<tr class="border-border hover:bg-muted/50 border-b transition-colors">
										<td class="px-4 py-3">
											<div class="flex items-center gap-2">
												{#if stat.category === '基本'}
													<Badge variant="default" class="text-xs">基本</Badge>
												{:else if stat.category === 'イベント'}
													<Badge variant="secondary" class="text-xs">イベント</Badge>
												{:else}
													<Badge variant="outline" class="text-xs">{stat.category}</Badge>
												{/if}
											</div>
										</td>
										<td class="px-4 py-3 text-right text-sm">{stat.productCount}種類</td>
										<td class="px-4 py-3 text-right text-sm">{stat.totalQuantity}個</td>
										<td class="px-4 py-3 text-right font-medium"
											>{formatCurrency(stat.totalSales)}</td
										>
										<td class="px-4 py-3 text-right font-medium"
											>{formatCurrency(stat.totalProfit)}</td
										>
										<td class="px-4 py-3 text-right text-sm">
											{stat.totalSales > 0
												? ((stat.totalProfit / stat.totalSales) * 100).toFixed(1)
												: '0.0'}%
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- 顧客情報統計 -->
		{#if genderSummary.length > 0 || ageGroupSummary.length > 0}
			<div class="grid gap-6 md:grid-cols-2">
				<!-- 性別統計 -->
				{#if genderSummary.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<ShoppingCart class="h-5 w-5" />
								性別分布
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each genderSummary as stat}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant="outline" class="text-xs">{stat.gender}</Badge>
										</div>
										<div class="flex items-center gap-3">
											<span class="text-sm font-medium">{stat.totalCount}人</span>
											<span class="text-muted-foreground text-xs"
												>{stat.percentage.toFixed(1)}%</span
											>
										</div>
									</div>
									<div class="bg-muted h-2 overflow-hidden rounded-full">
										<div
											class="bg-primary h-full transition-all"
											style="width: {stat.percentage}%"
										></div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}

				<!-- 年齢層統計 -->
				{#if ageGroupSummary.length > 0}
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<ShoppingCart class="h-5 w-5" />
								年齢層分布
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								{#each ageGroupSummary as stat}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant="outline" class="text-xs">{stat.ageGroup}</Badge>
										</div>
										<div class="flex items-center gap-3">
											<span class="text-sm font-medium">{stat.totalCount}人</span>
											<span class="text-muted-foreground text-xs"
												>{stat.percentage.toFixed(1)}%</span
											>
										</div>
									</div>
									<div class="bg-muted h-2 overflow-hidden rounded-full">
										<div
											class="bg-primary h-full transition-all"
											style="width: {stat.percentage}%"
										></div>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
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

		<!-- 商品別比較 -->
		{#if comparisonRange}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<TrendingUp class="h-5 w-5" />
						商品別比較
					</CardTitle>
				</CardHeader>
				<CardContent>
					{#if productComparisonSorted.length === 0}
						<div class="text-muted-foreground py-12 text-center">比較対象の商品データがありません</div>
					{:else}
						<!-- モバイル表示: カードレイアウト -->
						<div class="space-y-3 md:hidden">
							{#each productComparisonSorted as row}
								<div class="border-border bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors">
									<div class="mb-3 font-semibold">{row.productName}</div>
									<div class="grid grid-cols-2 gap-2 text-sm">
										<div>
											<div class="text-muted-foreground text-xs">今期売上</div>
											<div class="font-semibold">{formatCurrency(row.currentSales)}</div>
										</div>
										<div>
											<div class="text-muted-foreground text-xs">比較期間売上</div>
											<div class="font-medium">{formatCurrency(row.comparisonSales)}</div>
										</div>
										<div>
											<div class="text-muted-foreground text-xs">差額</div>
											<div
												class="font-medium {row.diffSales > 0
													? 'text-green-600 dark:text-green-400'
													: row.diffSales < 0
														? 'text-red-600 dark:text-red-400'
														: ''}"
											>
												{row.diffSales > 0 ? '+' : ''}{formatCurrency(row.diffSales)}
											</div>
										</div>
										<div>
											<div class="text-muted-foreground text-xs">増減率</div>
											<div
												class="font-medium {row.diffPercent === null
													? 'text-muted-foreground'
													: row.diffPercent > 0
														? 'text-green-600 dark:text-green-400'
														: row.diffPercent < 0
															? 'text-red-600 dark:text-red-400'
															: ''}"
											>
												{row.diffPercent === null
													? '新規'
													: `${row.diffPercent > 0 ? '+' : ''}${row.diffPercent.toFixed(1)}%`}
											</div>
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
										{#each [
											{ key: 'productName', label: '商品名', align: 'text-left' },
											{ key: 'currentSales', label: '今期売上', align: 'text-right' },
											{ key: 'comparisonSales', label: '比較期間売上', align: 'text-right' },
											{ key: 'diffSales', label: '差額', align: 'text-right' },
											{ key: 'diffPercent', label: '増減率', align: 'text-right' }
										] as col}
											<th class="px-4 py-3 {col.align}">
												<button
													type="button"
													onclick={() => toggleSort(col.key as typeof sortKey)}
													class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium uppercase touch-manipulation"
												>
													{col.label}
													{#if sortKey === col.key}
														<span class="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
													{/if}
												</button>
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each productComparisonSorted as row}
										<tr class="border-border hover:bg-muted/50 border-b transition-colors">
											<td class="px-4 py-3 font-medium">{row.productName}</td>
											<td class="px-4 py-3 text-right">{formatCurrency(row.currentSales)}</td>
											<td class="px-4 py-3 text-right">{formatCurrency(row.comparisonSales)}</td>
											<td
												class="px-4 py-3 text-right font-medium {row.diffSales > 0
													? 'text-green-600 dark:text-green-400'
													: row.diffSales < 0
														? 'text-red-600 dark:text-red-400'
														: ''}"
											>
												{row.diffSales > 0 ? '+' : ''}{formatCurrency(row.diffSales)}
											</td>
											<td
												class="px-4 py-3 text-right {row.diffPercent === null
													? 'text-muted-foreground'
													: row.diffPercent > 0
														? 'text-green-600 dark:text-green-400'
														: row.diffPercent < 0
															? 'text-red-600 dark:text-red-400'
															: ''}"
											>
												{row.diffPercent === null
													? '新規'
													: `${row.diffPercent > 0 ? '+' : ''}${row.diffPercent.toFixed(1)}%`}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

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
