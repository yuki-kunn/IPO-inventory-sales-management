import { json } from '@sveltejs/kit';
import { Client, isFullDatabase } from '@notionhq/client';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Notionから原材料在庫データを取得
export const GET: RequestHandler = async () => {
	if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
		return json(
			{ error: 'Notion API設定がありません。環境変数を確認してください。' },
			{ status: 500 }
		);
	}

	try {
		const notion = new Client({ auth: env.NOTION_API_KEY });

		// 1. データベース情報を取得してデータソースIDを特定する
		const db = await notion.databases.retrieve({
			database_id: env.NOTION_DATABASE_ID as string
		});

		if (!isFullDatabase(db)) {
			throw new Error('データベース情報の詳細を取得できませんでした。権限を確認してください。');
		}

		const dataSourceId = db.data_sources?.[0]?.id;
		if (!dataSourceId) {
			throw new Error('データベース内に有効なデータソースが見つかりませんでした。');
		}

		// 2. 特定したデータソースに対してクエリを実行（全件取得）
		const response = await notion.dataSources.query({
			data_source_id: dataSourceId
		});

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
		const ingredients = response.results.map((page: any) => {
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

		return json({ ingredients });
	} catch (error: any) {
		console.error('[Notion API] エラー:', error);
		return json({ error: 'データ取得に失敗しました', details: error.message }, { status: 500 });
	}
};

// Notionの在庫を更新
export const POST: RequestHandler = async ({ request }) => {
	if (!env.NOTION_API_KEY) {
		return json({ error: 'Notion API設定がありません' }, { status: 500 });
	}

	try {
		const { updates } = await request.json();

		if (!Array.isArray(updates) || updates.length === 0) {
			return json({ error: '更新データがありません' }, { status: 400 });
		}

		const notion = new Client({ auth: env.NOTION_API_KEY });

		// 全ての更新を並列実行
		await Promise.all(
			updates.map(async (update: any) => {
				await notion.pages.update({
					page_id: update.id,
					properties: {
						在庫数: {
							number: update.newStock
						}
					}
				});
			})
		);

		return json({ success: true });
	} catch (error: any) {
		console.error('[Notion API] 更新エラー:', error);
		return json({ error: '更新に失敗しました', details: error.message }, { status: 500 });
	}
};
