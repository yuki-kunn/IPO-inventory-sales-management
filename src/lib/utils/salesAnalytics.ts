import type { DailySales } from '$lib/types';

/** YYYY-MM-DD をローカルタイムのDateに変換（UTC解釈による曜日ズレを防ぐ） */
export function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number);
	return new Date(y, m - 1, d);
}

/** 曜日番号 0=日..6=土 */
export function getWeekday(dateStr: string): number {
	return parseLocalDate(dateStr).getDay();
}

/** 曜日ラベル（日本語短縮） */
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** 中央値（空配列は0） */
export function median(nums: number[]): number {
	if (nums.length === 0) return 0;
	const sorted = [...nums].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface WeekdayStat {
	weekday: number; // 0..6
	label: string; // 日..土
	count: number; // 日数
	total: number; // 合計売上
	avg: number; // 平均売上
	median: number; // 中央値
	max: number; // 最高売上
	min: number; // 最低売上
}

/** 期間内データを曜日別に集計（日→土の7要素を必ず返す） */
export function calculateWeekdayStats(days: DailySales[]): WeekdayStat[] {
	// 0〜6の7バケツに totalSales を集約
	const buckets: number[][] = [[], [], [], [], [], [], []];
	for (const day of days) {
		const wd = getWeekday(day.date);
		buckets[wd].push(day.totalSales);
	}

	return buckets.map((values, weekday) => {
		const count = values.length;
		if (count === 0) {
			return {
				weekday,
				label: WEEKDAY_LABELS[weekday],
				count: 0,
				total: 0,
				avg: 0,
				median: 0,
				max: 0,
				min: 0
			};
		}
		const total = values.reduce((sum, v) => sum + v, 0);
		return {
			weekday,
			label: WEEKDAY_LABELS[weekday],
			count,
			total,
			avg: total / count,
			median: median(values),
			max: Math.max(...values),
			min: Math.min(...values)
		};
	});
}
