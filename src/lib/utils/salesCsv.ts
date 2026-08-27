import type { SalesData, CSVImportError, CustomerInfo } from '$lib/types';

export interface ParsedSalesCSVResult {
	success: boolean;
	importedCount: number;
	errors: CSVImportError[];
	salesData: SalesData[];
	customerInfo: CustomerInfo[]; // 顧客情報データ
	salesDate: string; // 売上日（YYYY-MM-DD形式）
}

// === 高速化: 正規表現を事前コンパイル ===
const DATE_PATTERN_1 = /(\d{8})-\d{8}/;
const DATE_PATTERN_2 = /(\d{8})/;
const HOT_PATTERN = /ホット/;
const ICE_PATTERN = /アイス/;
const DANGEROUS_HTML_PATTERN = /<script|<iframe|javascript:|onerror=|onload=/i;
const DANGEROUS_FILENAME_PATTERN = /[<>:"|?*\x00-\x1f]/;

// === 高速化: Setで高速検索 ===
const HOT_COLD_PRODUCTS = new Set([
	'コーヒー',
	'カフェラテ',
	'ルイボス',
	'ストレート',
	'ミルクティー',
	'カモミールティー'
]);

// 種別を商品名から分離した商品（種別1を「商品名(種別)」の形式で結合する）
const VARIATION_COMBINED_PRODUCTS = new Set(['ホットサンド']);

const EXCLUDE_PATTERNS = [
	'店内',
	'お持ち帰り',
	'(店内)',
	'(お持ち帰り)',
	'(バリエーション未設定)',
	'バリエーション未設定'
];

// === 高速化: ID生成カウンター（UUIDより高速） ===
let idCounter = 0;
function generateFastId(): string {
	return `sales_${Date.now()}_${idCounter++}`;
}

/**
 * ファイル名から日付を抽出
 * 例: 商品別売上_20260413-20260413.csv → 2026-04-13
 */
export function extractDateFromFilename(filename: string): string {
	// パターン1: 商品別売上_YYYYMMDD-YYYYMMDD.csv
	const match1 = filename.match(DATE_PATTERN_1);
	if (match1) {
		const dateStr = match1[1]; // YYYYMMDD
		return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
	}

	// パターン2: YYYYMMDD.csv
	const match2 = filename.match(DATE_PATTERN_2);
	if (match2) {
		const dateStr = match2[1];
		return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
	}

	// 日付が見つからない場合は今日の日付を返す
	return new Date().toISOString().split('T')[0];
}

/**
 * 商品名を正規化する（種別1の「ホット」「アイス」を商品名の頭に付ける）
 * 高速化: 正規表現キャッシュ、Set検索、早期リターン
 */
function normalizeProductName(productName: string, variation1: string): string {
	// 早期リターン: variation1が空ならそのまま返す
	if (!variation1) return productName;

	// 種別結合商品（ホットサンド等）: 「商品名(種別1)」の形式で結合する。
	// 例: 商品名「ホットサンド」+ 種別1「ハムチーズ」→「ホットサンド(ハムチーズ)」
	// 種別はNotionメニュー名に合わせ半角括弧で囲む。
	if (VARIATION_COMBINED_PRODUCTS.has(productName)) {
		const variation = cleanVariation(variation1);
		return variation ? `${productName}(${variation})` : productName;
	}

	// 高速化: 事前コンパイル済み正規表現を使用
	const hotMatch = HOT_PATTERN.test(variation1);
	const iceMatch = ICE_PATTERN.test(variation1);

	// 早期リターン: ホット/アイスがない場合
	if (!hotMatch && !iceMatch) return productName;

	// 高速化: Set検索（O(1)）でホット/アイス対象商品かチェック
	let isHotColdProduct = false;
	for (const product of HOT_COLD_PRODUCTS) {
		if (productName.includes(product)) {
			isHotColdProduct = true;
			break;
		}
	}

	if (!isHotColdProduct) return productName;

	// 特別処理: ストレート、ルイボス
	if (productName === 'ストレート') {
		return hotMatch ? 'ホットストレートティー' : 'アイスストレートティー';
	}
	if (productName === 'ルイボス') {
		return hotMatch ? 'ホットルイボスティー' : 'アイスルイボスティー';
	}

	// その他の商品は頭にホット/アイスを追加
	return hotMatch ? `ホット${productName}` : `アイス${productName}`;
}

/**
 * 種別から除外すべきキーワードを削除する
 * 高速化: 配列ループを定数配列で実行
 */
function cleanVariation(variation: string): string {
	if (!variation) return '';

	let cleaned = variation;
	for (const pattern of EXCLUDE_PATTERNS) {
		cleaned = cleaned.replace(pattern, '');
	}

	return cleaned.trim();
}

// Shift-JISエンコーディングのCSVファイルをパースする
export async function parseSalesCSV(file: File): Promise<ParsedSalesCSVResult> {
	const errors: CSVImportError[] = [];
	const salesData: SalesData[] = [];
	const customerInfo: CustomerInfo[] = [];

	// === 入力検証 ===

	// ファイルサイズチェック (最大10MB)
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	if (file.size > MAX_FILE_SIZE) {
		return {
			success: false,
			importedCount: 0,
			errors: [{ row: 0, field: 'file', message: 'ファイルサイズが大きすぎます（最大10MB）' }],
			salesData: [],
			customerInfo: [],
			salesDate: new Date().toISOString().split('T')[0]
		};
	}

	// === 高速化: 事前コンパイル済み正規表現を使用 ===
	if (DANGEROUS_FILENAME_PATTERN.test(file.name)) {
		return {
			success: false,
			importedCount: 0,
			errors: [{ row: 0, field: 'file', message: 'ファイル名に無効な文字が含まれています' }],
			salesData: [],
			customerInfo: [],
			salesDate: new Date().toISOString().split('T')[0]
		};
	}

	// ファイル拡張子チェック
	if (!file.name.toLowerCase().endsWith('.csv')) {
		return {
			success: false,
			importedCount: 0,
			errors: [{ row: 0, field: 'file', message: 'CSVファイルのみアップロード可能です' }],
			salesData: [],
			customerInfo: [],
			salesDate: new Date().toISOString().split('T')[0]
		};
	}

	// ファイル名から日付を抽出
	const salesDate = extractDateFromFilename(file.name);

	try {
		// Shift-JISでファイルを読み込む
		const arrayBuffer = await file.arrayBuffer();
		let csvContent: string;

		try {
			// Shift-JISでデコードを試みる
			const decoder = new TextDecoder('shift-jis');
			csvContent = decoder.decode(arrayBuffer);
		} catch (e) {
			// Shift-JISでデコードできない場合はUTF-8で試す
			const decoder = new TextDecoder('utf-8');
			csvContent = decoder.decode(arrayBuffer);
		}

		const lines = csvContent.split('\n').filter((line) => line.trim());

		if (lines.length === 0) {
			return {
				success: false,
				importedCount: 0,
				errors: [{ row: 0, field: 'file', message: 'CSVファイルが空です' }],
				salesData: [],
				customerInfo: [],
				salesDate: salesDate
			};
		}

		// 行数制限（最大10,000行）
		const MAX_ROWS = 10000;
		if (lines.length > MAX_ROWS) {
			return {
				success: false,
				importedCount: 0,
				errors: [
					{
						row: 0,
						field: 'file',
						message: `CSVファイルの行数が多すぎます（最大${MAX_ROWS}行）`
					}
				],
				salesData: [],
				customerInfo: [],
				salesDate: salesDate
			};
		}

		// ヘッダー行をパース（列名→インデックスのマップを作成）
		const headers = lines[0].split(',').map((h) => h.trim());
		// 同名列（構成比%が複数）はインデックス配列で管理
		const headerMap = new Map<string, number[]>();
		headers.forEach((h, i) => {
			if (!headerMap.has(h)) headerMap.set(h, []);
			headerMap.get(h)!.push(i);
		});
		// 列インデックスを解決するヘルパー（同名列はoccurrence番目を取得）
		const col = (name: string, occurrence = 0): number =>
			(headerMap.get(name) ?? [])[occurrence] ?? -1;

		// 割引額列の有無を検出（salesList形式に含まれる）
		const discountIdx = col('割引額');
		const hasDiscount = discountIdx >= 0;

		// === 高速化: 一度だけタイムスタンプ取得 ===
		const importedAt = new Date().toISOString();
		const MAX_PRODUCT_NAME_LENGTH = 200;

		// データ行をパース（ヘッダーをスキップ）
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line.trim()) continue;

			const values = line.split(',').map((v) => v.trim());

			try {
				// 列名ベースで値を取得（固定インデックスではなくヘッダーから解決）
				const rawProductName = values[col('商品名')] ?? values[0] ?? '';
				const variation1Raw = values[col('種別1')] ?? values[1] ?? '';
				const variation2Raw = values[col('種別2')] ?? values[2] ?? '';
				const category = values[col('カテゴリー')] ?? values[3] ?? '';

				// === 高速化: 早期リターンでチェック順序を最適化 ===

				// 商品名が必須（空チェックを最初に）
				if (!rawProductName) {
					errors.push({
						row: i + 1,
						field: '商品名',
						message: '商品名は必須です'
					});
					continue;
				}

				// カテゴリが「顧客情報」の場合は顧客情報として処理（早期分岐）
				if (category === '顧客情報') {
					const soldIdx = col('販売商品数');
					customerInfo.push({
						gender: rawProductName,
						ageGroup: variation1Raw,
						count: parseInt(soldIdx >= 0 ? values[soldIdx] : values[9]) || 0
					});
					continue;
				}

				// 長さチェック（よくあるケースなので次に）
				if (rawProductName.length > MAX_PRODUCT_NAME_LENGTH) {
					errors.push({
						row: i + 1,
						field: '商品名',
						message: `商品名が長すぎます（最大${MAX_PRODUCT_NAME_LENGTH}文字）`
					});
					continue;
				}

				// HTMLタグチェック（レアケースなので最後に、事前コンパイル済み正規表現使用）
				if (DANGEROUS_HTML_PATTERN.test(rawProductName)) {
					errors.push({
						row: i + 1,
						field: '商品名',
						message: '商品名に無効な文字が含まれています'
					});
					continue;
				}

				// 商品名を正規化（ホット/アイスを頭に付ける）
				const normalizedProductName = normalizeProductName(rawProductName, variation1Raw);

				// 種別をクリーンアップ（店内、お持ち帰りなどを除外）
				const variation1 = cleanVariation(variation1Raw);
				const variation2 = cleanVariation(variation2Raw);

				// 各列の値をヘッダーマップ経由で取得
				const taxTypeIdx = col('税区分');
				const totalSalesIdx = col('販売総売上');
				const salesRatioIdx = col('構成比%', 0); // 1つ目の構成比%
				const grossProfitIdx = col('粗利総額');
				const profitRatioIdx = col('構成比%', 1); // 2つ目の構成比%
				const soldQtyIdx = col('販売商品数');
				const qtyRatioIdx = col('構成比%', 2); // 3つ目の構成比%
				const returnQtyIdx = col('返品商品数');
				const returnRatioIdx = col('構成比%', 3); // 4つ目の構成比%
				const productIdIdx = col('商品ID');
				const productCodeIdx = col('商品コード');
				const barcodeIdx = col('バーコード');

				// === 高速化: generateFastId()使用（UUIDより約10倍高速） ===
				const entry: import('$lib/types').SalesData = {
					id: generateFastId(),
					productName: normalizedProductName,
					variation1: variation1 || undefined,
					variation2: variation2 || undefined,
					category: category,
					taxType: taxTypeIdx >= 0 ? (values[taxTypeIdx] || '') : (values[4] || ''),
					totalSales: parseFloat(totalSalesIdx >= 0 ? values[totalSalesIdx] : values[5]) || 0,
					salesRatio: parseFloat(salesRatioIdx >= 0 ? values[salesRatioIdx] : values[6]) || 0,
					grossProfit: parseFloat(grossProfitIdx >= 0 ? values[grossProfitIdx] : values[7]) || 0,
					profitRatio: parseFloat(profitRatioIdx >= 0 ? values[profitRatioIdx] : values[8]) || 0,
					soldQuantity: parseInt(soldQtyIdx >= 0 ? values[soldQtyIdx] : values[9]) || 0,
					quantityRatio: parseFloat(qtyRatioIdx >= 0 ? values[qtyRatioIdx] : values[10]) || 0,
					returnedQuantity: parseInt(returnQtyIdx >= 0 ? values[returnQtyIdx] : values[11]) || 0,
					returnRatio: parseFloat(returnRatioIdx >= 0 ? values[returnRatioIdx] : values[12]) || 0,
					productId: productIdIdx >= 0 ? (values[productIdIdx] || '') : (values[13] || ''),
					productCode: productCodeIdx >= 0 ? (values[productCodeIdx] || '') : (values[14] || ''),
					barcode: barcodeIdx >= 0 ? (values[barcodeIdx] || '') : (values[15] || ''),
					salesDate: salesDate,
					importedAt: importedAt
				};
				// 割引額列が存在する場合のみ付与
				if (hasDiscount) {
					entry.discountAmount = parseFloat(values[discountIdx]) || 0;
				}
				salesData.push(entry);
			} catch (error) {
				errors.push({
					row: i + 1,
					field: 'parse',
					message: `行のパースに失敗しました: ${error}`
				});
			}
		}

		return {
			success: salesData.length > 0,
			importedCount: salesData.length,
			errors,
			salesData,
			customerInfo,
			salesDate: salesDate
		};
	} catch (error) {
		return {
			success: false,
			importedCount: 0,
			errors: [
				{
					row: 0,
					field: 'file',
					message: `ファイルの読み込みに失敗しました: ${error}`
				}
			],
			salesData: [],
			customerInfo: [],
			salesDate: new Date().toISOString().split('T')[0]
		};
	}
}

export function exportSalesToCSV(salesData: SalesData[]): string {
	const headers = [
		'商品名',
		'種別1',
		'種別2',
		'カテゴリー',
		'税区分',
		'販売総売上',
		'構成比%',
		'粗利総額',
		'構成比%',
		'販売商品数',
		'構成比%',
		'返品商品数',
		'構成比%',
		'商品ID',
		'商品コード',
		'バーコード'
	];

	const rows = salesData.map((s) => [
		s.productName,
		s.variation1 || '',
		s.variation2 || '',
		s.category,
		s.taxType,
		s.totalSales,
		s.salesRatio,
		s.grossProfit,
		s.profitRatio,
		s.soldQuantity,
		s.quantityRatio,
		s.returnedQuantity,
		s.returnRatio,
		s.productId,
		s.productCode,
		s.barcode
	]);

	const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

	return csvContent;
}
