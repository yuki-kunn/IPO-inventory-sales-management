<script lang="ts">
	import { Upload, Folder, File } from 'lucide-svelte';
	import Button from './ui/Button.svelte';
	import Card from './ui/Card.svelte';
	import CardContent from './ui/CardContent.svelte';
	import CardHeader from './ui/CardHeader.svelte';
	import CardTitle from './ui/CardTitle.svelte';
	import { parseSalesCSV, type ParsedSalesCSVResult } from '$lib/utils/salesCsv';
	import { dailySales } from '$lib/stores/dailySales.firestore';
	import { processSalesData } from '$lib/utils/salesProcessor';
	import type { SalesProcessResult } from '$lib/types';

	let fileInput: HTMLInputElement;
	let folderInput: HTMLInputElement;
	let uploadStatus: ParsedSalesCSVResult | null = $state(null);
	let processResult: SalesProcessResult | null = $state(null);
	let uploading = $state(false);
	let batchResults = $state<
		Array<{
			date: string;
			success: boolean;
			imported: number;
			processed: number;
			unregistered: number;
		}>
	>([]);

	async function processFile(file: File) {
		try {
			const result = await parseSalesCSV(file);

			if (result.success && result.salesData.length > 0) {
				console.log('[SalesUploader] 処理中:', file.name, '売上日:', result.salesDate);

				// レシピに基づいて原材料在庫を減算（新規アップロードなので処理済み商品リストは空）
				const processResult = await processSalesData(result.salesData, result.salesDate, []);

				// 日別売上として保存（未登録商品数も含める）
				await dailySales.addOrUpdate(
					result.salesDate,
					result.salesData,
					processResult.totalUnregistered
				);

				// 処理済み商品リストを作成
				const processedProductNames = processResult.processedProducts.map((p) => p.productName);

				// 処理済みとしてマーク
				await dailySales.markAsProcessed(
					result.salesDate,
					processResult.totalUnregistered,
					processedProductNames
				);

				return {
					date: result.salesDate,
					success: true,
					imported: result.importedCount,
					processed: processResult.totalProcessed,
					unregistered: processResult.totalUnregistered
				};
			}

			return {
				date: file.name,
				success: false,
				imported: 0,
				processed: 0,
				unregistered: 0
			};
		} catch (error) {
			console.error('[SalesUploader] エラー:', file.name, error);
			return {
				date: file.name,
				success: false,
				imported: 0,
				processed: 0,
				unregistered: 0
			};
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (!files || files.length === 0) return;

		uploading = true;
		uploadStatus = null;
		processResult = null;
		batchResults = [];

		try {
			if (files.length === 1) {
				// 単一ファイルの場合は従来通りの詳細表示
				const file = files[0];
				const result = await parseSalesCSV(file);
				uploadStatus = result;

				if (result.success && result.salesData.length > 0) {
					console.log('[SalesUploader] 売上日:', result.salesDate);

					processResult = await processSalesData(result.salesData, result.salesDate, []);
					await dailySales.addOrUpdate(
						result.salesDate,
						result.salesData,
						processResult.totalUnregistered
					);

					const processedProductNames = processResult.processedProducts.map((p) => p.productName);
					await dailySales.markAsProcessed(
						result.salesDate,
						processResult.totalUnregistered,
						processedProductNames
					);
				}
			} else {
				// 複数ファイルの場合は一括処理
				console.log('[SalesUploader] 一括処理開始:', files.length, 'ファイル');

				const csvFiles = Array.from(files).filter((f) => f.name.endsWith('.csv'));
				console.log('[SalesUploader] CSVファイル:', csvFiles.length, '件');

				// 各ファイルを順次処理（並行処理するとFirestoreの制限に引っかかる可能性があるため）
				const results = [];
				for (const file of csvFiles) {
					const result = await processFile(file);
					results.push(result);
				}

				batchResults = results;
				console.log('[SalesUploader] 一括処理完了:', results);
			}
		} catch (error) {
			uploadStatus = {
				success: false,
				importedCount: 0,
				errors: [{ row: 0, field: 'file', message: `エラーが発生しました: ${error}` }],
				salesData: [],
				salesDate: ''
			};
		} finally {
			uploading = false;
			// ファイル選択をリセット
			if (target) {
				target.value = '';
			}
		}
	}

	function triggerFileInput() {
		fileInput.click();
	}

	function triggerFolderInput() {
		folderInput.click();
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Upload class="h-5 w-5" />
			売上CSVファイルをアップロード
		</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			<p class="text-muted-foreground text-sm">
				商品別売上データ（Shift-JIS/UTF-8対応）のCSVファイルをアップロードしてください。
			</p>

			<input
				type="file"
				accept=".csv"
				bind:this={fileInput}
				onchange={handleFileSelect}
				class="hidden"
			/>

			<input
				type="file"
				accept=".csv"
				multiple
				webkitdirectory
				bind:this={folderInput}
				onchange={handleFileSelect}
				class="hidden"
			/>

			<div class="grid grid-cols-2 gap-2">
				<Button onclick={triggerFileInput} disabled={uploading} variant="outline">
					<File class="mr-2 h-4 w-4" />
					{uploading ? '処理中...' : 'ファイル選択'}
				</Button>
				<Button onclick={triggerFolderInput} disabled={uploading}>
					<Folder class="mr-2 h-4 w-4" />
					{uploading ? '処理中...' : 'フォルダ選択'}
				</Button>
			</div>

			<!-- 一括処理結果 -->
			{#if batchResults.length > 0}
				<div class="rounded-md border border-blue-500/20 bg-blue-500/10 p-4">
					<p class="mb-3 text-sm font-medium text-blue-600 dark:text-blue-400">
						一括処理完了: {batchResults.length}ファイル
					</p>
					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each batchResults as result}
							<div
								class="rounded p-2 text-xs {result.success ? 'bg-green-500/10' : 'bg-red-500/10'}"
							>
								<div class="flex items-center justify-between">
									<span
										class="font-medium {result.success
											? 'text-green-700 dark:text-green-300'
											: 'text-red-700 dark:text-red-300'}"
									>
										{result.date}
									</span>
									<span class="text-muted-foreground">
										{result.success ? '✓' : '✗'}
									</span>
								</div>
								{#if result.success}
									<div class="text-muted-foreground mt-1 space-x-3">
										<span>商品: {result.imported}件</span>
										<span>処理: {result.processed}件</span>
										{#if result.unregistered > 0}
											<span class="text-yellow-600 dark:text-yellow-400"
												>未登録: {result.unregistered}件</span
											>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<div class="mt-3 border-t border-blue-500/20 pt-3">
						<div class="grid grid-cols-3 gap-2 text-xs">
							<div class="text-center">
								<div class="font-medium text-green-600 dark:text-green-400">
									{batchResults.filter((r) => r.success).length}
								</div>
								<div class="text-muted-foreground">成功</div>
							</div>
							<div class="text-center">
								<div class="font-medium text-blue-600 dark:text-blue-400">
									{batchResults.reduce((sum, r) => sum + r.imported, 0)}
								</div>
								<div class="text-muted-foreground">総商品数</div>
							</div>
							<div class="text-center">
								<div class="font-medium text-yellow-600 dark:text-yellow-400">
									{batchResults.reduce((sum, r) => sum + r.unregistered, 0)}
								</div>
								<div class="text-muted-foreground">未登録</div>
							</div>
						</div>
					</div>
					{#if batchResults.some((r) => r.unregistered > 0)}
						<Button
							variant="outline"
							size="sm"
							class="mt-3 w-full"
							onclick={() => (window.location.href = '/unregistered')}
						>
							未登録商品ページで確認
						</Button>
					{/if}
				</div>
			{/if}

			<!-- 単一ファイル処理結果 -->
			{#if uploadStatus}
				<div
					class="rounded-md p-4 {uploadStatus.success
						? 'border border-green-500/20 bg-green-500/10'
						: 'border border-red-500/20 bg-red-500/10'}"
				>
					{#if uploadStatus.success}
						<p class="mb-2 text-sm font-medium text-green-600 dark:text-green-400">
							{uploadStatus.importedCount}件の売上データをインポートしました
						</p>
						{#if processResult}
							<div class="mt-3 border-t border-green-500/20 pt-3">
								<p class="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
									原材料在庫を自動更新しました: {processResult.totalProcessed}件
								</p>
								{#if processResult.processedProducts.length > 0}
									<ul
										class="max-h-40 space-y-1 overflow-y-auto text-xs text-green-700 dark:text-green-300"
									>
										{#each processResult.processedProducts as processed}
											<li>
												<span class="font-medium">{processed.productName}</span>: {processed.soldQuantity}個販売
												{#if processed.ingredientsReduced.length > 0}
													<ul class="mt-1 ml-4 space-y-0.5">
														{#each processed.ingredientsReduced as ing}
															<li class="text-[10px]">
																↳ {ing.ingredientName}: -{ing.reducedQuantity}
															</li>
														{/each}
													</ul>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
								{#if processResult.unregisteredProducts.length > 0}
									<div class="mt-3 border-t border-yellow-500/20 pt-3">
										<p class="mb-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
											原料未登録の商品: {processResult.totalUnregistered}件
										</p>
										<ul
											class="max-h-32 space-y-1 overflow-y-auto text-xs text-yellow-700 dark:text-yellow-300"
										>
											{#each processResult.unregisteredProducts as unregistered}
												<li>
													{unregistered.productName} ({unregistered.soldQuantity}個)
												</li>
											{/each}
										</ul>
										<Button
											variant="outline"
											size="sm"
											class="mt-2"
											onclick={() => (window.location.href = '/unregistered')}
										>
											未登録商品ページで確認
										</Button>
									</div>
								{/if}
							</div>
						{/if}
					{:else}
						<p class="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
							インポートに失敗しました
						</p>
						<ul class="space-y-1 text-xs text-red-600 dark:text-red-400">
							{#each uploadStatus.errors as error}
								<li>行 {error.row}: {error.field} - {error.message}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			<div class="text-muted-foreground space-y-2 text-xs">
				<div>
					<p class="mb-1 font-medium">アップロード方法:</p>
					<ul class="ml-4 list-disc space-y-1 text-[10px]">
						<li><strong>ファイル選択</strong>: 単一ファイルまたは複数ファイルを選択</li>
						<li>
							<strong>フォルダ選択</strong>: フォルダ内のすべてのCSVファイルを一括アップロード
						</li>
					</ul>
				</div>
				<div>
					<p class="mb-1 font-medium">対応フォーマット:</p>
					<code class="bg-muted block rounded p-2 text-[10px] leading-relaxed">
						商品名,カテゴリー,税区分,販売総売上,構成比%,粗利総額,構成比%,販売商品数,構成比%,返品商品数,構成比%,商品ID,商品コード,バーコード
					</code>
				</div>
				<p class="text-[10px]">
					※ Shift-JIS/UTF-8対応 | ファイル名から日付を自動抽出（例:
					商品別売上_20260413-20260413.csv）
				</p>
			</div>
		</div>
	</CardContent>
</Card>
