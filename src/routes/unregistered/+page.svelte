<script lang="ts">
	import { AlertCircle, Moon, Sun, Plus, RefreshCw } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { unregisteredProducts } from '$lib/stores/unregistered.api';
	import { dailySales } from '$lib/stores/dailySales.api';
	import { darkMode } from '$lib/stores/darkMode';
	import { processSalesData } from '$lib/utils/salesProcessor';
	import type { UnregisteredProduct } from '$lib/types';

	let products = $state<UnregisteredProduct[]>([]);
	let isDarkMode = $state(false);
	let reprocessing = $state<{ [date: string]: boolean }>({});

	unregisteredProducts.subscribe((value) => {
		products = value;
	});

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	function toggleDarkMode() {
		darkMode.toggle();
	}

	function handleRegisterProduct(productName: string) {
		// 原料管理ページに商品名を渡して遷移
		window.location.href = `/recipes?productName=${encodeURIComponent(productName)}`;
	}

	function handleRemoveProduct(productName: string) {
		if (confirm(`「${productName}」を未登録リストから削除しますか?`)) {
			unregisteredProducts.remove(productName);
		}
	}

	async function handleReprocessDate(date: string) {
		if (reprocessing[date]) return;

		if (
			!confirm(
				`${date}の売上データを再計算します。\n登録済みレシピに基づいて原材料在庫を再度減算します。\nよろしいですか？`
			)
		) {
			return;
		}

		try {
			reprocessing[date] = true;
			console.log('[UnregisteredProducts] 再計算開始:', date);

			// その日の売上データを取得
			const dailyData = await dailySales.getByDate(date);

			if (!dailyData || !dailyData.sales || dailyData.sales.length === 0) {
				alert(`${date}の売上データが見つかりません。`);
				return;
			}

			console.log('[UnregisteredProducts] 売上データ取得:', dailyData.sales.length, '件');

			// すでに処理済みの商品リストを取得
			const alreadyProcessed = dailyData.processedProducts || [];
			console.log('[UnregisteredProducts] すでに処理済みの商品:', alreadyProcessed);

			// 売上データを再処理（処理済み商品をスキップ）
			const result = await processSalesData(dailyData.sales, date, alreadyProcessed);

			console.log('[UnregisteredProducts] 再計算完了:', result);

			// 新しく処理された商品を既存のリストに追加
			const newlyProcessedProducts = result.processedProducts.map((p) => p.productName);
			const allProcessedProducts = [...new Set([...alreadyProcessed, ...newlyProcessedProducts])];

			// 処理済みとしてマーク
			await dailySales.markAsProcessed(date, result.totalUnregistered, allProcessedProducts);

			alert(
				`${date}の売上データを再計算しました。\n\n` +
					`今回処理: ${result.totalProcessed}件\n` +
					`未登録: ${result.totalUnregistered}件\n` +
					`総処理済み: ${allProcessedProducts.length}件`
			);
		} catch (error) {
			console.error('[UnregisteredProducts] 再計算エラー:', error);
			alert(`再計算中にエラーが発生しました: ${error}`);
		} finally {
			reprocessing[date] = false;
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border ml-14 flex flex-col gap-4 border-b pb-4 sm:ml-0 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">未登録商品</h1>
				<p class="text-muted-foreground mt-1 text-xs sm:text-sm">
					原材料が登録されていない商品の一覧
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
				<Button onclick={() => (window.location.href = '/recipes')} class="touch-manipulation">
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">商品を登録</span>
				</Button>
			</div>
		</div>

		<!-- 統計カード -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">未登録商品数</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold">{products.length}</div>
					<p class="text-muted-foreground mt-1 text-sm">レシピ登録が必要な商品</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">原材料登録が必要</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-3xl font-bold">
						{products.reduce((sum, p) => sum + p.soldQuantity, 0)}
					</div>
					<p class="text-muted-foreground mt-1 text-sm">未登録商品の総販売個数</p>
				</CardContent>
			</Card>
		</div>

		<!-- アラート -->
		{#if products.length > 0}
			<Card class="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-orange-800 dark:text-orange-200">
						<AlertCircle class="h-5 w-5" />
						原材料登録アラート
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="mb-4 text-sm text-orange-700 dark:text-orange-300">
						以下の商品の原材料が登録されていません。原材料在庫が正確に管理されるよう、商品の原材料を登録してください。
					</p>

					{@const allSalesDates = Array.from(new Set(products.flatMap((p) => p.salesDates))).sort(
						(a, b) => b.localeCompare(a)
					)}

					{#if allSalesDates.length > 0}
						<div class="mt-4 border-t border-orange-200 pt-4 dark:border-orange-800">
							<p class="mb-2 text-sm font-medium text-orange-800 dark:text-orange-200">
								原材料登録後の再計算
							</p>
							<p class="mb-3 text-xs text-orange-700 dark:text-orange-300">
								未登録商品に原材料を登録した後、以下の日付の売上を再計算できます。
							</p>
							<div class="flex flex-wrap gap-2">
								{#each allSalesDates as date}
									<Button
										variant="outline"
										size="sm"
										onclick={() => handleReprocessDate(date)}
										disabled={reprocessing[date]}
										class="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300"
									>
										{#if reprocessing[date]}
											<RefreshCw class="mr-1 h-3 w-3 animate-spin" />
										{:else}
											<RefreshCw class="mr-1 h-3 w-3" />
										{/if}
										{date} を再計算
									</Button>
								{/each}
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- 未登録商品一覧 -->
		<Card>
			<CardHeader>
				<CardTitle>未登録商品一覧</CardTitle>
			</CardHeader>
			<CardContent>
				{#if products.length === 0}
					<div class="text-muted-foreground py-12 text-center">未登録商品はありません</div>
				{:else}
					<!-- モバイル: カード表示 -->
					<div class="-mx-4 block space-y-3 sm:mx-0 md:hidden">
						{#each products as product}
							<div
								class="hover:bg-muted/50 space-y-3 border-b p-4 transition-colors last:border-b-0 md:rounded-lg md:border"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="text-base font-medium">{product.productName}</div>
										<Badge variant="destructive" class="mt-1">未登録</Badge>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-3 text-sm">
									<div>
										<div class="text-muted-foreground mb-1 text-xs">累計販売数</div>
										<div class="font-semibold">{product.soldQuantity}</div>
									</div>
									<div>
										<div class="text-muted-foreground mb-1 text-xs">初回検出</div>
										<div class="text-xs">{formatDate(product.firstSeenAt)}</div>
									</div>
								</div>

								<div>
									<div class="text-muted-foreground mb-1 text-xs">売上日</div>
									<div class="flex flex-wrap gap-1">
										{#each product.salesDates as date}
											<Badge variant="outline" class="text-xs">{date}</Badge>
										{/each}
									</div>
								</div>

								<div class="border-border flex justify-end gap-2 border-t pt-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => handleRegisterProduct(product.productName)}
										class="touch-manipulation"
									>
										原材料登録
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleRemoveProduct(product.productName)}
										class="touch-manipulation"
									>
										削除
									</Button>
								</div>
							</div>
						{/each}
					</div>

					<!-- デスクトップ: テーブル表示 -->
					<div
						class="border-border -mx-4 hidden overflow-x-auto border-y sm:mx-0 sm:rounded-lg sm:border md:block"
					>
						<table class="divide-border min-w-full divide-y">
							<thead class="bg-muted/50">
								<tr>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										商品名
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										累計販売数
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										売上日
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										初回検出日時
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-right text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										アクション
									</th>
								</tr>
							</thead>
							<tbody class="bg-background divide-border divide-y">
								{#each products as product}
									<tr class="hover:bg-muted/50 transition-colors">
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="flex items-center gap-2 text-sm font-medium">
												{product.productName}
												<Badge variant="destructive">未登録</Badge>
											</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm font-semibold">{product.soldQuantity}</div>
										</td>
										<td class="px-4 py-3 sm:px-6 sm:py-4">
											<div class="flex flex-wrap gap-1">
												{#each product.salesDates as date}
													<Badge variant="outline">{date}</Badge>
												{/each}
											</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-muted-foreground text-sm">
												{formatDate(product.firstSeenAt)}
											</div>
										</td>
										<td
											class="px-4 py-3 text-right text-sm font-medium whitespace-nowrap sm:px-6 sm:py-4"
										>
											<div class="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onclick={() => handleRegisterProduct(product.productName)}
												>
													原材料登録
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => handleRemoveProduct(product.productName)}
												>
													削除
												</Button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
