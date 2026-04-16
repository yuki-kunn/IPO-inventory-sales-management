import type { SalesData, CSVImportError } from '$lib/types';

export interface ParsedSalesCSVResult {
  success: boolean;
  importedCount: number;
  errors: CSVImportError[];
  salesData: SalesData[];
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

// Shift-JISエンコーディングのCSVファイルをパースする
export async function parseSalesCSV(file: File): Promise<ParsedSalesCSVResult> {
  const errors: CSVImportError[] = [];
  const salesData: SalesData[] = [];

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
        salesDate: salesDate,
      };
    }

    // ヘッダー行をパース
    const headers = lines[0].split(',').map((h) => h.trim());

    // 期待されるヘッダー
    const expectedHeaders = [
      '商品名',
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
      'バーコード',
    ];

    // データ行をパース（ヘッダーをスキップ）
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map((v) => v.trim());

      try {
        const sales: SalesData = {
          id: crypto.randomUUID(),
          productName: values[0] || '',
          category: values[1] || '',
          taxType: values[2] || '',
          totalSales: parseFloat(values[3]) || 0,
          salesRatio: parseFloat(values[4]) || 0,
          grossProfit: parseFloat(values[5]) || 0,
          profitRatio: parseFloat(values[6]) || 0,
          soldQuantity: parseInt(values[7]) || 0,
          quantityRatio: parseFloat(values[8]) || 0,
          returnedQuantity: parseInt(values[9]) || 0,
          returnRatio: parseFloat(values[10]) || 0,
          productId: values[11] || '',
          productCode: values[12] || '',
          barcode: values[13] || '',
          salesDate: salesDate,
          importedAt: new Date().toISOString(),
        };

        // 商品名が必須
        if (!sales.productName) {
          errors.push({
            row: i + 1,
            field: '商品名',
            message: '商品名は必須です',
          });
          continue;
        }

        salesData.push(sales);
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'parse',
          message: `行のパースに失敗しました: ${error}`,
        });
      }
    }

    return {
      success: errors.length === 0,
      importedCount: salesData.length,
      errors,
      salesData,
      salesDate: salesDate,
    };
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      errors: [
        {
          row: 0,
          field: 'file',
          message: `ファイルの読み込みに失敗しました: ${error}`,
        },
      ],
      salesData: [],
      salesDate: new Date().toISOString().split('T')[0],
    };
  }
}

export function exportSalesToCSV(salesData: SalesData[]): string {
  const headers = [
    '商品名',
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
    'バーコード',
  ];

  const rows = salesData.map((s) => [
    s.productName,
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
    s.barcode,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return csvContent;
}
