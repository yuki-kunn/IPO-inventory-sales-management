import { browser } from '$app/environment';
import type { WeatherType } from '$lib/types';

export interface AnalyticsSettings {
	startDate: string;
	endDate: string;
	lowerThreshold: number;
	upperThreshold: number;
	weatherFilter: WeatherType | 'all';
	comparisonMode?: 'none' | 'prevMonth' | 'prevYear' | 'custom';
	customComparisonStart?: string;
	customComparisonEnd?: string;
}

const KEY = 'cafe-inventory-analytics-settings';

const VALID_WEATHER_FILTERS = ['all', 'sunny', 'cloudy', 'rainy', 'snowy', 'other'];
const VALID_COMPARISON_MODES = ['none', 'prevMonth', 'prevYear', 'custom'];

/** 保存済み設定を読み込む（無ければ null） */
export function loadAnalyticsSettings(): AnalyticsSettings | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(KEY);
		if (!stored) return null;
		const parsed = JSON.parse(stored);
		// 最低限の妥当性チェック（必須キーが揃っているか）
		if (
			typeof parsed?.startDate === 'string' &&
			typeof parsed?.endDate === 'string' &&
			Number.isFinite(parsed?.lowerThreshold) &&
			Number.isFinite(parsed?.upperThreshold) &&
			VALID_WEATHER_FILTERS.includes(parsed?.weatherFilter) &&
			(parsed?.comparisonMode === undefined || VALID_COMPARISON_MODES.includes(parsed.comparisonMode)) &&
			(parsed?.customComparisonStart === undefined || typeof parsed.customComparisonStart === 'string') &&
			(parsed?.customComparisonEnd === undefined || typeof parsed.customComparisonEnd === 'string')
		) {
			return parsed as AnalyticsSettings;
		}
		return null;
	} catch {
		return null;
	}
}

/** 設定を保存 */
export function saveAnalyticsSettings(settings: AnalyticsSettings): void {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(settings));
	} catch {
		// 保存失敗は無視（プライベートモード等）
	}
}
