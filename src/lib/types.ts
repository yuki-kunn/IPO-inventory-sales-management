// 原材料データ型定義
export interface Ingredient {
  id: string;
  name: string;
  unit: string; // 単位（例: g, ml, 個）
  stockQuantity: number;
  minStockLevel: number; // 発注アラート用の最低在庫レベル
  supplier?: string;
  unitPrice?: number; // 単価
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientStats {
  totalIngredients: number;
  lowStockIngredients: number;
  outOfStockIngredients: number;
  totalValue: number;
}

// レシピデータ型定義
export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number; // 使用量
  unit: string;
}

export interface Recipe {
  id: string;
  productName: string; // 商品名
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

// 未登録商品データ型定義
export interface UnregisteredProduct {
  productName: string;
  soldQuantity: number; // 累計販売個数
  salesDates: string[]; // この商品が含まれる売上日（YYYY-MM-DD形式）の配列
  firstSeenAt: string; // 初めて検出された日時
  lastSeenAt: string; // 最後に検出された日時
}

export interface CSVImportError {
  row: number;
  field: string;
  message: string;
}

export interface CSVImportResult {
  success: boolean;
  importedCount: number;
  errors: CSVImportError[];
}

// 売上データ型定義
export interface SalesData {
  id: string;
  productName: string;
  category: string;
  taxType: string;
  totalSales: number;
  salesRatio: number;
  grossProfit: number;
  profitRatio: number;
  soldQuantity: number;
  quantityRatio: number;
  returnedQuantity: number;
  returnRatio: number;
  productId: string;
  productCode: string;
  barcode: string;
  salesDate: string; // 売上日（YYYY-MM-DD形式）
  importedAt: string;
}

// 天候タイプ
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'other' | '';

// 日別売上集計
export interface DailySales {
  id: string; // YYYY-MM-DD形式の日付をIDとして使用
  date: string; // YYYY-MM-DD形式
  totalSales: number; // 日別総売上
  totalProfit: number; // 日別総粗利
  totalQuantity: number; // 日別総販売数
  productCount: number; // 販売商品種類数
  sales: SalesData[]; // その日の売上データ
  inventoryProcessed: boolean; // 原材料在庫減算が処理済みかどうか
  unregisteredCount: number; // 未登録商品数
  processedProducts: string[]; // 在庫減算済みの商品名リスト
  weather?: WeatherType; // 天候情報
  createdAt: string;
  updatedAt: string;
}

export interface SalesStats {
  totalSales: number;
  totalProfit: number;
  totalSoldQuantity: number;
  totalReturnedQuantity: number;
  productCount: number;
  averageSales: number;
}

// 原材料使用データ型定義
export interface IngredientUsageData {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  totalUsed: number; // 総使用量
  usedFromProducts: {
    productName: string;
    soldQuantity: number;
    ingredientUsed: number;
  }[];
}

// 売上処理結果
export interface SalesProcessResult {
  processedProducts: {
    productName: string;
    soldQuantity: number;
    ingredientsReduced: {
      ingredientName: string;
      reducedQuantity: number;
    }[];
  }[];
  unregisteredProducts: UnregisteredProduct[];
  totalProcessed: number;
  totalUnregistered: number;
}
