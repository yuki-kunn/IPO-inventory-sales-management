<script lang="ts">
	import { Upload, Folder, File as FileIcon } from 'lucide-svelte';
	import Button from './ui/Button.svelte';
	import Card from './ui/Card.svelte';
	import CardContent from './ui/CardContent.svelte';
	import CardHeader from './ui/CardHeader.svelte';
	import CardTitle from './ui/CardTitle.svelte';
	import { parseSalesCSV, extractDateFromFilename, type ParsedSalesCSVResult } from '$lib/utils/salesCsv';
	import { dailySales } from '$lib/stores/dailySales.api';
	import type { SalesProcessResult } from '$lib/types';

	async function reflectInventory(date: string) {
		const res = await fetch('/api/inventory/reflect', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ date })
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok || !data.success) {
			throw new Error(data?.error || data?.message || '在庫反映に失敗しました');
		}
		return data.result as {
			totalProcessed: number;
			totalUnregistered: number;
			processedProducts: any[];
			unregisteredProducts: any[];
		};
	}

	let fileInput: HTMLInputElement;
	let folderInput: HTMLInputElement;
	let uploadStatus: ParsedSalesCSVResult | null = $state(null);
	let processResult: SalesProcessResult | null = $state(null);
	let reflectFailed = $state(false);
	let uploading = $state(false);
	let batchResults = $state<
		Array<{
			date: string;
			success: boolean;
			imported: number;
			processed: number;
			unregistered: number;
			warnings: number;
		}>
	>([]);

	// プログレス表示用
	let currentFileIndex = $state(0);
	let totalFiles = $state(0);
	let currentFileName = $state('');

	async function processFile(file: File) {
		try {
			const result = await parseSalesCSV(file);

			if (result.success && result.salesData.length > 0) {
				// カレンダーに先に保存（在庫反映が失敗してもカレンダーデータは確保）
				await dailySales.addOrUpdate(result.salesDate, result.salesData, 0, result.customerInfo);

				const reflect = await reflectInventory(result.salesDate);
				return {
					date: result.salesDate,
					success: true,
					imported: result.importedCount,
					processed: reflect.totalProcessed,
					unregistered: reflect.totalUnregistered,
					warnings: result.errors.length
				};
			}

			return {
				date: result.salesDate,
				success: false,
				imported: result.importedCount,
				processed: 0,
				unregistered: 0,
				warnings: result.errors.length
			};
		} catch (error) {
			console.error('[SalesUploader] エラー:', file.name, error);
			return {
				date: extractDateFromFilename(file.name),
				success: false,
				imported: 0,
				processed: 0,
				unregistered: 0,
				warnings: 0
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
		reflectFailed = false;
		batchResults = [];
		totalFiles = files.length;
		currentFileIndex = 0;

		try {
			if (files.length === 1) {
				// 単一ファイルの場合は従来通りの詳細表示
				const file = files[0];
				currentFileName = file.name;
				currentFileIndex = 1;

				const result = await parseSalesCSV(file);
				uploadStatus = result;

				if (result.success && result.salesData.length > 0) {
					// カレンダーに先に保存（在庫反映が失敗してもカレンダーデータは確保）
					await dailySales.addOrUpdate(result.salesDate, result.salesData, 0, result.customerInfo);

					// 在庫反映は付随処理。失敗してもインポート成功表示は維持する
					// （売上データは保存済み。後から /calendar の再計算でリカバリ可能）。
					try {
						const reflect = await reflectInventory(result.salesDate);
						processResult = {
							processedProducts: reflect.processedProducts,
							unregisteredProducts: reflect.unregisteredProducts,
							totalProcessed: reflect.totalProcessed,
							totalUnregistered: reflect.totalUnregistered
						};
					} catch (reflectError) {
						console.error('[SalesUploader] 在庫反映に失敗（インポートは成功）:', reflectError);
						reflectFailed = true;
					}
				}
			} else {
				// 複数ファイルの場合は一括処理
				const csvFiles = Array.from(files).filter((f) => f.name.endsWith('.csv'));
				totalFiles = csvFiles.length;

				// 各ファイルを順次処理（高速化のため並列度を上げる）
				const results = [];
				for (let i = 0; i < csvFiles.length; i++) {
					const file = csvFiles[i];
					currentFileIndex = i + 1;
					currentFileName = file.name;

					const result = await processFile(file);
					results.push(result);
				}

				batchResults = results;
			}
		} catch (error) {
			uploadStatus = {
				success: false,
				importedCount: 0,
				errors: [{ row: 0, field: 'file', message: `エラーが発生しました: ${error}` }],
				salesData: [],
				customerInfo: [],
				salesDate: ''
			};
		} finally {
			uploading = false;
			currentFileIndex = 0;
			totalFiles = 0;
			currentFileName = '';
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
					<FileIcon class="mr-2 h-4 w-4" />
					{uploading ? '処理中...' : 'ファイル選択'}
				</Button>
				<Button onclick={triggerFolderInput} disabled={uploading}>
					<Folder class="mr-2 h-4 w-4" />
					{uploading ? '処理中...' : 'フォルダ選択'}
				</Button>
			</div>

			<!-- プログレス表示 -->
			{#if uploading && totalFiles > 0}
				<div class="space-y-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-4">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium text-blue-600 dark:text-blue-400">
							処理中... {currentFileIndex}/{totalFiles}
						</span>
						<span class="text-muted-foreground text-xs">
							{Math.round((currentFileIndex / totalFiles) * 100)}%
						</span>
					</div>
					<!-- プログレスバー -->
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							class="h-full bg-blue-500 transition-all duration-300"
							style="width: {(currentFileIndex / totalFiles) * 100}%"
						></div>
					</div>
					{#if currentFileName}
						<p class="text-muted-foreground truncate text-xs">{currentFileName}</p>
					{/if}
				</div>
			{/if}

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
										{#if result.warnings > 0}
											<span class="text-orange-600 dark:text-orange-400"
												>スキップ: {result.warnings}行</span
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
							{uploadStatus.importedCount}件の売上データをインポートしました{#if uploadStatus.errors.length > 0}（{uploadStatus.errors.length}行スキップ）{/if}
						</p>
						{#if reflectFailed}
							<div class="mt-3 border-t border-orange-500/20 pt-3">
								<p class="text-xs font-medium text-orange-600 dark:text-orange-400">
									⚠ 売上データは保存しましたが、原材料在庫の自動反映に失敗しました。<br />
									カレンダーの該当日から「再計算」で反映できます。
								</p>
							</div>
						{/if}
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
						{#if uploadStatus.errors.length > 0}
							<div class="mt-3 border-t border-yellow-500/20 pt-3">
								<p class="mb-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
									スキップされた行: {uploadStatus.errors.length}件
								</p>
								<ul class="max-h-32 space-y-0.5 overflow-y-auto text-xs text-yellow-700 dark:text-yellow-300">
									{#each uploadStatus.errors as error}
										<li>行 {error.row}: {error.field} - {error.message}</li>
									{/each}
								</ul>
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
						商品名,種別1,種別2,カテゴリー,税区分,販売総売上,構成比%,粗利総額,構成比%,販売商品数,構成比%,返品商品数,構成比%,商品ID,商品コード,バーコード
					</code>
				</div>
				<div class="space-y-1 text-[10px]">
					<p class="font-medium">自動処理:</p>
					<ul class="ml-4 list-disc space-y-0.5">
						<li>
							種別1の「ホット」「アイス」を対象商品（コーヒー、カフェラテ、ルイボス、ストレート、ミルクティー、カモミールティー）の頭に自動付加
						</li>
						<li>
							「ストレート」「ルイボス」は「ホット/アイス〇〇ティー」に変換
						</li>
						<li>「リンゴ」「マンゴー」はNotionの「〇〇ジュース」と自動マッチング</li>
						<li>「店内」「お持ち帰り」などのキーワードを自動除外</li>
						<li>カテゴリ「顧客情報」のデータを自動分離・集計</li>
					</ul>
				</div>
				<p class="text-[10px]">
					※ Shift-JIS/UTF-8対応 | ファイル名から日付を自動抽出（例:
					バリエーション別売上_20260424-20260424.csv）
				</p>
			</div>
		</div>
	</CardContent>
</Card>
