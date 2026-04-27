<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Calendar as CalendarIcon,
		Moon,
		Sun,
		ArrowLeft,
		RefreshCw,
		AlertCircle,
		CheckCircle,
		Cloud
	} from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import SalesTable from '$lib/components/SalesTable.svelte';
	import WeatherIcon from '$lib/components/WeatherIcon.svelte';
	import WeatherSelector from '$lib/components/WeatherSelector.svelte';
	import { dailySales } from '$lib/stores/dailySales.api';
	import { darkMode } from '$lib/stores/darkMode';
	import { processSalesData } from '$lib/utils/salesProcessor';
	import { fetchWeatherForDate } from '$lib/utils/weatherService';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { DailySales, WeatherType } from '$lib/types';
	import { DollarSign, TrendingUp, Package } from 'lucide-svelte';

	let isDarkMode = $state(false);
	let salesDate = $state('');
	let dailyData = $state<DailySales | null>(null);
	let loading = $state(true);
	let reprocessing = $state(false);
	let fetchingWeather = $state(false);
	let showWeatherSelector = $state(false);

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	if (browser) {
		page.subscribe(($page) => {
			salesDate = $page.params.date || '';
			loadData();
		});
	}

	async function loadData() {
		if (!salesDate) return;

		loading = true;
		try {
			dailyData = await dailySales.getByDate(salesDate);
		} catch (error) {
			console.error('[CalendarDate] データ取得エラー:', error);
		} finally {
			loading = false;
		}
	}

	function toggleDarkMode() {
		darkMode.toggle();
	}

	async function handleReprocess() {
		if (!dailyData || reprocessing) return;

		if (dailyData.inventoryProcessed && dailyData.unregisteredCount === 0) {
			alert('この日付の売上はすべて反映済みです。再計算の必要はありません。');
			return;
		}

		if (
			!confirm(
				`${salesDate}の売上データを再計算します。\n登録済みレシピに基づいて原材料在庫を減算します。\nよろしいですか？`
			)
		) {
			return;
		}

		try {
			reprocessing = true;
			console.log('[CalendarDate] 再計算開始:', salesDate);

			// すでに処理済みの商品リストを取得
			const alreadyProcessed = dailyData.processedProducts || [];
			console.log('[CalendarDate] すでに処理済みの商品:', alreadyProcessed);

			// 売上データを再処理（処理済み商品をスキップ）
			const result = await processSalesData(dailyData.sales, salesDate, alreadyProcessed);

			console.log('[CalendarDate] 再計算完了:', result);

			// 新しく処理された商品を既存のリストに追加
			const newlyProcessedProducts = result.processedProducts.map((p) => p.productName);
			const allProcessedProducts = [...new Set([...alreadyProcessed, ...newlyProcessedProducts])];

			// 処理済みとしてマーク
			await dailySales.markAsProcessed(salesDate, result.totalUnregistered, allProcessedProducts);

			alert(
				`${salesDate}の売上データを再計算しました。\n\n` +
					`今回処理: ${result.totalProcessed}件\n` +
					`未登録: ${result.totalUnregistered}件\n` +
					`総処理済み: ${allProcessedProducts.length}件`

			);
			// データをリロード
			await loadData();
		} catch (error) {
			console.error('[CalendarDate] 再計算エラー:', error);
			alert(`再計算中にエラーが発生しました: ${error}`);
		} finally {
			reprocessing = false;
		}
	}

	async function handleFetchWeather() {
		if (fetchingWeather) return;

		try {
			fetchingWeather = true;
			console.log('[CalendarDate] 天候取得開始:', salesDate);

			const weatherData = await fetchWeatherForDate(salesDate);

			if (!weatherData) {
				alert('天候データの取得に失敗しました。APIキーが設定されているか確認してください。');
				return;
			}

			// 天候を保存
			await dailySales.updateWeather(salesDate, weatherData.weather);

			alert(`天候を取得しました: ${weatherData.description} (${weatherData.temp_c}°C)`);

			// データをリロード
			await loadData();
		} catch (error) {
			console.error('[CalendarDate] 天候取得エラー:', error);
			alert(`天候取得中にエラーが発生しました: ${error}`);
		} finally {
			fetchingWeather = false;
		}
	}

	async function handleWeatherSelect(weather: WeatherType) {
		try {
			await dailySales.updateWeather(salesDate, weather);
			showWeatherSelector = false;
			await loadData();
		} catch (error) {
			console.error('[CalendarDate] 天候更新エラー:', error);
			alert(`天候更新中にエラーが発生しました: ${error}`);
		}
	}
