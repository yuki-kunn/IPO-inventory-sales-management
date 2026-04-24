import type { SalesData, CSVImportError, CustomerInfo } from '$lib/types';

export interface ParsedSalesCSVResult {
	success: boolean;
	importedCount: number;
	errors: CSVImportError[];
	salesData: SalesData[];
	customerInfo: CustomerInfo[]; // 顧客情報データ
	salesDate: string; // 売上日（YYYY-MM-DD形式）
}

/**
 * ファイル名から日付を抽出
 * 例: 商品別売上_20260413-20260413.csv → 2026-04-13
 */
function extractDateFromFilename(filename: string): string {
	console.log('[salesCsv] ファイル名:', filename);

	// パターン1: 商品別売上_YYYYMMDD-YYYYMMDD.csv
	const pattern1 = /(\d{8})-\d{8}/;
	const match1 = filename.match(pattern1);

	if (match1) {
		const dateStr = match1[1]; // YYYYMMDD
		const year = dateStr.substring(0, 4);
		const month = dateStr.substring(4, 6);
		const day = dateStr.substring(6, 8);
		const formattedDate = `${year}-${month}-${day}`;
		console.log('[salesCsv] 抽出した日付:', formattedDate);
		return formattedDate;
	}

	// パターン2: YYYYMMDD.csv
	const pattern2 = /(\d{8})/;
	const match2 = filename.match(pattern2);

	if (match2) {
		const dateStr = match2[1];
		const year = dateStr.substring(0, 4);
		const month = dateStr.substring(4, 6);
		const day = dateStr.substring(6, 8);
		const formattedDate = `${year}-${month}-${day}`;
		console.log('[salesCsv] 抽出した日付:', formattedDate);
		return formattedDate;
	}

	// 日付が見つからない場合は今日の日付を返す
	const today = new Date().toISOString().split('T')[0];
	console.log('[salesCsv] 日付が見つかりません。今日の日付を使用:', today);
	return today;
}

/**
 * 商品名を正規化する（種別1の「ホット」「アイス」を商品名の頭に付ける）
 */
function normalizeProductName(productName: string, variation1: string): string {
	// ホット/アイスを適用する商品リスト
	const hotColdProducts = [
		'コーヒー',
		'カフェラテ',
		'ルイボス',
		'ストレート',
		'ミルクティー',
		'カモミールティー'
	];

	// 種別1から「ホット」「アイス」を抽出
	const hotMatch = variation1.match(/ホット/);
	const iceMatch = variation1.match(/アイス/);

	// ホット/アイス対象商品の場合のみ処理
	const isHotColdProduct = hotColdProducts.some((product) => productName.includes(product));

	if (isHotColdProduct && (hotMatch || iceMatch)) {
		// 「ストレート」の場合は特別処理（お尻に「ティー」を追加）
		if (productName === 'ストレート') {
			if (hotMatch) {
				return 'ホットストレートティー';
			} else if (iceMatch) {
				return 'アイスストレートティー';
			}
		}

		// その他の商品は頭にホット/アイスを追加
		if (hotMatch) {
			return `ホット${productName}`;
		} else if (iceMatch) {
			return `アイス${productName}`;
		}
	}

	return productName;
}

/**
 * 種別から除外すべきキーワードを削除する
 */
function cleanVariation(variation: string): string {
	if (!variation) return '';

	// 除外するキーワード
	const excludePatterns = [
		'店内',
		'お持ち帰り',
		'(店内)',
		'(お持ち帰り)',
		'(バリエーション未設定)',
		'バリエーション未設定'
	];

	let cleaned = variation;
	for (const pattern of excludePatterns) {
		cleaned = cleaned.replace(pattern, '');
	}

	return cleaned.trim();
}

// Shift-JISエンコーディングのCSVファイルをパースする
export async function parseSalesCSV(file: File): Promise<ParsedSalesCSVResult> {
	const errors: CSVImportError[] = [];
	const salesData: SalesData[] = [];
	const customerInfo: CustomerInfo[] = [];

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

		// ヘッダー行をパース
		const headers = lines[0].split(',').map((h) => h.trim());

		// 新しい期待されるヘッダー（種別1、種別2を含む）
		const expectedHeaders = [
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

		// データ行をパース（ヘッダーをスキップ）
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line.trim()) continue;

			const values = line.split(',').map((v) => v.trim());

			try {
				const rawProductName = values[0] || '';
				const variation1Raw = values[1] || '';
				const variation2Raw = values[2] || '';
				const category = values[3] || '';

				// カテゴリが「顧客情報」の場合は顧客情報として処理
				if (category === '顧客情報') {
					const info: CustomerInfo = {
						gender: rawProductName, // 商品名の列に性別が入っている
						ageGroup: variation1Raw, // 種別1の列に年齢層が入っている
						count: parseInt(values[9]) || 0 // 販売商品数の列に人数が入っている
					};
					customerInfo.push(info);
					continue; // 商品データとしては処理しない
				}

				// 商品名を正規化（ホット/アイスを頭に付ける）
				const normalizedProductName = normalizeProductName(rawProductName, variation1Raw);

				// 種別をクリーンアップ（店内、お持ち帰りなどを除外）
				const variation1 = cleanVariation(variation1Raw);
				const variation2 = cleanVariation(variation2Raw);

				const sales: SalesData = {
					id: crypto.randomUUID(),
					productName: normalizedProductName,
					variation1: variation1 || undefined,
					variation2: variation2 || undefined,
					category: category,
					taxType: values[4] || '',
					totalSales: parseFloat(values[5]) || 0,
					salesRatio: parseFloat(values[6]) || 0,
					grossProfit: parseFloat(values[7]) || 0,
					profitRatio: parseFloat(values[8]) || 0,
					soldQuantity: parseInt(values[9]) || 0,
					quantityRatio: parseFloat(values[10]) || 0,
					returnedQuantity: parseInt(values[11]) || 0,
					returnRatio: parseFloat(values[12]) || 0,
					productId: values[13] || '',
					productCode: values[14] || '',
					barcode: values[15] || '',
					salesDate: salesDate,
					importedAt: new Date().toISOString()
				};

				// 商品名が必須
				if (!sales.productName) {
					errors.push({
						row: i + 1,
						field: '商品名',
						message: '商品名は必須です'
					});
					continue;
				}

				salesData.push(sales);
			} catch (error) {
				errors.push({
					row: i + 1,
					field: 'parse',
					message: `行のパースに失敗しました: ${error}`
				});
			}
		}

		return {
			success: errors.length === 0,
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
