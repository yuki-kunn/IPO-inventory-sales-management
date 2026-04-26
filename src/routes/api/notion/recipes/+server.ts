import { Client, isFullDatabase } from '@notionhq/client';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { Recipe, RecipeIngredient, Ingredient } from '$lib/types';
import { createErrorResponse } from '$lib/utils/errorHandler';

// Notion プロパティの型
type NotionProperty = {
	id: string;
	type: string;
	title?: Array<{ plain_text: string }>;
	rich_text?: Array<{ plain_text: string }>;
	number?: number;
	select?: { name: string };
};

type NotionPage = {
	id: string;
	properties: Record<string, NotionProperty>;
};

type NotionQueryResponse = {
	results: NotionPage[];
};

export const GET: RequestHandler = async () => {
	if (!env.NOTION_API_KEY || !env.NOTION_DATABASE_ID) {
		console.error('[Notion Recipes API] Missing configuration');
		return json({ error: 'Notion API設定がありません' }, { status: 500 });
	}

	try {
		const notion = new Client({
			auth: env.NOTION_API_KEY,
			timeoutMs: 60000
		});

		const db = await notion.databases.retrieve({
			database_id: env.NOTION_DATABASE_ID
		});

		if (!isFullDatabase(db)) {
			console.error('[Notion Recipes API] Database information incomplete');
			return json({ error: 'データベース情報の取得に失敗しました' }, { status: 500 });
		}

		// データソースを検索
		const ingredientsDataSource = db.data_sources?.find((ds: any) => ds.name === 'IPO カフェ 原材料');
		const menuDataSource = db.data_sources?.find((ds: any) => ds.name === 'IPO カフェ メニュー');
		const recipeDataSource = db.data_sources?.find(
			(ds: any) => ds.name === 'IPO カフェ レシピ（原材料明細）'
		);

		if (!ingredientsDataSource || !menuDataSource || !recipeDataSource) {
			console.error('[Notion Recipes API] Required data sources not found');
			return json({ error: 'データソースの取得に失敗しました' }, { status: 500 });
		}

		// 1. 原材料マスタを取得
		const ingredientsResponse = (await notion.dataSources.query({
			data_source_id: ingredientsDataSource.id
		})) as NotionQueryResponse;

		// 2. メニューマスタを取得
		const menuResponse = (await notion.dataSources.query({
			data_source_id: menuDataSource.id
		})) as NotionQueryResponse;

		// 3. レシピ明細を取得
		const response = (await notion.dataSources.query({
			data_source_id: recipeDataSource.id
		})) as NotionQueryResponse;

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
			if (prop.type === 'relation' && prop.relation) {
				// relationの場合はIDの配列を返す
				return prop.relation.length > 0 ? prop.relation[0].id : null;
			}

			return null;
		};

		// メニューマスタからIDマッピングを作成
		const menuMap = new Map<string, string>(); // ID -> メニュー名
		for (const page of menuResponse.results) {
			const nameProp = getProp(page, 'メニュー', 'Name', 'name', '商品名');
			const name = getValue(nameProp);
			if (name) {
				menuMap.set(page.id, name);
			}
		}

		// 原材料マスタからIDマッピングを作成（ID -> 原材料情報）
		const ingredientsMapById = new Map<string, Ingredient>();
		for (const page of ingredientsResponse.results) {
			const nameProp = getProp(page, '原材料名', 'Name', 'name');
			const name = getValue(nameProp);

			if (name) {
				const ingredient: Ingredient = {
					id: page.id,
					name: name,
					stockQuantity: 0,
					unit: '',
					minStockLevel: 0
				};
				ingredientsMapById.set(page.id, ingredient);
			}
		}

		// レシピ明細データを抽出してグループ化
		const recipeMap = new Map<string, RecipeIngredient[]>();

		for (const page of response.results) {
			// レシピ明細のプロパティ（Aa行、メニュー、原材料、使用量、単位、メモ）
			const menuProp = getProp(page, 'メニュー', 'Menu', 'menu');
			const ingredientProp = getProp(page, '原材料', 'Ingredient', 'ingredient');
			const quantityProp = getProp(page, '使用量', 'Quantity', 'quantity');
			const unitProp = getProp(page, '単位', 'Unit', 'unit');

			// relationからIDを取得
			const menuId = getValue(menuProp); // relation型なのでIDが返る
			const ingredientId = getValue(ingredientProp); // relation型なのでIDが返る
			const quantity = getValue(quantityProp);
			const unit = getValue(unitProp);

			// IDから名前を取得
			const menuName = menuId ? menuMap.get(menuId) : null;
			const ingredientInfo = ingredientId ? ingredientsMapById.get(ingredientId) : null;
			const ingredientName = ingredientInfo?.name;

			// メニュー名と原材料名が両方ある行のみ処理
			if (!menuName || !ingredientName || !ingredientId) {
				continue; // 空行またはマッピングできない行をスキップ
			}

			// 単位：レシピ明細の単位を優先、なければ原材料マスタの単位
			const finalUnit = unit || ingredientInfo?.unit || '';

			// レシピ明細を追加
			if (!recipeMap.has(menuName)) {
				recipeMap.set(menuName, []);
			}

			recipeMap.get(menuName)!.push({
				ingredientId,
				ingredientName,
				quantity: quantity ?? 0,
				unit: finalUnit
			});
		}

		// Recipe オブジェクトの配列を生成
		const recipes: Recipe[] = Array.from(recipeMap.entries()).map(([productName, ingredients]) => {
			const now = new Date().toISOString();
			return {
				id: `notion-${productName.replace(/\s+/g, '-')}`,
				productName,
				ingredients,
				createdAt: now,
				updatedAt: now
			};
		});

		return json({ recipes });
	} catch (err: any) {
		return createErrorResponse(err, 'レシピデータの取得に失敗しました', 500);
	}
};