</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border ml-14 flex flex-col gap-4 border-b pb-4 sm:ml-0 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div class="flex items-center gap-2 sm:gap-4">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => (window.location.href = '/calendar')}
					class="touch-manipulation"
				>
					<ArrowLeft class="h-5 w-5" />
				</Button>
				<div>
					<h1 class="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-3xl">
						<CalendarIcon class="h-6 w-6 sm:h-8 sm:w-8" />
						{salesDate}
					</h1>
					<p class="text-muted-foreground mt-1 text-xs sm:text-sm">この日の売上データ</p>
				</div>
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

		{#if loading}
			<Card>
				<CardContent class="text-muted-foreground py-12 text-center">読み込み中...</CardContent>
			</Card>
		{:else if !dailyData}
			<Card class="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-orange-800 dark:text-orange-200">
						<AlertCircle class="h-5 w-5" />
						データが存在しません
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-orange-700 dark:text-orange-300">
						{salesDate} の売上データは登録されていません。
					</p>
				</CardContent>
			</Card>
		{:else}
			<!-- 天候情報カード -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center justify-between">
						<span class="flex items-center gap-2">
							<Cloud class="h-5 w-5" />
							天候情報
						</span>
						{#if dailyData.weather && dailyData.weather !== ''}
							<div class="flex items-center gap-2">
								<WeatherIcon weather={dailyData.weather} class="h-6 w-6" />
								<span class="text-muted-foreground text-sm font-normal">
									{dailyData.weather === 'sunny'
										? '晴れ'
										: dailyData.weather === 'cloudy'
											? '曇り'
											: dailyData.weather === 'rainy'
												? '雨'
												: dailyData.weather === 'snowy'
													? '雪'
													: 'その他'}
								</span>
							</div>
						{/if}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{#if !dailyData.weather || dailyData.weather === ''}
						<p class="text-muted-foreground mb-4 text-sm">
							この日の天候情報がまだ設定されていません。
						</p>
					{/if}

					<div class="mb-4 flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={handleFetchWeather}
							disabled={fetchingWeather}
							class="touch-manipulation"
						>
							{#if fetchingWeather}
								<RefreshCw class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<Cloud class="mr-2 h-4 w-4" />
							{/if}
							天候を自動取得
						</Button>

						<Button
							variant="outline"
							size="sm"
							onclick={() => (showWeatherSelector = !showWeatherSelector)}
							class="touch-manipulation"
						>
							<AlertCircle class="mr-2 h-4 w-4" />
							手動で設定
						</Button>
					</div>

					{#if showWeatherSelector}
						<div class="border-border bg-muted/30 mt-4 rounded-lg border p-4">
							<p class="mb-3 text-sm font-medium">天候を選択してください</p>
							<WeatherSelector weather={dailyData.weather || ''} onSelect={handleWeatherSelect} />
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- ステータスカード -->
			{#if dailyData.inventoryProcessed && dailyData.unregisteredCount === 0}
				<Card class="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-green-800 dark:text-green-200">
							<CheckCircle class="h-5 w-5" />
							すべて反映済み
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-green-700 dark:text-green-300">
							この日の売上データはすべて原材料在庫に反映されています。
						</p>
					</CardContent>
				</Card>
			{:else if dailyData.unregisteredCount > 0}
				<Card class="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-orange-800 dark:text-orange-200">
							<AlertCircle class="h-5 w-5" />
							未登録商品があります
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="mb-4 text-sm text-orange-700 dark:text-orange-300">
							{dailyData.unregisteredCount}件の商品に原材料が登録されていません。商品の原材料を登録した後、再計算してください。
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={() => (window.location.href = '/unregistered')}
								class="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300"
							>
								未登録商品を確認
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={handleReprocess}
								disabled={reprocessing}
								class="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300"
							>
								{#if reprocessing}
									<RefreshCw class="mr-2 h-4 w-4 animate-spin" />
								{:else}
									<RefreshCw class="mr-2 h-4 w-4" />
								{/if}
								再計算
							</Button>
						</div>
					</CardContent>
				</Card>
			{:else}
				<Card class="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-blue-800 dark:text-blue-200">
							<AlertCircle class="h-5 w-5" />
							原材料在庫を反映できます
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="mb-4 text-sm text-blue-700 dark:text-blue-300">
							すべての商品に原材料が登録されています。「再計算」をクリックして原材料在庫に反映してください。
						</p>
						<Button
							variant="outline"
							size="sm"
							onclick={handleReprocess}
							disabled={reprocessing}
							class="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
						>
							{#if reprocessing}
								<RefreshCw class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<RefreshCw class="mr-2 h-4 w-4" />
							{/if}
							再計算
						</Button>
					</CardContent>
				</Card>
			{/if}

			<!-- 統計カード -->
			<div class="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
				<StatsCard
					title="総売上額"
					value={`¥${dailyData.totalSales.toLocaleString()}`}
					description={`${salesDate}の総売上`}
					icon={DollarSign}
					iconColor="text-green-600 dark:text-green-400"
				/>
				<StatsCard
					title="粗利総額"
					value={`¥${dailyData.totalProfit.toLocaleString()}`}
					description={`${salesDate}の粗利益`}
					icon={TrendingUp}
					iconColor="text-blue-600 dark:text-blue-400"
				/>
				<StatsCard
					title="販売商品数"
					value={dailyData.totalQuantity}
					description={`${salesDate}の販売数`}
					icon={Package}
					iconColor="text-purple-600 dark:text-purple-400"
				/>
				<StatsCard
					title="商品種類"
					value={dailyData.productCount}
					description={`${salesDate}の商品種類`}
					icon={Package}
					iconColor="text-orange-600 dark:text-orange-400"
				/>
			</div>

			<!-- 処理済み商品情報 -->
			{#if dailyData.processedProducts && dailyData.processedProducts.length > 0}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-green-800 dark:text-green-200">
							<CheckCircle class="h-5 w-5" />
							在庫反映済み商品（{dailyData.processedProducts.length}件）
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-wrap gap-2">
							{#each dailyData.processedProducts as productName}
								<Badge variant="default">{productName}</Badge>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- 売上データテーブル -->
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle>商品別売上一覧</CardTitle>
						{#if dailyData.inventoryProcessed}
							<Badge variant="default">在庫反映済み</Badge>
						{/if}
					</div>
				</CardHeader>
				<CardContent>
					<SalesTable salesData={dailyData.sales} />
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
