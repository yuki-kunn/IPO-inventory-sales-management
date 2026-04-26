import { json } from '@sveltejs/kit';
import { Client, isFullDatabase } from '@notionhq/client';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { createErrorResponse } from '$lib/utils/errorHandler';
import { dev } from '$app/environment';

// Notionインポート用データベースから原材料在庫データを取得
export const GET: RequestHandler = async () => {
	if (dev) {
		console.log('[Notion Import API] リクエスト受信');
		console.log('[Notion Import API] NOTION_API_KEY:', env.NOTION_API_KEY ? '設定済み' : '未設定');
		console.log('[Notion Import API] NOTION_DATABASE_ID_IMPORT:', env.NOTION_DATABASE_ID_IMPORT);
	}

	if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID_IMPORT) {
		console.error('[Notion Import API] Missing configuration');
		return json({ error: 'Notion API設定がありません' }, { status: 500 });
	}

	try {
		const notion = new Client({
			auth: env.NOTION_API_KEY,
			timeoutMs: 60000 // 60秒のタイムアウト
		});
		if (dev) console.log('[Notion Import API] Notion Client初期化完了');

		// 1. データベース情報を取得してデータソースIDを特定する
		if (dev) console.log('[Notion Import API] データベース情報取得中...');
		const db = await notion.databases.retrieve({
			database_id: env.NOTION_DATABASE_ID_IMPORT as string
		});
		if (dev) console.log('[Notion Import API] データベース取得成功');

		if (!isFullDatabase(db)) {
			console.error('[Notion Import API] Database information incomplete');
			throw new Error('データベース情報の取得に失敗しました');
		}

		const dataSourceId = db.data_sources?.[0]?.id;
		if (dev) console.log('[Notion Import API] データソースID:', dataSourceId);

		if (!dataSourceId) {
			console.error('[Notion Import API] Data source ID not found');
			throw new Error('データソースの取得に失敗しました');
		}

		// 2. 特定したデータソースに対してクエリを実行（全件取得）
		if (dev) console.log('[Notion Import API] データソースクエリ実行中...');
		const response = await notion.dataSources.query({
			data_source_id: dataSourceId
		});
		if (dev) console.log('[Notion Import API] クエリ成功 - 取得件数:', response.results.length);

		// プロパティ取得ヘルパー（完全一致または部分一致）
		const getProp = (page: any, ...keywords: string[]) => {
			for (const keyword of keywords) {
				// 完全一致を優先
				if (page.properties[keyword]) {
					return page.properties[keyword];
				}
				// 部分一致
				const key = Object.keys(page.properties).find((k) =>
					k.toLowerCase().includes(keyword.toLowerCase())
				);
				if (key) {
					return page.properties[key];
				}
			}
			return null;
		};

		// プロパティから値を安全に取得（型を自動判定）
		const getValue = (prop: any): any => {
			if (!prop) return null;

			// プロパティの型に応じて値を取得
			if (prop.type === 'title' && prop.title) {
				return prop.title[0]?.plain_text || null;
			}
			if (prop.type === 'rich_text' && prop.rich_text) {
				return prop.rich_text[0]?.plain_text || null;
			}
			if (prop.type === 'number') {
				return prop.number ?? null;
			}
			if (prop.type === 'select' && prop.select) {
				return prop.select.name || null;
			}

			return null;
		};

		// データを整形
		if (dev) console.log('[Notion Import API] データ整形開始...');
		const ingredients = response.results.map((page: any, index: number) => {
			// デバッグ: 最初のページのプロパティを確認
			if (dev && index === 0) {
				console.log(
					'[Notion Import API] 利用可能なプロパティ:',
					Object.keys(page.properties)
				);
			}

			// タイトルプロパティ（原材料名 or 商品名）
			const nameProp = getProp(page, '原材料名', '商品名', 'Name', 'name');
			const name = getValue(nameProp) || '名前なし';

			// 在庫数（必須）
			const stockProp = getProp(page, '在庫数', '在庫', 'Stock', 'stock');
			const stockQuantity = getValue(stockProp) ?? 0;

			// 単位
			const unitProp = getProp(page, '単位', 'Unit', 'unit');
			const unit = getValue(unitProp) || '';

			// 最小在庫
			const minStockProp = getProp(page, '最小在庫', '買い出し点', 'Min Stock', 'min_stock');
			const minStockLevel = getValue(minStockProp) ?? 0;

			// 仕入先
			const supplierProp = getProp(page, '仕入先', 'Supplier', 'supplier');
			const supplier = getValue(supplierProp) || '';

			// 単価
			const priceProp = getProp(page, '単価', '価格', 'Price', 'price');
			const unitPrice = getValue(priceProp) ?? 0;

			// 説明
			const descProp = getProp(page, '説明', 'Description', 'description', 'メモ');
			const description = getValue(descProp) || '';

			if (dev) console.log(`[Notion Import API] ${index + 1}. ${name}: 在庫=${stockQuantity}${unit}`);

			return {
				id: page.id,
				name,
				unit,
				stockQuantity,
				minStockLevel,
				supplier,
				unitPrice,
				description,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
		});

		if (dev) console.log('[Notion Import API] 整形完了 - 件数:', ingredients.length);
		return json({ ingredients });
	} catch (error: any) {
		return createErrorResponse(error, 'データ取得に失敗しました', 500);
	}
};
