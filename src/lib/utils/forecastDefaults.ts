import type { WeatherType } from '$lib/types';

// 飲食業界調査に基づくベイズ事前分布としてのデフォルト係数
// Sources: 飲食店ドットコム(約400店調査), 花王プロフェッショナル, Liberty/Toast POS研究
// 大阪泉州エリアの郊外型カフェ向けに調整

export const PSEUDO_COUNT = 10; // ベイズ収縮の擬似サンプル数（実績10件相当の重み）

// 曜日別デフォルト係数 (0=日曜, 6=土曜)
export const DEFAULT_DAY_OF_WEEK_FACTORS: Record<number, number> = {
	0: 1.25, // 日曜: 休日ピーク、ファミリー・レジャー来店
	1: 0.85, // 月曜: 週間最低、多くの飲食店が定休日にする水準
	2: 0.90, // 火曜: 週間2番目に低い
	3: 0.95, // 水曜: 週中ベースライン
	4: 1.00, // 木曜: 平均基準
	5: 1.10, // 金曜: 週末前の需要上昇
	6: 1.30 // 土曜: 最大ピーク、郊外ショッピング+レジャー
};

// 天候別デフォルト係数
export const DEFAULT_WEATHER_FACTORS: Record<WeatherType, number> = {
	sunny: 1.05, // 晴れ: 来店意欲微増
	cloudy: 1.00, // 曇り: 基準
	rainy: 0.85, // 雨: 約400店調査で72.5%が客数減少を報告（平均約-15%）
	snowy: 0.70, // 雪: 大阪では希少イベントのため来客数が大幅減
	other: 1.00, // その他
	'': 1.00 // 未設定
};
